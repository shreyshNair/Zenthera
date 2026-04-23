"""
card_scanner.py
================
Scans bacterial genomes for known antibiotic resistance genes using
k-mer containment analysis against the CARD gene index.

Provides a deterministic layer that overrides ML predictions when
well-characterised resistance genes are detected in the genome.
"""

import os
import json
import logging
from typing import Optional

from config import (
    CARD_INDEX_FILE,
    GENE_KMER_SIZE,
    GENE_DETECT_THRESHOLD,
)

log = logging.getLogger(__name__)


class ResistanceGeneScanner:
    """Loads the CARD gene index and scans genomes for resistance genes."""

    def __init__(self) -> None:
        self.genes: dict = {}
        self.available = False
        self._load_index()

    def _load_index(self) -> None:
        if not os.path.exists(CARD_INDEX_FILE):
            log.info("CARD gene index not found. Run: python step5_setup_card.py")
            return
        try:
            with open(CARD_INDEX_FILE, "r", encoding="utf-8") as f:
                self.genes = json.load(f)
            self.available = True
            log.info(f"CARD scanner loaded: {len(self.genes)} resistance genes")
        except Exception as e:
            log.warning(f"Failed to load CARD index: {e}")

    @staticmethod
    def _extract_kmers(seq: str, k: int) -> set:
        """Extract all k-mers from a DNA sequence."""
        seq = seq.upper()
        return {seq[i:i+k] for i in range(len(seq) - k + 1)}

    def scan(self, genome_seq: str) -> list[dict]:
        """
        Scan a genome sequence for known resistance genes.

        Returns a list of detected genes:
        [
            {
                "gene": "blaTEM-1",
                "antibiotics": ["ampicillin", "amoxicillin"],
                "coverage": 0.87,
                "gene_length": 861,
                "description": "..."
            },
            ...
        ]
        """
        if not self.available or not genome_seq:
            return []

        k = GENE_KMER_SIZE
        genome_seq_clean = "".join(c for c in genome_seq.upper() if c in "ACGT")

        if len(genome_seq_clean) < k:
            return []

        # Build genome k-mer set (one-time cost)
        genome_kmers = self._extract_kmers(genome_seq_clean, k)

        detected = []
        for gene_name, gene_info in self.genes.items():
            gene_seq = gene_info["sequence"]
            if len(gene_seq) < k:
                continue

            gene_kmers = self._extract_kmers(gene_seq, k)
            if not gene_kmers:
                continue

            # Containment: fraction of gene k-mers found in the genome
            hits = len(gene_kmers & genome_kmers)
            coverage = hits / len(gene_kmers)

            if coverage >= GENE_DETECT_THRESHOLD:
                detected.append({
                    "gene": gene_name,
                    "antibiotics": gene_info["antibiotics"],
                    "coverage": round(coverage, 3),
                    "gene_length": gene_info["length"],
                    "description": gene_info.get("description", ""),
                })

        # Sort by coverage descending
        detected.sort(key=lambda x: x["coverage"], reverse=True)

        if detected:
            log.info(f"CARD scan: {len(detected)} resistance genes detected")
        return detected

    def get_resistant_drugs(self, genome_seq: str) -> dict:
        """
        Scan genome and return a dict of antibiotic -> list of detected genes.
        Only includes antibiotics for which at least one gene was found.
        """
        detections = self.scan(genome_seq)
        drug_genes: dict[str, list] = {}
        for d in detections:
            for ab in d["antibiotics"]:
                if ab not in drug_genes:
                    drug_genes[ab] = []
                drug_genes[ab].append({
                    "gene": d["gene"],
                    "coverage": d["coverage"],
                })
        return drug_genes
