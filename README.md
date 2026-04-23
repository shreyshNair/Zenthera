# Zenthera: Clinical AI-Powered Antimicrobial Resistance (AMR) Diagnostics

Zenthera is a state-of-the-art, high-fidelity clinical platform designed to predict antibiotic resistance patterns in bacterial genomes. It utilizes a **dual-layer hybrid diagnostic strategy**, combining deterministic genomic scanning with probabilistic Machine Learning to provide frontline clinicians with rapid, actionable resistance profiles.

![Zenthera Landing Page](https://github.com/shreyshNair/Zenthera/blob/main/frontend/public/logo.png?raw=true)

---

## 🧬 Diagnostic Architecture

The Zenthera pipeline processes raw FASTA genomic data through a sophisticated multi-stage analysis engine:

### 1. Hybrid Detection Strategy
*   **Deterministic Layer (CARD & Mutation Scanning)**: 
    *   **Gene Scanner**: Scans for known resistance genes using the Comprehensive Antibiotic Resistance Database (CARD).
    *   **Mutation Scanner**: Identifies specific clinical mutations known to confer resistance (e.g., *gyrA* mutations for fluoroquinolones).
*   **Probabilistic Layer (ML Pipeline)**: 
    *   **Feature Engineering**: DNA k-mers (k=3, k=4) are transformed into high-dimensional vectors using TF-IDF normalization.
    *   **Ensemble Models**: Random Forest and Logistic Regression models, trained on 15+ high-priority antibiotics from the BV-BRC database.

### 2. Clinical Actionability
The system produces a categorized resistance report for **35 antibiotics**, focusing on those most relevant to clinical practice in India and globally:

| Antibiotic Class | Examples |
|------------------|----------|
| **Fluoroquinolones** | Ciprofloxacin, Levofloxacin, Moxifloxacin |
| **Beta-lactams** | Amoxicillin, Ampicillin, Ceftriaxone, Cefuroxime |
| **Carbapenems** | Meropenem, Imipenem |
| **Polymyxins** | Colistin (Last-resort) |
| **Aminoglycosides** | Gentamicin, Amikacin, Tobramycin |
| **Glycopeptides** | Vancomycin, Teicoplanin (MRSA focus) |
| **Anti-TB Drugs** | Rifampicin, Isoniazid, Pyrazinamide, Ethambutol |

---

## 🚀 Performance Benchmarks

The machine learning models are evaluated using 5-fold cross-validation on real-world clinical isolates:

| Metric | Random Forest (Ensemble) | Logistic Regression |
|--------|--------------------------|---------------------|
| **Accuracy** | ~0.88 – 0.94 | ~0.82 – 0.89 |
| **ROC-AUC** | ~0.92 – 0.97 | ~0.87 – 0.93 |
| **F1-Score** | ~0.89 – 0.95 | ~0.83 – 0.90 |

*Note: Performance varies by antibiotic. Ciprofloxacin and Meropenem typically show the highest accuracy due to robust training data.*

---

## 🛠️ Project Structure

```bash
Zenthera/
├── frontend/               # React + Vite + Tailwind CSS (Premium UI)
│   ├── src/
│   │   ├── components/     # High-fidelity dashboard & 3D visualizations
│   │   ├── pages/          # Landing, Analysis Dashboard, HowItWorks
│   │   └── App.tsx         # Routing and global state management
│   └── index.html
├── aiModel/                # Python + Flask + ML Backend
│   ├── models/             # joblib-compressed ML models (managed by Git LFS)
│   ├── data/               # Genomic metadata & CARD/Mutation indexes
│   ├── app.py              # Flask REST API Server
│   ├── predict.py          # Core Hybrid Inference Pipeline
│   ├── card_scanner.py     # Deterministic Gene Matcher
│   └── mutation_scanner.py # Clinical Mutation Scanner
├── .gitignore              # Robust exclusion for data and cache
└── README.md               # Main project documentation
```

---

## ⚡ Quick Start

### 1. Backend (Inference Engine)
1. Navigate to `aiModel/`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Ensure large models are pulled via Git LFS: `git lfs pull`.
4. Start the server: `python app.py`.
   *   API Endpoint: `POST /api/predict` (Accepts multipart/form-data with `fasta` file).

### 2. Frontend (Clinical UI)
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Start development server: `npm run dev`.
4. Access at `http://localhost:5173`.

---

## 📦 Data Source & Ethics

Zenthera leverages the **BV-BRC (Bacterial and Viral Bioinformatics Resource Center)** public API for high-quality, lab-confirmed AMR phenotypes. We prioritize data with "Laboratory Method" and "Phenotype" evidence to ensure clinical relevance.

---

## 🛡️ Clinical Disclaimer

Zenthera is a diagnostic support tool designed for educational and research purposes. All resistance predictions must be validated by standard Laboratory Antimicrobial Susceptibility Testing (AST) before clinical implementation.

---
© 2026 Zenthera Diagnostics. Built for Advanced Clinical Genomics.

