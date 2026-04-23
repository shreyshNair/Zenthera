"""
step2_preprocess.py
====================
Cleans the AMR CSV, merges real DNA sequences, then builds features:

  1. DNA k-mer TF-IDF  (k=3,4) — from actual genome sequences
     Falls back to genome-name character k-mers if no sequence available.
  2. GC content (numeric)
  3. Sequence length (log-normalised)
  4. Antibiotic one-hot (15 drugs)
  5. Genus one-hot (top 50 genera)
  6. Taxon ID normalised

Run:
    python step2_preprocess.py

Input:
    data/amr_raw.csv
    data/genome_sequences.csv   (from step1b — optional but recommended)

Output:
    data/amr_processed.csv
    data/amr_features.npz
    data/amr_features_labels.npy
    models/kmer_vectorizer.joblib
    models/label_encoder.joblib
"""

import os
import logging
import warnings

import numpy as np
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from scipy.sparse import hstack, csr_matrix, save_npz

from config import (
    DATA_DIR,
    MODELS_DIR,
    LOGS_DIR,
    RAW_DATA_FILE,
    PROCESSED_DATA_FILE,
    FEATURES_FILE,
    LABEL_ENCODER_FILE,
    VECTORIZER_FILE,
    KMER_SIZES,
    MAX_KMER_FEATURES,
    INDIA_ANTIBIOTICS,
    RANDOM_STATE,
)

warnings.filterwarnings("ignore")

GENOME_SEQ_FILE = f"{DATA_DIR}/genome_sequences.csv"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(f"{LOGS_DIR}/preprocess.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


# ── K-mer helpers ──────────────────────────────────────────────────────────────

def dna_to_kmers(seq: str, k: int) -> str:
    """
    Convert a DNA sequence string to a space-joined string of k-mers.
    Skips any k-mer containing 'N' (ambiguous bases).

    e.g. 'ACGTACGT', k=3 → 'ACG CGT GTA TAC ACG CGT'
    """
    seq = seq.upper()
    kmers = [
        seq[i : i + k]
        for i in range(len(seq) - k + 1)
        if "N" not in seq[i : i + k]
    ]
    return " ".join(kmers)


def name_to_kmers(name: str, k: int) -> str:
    """Fallback: character k-mers from genome name when no FASTA available."""
    cleaned = "".join(c.lower() for c in name if c.isalpha())
    return " ".join(cleaned[i : i + k] for i in range(len(cleaned) - k + 1))


def make_kmer_corpus(df: pd.DataFrame, k: int) -> list[str]:
    """
    For each row, return the best k-mer string available:
      - Real DNA k-mers if seq_sample is present and long enough
      - Otherwise fall back to genome name character k-mers
    """
    corpus = []
    dna_count = 0
    for _, row in df.iterrows():
        seq = str(row.get("seq_sample", ""))
        if len(seq) >= k * 2:                    # Have real DNA
            corpus.append(dna_to_kmers(seq, k))
            dna_count += 1
        else:                                     # Fallback
            corpus.append(name_to_kmers(str(row.get("genome_name", "")), k))

    if k == KMER_SIZES[0]:                        # Log once
        pct = dna_count / max(len(df), 1) * 100
        log.info(f"  DNA sequences used: {dna_count:,}/{len(df):,} ({pct:.1f}%)")

    return corpus


# ── Load & clean ───────────────────────────────────────────────────────────────

def load_and_clean(amr_path: str, seq_path: str) -> pd.DataFrame:
    log.info(f"Loading AMR data from {amr_path} ...")
    df = pd.read_csv(amr_path, low_memory=False)
    log.info(f"  Raw rows: {len(df):,}")

    df = df.dropna(subset=["genome_id", "antibiotic", "resistant_phenotype"])
    df = df[df["resistant_phenotype"].isin(["Resistant", "Susceptible"])]
    df["antibiotic"] = df["antibiotic"].str.lower().str.strip()
    df = df[df["antibiotic"].isin(INDIA_ANTIBIOTICS)]
    df["genome_name"] = df["genome_name"].fillna("unknown organism")
    log.info(f"  After cleaning: {len(df):,} rows")

    # Merge sequences
    if os.path.exists(seq_path):
        log.info(f"Merging genome sequences from {seq_path} ...")
        seq_df = pd.read_csv(seq_path, low_memory=False, usecols=[
            "genome_id", "seq_sample", "seq_length", "gc_pct"
        ])
        df = df.merge(seq_df, on="genome_id", how="left")
        has_seq = df["seq_sample"].notna() & (df["seq_sample"].str.len() > 10)
        log.info(f"  Genomes with real DNA sequence: {has_seq.sum():,}/{len(df):,}")
    else:
        log.warning(
            f"  {seq_path} not found. Run step1b_fetch_sequences.py first for best results.\n"
            "  Falling back to genome-name character k-mers."
        )
        df["seq_sample"] = ""
        df["seq_length"] = 0
        df["gc_pct"] = 0.0

    # Fill missing sequence columns
    df["seq_sample"] = df["seq_sample"].fillna("")
    df["seq_length"] = pd.to_numeric(df["seq_length"], errors="coerce").fillna(0)
    df["gc_pct"] = pd.to_numeric(df["gc_pct"], errors="coerce").fillna(0.0)

    return df.reset_index(drop=True)


# ── Feature builders ───────────────────────────────────────────────────────────

def build_kmer_features(df: pd.DataFrame):
    """TF-IDF k-mer matrix from real DNA (or fallback name k-mers)."""
    log.info(f"Building k-mer features (k={KMER_SIZES}, max_features={MAX_KMER_FEATURES}) ...")
    matrices = []
    vectorizers = {}

    for k in KMER_SIZES:
        log.info(f"  Vectorising {k}-mers ...")
        corpus = make_kmer_corpus(df, k)
        vec = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 1),
            max_features=MAX_KMER_FEATURES,
            sublinear_tf=True,
            min_df=2,
        )
        X_k = vec.fit_transform(corpus)
        matrices.append(X_k)
        vectorizers[k] = vec
        log.info(f"  {k}-mer matrix: {X_k.shape}")

    joblib.dump(vectorizers, VECTORIZER_FILE)
    log.info(f"  Vectorizer saved → {VECTORIZER_FILE}")
    return hstack(matrices)


