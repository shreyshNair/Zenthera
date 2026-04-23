# Zenthera Developer Guide

## 🏗 Architecture
Zenthera is an Antimicrobial Resistance (AMR) predictive diagnostic platform.
- **`aiModel/`**: Python backend & ML pipeline. Predicts antibiotic resistance directly from raw genomic FASTA files using k-mer frequency analysis and machine learning (Random Forest & Logistic Regression).
- **`frontend/`**: Vite + React + TypeScript web application for the user interface.

## 🛠 Commands

### AI Model Pipeline
```bash
cd aiModel

# Run the complete data fetching and ML training pipeline
python run_pipeline.py

# Run specific steps of the pipeline
python run_pipeline.py --steps 3 4     # Train & Evaluate models only
python run_pipeline.py --skip-fetch    # Run pipeline but skip CSV metadata download
python run_pipeline.py --skip-fasta    # Run pipeline but skip FASTA download

# Test the predictor dynamically on all local FASTA files in sample_genomes/
python test_predict.py

# Run the Flask backend server
python app.py
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
npm run build
```

## 📝 Code Style & Guidelines
- **Python Framework**: Follow standard PEP-8 conventions. Use `logging` module rather than raw `print()` for backend pipeline logs.
- **Memory & Performance**: The ML pipeline is highly optimized. K-mer extraction relies on memory-efficient generator chunking and `scipy.sparse.vstack` to prevent crashing on large genomes (like Tuberculosis). Maintain these optimizations when modifying inference code.
- **No Hardcoding**: The inference engine (`predict.py`) is explicitly designed to be pathogen-agnostic. Do not hardcode specific strains, antibiotics, or genome sizes. The engine mathematically relies strictly on DNA k-mer signatures.
- **Testing**: When creating test scripts for the terminal, ensure standard ASCII characters are used. Windows terminals can throw `UnicodeEncodeError` when encountering complex emojis.
- **Frontend**: Vite + TypeScript environment. Prioritize strict type checking and functional components.
