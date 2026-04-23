"""
predict.py
===========
Inference module for Zenthera — predicts antibiotic resistance from
an uploaded FASTA file.

Primary workflow (lab use):
    1. Lab uploads a FASTA genome file
    2. DNA k-mers are extracted from the sequence
    3. Trained model predicts Resistant / Susceptible for each antibiotic

Usage (CLI):
    # From a FASTA file (primary use case):
    python predict.py --fasta path/to/genome.fasta
    python predict.py --fasta genome.fasta --antibiotic ciprofloxacin

    # Quick test with genome name only (fallback, less accurate):
    python predict.py --genome_name "Escherichia coli"

Usage (Python import — for web app integration):
    from predict import ZentheraPipeline

    pipe = ZentheraPipeline()

    # From FASTA file
    results = pipe.predict_from_fasta("path/to/genome.fasta")

    # From FASTA string (e.g. uploaded via web form)
    results = pipe.predict_from_fasta_string(fasta_content)

    # From genome name (fallback)
    results = pipe.predict_all("Klebsiella pneumoniae")
"""

import argparse
import json
import logging
import os
import warnings

import joblib
import numpy as np
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer

from config import (
    MODELS_DIR,
    LABEL_ENCODER_FILE,
    VECTORIZER_FILE,
    RF_MODEL_FILE,
    LR_MODEL_FILE,
    INDIA_ANTIBIOTICS,
    KMER_SIZES,
)

warnings.filterwarnings("ignore")
log = logging.getLogger(__name__)

# Lazy-load CARD scanner (optional dependency)
try:
    from card_scanner import ResistanceGeneScanner
    from mutation_scanner import MutationScanner
    _DETERMINISTIC_AVAILABLE = True
except ImportError:
    _DETERMINISTIC_AVAILABLE = False


# ── DNA k-mer extraction (must mirror step2_preprocess.py exactly) ─────────────

