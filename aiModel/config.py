# ============================================================
# config.py — Central configuration for Zenthera AMR Pipeline
# ============================================================

# BV-BRC API base URL
API_BASE_URL = "https://www.bv-brc.org/api"

# ──────────────────────────────────────────────────────────────
# Most widely used antibiotics in India (WHO Essential Medicines
# + ICMR AMR surveillance panel)
# ──────────────────────────────────────────────────────────────
INDIA_ANTIBIOTICS = [
    # Original 15
    "ciprofloxacin", "amoxicillin", "ampicillin", "tetracycline", "azithromycin",
    "ceftriaxone", "meropenem", "colistin", "trimethoprim", "chloramphenicol",
    "erythromycin", "levofloxacin", "imipenem", "gentamicin", "doxycycline",
    
    # New 20 (Clinical Expansion)
    "amikacin", "tobramycin",           # Aminoglycosides
    "cefepime", "ceftazidime",          # 3rd/4th gen Cephalosporins
    "nitrofurantoin", "fosfomycin",     # UTI specifics
    "tigecycline", "aztreonam",         # Reserve Beta-lactams
    "teicoplanin", "vancomycin",        # Glycopeptides (Gram+)
    "linezolid", "clindamycin",         # Oxazolidinone/Lincosamide
    "moxifloxacin", "cefotaxime",       # Fluoroquinolones/Cephalosporins
    "cefuroxime", "metronidazole",      # Anaerobes/STIs
    "rifampicin", "isoniazid",          # Tuberculosis (Critical)
    "pyrazinamide", "ethambutol"        # Tuberculosis (Critical)
]

# ──────────────────────────────────────────────────────────────
# Data collection settings
# ──────────────────────────────────────────────────────────────
TARGET_RECORDS_PER_ANTIBIOTIC = 5000   # Increased for better clinical resolution

API_BATCH_SIZE = 100                   # Records per API request
API_TIMEOUT_SEC = 30                   # Seconds before timeout
API_RETRY_ATTEMPTS = 3                 # Retry failed requests

# Evidence filter – use only lab-confirmed phenotypes
EVIDENCE_TYPES = ["Laboratory Method", "Phenotype"]

# ──────────────────────────────────────────────────────────────
# Feature engineering
# ──────────────────────────────────────────────────────────────
KMER_SIZES = [3, 4]          # k-mer lengths to extract
MAX_KMER_FEATURES = 500      # Per k size (improves resolution)

# ──────────────────────────────────────────────────────────────
# Model training
# ──────────────────────────────────────────────────────────────
TEST_SIZE = 0.20             # 80/20 train-test split
RANDOM_STATE = 42

RF_PARAMS = {
    "n_estimators": 300,
    "max_depth": None,
    "min_samples_split": 2,
    "min_samples_leaf": 1,
    "n_jobs": -1,            # Use all CPU cores
    "random_state": RANDOM_STATE,
}

LR_PARAMS = {
    "C": 1.0,
    "max_iter": 1000,
    "solver": "lbfgs",
    "multi_class": "ovr",
    "random_state": RANDOM_STATE,
}

# ──────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────
DATA_DIR = "data"
MODELS_DIR = "models"
LOGS_DIR = "logs"
RAW_DATA_FILE = f"{DATA_DIR}/amr_raw.csv"
PROCESSED_DATA_FILE = f"{DATA_DIR}/amr_processed.csv"
FEATURES_FILE = f"{DATA_DIR}/amr_features.npz"
LABEL_ENCODER_FILE = f"{MODELS_DIR}/label_encoder.joblib"
VECTORIZER_FILE = f"{MODELS_DIR}/kmer_vectorizer.joblib"
RF_MODEL_FILE = f"{MODELS_DIR}/random_forest.joblib"
LR_MODEL_FILE = f"{MODELS_DIR}/logistic_regression.joblib"
REPORT_FILE = f"{LOGS_DIR}/training_report.txt"

# ──────────────────────────────────────────────────────────────
# CARD Resistance Gene Database
# ──────────────────────────────────────────────────────────────
CARD_DIR = f"{DATA_DIR}/card"
CARD_INDEX_FILE = f"{CARD_DIR}/gene_index.json"
CARD_DOWNLOAD_URL = "https://card.mcmaster.ca/latest/data"
GENE_KMER_SIZE = 21            # k-mer size for gene detection
GENE_DETECT_THRESHOLD = 0.60   # min fraction of gene k-mers to call detected