def build_metadata_features(df: pd.DataFrame) -> np.ndarray:
    """Numeric + one-hot metadata features.
    REDUCED: Only includes Antibiotic targets to force the model
    to rely on the DNA K-mers rather than Genus metadata."""
    log.info("Building metadata features (Antibiotics ONLY) ...")

    # Antibiotic one-hot (fixed 15-dim)
    ab_dummies = pd.get_dummies(df["antibiotic"], prefix="ab", dtype=np.float32)
    for ab in INDIA_ANTIBIOTICS:
        col = f"ab_{ab}"
        if col not in ab_dummies.columns:
            ab_dummies[col] = 0.0
    ab_dummies = ab_dummies[[f"ab_{a}" for a in INDIA_ANTIBIOTICS]]

    meta = ab_dummies.values
    log.info(f"  Metadata feature shape: {meta.shape}")
    return meta


def encode_labels(df: pd.DataFrame):
    """Binary encode resistant_phenotype → Resistant=1, Susceptible=0."""
    le = LabelEncoder()
    # Ensure consistent ordering: Resistant=1, Susceptible=0
    le.fit(["Susceptible", "Resistant"])
    y = le.transform(df["resistant_phenotype"])
    log.info(f"  Label mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}")
    joblib.dump(le, LABEL_ENCODER_FILE)
    log.info(f"  LabelEncoder saved → {LABEL_ENCODER_FILE}")
    return y, le


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("=" * 60)
    log.info("Zenthera AMR Preprocessor  (DNA k-mer edition)")
    log.info("=" * 60)

    df = load_and_clean(RAW_DATA_FILE, GENOME_SEQ_FILE)
    df.to_csv(PROCESSED_DATA_FILE, index=False)
    log.info(f"Processed CSV saved → {PROCESSED_DATA_FILE}")

    # Class distribution
    log.info("\nClass distribution:")
    for label, cnt in df["resistant_phenotype"].value_counts().items():
        pct = cnt / len(df) * 100
        log.info(f"  {label:<15} {cnt:>5} ({pct:.1f}%)")

    log.info("\nPer-antibiotic counts:")
    for ab, grp in df.groupby("antibiotic"):
        r = grp["resistant_phenotype"].eq("Resistant").sum()
        s = grp["resistant_phenotype"].eq("Susceptible").sum()
        log.info(f"  {ab:<22} {len(grp):>4} rows  (R={r}, S={s})")

    # Build features
    X_kmer = build_kmer_features(df)
    X_meta = build_metadata_features(df)
    X_meta_sparse = csr_matrix(X_meta)
    X = hstack([X_kmer, X_meta_sparse])
    log.info(f"\nFinal feature matrix: {X.shape}")

    # Encode labels
    y, _ = encode_labels(df)

    # Save
    save_npz(FEATURES_FILE.replace(".npz", ""), X)
    np.save(FEATURES_FILE.replace(".npz", "_labels.npy"), y)
    log.info(f"Features saved → {FEATURES_FILE}")
    log.info(f"Labels   saved → {FEATURES_FILE.replace('.npz', '_labels.npy')}")

    log.info("")
    log.info("=" * 60)
    log.info("Preprocessing complete!")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
