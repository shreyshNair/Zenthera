# Zenthera: AI-Powered Antimicrobial Resistance (AMR) Diagnostics

Zenthera is a high-fidelity, clinical-grade platform designed to predict antibiotic resistance patterns in bacterial genomes using advanced Machine Learning and genomic scanning.

![Zenthera Logo](frontend/public/logo.png) *Note: High-fidelity landing page with glassmorphism and dynamic animations.*

---

## 🚀 Overview

The Zenthera platform consists of two main components:
1.  **Frontend**: A premium React-based web interface built with Vite, Tailwind CSS, and Framer Motion. It features a sophisticated diagnostic dashboard and an educational "How It Works" pipeline visualization.
2.  **aiModel**: A robust Python backend powered by Flask and Scikit-Learn. It implements a dual-layer diagnostic strategy combining deterministic gene scanning (CARD/NCBI) with probabilistic Machine Learning (Random Forest/Logistic Regression).

---

## 🧬 Diagnostic Pipeline

The Zenthera pipeline processes raw FASTA genomic data through four distinct phases:

1.  **Ingestion & Quality Control**: Raw sequences are fetched from repositories (like BV-BRC) or uploaded by clinicians. The system calculates GC content and validates sequence integrity.
2.  **Tokenization**: Genomic data is broken down into character k-mers (k=3, k=4) and transformed into numerical feature vectors using TF-IDF normalization.
3.  **Hybrid Analysis**:
    *   **Deterministic Layer**: Scans for known resistance genes using the CARD (Comprehensive Antibiotic Resistance Database) and specific clinical mutations.
    *   **Probabilistic Layer**: ML models (Random Forest) predict resistance for 15+ high-priority antibiotics based on the global genomic fingerprint.
4.  **Clinical Actionability**: The system generates a categorized report (Susceptible, Resistant, Inconclusive) with confidence scores and clinical context for frontline medical use.

---

## 🛠️ Project Structure

```bash
Zenthera/
├── frontend/               # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/     # High-fidelity UI components
│   │   ├── pages/          # Landing, Dashboard, HowItWorks
│   │   └── App.tsx         # Routing and core logic
│   └── index.html
├── aiModel/                # Flask + ML Backend
│   ├── models/             # Pre-trained Random Forest & LR models
│   ├── data/               # Genomic metadata and CARD mapping
│   ├── app.py              # Flask Web Server
│   ├── predict.py          # Core Inference Pipeline
│   ├── card_scanner.py     # Deterministic Gene Scanner
│   └── mutation_scanner.py # Mutation-specific Scanner
└── README.md               # Project Documentation
```

---

## ⚡ Quick Start

### Backend (aiModel)
1. Navigate to the `aiModel` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the Flask server:
   ```bash
   python app.py
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📦 Large File Support (Git LFS)

This project uses **Git LFS** to manage large AI model files. If you are cloning this for the first time, ensure you have Git LFS installed:

1.  **Install**: `git lfs install`
2.  **Download Models**: `git lfs pull`

The model weights are stored in `aiModel/models/` and are required for the prediction engine to function.

---

## 🔗 Integration Details

-   **Backend Port**: 5000 (Flask)
-   **Frontend Port**: 5173 (Vite)
-   **CORS**: Enabled on the backend to allow requests from the frontend.
-   **API Endpoint**: `POST http://localhost:5000/api/predict` (expects `fasta` file field).

---

## 🧪 Technology Stack

-   **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide React.
-   **Backend**: Python 3.9+, Flask, Scikit-Learn, NumPy, SciPy, Joblib.
-   **Data Science**: TF-IDF Vectorization, Random Forest, Logistic Regression.
-   **Genomics**: CARD (Comprehensive Antibiotic Resistance Database) integration, FASTA parsing.

---

## 🛡️ Clinical Disclaimer

Zenthera is an AI-assisted screening tool. Results are intended for educational and research purposes and must be validated by laboratory Antimicrobial Susceptibility Testing (AST) before making clinical treatment decisions.
