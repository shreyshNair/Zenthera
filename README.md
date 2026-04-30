# Zenthera 🧬

**AI-Powered Genomic Intelligence Platform for Antimicrobial Resistance (AMR) Diagnostics.**

![Zenthera Banner](https://img.shields.io/badge/Status-Operational-emerald.svg?style=for-the-badge)
![Accuracy](https://img.shields.io/badge/Model_Accuracy-87.7%25-blue.svg?style=for-the-badge)
![Antibiotics](https://img.shields.io/badge/Antibiotics_Supported-35-orange.svg?style=for-the-badge)

Zenthera is a clinical-grade diagnostic platform that predicts antibiotic resistance through high-fidelity genomic intelligence. It ingests raw genomic sequences (`.fasta`) and utilizes a state-of-the-art **Triple-Layer Predictive Pipeline** to generate precise, medically actionable susceptibility reports.

---

## 🧠 Triple-Layer Diagnostic Engine

Zenthera doesn't just guess; it analyzes DNA evidence at three distinct levels of resolution:

1.  **🧬 Layer 1: CARD Gene Scanner (Deterministic)**
    *   Scans for 100% matches against the **Comprehensive Antibiotic Resistance Database (CARD)**.
    *   Identifies known resistance genes (e.g., `blaTEM-1`, `ndm-1`).
    *   Provides high-confidence `[GENE]` evidence badges.

2.  **🔬 Layer 2: Mutation Scanner (High-Precision SNP)**
    *   Detects specific point mutations (SNPs) in critical regions like `gyrA` or `rpoB`.
    *   Uses a curated index of 6 high-confidence resistance-conferring mutations.
    *   Provides `[MUTATION]` evidence badges for molecular-level diagnostics.

3.  **🤖 Layer 3: Zenthera AI (Machine Learning)**
    *   **Calibrated Random Forest** model trained on **149,000+** genomic records from BV-BRC.
    *   Analyzes DNA k-mer signatures to predict susceptibility even when no known genes are found.
    *   Outputs confidence scores with 87.7% accuracy across 35 antibiotics.

---

## 📊 Model Performance Facts

| Metric | Value |
| :--- | :--- |
| **Training Samples** | 148,261 unique AMR records |
| **Genome Bank** | 26,183 processed bacterial genomes |
| **Accuracy (Holdout)** | 87.72% |
| **ROC-AUC Score** | 0.9379 |
| **Antibiotic Panel** | 35 drugs (Beta-lactams, Aminoglycosides, Fluoroquinolones, etc.) |

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, HTML5 Canvas |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JSON Web Tokens (JWT) |
| **AI/ML Engine** | Python 3.12, Scikit-Learn, Joblib, Pandas, NumPy, Flask |
| **Bioinformatics** | DNA K-mer Vectorization, TF-IDF Normalization, CARD Bio-Scanning |

---

## 🚀 Getting Started

### 1. Repository Setup
```bash
git clone https://github.com/shreyshNair/Zenthera.git
cd Zenthera
```

### 2. Frontend Launch (Vite)
```bash
cd frontend
npm install
npm run dev
```
*Access at `http://localhost:5173`*

### 3. Backend Launch (Node)
```bash
cd backend
npm install
# Configure .env with MONGO_URI and JWT_SECRET
npm run dev
```
*Access at `http://localhost:4000`*

### 4. AI Engine Launch (Flask)
```bash
cd aiModel
# Install dependencies
pip install -r requirements.txt
# Start the prediction server
python app.py
```
*Access at `http://localhost:5000`*

---

## 📂 Project Structure

```text
Zenthera/
├── aiModel/                  # Python ML Pipeline & AI Engine
│   ├── models/               # Trained artifacts (RF, Vectorizer, LabelEncoder)
│   ├── data/                 # Genomic indexes & raw AMR datasets
│   ├── logs/                 # Training & Evaluation reports
│   ├── step1_fetch.py        # Data ingestion from BV-BRC
│   ├── step2_preprocess.py   # DNA Vectorization & Cleaning
│   ├── step3_train.py        # Model training & Calibration
│   ├── step4_evaluate.py     # Genome-level holdout validation
│   └── app.py                # Production Flask API
├── backend/                  # Node.js Clinical API
│   ├── models/               # Mongoose schemas (User, Patient, Analysis)
│   ├── routes/               # API controllers
│   └── server.js             # Main entry point
├── frontend/                 # React Intelligence Hub
│   ├── src/components/       # Premium UI (Analytics, Lab, Patients)
│   └── src/pages/            # View logic
└── README.md
```

---

## 🎨 Design Philosophy

Zenthera follows a **"Dark-First"** premium aesthetic designed for high-stakes medical environments.
*   **Typography:** Authority headers in `Playfair Display`, data interfaces in `Inter`.
*   **Color Palette:** Deep Obsidian backgrounds with vibrant `Emerald` (Susceptible) and `Rose` (Resistant) status indicators.
*   **Aesthetics:** Heavy use of glassmorphism, custom-rendered canvas charts, and silky Framer Motion transitions.

---
*Developed with precision for the future of antimicrobial diagnostics.*