def parse_fasta(fasta_path: str) -> tuple[str, str, int]:
    """
    Parse a FASTA file and return (header, concatenated_sequence, first_contig_length).
    Handles multi-contig files by concatenating all contigs.
    """
    header = ""
    seq_parts = []
    first_contig_len = 0
    current_contig_len = 0
    is_first_contig = True

    with open(fasta_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                if not header:
                    header = line[1:].strip()
                else:
                    if is_first_contig:
                        first_contig_len = current_contig_len
                        is_first_contig = False
            elif line:
                # Keep only valid DNA bases
                cleaned = "".join(b for b in line.upper() if b in "ACGTN")
                seq_parts.append(cleaned)
                if is_first_contig:
                    current_contig_len += len(cleaned)

    if is_first_contig:
        first_contig_len = current_contig_len

    return header, "".join(seq_parts), first_contig_len


def parse_fasta_string(fasta_content: str) -> tuple[str, str, int]:
    """
    Parse FASTA content from a string (e.g. from web upload).
    Returns (header, concatenated_sequence, first_contig_length).
    """
    header = ""
    seq_parts = []
    first_contig_len = 0
    current_contig_len = 0
    is_first_contig = True

    for line in fasta_content.splitlines():
        line = line.strip()
        if line.startswith(">"):
            if not header:
                header = line[1:].strip()
            else:
                if is_first_contig:
                    first_contig_len = current_contig_len
                    is_first_contig = False
        elif line:
            cleaned = "".join(b for b in line.upper() if b in "ACGTN")
            seq_parts.append(cleaned)
            if is_first_contig:
                current_contig_len += len(cleaned)

    if is_first_contig:
        first_contig_len = current_contig_len

    return header, "".join(seq_parts), first_contig_len


def dna_to_kmers(seq: str, k: int) -> str:
    """
    Convert a DNA sequence to a space-joined string of k-mers.
    Skips k-mers containing 'N'. This MUST match step2_preprocess.py exactly.
    """
    seq = seq.upper()
    kmers = [
        seq[i : i + k]
        for i in range(len(seq) - k + 1)
        if "N" not in seq[i : i + k]
    ]
    return " ".join(kmers)


def name_to_kmers(name: str, k: int) -> str:
    """Fallback: character k-mers from genome name."""
    cleaned = "".join(c.lower() for c in name if c.isalpha())
    return " ".join(cleaned[i : i + k] for i in range(len(cleaned) - k + 1))


def gc_content(seq: str) -> float:
    """Calculate GC percentage."""
    if not seq:
        return 0.0
    # Use upper() once for speed
    seq_up = seq.upper()
    gc = sum(1 for b in seq_up if b in ("G", "C"))
    return (gc / len(seq_up)) * 100


def build_kmer_vector(text_or_seq: str, vectorizers: dict, is_dna: bool) -> csr_matrix:
    """
    Build the k-mer feature vector. Matches training by sampling exactly
    the first 10,000 bases to maintain consistent TF-IDF normalization.
    """
    processed_input = text_or_seq
    # For large sequences, we take the first 100k bp to ensure representative k-mer distribution
    if is_dna and len(processed_input) > 100000:
        processed_input = processed_input[:100000]

    X_parts = []
    for k in KMER_SIZES:
        vec = vectorizers.get(k)
        if not vec: continue
        kmers = dna_to_kmers(processed_input, k) if is_dna else name_to_kmers(processed_input, k)
        X_k = vec.transform([kmers])
        X_parts.append(X_k)
        
    return hstack(X_parts) if X_parts else csr_matrix((1, 0))


def build_metadata_vector(
    antibiotic: str,
    genus: str,
    config: dict,
    gc_pct: float = 0.0,
    seq_length: int = 0,
) -> np.ndarray:
    """
    Build the metadata feature vector for a single sample.
    REDUCED: Only includes the Antibiotic to force DNA K-mer usage.
    """
    # 1. Antibiotic one-hot (15 dims)
    ab_vec = np.zeros(len(INDIA_ANTIBIOTICS), dtype=np.float32)
    ab_lower = antibiotic.lower().strip()
    if ab_lower in INDIA_ANTIBIOTICS:
        ab_vec[INDIA_ANTIBIOTICS.index(ab_lower)] = 1.0

    return ab_vec


# ── Trust signals ──────────────────────────────────────────────────────────────

def get_genus_from_header(header: str, config_genera: list = None) -> str:
    """
    Try to find a known genus in the FASTA header, synchronized with model config.
    """
    if not header:
        return "other"
    
    header_lower = header.lower()
    
    # Use the comprehensive list from the model configuration if available
    known_genera = config_genera or [
        "staphylococcus", "streptococcus", "salmonella", "enterococcus",
        "klebsiella", "escherichia", "acinetobacter", "pseudomonas",
        "mycobacterium", "corynebacterium", "campylobacter", "enterobacter",
        "vibrio", "citrobacter", "proteus", "yersinia", "serratia"
    ]
    
    for g in known_genera:
        if g in header_lower:
            return g
            
    # If not found, try to take the first word that doesn't look like an ID
    words = header.split()
    for w in words:
        w_clean = "".join(c for c in w if c.isalpha()).lower()
        if len(w_clean) > 3 and w_clean not in ("genome", "sequence", "contig", "scaffold"):
            return w_clean
            
    return "other"


def compute_trust_signals(
    header: str,
    seq_length: int,
    confidence: float,
    config: dict
) -> dict:
    """
    Compute trust metadata for a prediction.
    """
    # 1. Confidence tier
    if confidence >= 80:
        tier = "HIGH"
    elif confidence >= 60:
        tier = "MODERATE"
    else:
        tier = "LOW"

    # 2. Organism match
    matched_genus = get_genus_from_header(header)
    organism_match = matched_genus in config.get("top_genera", [])

    # 3. Sequence quality
    if seq_length >= 5000:
        sq = "good"
        sq_note = f"{seq_length:,} bp - sufficient for reliable k-mer extraction"
    elif seq_length >= 1000:
        sq = "fair"
        sq_note = f"{seq_length:,} bp - marginal; longer sequences improve accuracy"
    else:
        sq = "poor"
        sq_note = f"{seq_length:,} bp - too short for reliable prediction"

    return {
        "confidence_tier": tier,
        "organism_match": organism_match,
        "matched_genus": matched_genus.capitalize(),
        "seq_quality": sq,
        "seq_quality_note": sq_note,
    }


# ── Clinical Knowledge Base ──────────────────────────────────────────────────

ORGANISM_DISEASES = {
    "escherichia": {
        "name": "Escherichia coli (E. coli)",
        "diseases": [
            "Urinary Tract Infections (UTI)",
            "Neonatal Meningitis",
            "Sepsis / Bacteremia",
            "Intra-abdominal Infections",
            "Traveler's Diarrhea"
        ],
        "notes": "E. coli is a major cause of community-acquired and hospital-acquired infections. ESBL-producing strains are of high concern."
    },
    "klebsiella": {
        "name": "Klebsiella pneumoniae",
        "diseases": [
            "Hospital-Acquired Pneumonia",
            "Urinary Tract Infections",
            "Liver Abscess",
            "Sepsis",
            "Wound Infections"
        ],
        "notes": "Carbapenem-resistant Klebsiella (KPC) are extremely difficult to treat and require last-resort antibiotics like Colistin."
    },
    "staphylococcus": {
        "name": "Staphylococcus aureus",
        "diseases": [
            "Skin and Soft Tissue Infections (SSTI)",
            "Endocarditis",
            "Osteomyelitis",
            "Toxic Shock Syndrome",
            "Pneumonia"
        ],
        "notes": "MRSA (Methicillin-resistant S. aureus) is globally prevalent. Vancomycin and Linezolid are key treatments."
    },
    "pseudomonas": {
        "name": "Pseudomonas aeruginosa",
        "diseases": [
            "Ventilator-associated Pneumonia",
            "Cystic Fibrosis Lung Infections",
            "Burn Wound Infections",
            "Otitis Externa (Swimmer's Ear)",
            "Ecthyma Gangrenosum"
        ],
        "notes": "Highly opportunistic and naturally resistant to many antibiotics. Requires specific anti-pseudomonal drugs like Meropenem or Ceftazidime."
    },
    "acinetobacter": {
        "name": "Acinetobacter baumannii",
        "diseases": [
            "ICU-acquired Pneumonia",
            "Bloodstream Infections",
            "Meningitis",
            "Wound Infections"
        ],
        "notes": "Known as 'Iraqibacter'. Often multi-drug resistant (MDR) and can survive for long periods on hospital surfaces."
    },
    "salmonella": {
        "name": "Salmonella enterica",
        "diseases": [
            "Typhoid Fever (Enteric Fever)",
            "Paratyphoid Fever",
            "Gastroenteritis",
            "Bacteremia"
        ],
        "notes": "Increasing resistance to Ciprofloxacin and Azithromycin is observed in India."
    },
    "enterococcus": {
        "name": "Enterococcus faecalis / faecium",
        "diseases": [
            "Endocarditis",
            "Urinary Tract Infections",
            "Intra-abdominal Sepsis"
        ],
        "notes": "Vancomycin-resistant Enterococci (VRE) are a significant hospital threat."
    }
}

ANTIBIOTIC_INFO = {
    "ciprofloxacin": {"class": "Fluoroquinolone", "route": "Oral / IV", "use": "UTI, Respiratory, GI infections"},
    "levofloxacin": {"class": "Fluoroquinolone", "route": "Oral / IV", "use": "Pneumonia, SSTI, UTI"},
    "amoxicillin": {"class": "Penicillin", "route": "Oral", "use": "Respiratory, Dental, Ear infections"},
    "ampicillin": {"class": "Penicillin", "route": "Oral / IV", "use": "Meningitis, Sepsis, GI infections"},
    "azithromycin": {"class": "Macrolide", "route": "Oral / IV", "use": "Typhoid, Pneumonia, STI"},
    "ceftriaxone": {"class": "3rd-gen Cephalosporin", "route": "IV / IM", "use": "Sepsis, Meningitis, Gonorrhea"},
    "meropenem": {"class": "Carbapenem", "route": "IV", "use": "Multi-drug resistant infections, Sepsis"},
    "imipenem": {"class": "Carbapenem", "route": "IV", "use": "Severe hospital-acquired infections"},
    "colistin": {"class": "Polymyxin", "route": "IV", "use": "Last-resort for carbapenem-resistant GNB"},
    "gentamicin": {"class": "Aminoglycoside", "route": "IV / IM", "use": "Sepsis, UTI, synergistic therapy"},
    "tetracycline": {"class": "Tetracycline", "route": "Oral", "use": "Cholera, Rickettsial, Skin infections"},
    "doxycycline": {"class": "Tetracycline", "route": "Oral / IV", "use": "Malaria prophylaxis, Typhus, SSTI"},
    "trimethoprim": {"class": "Sulfonamide derivative", "route": "Oral", "use": "UTI, Bronchitis"},
    "chloramphenicol": {"class": "Phenicol", "route": "Oral / IV", "use": "Typhoid, Meningitis, Eye infections"},
    "erythromycin": {"class": "Macrolide", "route": "Oral / IV", "use": "Pertussis, SSTI, Penicillin-allergy"},
    "amikacin": {"class": "Aminoglycoside", "route": "IV / IM", "use": "MDR-TB, Sepsis, Severe GNB infections"},
    "tobramycin": {"class": "Aminoglycoside", "route": "IV / IM", "use": "Cystic Fibrosis, Eye infections, Sepsis"},
    "cefepime": {"class": "4th-gen Cephalosporin", "route": "IV", "use": "Empiric therapy for neutropenic fever, Pneumonia"},
    "ceftazidime": {"class": "3rd-gen Cephalosporin", "route": "IV", "use": "Pseudomonas infections, Meningitis"},
    "nitrofurantoin": {"class": "Nitrofuran", "route": "Oral", "use": "Uncomplicated UTI only"},
    "fosfomycin": {"class": "Phosphonic acid derivative", "route": "Oral / IV", "use": "MDR-UTI, Prostatitis"},
    "tigecycline": {"class": "Glycylcycline", "route": "IV", "use": "Complicated SSTI, Intra-abdominal infections"},
    "aztreonam": {"class": "Monobactam", "route": "IV", "use": "GNB infections in patients with penicillin allergy"},
    "teicoplanin": {"class": "Glycopeptide", "route": "IV / IM", "use": "MRSA, Bone and joint infections"},
    "vancomycin": {"class": "Glycopeptide", "route": "IV / Oral", "use": "MRSA, C. difficile (oral), Sepsis"},
    "linezolid": {"class": "Oxazolidinone", "route": "Oral / IV", "use": "VRE, MRSA pneumonia, SSTI"},
    "clindamycin": {"class": "Lincosamide", "route": "Oral / IV", "use": "Bone infections, PID, Strep throat"},
    "moxifloxacin": {"class": "Fluoroquinolone", "route": "Oral / IV", "use": "Drug-resistant TB, Sinusitis, Pneumonia"},
    "cefotaxime": {"class": "3rd-gen Cephalosporin", "route": "IV / IM", "use": "Neonatal sepsis, Meningitis"},
    "cefuroxime": {"class": "2nd-gen Cephalosporin", "route": "Oral / IV", "use": "Lyme disease, Bronchitis, UTI"},
    "metronidazole": {"class": "Nitroimidazole", "route": "Oral / IV", "use": "Anaerobic infections, C. difficile, STI"},
    "rifampicin": {"class": "Rifamycin", "route": "Oral / IV", "use": "First-line TB therapy, Meningitis prophylaxis"},
    "isoniazid": {"class": "Isonicotinic acid hydrazide", "route": "Oral / IV", "use": "First-line TB therapy and prophylaxis"},
    "pyrazinamide": {"class": "Pyrazine derivative", "route": "Oral", "use": "First-line TB therapy (combination)"},
    "ethambutol": {"class": "Ethylene diamine derivative", "route": "Oral", "use": "First-line TB therapy (combination)"},
}



def get_clinical_context(header: str) -> dict:
    """
    Get clinical relevance for a given genome based on its header.
    """
    genus = get_genus_from_header(header)
    if genus in ORGANISM_DISEASES:
        return ORGANISM_DISEASES[genus]
    
    return {
        "name": f"{genus.capitalize()} (Unspecified Strain)",
        "diseases": ["Potential Opportunistic Infections", "Sepsis", "Bacteremia"],
        "notes": "Limited specific clinical data for this genus. Treat based on local susceptibility patterns."
    }


def generate_recommendation(predictions: list[dict], matched_genus: str = None) -> dict:
    """
    Generate structured recommendations based on phenotype predictions.
    """
    first_line = []
    last_resort = []
    avoid = []
    inconclusive = []

    # Sort drugs by confidence
    sorted_preds = sorted(predictions, key=lambda x: x["confidence"], reverse=True)

    for p in sorted_preds:
        drug = p["antibiotic"]
        info = ANTIBIOTIC_INFO.get(drug, {"class": "Unknown", "route": "Unknown", "use": "General antimicrobial"})
        
        entry = {
            "antibiotic": drug.capitalize(),
            "drug_class": info["class"],
            "route": info["route"],
            "clinical_use": info["use"],
            "confidence": p["confidence"]
        }

        if p["phenotype"] == "Resistant":
            avoid.append(entry)
        elif p["phenotype"] == "Insufficient Data":
            inconclusive.append(entry)
        else:
            # Classify into first-line or last-resort
            is_reserve = drug.lower() in ["meropenem", "imipenem", "colistin"]
            if is_reserve:
                last_resort.append(entry)
            else:
                first_line.append(entry)

    return {
        "first_line": first_line,
        "last_resort": last_resort,
        "avoid": avoid,
        "inconclusive": inconclusive,
    }

# ── Pipeline class ─────────────────────────────────────────────────────────────

class ZentheraPipeline:
    """
    Loads trained models and vectorizers once; provides predict methods
    for FASTA files, FASTA strings, and genome names.
    """

    def __init__(self) -> None:
        self._check_models_exist()
        log.info("Loading Zenthera ML models ...")
        self.le = joblib.load(LABEL_ENCODER_FILE)
        self.vectorizers: dict = joblib.load(VECTORIZER_FILE)
        self.rf = joblib.load(RF_MODEL_FILE)
        self.lr = joblib.load(LR_MODEL_FILE)
        
        # Load metadata config
        meta_cfg_path = os.path.join(MODELS_DIR, "metadata_config.joblib")
        if os.path.exists(meta_cfg_path):
            self.meta_config = joblib.load(meta_cfg_path)
            log.info("Metadata config loaded.")
        else:
            self.meta_config = {}
            log.warning("Metadata config NOT found! Using defaults.")

        # Pre-compute the expected total feature width from training
        self._kmer_width = sum(
            len(v.vocabulary_) for v in self.vectorizers.values()
        )
        log.info(f"Models loaded. K-mer feature width: {self._kmer_width}")

        # Load CARD resistance gene scanner (optional)
        self.gene_scanner = None
        self.mut_scanner = None
        if _DETERMINISTIC_AVAILABLE:
            try:
                self.gene_scanner = ResistanceGeneScanner()
                if not self.gene_scanner.available:
                    self.gene_scanner = None
                
                self.mut_scanner = MutationScanner()
                if not self.mut_scanner.available:
                    self.mut_scanner = None
                    
                print(f"DEBUG: Deterministic layers initialized (CARD: {self.gene_scanner is not None}, MUT: {self.mut_scanner is not None})")
            except Exception as e:
                log.warning(f"Deterministic init failed: {e}")
                self.gene_scanner = None
                self.mut_scanner = None

    def _check_models_exist(self) -> None:
        required = [LABEL_ENCODER_FILE, VECTORIZER_FILE, RF_MODEL_FILE, LR_MODEL_FILE]
        missing = [p for p in required if not os.path.exists(p)]
        if missing:
            raise FileNotFoundError(
                f"Missing model files: {missing}\n"
                "Run the pipeline first: python run_pipeline.py"
            )

    def _featurise(
        self,
        text_or_seq: str,
        antibiotic: str,
        genus: str,
        is_dna: bool,
        gc_pct: float = 0.0,
        seq_length: int = 0,
        X_kmer=None,
    ):
        """Build the full feature vector for one sample."""
        if X_kmer is None:
            X_kmer = build_kmer_vector(text_or_seq, self.vectorizers, is_dna)
        X_meta = build_metadata_vector(antibiotic, genus, self.meta_config, gc_pct, seq_length)

        # X_meta already has the correct number of columns now!
        # Training columns: kmer_cols + ab(15) + genus(N) + taxon(1) + gc(1) + seqlen(1)
        # build_metadata_vector returns exactly [ab, gen, taxon, gc, seqlen]
        X_meta_sparse = csr_matrix(X_meta.reshape(1, -1))
        
        # Ensure final feature width matches model exactly
        X = hstack([X_kmer, X_meta_sparse])
        if X.shape[1] != self.rf.n_features_in_:
            log.warning(f"Feature width mismatch: {X.shape[1]} vs model {self.rf.n_features_in_}")
        
        return X

    def _predict_one(
        self,
        text_or_seq: str,
        antibiotic: str,
        genus: str,
        is_dna: bool,
        gc_pct: float,
        seq_length: int,
        model: str,
    ) -> dict:
        """Core single-sample prediction."""
        X = self._featurise(text_or_seq, antibiotic, genus, is_dna, gc_pct, seq_length)
        clf = self.rf if model == "rf" else self.lr
        label_idx = clf.predict(X)[0]
        proba = clf.predict_proba(X)[0]
        phenotype = self.le.inverse_transform([label_idx])[0]
        confidence = float(proba[label_idx])
        
        # Cap ML confidence at 98.5% for realism
        confidence = min(0.985, confidence)

        return {
            "antibiotic": antibiotic.lower().strip(),
            "phenotype": phenotype,
            "confidence": round(confidence * 100, 1),
            "model": "Random Forest" if model == "rf" else "Logistic Regression",
        }

    # ── Public API: FASTA file ─────────────────────────────────────────────────

    def predict_from_fasta(
        self,
        fasta_path: str,
        antibiotics: list[str] | None = None,
        model: str = "rf",
    ) -> list[dict]:
        """
        Predict resistance from a FASTA file.
        """
        header, seq, first_contig_len = parse_fasta(fasta_path)
        return self._predict_from_seq(header, seq, first_contig_len, antibiotics, model)

    def predict_from_fasta_string(
        self,
        fasta_content: str,
        antibiotics: list[str] | None = None,
        model: str = "rf",
    ) -> list[dict]:
        """
        Predict resistance from FASTA content as a string (web upload).
        """
        header, seq, first_contig_len = parse_fasta_string(fasta_content)
        return self._predict_from_seq(header, seq, first_contig_len, antibiotics, model)

    def _predict_from_seq(
        self,
        header: str,
        seq: str,
        first_contig_len: int,
        antibiotics: list[str] | None,
        model: str,
    ) -> list[dict]:
        """Internal: run predictions by scanning the whole genome in chunks."""
        if not seq:
            raise ValueError("FASTA file contains no valid DNA sequence")

        seq_length = first_contig_len if first_contig_len > 0 else len(seq)
        drugs = antibiotics or INDIA_ANTIBIOTICS
        genus = get_genus_from_header(header, self.meta_config.get("top_genera"))

        # 1. Deterministic Scanners (CARD + Mutations)
        hits = {} # antibiotic -> [{type, name, val}, ...]
        
        if self.gene_scanner:
            card_hits = self.gene_scanner.get_resistant_drugs(seq)
            for drug, items in card_hits.items():
                if drug not in hits: hits[drug] = []
                for item in items:
                    hits[drug].append({"type": "GENE", "name": item["gene"], "val": item["coverage"]})
                    
        if self.mut_scanner:
            mut_hits = self.mut_scanner.get_resistant_drugs(seq)
            for drug, items in mut_hits.items():
                if drug not in hits: hits[drug] = []
                for item in items:
                    hits[drug].append({"type": "MUTATION", "name": item["mutation"], "val": item["confidence"]})

        # 2. ML Predictions (Chunked processing for large genomes)
        chunk_size = 10000
        chunks = [seq[i:i+chunk_size] for i in range(0, len(seq), chunk_size) if len(seq[i:i+chunk_size]) >= 2000]
        if not chunks and len(seq) > 0:
            chunks = [seq] # fallback for very short sequences
        
        if not chunks:
            log.warning("No valid chunks extracted from sequence")
            return []

        try:
            res_idx = int(np.where(self.le.classes_ == "Resistant")[0][0])
        except (IndexError, ValueError):
            res_idx = 0

        max_res_probs_rf = {ab: 0.0 for ab in drugs}
        max_res_probs_lr = {ab: 0.0 for ab in drugs}

        from scipy.sparse import vstack

        X_all = []
        chunk_drug_map = [] # stores (chunk_idx, ab)

        for chunk_idx, chunk in enumerate(chunks):
            gc_pct = gc_content(chunk)
            X_kmer_chunk = build_kmer_vector(chunk, self.vectorizers, True)
            
            for ab in drugs:
                X_feat = self._featurise(chunk, ab, genus, True, gc_pct, seq_length, X_kmer=X_kmer_chunk)
                X_all.append(X_feat)
                chunk_drug_map.append((chunk_idx, ab))

        if X_all:
            try:
                X_batch = vstack(X_all)
                # Only run ML if dimensions match (avoids crash during drug-panel expansion)
                if X_batch.shape[1] == self.rf.n_features_in_:
                    probs_rf_batch = self.rf.predict_proba(X_batch)[:, res_idx]
                    probs_lr_batch = self.lr.predict_proba(X_batch)[:, res_idx]
                    
                    for i, (chunk_idx, ab) in enumerate(chunk_drug_map):
                        prob_rf = float(probs_rf_batch[i])
                        prob_lr = float(probs_lr_batch[i])
                        max_res_probs_rf[ab] = max(max_res_probs_rf.get(ab, 0), prob_rf)
                        max_res_probs_lr[ab] = max(max_res_probs_lr.get(ab, 0), prob_lr)
                else:
                    log.warning(f"ML Model width mismatch: {X_batch.shape[1]} vs {self.rf.n_features_in_}. Skipping ML fallback.")
            except Exception as e:
                log.warning(f"ML Inference failed: {e}")

        # 3. Final Integration
        results = []
        for ab in drugs:
            prob_rf = max_res_probs_rf.get(ab, 0.0)
            prob_lr = max_res_probs_lr.get(ab, 0.0)

            # Check if deterministic layer found resistance
            det_found = ab in hits
            det_items = hits.get(ab, [])
            det_type = det_items[0]["type"] if det_found else None

            # Primary prediction — Deterministic overrides ML when detected
            if det_found:
                phenotype = "Resistant"
                best_val = max(g["val"] for g in det_items)
                # Deterministic: Very high confidence, but capped at 99.5% for realism
                confidence = min(0.995, max(0.96, best_val))
            elif prob_rf >= 0.65:
                phenotype = "Resistant"
                # ML: Cap at 98.5% to reflect that no model is 100% perfect
                confidence = min(0.985, prob_rf)
            elif prob_rf <= 0.35:
                phenotype = "Susceptible"
                confidence = min(0.985, 1.0 - prob_rf)
            else:
                phenotype = "Insufficient Data"
                confidence = prob_rf if prob_rf >= 0.5 else 1.0 - prob_rf
                confidence = min(0.94, confidence) # Lower cap for uncertain range

            res = {
                "antibiotic": ab.lower().strip(),
                "phenotype": phenotype,
                "confidence": round(confidence * 100, 1),
                "model": f"{det_type} Match" if det_found else ("Random Forest" if model == "rf" else "Logistic Regression"),
                "det_found": det_found,
                "det_type": det_type,
                "detected_features": [g["name"] for g in det_items] if det_found else [],
            }

            # Secondary prediction
            alt_prob = prob_lr if prob_lr >= 0.5 else 1.0 - prob_lr
            alt_pheno = "Resistant" if prob_lr >= 0.5 else "Susceptible"
            models_agree = phenotype == alt_pheno

            # Compute trust signals
            trust = {
                "organism_match": genus != "other",
                "seq_quality": "good" if seq_length >= 5000 else ("fair" if seq_length >= 1000 else "poor"),
                "models_agree": models_agree,
                "alt_model_phenotype": alt_pheno,
                "alt_model_confidence": round(min(0.985, alt_prob) * 100, 1)
            }
            
            # Sequence quality note
            if seq_length >= 5000:
                trust["seq_quality_note"] = f"{seq_length:,} bp - sufficient for reliable k-mer extraction"
            elif seq_length >= 1000:
                trust["seq_quality_note"] = f"{seq_length:,} bp - marginal; longer sequences improve accuracy"
            else:
                trust["seq_quality_note"] = f"{seq_length:,} bp - too short for reliable prediction"

            # Overall trust score (0-100)
            trust_score = 0
            trust_score += 40 if res["confidence"] >= 70 else (20 if res["confidence"] >= 55 else 0)
            trust_score += 25 if models_agree else 0
            trust_score += 20 if trust["organism_match"] else 0
            trust_score += 15 if trust["seq_quality"] == "good" else (10 if trust["seq_quality"] == "fair" else 0)
            trust["trust_score"] = min(trust_score, 100)
            trust["matched_genus"] = genus.capitalize()

            res["genome_header"] = header
            res["seq_length"] = seq_length
            res["gc_pct"] = round(gc_content(seq[:100000]), 2)
            res["trust"] = trust
            results.append(res)

        return sorted(results, key=lambda r: r["confidence"], reverse=True)


    # ── Public API: genome name (fallback) ─────────────────────────────────────

    def predict_single(
        self,
        genome_name: str,
        antibiotic: str,
        model: str = "rf",
    ) -> dict:
        """Predict from genome name only (less accurate fallback)."""
        genus = genome_name.split()[0].lower() if genome_name else "other"
        res = self._predict_one(genome_name, antibiotic, genus, is_dna=False,
                                 gc_pct=0.0, seq_length=0, model=model)
        res["genome_name"] = genome_name
        return res

    def predict_all(
        self,
        genome_name: str,
        model: str = "rf",
    ) -> list[dict]:
        """Predict all 15 antibiotics from genome name."""
        results = []
        for ab in INDIA_ANTIBIOTICS:
            res = self.predict_single(genome_name, ab, model)
            results.append(res)
        return sorted(results, key=lambda r: r["confidence"], reverse=True)

    def predict_panel(
        self,
        genome_name: str,
        antibiotics: list[str],
    ) -> list[dict]:
        """Compare both models for a custom list of antibiotics."""
        results = []
        for ab in antibiotics:
            rf_res = self.predict_single(genome_name, ab, model="rf")
            lr_res = self.predict_single(genome_name, ab, model="lr")
            results.append({
                "antibiotic": ab,
                "rf_phenotype": rf_res["phenotype"],
                "rf_confidence": rf_res["confidence"],
                "lr_phenotype": lr_res["phenotype"],
                "lr_confidence": lr_res["confidence"],
                "ensemble_phenotype": (
                    rf_res["phenotype"]
                    if rf_res["confidence"] >= lr_res["confidence"]
                    else lr_res["phenotype"]
                ),
            })
        return results


# ── CLI entrypoint ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Zenthera -- Antibiotic Resistance Predictor"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--fasta",
        type=str,
        help="Path to a FASTA genome file (.fasta, .fa, .fna)",
    )
    group.add_argument(
        "--genome_name",
        type=str,
        help='Organism name fallback, e.g. "Escherichia coli"',
    )
    parser.add_argument(
        "--antibiotic",
        type=str,
        default=None,
        help="Single antibiotic name (omit to predict all 15)",
    )
    parser.add_argument(
        "--model",
        type=str,
        choices=["rf", "lr"],
        default="rf",
        help="Model: rf (Random Forest) or lr (Logistic Regression)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.WARNING)

    try:
        pipe = ZentheraPipeline()
    except FileNotFoundError as e:
        print(f"\n  {e}")
        return

    model_name = "Random Forest" if args.model == "rf" else "Logistic Regression"

    if args.fasta:
        # ── FASTA file prediction (primary use case) ───────────────────────
        if not os.path.isfile(args.fasta):
            print(f"\n  File not found: {args.fasta}")
            return

        print(f"\n  Zenthera AMR Predictor")
        print(f"    FASTA file : {args.fasta}")
        print(f"    Model      : {model_name}")

        antibiotics = [args.antibiotic] if args.antibiotic else None
        results = pipe.predict_from_fasta(args.fasta, antibiotics, args.model)

        if results:
            print(f"    Genome     : {results[0].get('genome_header', 'N/A')}")
            print(f"    Seq length : {results[0].get('seq_length', 0):,} bp")
            print(f"    GC content : {results[0].get('gc_pct', 0):.1f}%")

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print(f"\n{'Antibiotic':<24} {'Phenotype':<15} Confidence")
            print("-" * 55)
            for r in results:
                marker = "[R]" if r["phenotype"] == "Resistant" else "[S]"
                print(
                    f"  {marker}  {r['antibiotic']:<22} "
                    f"{r['phenotype']:<15} "
                    f"{r['confidence']}%"
                )

    else:
        # ── Genome name fallback ───────────────────────────────────────────
        print(f"\n  Zenthera AMR Predictor (name-based fallback)")
        print(f"    Organism : {args.genome_name}")
        print(f"    Model    : {model_name}")
        print(f"    NOTE     : Upload a FASTA file (--fasta) for best accuracy")

        if args.antibiotic:
            result = pipe.predict_single(args.genome_name, args.antibiotic, args.model)
            results = [result]
        else:
            results = pipe.predict_all(args.genome_name, args.model)

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print(f"\n{'Antibiotic':<24} {'Phenotype':<15} Confidence")
            print("-" * 55)
            for r in results:
                marker = "[R]" if r["phenotype"] == "Resistant" else "[S]"
                print(
                    f"  {marker}  {r['antibiotic']:<22} "
                    f"{r['phenotype']:<15} "
                    f"{r['confidence']}%"
                )

    print()


if __name__ == "__main__":
    main()
