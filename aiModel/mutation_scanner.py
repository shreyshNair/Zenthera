import os
import json
import logging

log = logging.getLogger(__name__)

class MutationScanner:
    """
    Detects high-confidence resistance-conferring point mutations (SNPs)
    using a k-mer anchor approach.
    """
    
    def __init__(self, index_path: str = None):
        self.index_path = index_path or os.path.join(os.path.dirname(__file__), "data", "mutation_index.json")
        self.mutations = {}
        self.available = False
        self.load_index()

    def load_index(self):
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, 'r') as f:
                    self.mutations = json.load(f)
                self.available = True
                log.info(f"Mutation scanner loaded: {len(self.mutations)} target mutations")
            except Exception as e:
                log.error(f"Failed to load mutation index: {e}")
        else:
            log.warning(f"Mutation index not found at {self.index_path}")

    def scan(self, dna_seq: str) -> list[dict]:
        """
        Scan DNA sequence for known mutation k-mer anchors.
        """
        if not self.available:
            return []
            
        hits = []
        seq_upper = dna_seq.upper()
        
        for mut_id, info in self.mutations.items():
            # info contains { "anchor": "ACTG...", "drug": "ciprofloxacin", "description": "gyrA S83L" }
            anchor = info.get("anchor", "").upper()
            if not anchor: continue
            
            if anchor in seq_upper:
                hits.append({
                    "mutation": info.get("description", mut_id),
                    "antibiotic": info.get("drug"),
                    "confidence": 1.0  # Deterministic
                })
        
        return hits

    def get_resistant_drugs(self, dna_seq: str) -> dict:
        """
        Returns a mapping of antibiotic -> list of mutations detected.
        """
        hits = self.scan(dna_seq)
        drug_map = {}
        for h in hits:
            drug = h["antibiotic"]
            if drug not in drug_map:
                drug_map[drug] = []
            drug_map[drug].append({
                "mutation": h["mutation"],
                "type": "MUTATION",
                "confidence": h["confidence"]
            })
        return drug_map
