"""
step5_setup_card.py
====================
Downloads the CARD (Comprehensive Antibiotic Resistance Database) and
builds a local gene index for deterministic resistance gene detection.

Run:
    python step5_setup_card.py

Output:
    data/card/gene_index.json   (indexed resistance genes for our 15 antibiotics)
"""

import os
import json
import tarfile
import logging
import requests
from io import BytesIO
from collections import defaultdict

from config import (
    CARD_DIR,
    CARD_INDEX_FILE,
    CARD_DOWNLOAD_URL,
    INDIA_ANTIBIOTICS,
    LOGS_DIR,
)

os.makedirs(CARD_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(f"{LOGS_DIR}/card_setup.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ── Drug-class keyword mapping ─────────────────────────────────────────────────
# CARD uses drug class names in its ontology.  We map them to our 15 antibiotics.
DRUG_CLASS_TO_ANTIBIOTICS = {
    # Penicillins
    "penam": ["ampicillin", "amoxicillin"],
    "penicillin": ["ampicillin", "amoxicillin"],
    "ampicillin": ["ampicillin"],
    "amoxicillin": ["amoxicillin"],
    # Cephalosporins
    "cephalosporin": ["ceftriaxone"],
    "cephamycin": ["ceftriaxone"],
    "ceftriaxone": ["ceftriaxone"],
    # Carbapenems
    "carbapenem": ["meropenem", "imipenem"],
    "meropenem": ["meropenem"],
    "imipenem": ["imipenem"],
    # Tetracyclines
    "tetracycline": ["tetracycline", "doxycycline"],
    "doxycycline": ["doxycycline"],
    # Fluoroquinolones
    "fluoroquinolone": ["ciprofloxacin", "levofloxacin"],
    "ciprofloxacin": ["ciprofloxacin"],
    "levofloxacin": ["levofloxacin"],
    # Aminoglycosides
    "aminoglycoside": ["gentamicin"],
    "gentamicin": ["gentamicin"],
    # Macrolides
    "macrolide": ["azithromycin", "erythromycin"],
    "azithromycin": ["azithromycin"],
    "erythromycin": ["erythromycin"],
    # Polymyxins
    "peptide antibiotic": ["colistin"],
    "polymyxin": ["colistin"],
    "colistin": ["colistin"],
    # Phenicols
    "phenicol": ["chloramphenicol"],
    "chloramphenicol": ["chloramphenicol"],
    # Diaminopyrimidines
    "diaminopyrimidine": ["trimethoprim"],
    "trimethoprim": ["trimethoprim"],
}


def map_drug_classes(drug_class_str: str) -> list[str]:
    """Convert CARD drug class string to our target antibiotics."""
    if not drug_class_str:
        return []
    matched = set()
    dc_lower = drug_class_str.lower()
    for keyword, antibiotics in DRUG_CLASS_TO_ANTIBIOTICS.items():
        if keyword in dc_lower:
            matched.update(antibiotics)
    return [a for a in matched if a in INDIA_ANTIBIOTICS]


def download_card() -> dict:
    """Download and parse CARD database. Returns card.json as dict."""
    log.info(f"Downloading CARD database from {CARD_DOWNLOAD_URL} ...")
    resp = requests.get(CARD_DOWNLOAD_URL, timeout=120, stream=True)
    resp.raise_for_status()

    log.info(f"Download complete ({len(resp.content) / 1e6:.1f} MB). Extracting ...")

    card_data = None
    with tarfile.open(fileobj=BytesIO(resp.content), mode="r:bz2") as tar:
        for member in tar.getmembers():
            if member.name.endswith("card.json"):
                f = tar.extractfile(member)
                if f:
                    card_data = json.loads(f.read().decode("utf-8"))
                    log.info(f"Parsed card.json: {len(card_data)} entries")
                    break

    if not card_data:
        raise FileNotFoundError("card.json not found in CARD archive")
    return card_data


def build_gene_index(card_data: dict) -> dict:
    """
    Parse CARD JSON and extract resistance genes relevant to our 15 antibiotics.
    Returns a dict of gene_name -> {sequence, antibiotics, family, description}.
    """
    genes = {}
    skipped = 0
    no_seq = 0

    for key, entry in card_data.items():
        # Skip non-model entries
        if not isinstance(entry, dict):
            continue
        if "ARO_name" not in entry:
            continue

        gene_name = entry.get("ARO_name", "").strip()
        aro_desc = entry.get("ARO_description", "")

        # Get drug class from ARO categories
        drug_classes = ""
        categories = entry.get("ARO_category", {})
        if isinstance(categories, dict):
            for cat_id, cat_info in categories.items():
                if isinstance(cat_info, dict):
                    cat_class = cat_info.get("category_aro_class_name", "")
                    if cat_class.lower() in ("drug class", "antibiotic"):
                        drug_classes += " " + cat_info.get("category_aro_name", "")

        # Map to our antibiotics
        target_abs = map_drug_classes(drug_classes)
        if not target_abs:
            skipped += 1
            continue

        # Extract nucleotide sequence
        seq_data = entry.get("model_sequences", {})
        dna_seq = ""
        if isinstance(seq_data, dict):
            for seq_key, seq_info in seq_data.items():
                if isinstance(seq_info, dict):
                    for inner_key, inner_val in seq_info.items():
                        if isinstance(inner_val, dict):
                            candidate = inner_val.get("dna_sequence", {})
                            if isinstance(candidate, dict):
                                s = candidate.get("sequence", "")
                                if s and len(s) > len(dna_seq):
                                    dna_seq = s

        if not dna_seq or len(dna_seq) < 100:
            no_seq += 1
            continue

        # Clean sequence
        dna_seq = "".join(c for c in dna_seq.upper() if c in "ACGT")
        if len(dna_seq) < 100:
            no_seq += 1
            continue

        genes[gene_name] = {
            "sequence": dna_seq,
            "antibiotics": sorted(target_abs),
            "length": len(dna_seq),
            "description": aro_desc[:200] if aro_desc else "",
        }

    log.info(f"Indexed {len(genes)} resistance genes for our 15 antibiotics")
    log.info(f"Skipped {skipped} (irrelevant drug class), {no_seq} (no/short sequence)")
    return genes


def main() -> None:
    log.info("=" * 60)
    log.info("Zenthera -- CARD Resistance Gene Database Setup")
    log.info("=" * 60)

    try:
        card_data = download_card()
    except Exception as e:
        log.error(f"Failed to download CARD: {e}")
        log.info("You can retry later. The ML model will still work without CARD.")
        return

    gene_index = build_gene_index(card_data)

    if not gene_index:
        log.warning("No genes were indexed. Check CARD data format.")
        return

    # Save index
    with open(CARD_INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(gene_index, f, indent=2)

    log.info(f"Gene index saved to {CARD_INDEX_FILE}")

    # Print summary per antibiotic
    ab_counts = defaultdict(int)
    for g in gene_index.values():
        for ab in g["antibiotics"]:
            ab_counts[ab] += 1

    log.info("\nGenes per antibiotic:")
    for ab in INDIA_ANTIBIOTICS:
        log.info(f"  {ab:20s} : {ab_counts.get(ab, 0)} genes")

    log.info("=" * 60)
    log.info("CARD setup complete!")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
