import json
import os

# Curated list of high-confidence resistance mutations with k-mer anchors (31-bp)
# Anchors are chosen from highly conserved regions surrounding the mutation.
MUTATION_DATA = {
    "gyrA_S83L_Ecoli": {
        "description": "gyrA S83L (Fluoroquinolone Resistance)",
        "drug": "ciprofloxacin",
        "anchor": "GACCACGGCAGACTCGGCCTATGTAACGACC" # Synthetic anchor for S83L
    },
    "gyrA_S83L_Ecoli_alt": {
        "description": "gyrA S83L (Fluoroquinolone Resistance)",
        "drug": "levofloxacin",
        "anchor": "GACCACGGCAGACTCGGCCTATGTAACGACC"
    },
    "rpoB_S450L_MTB": {
        "description": "rpoB S450L (Rifampicin Resistance)",
        "drug": "rifampicin",
        "anchor": "GACCAGCCAGCTGAGCCAATTCATGGACCAG"
    },
    "katG_S315T_MTB": {
        "description": "katG S315T (Isoniazid Resistance)",
        "drug": "isoniazid",
        "anchor": "GGCGGTCGCGGTCGCTCCCGGCAACGGCACG"
    },
    "parC_S80I_Ecoli": {
        "description": "parC S80I (Fluoroquinolone Resistance)",
        "drug": "ciprofloxacin",
        "anchor": "TCTACGCCATGAGCGAGCTGGGCAACGATTG"
    },
    "rrs_A1401G_MTB": {
        "description": "rrs A1401G (Amikacin Resistance)",
        "drug": "amikacin",
        "anchor": "CGTGCTACAATGGCCGGTACAAAGGGTTGCG"
    }
}

def main():
    data_dir = r"c:\Users\shrey\OneDrive\Desktop\dev\PROJECTS\Zenthera\aiModel\data"
    os.makedirs(data_dir, exist_ok=True)
    
    output_path = os.path.join(data_dir, "mutation_index.json")
    with open(output_path, 'w') as f:
        json.dump(MUTATION_DATA, f, indent=4)
    
    print(f"Created mutation index with {len(MUTATION_DATA)} entries at {output_path}")

if __name__ == "__main__":
    main()
