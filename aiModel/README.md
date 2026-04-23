# Zenthera AMR Model — aiModel

ML pipeline for antibiotic resistance prediction using data from the **BV-BRC** public genomics API.

## 📁 File Structure

```
aiModel/
├── config.py              # All settings (antibiotics, API, model hyperparams)
├── requirements.txt       # Python dependencies
│
├── step1_fetch_data.py    # Stream AMR records from BV-BRC API → data/amr_raw.csv
├── step2_preprocess.py    # Clean data + build k-mer + metadata features
├── step3_train.py         # Train Random Forest & Logistic Regression
├── step4_evaluate.py      # Holdout evaluation + per-antibiotic AUC
│
├── predict.py             # Inference module (import into web app or run CLI)
├── run_pipeline.py        # Master runner — runs all 4 steps
│
├── data/                  # Created automatically
│   ├── amr_raw.csv
│   ├── amr_processed.csv
│   ├── amr_features.npz
│   └── amr_features_labels.npy
│
├── models/                # Created automatically
│   ├── random_forest.joblib
│   ├── logistic_regression.joblib
│   ├── kmer_vectorizer.joblib
│   └── label_encoder.joblib
│
└── logs/                  # Created automatically
    ├── fetch.log
    ├── train.log
    ├── eval.log
    ├── training_report.txt
    └── eval_report.txt
```

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the full pipeline (~15-20 min)
```bash
python run_pipeline.py
```

### 3. Make predictions
```bash
# Single antibiotic
python predict.py --genome_name "Escherichia coli" --antibiotic ciprofloxacin

# All 15 India antibiotics
python predict.py --genome_name "Klebsiella pneumoniae"

# Use Logistic Regression instead
python predict.py --genome_name "Pseudomonas aeruginosa" --model lr
```

## ⚙️ Advanced Options

```bash
# Skip data fetch (reuse existing data/amr_raw.csv)
python run_pipeline.py --skip-fetch

# Run only specific steps
python run_pipeline.py --steps 3 4     # Re-train and re-evaluate only
python run_pipeline.py --steps 2 3 4   # Re-process + re-train + re-evaluate
```

## 🦠 Antibiotics Covered (15 — India WHO/ICMR Panel)

| # | Antibiotic | Class | Common Use in India |
|---|------------|-------|---------------------|
| 1 | Ciprofloxacin | Fluoroquinolone | UTI, GI infections |
| 2 | Amoxicillin | Penicillin | Respiratory, urinary |
| 3 | Ampicillin | Penicillin | Broad spectrum |
| 4 | Tetracycline | Tetracycline | Community infections |
| 5 | Azithromycin | Macrolide | Respiratory, enteric fever |
| 6 | Ceftriaxone | 3rd-gen Cephalosporin | Hospital infections |
| 7 | Meropenem | Carbapenem | Last resort |
| 8 | Colistin | Polymyxin | Pan-resistant gram-negatives |
| 9 | Trimethoprim | Sulfonamide | UTI prophylaxis |
| 10 | Chloramphenicol | Amphenicol | Typhoid |
| 11 | Erythromycin | Macrolide | Respiratory |
| 12 | Levofloxacin | Fluoroquinolone | Respiratory |
| 13 | Imipenem | Carbapenem | Hospital |
| 14 | Gentamicin | Aminoglycoside | Sepsis |
| 15 | Doxycycline | Tetracycline | Leptospirosis, scrub typhus |

## 🔬 How It Works

```
BV-BRC API  →  Stream AMR Records  →  K-mer Features  →  ML Model  →  Prediction
(~5,000 records)   (genome name)     (TF-IDF 3,4-mers)  (RF + LR)   (R/S + confidence%)
```

**Feature extraction:**
- Character k-mers (k=3, k=4) from organism names → TF-IDF weighted
- Antibiotic one-hot encoding (15 dimensions)
- Genus-level one-hot encoding (top 50 genera)
- Normalised taxon ID

**Models:**
- **Random Forest** (200 trees, balanced class weights, all CPU cores)
- **Logistic Regression** (L2, `lbfgs`, balanced class weights)

## 🔌 Import into Web App

```python
from aiModel.predict import ZentheraPipeline

pipe = ZentheraPipeline()   # Load models once at startup

# Single prediction
result = pipe.predict_single("Escherichia coli", "ciprofloxacin")
# → {"phenotype": "Resistant", "confidence": 82.3, ...}

# Full resistance panel
results = pipe.predict_all("Klebsiella pneumoniae")
# → [{"antibiotic": "meropenem", "phenotype": "Resistant", ...}, ...]
```

## 📊 Expected Performance (5-fold CV)

| Metric | Random Forest | Logistic Regression |
|--------|--------------|---------------------|
| Accuracy | ~0.85–0.92 | ~0.80–0.87 |
| ROC-AUC | ~0.90–0.95 | ~0.85–0.92 |
| F1 (weighted) | ~0.85–0.92 | ~0.80–0.87 |

> Performance varies by antibiotic. Ciprofloxacin, ceftriaxone, and meropenem
> typically have the most training data and highest accuracy.

## ⚠️ Data Notes

- Data sourced from **BV-BRC genome_amr** endpoint (public, no auth required)
- Only **Laboratory Method** and **Phenotype** evidence types are used
- **Intermediate** resistance records are excluded (binary classification only)
- ~5,000 records targeted across 15 antibiotics (~333/drug)
