# Zenthera AI 🧬

**Genomic Intelligence Platform for Predicting Antimicrobial Resistance (AMR) with DNA.**

![Zenthera Banner](https://img.shields.io/badge/Status-Active_Development-emerald.svg)
![React](https://img.shields.io/badge/Frontend-React_18_%7C_Vite-61DAFB?logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Backend-Node.js_%7C_Express-339933?logo=nodedotjs&logoColor=white)
![Python](https://img.shields.io/badge/AI_Engine-Python_%7C_Flask-3776AB?logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)

Zenthera is a clinical-grade diagnostic platform that accelerates antibiotic resistance prediction through high-fidelity genomic intelligence and deterministic gene scanning. It ingests patient DNA sequences (`.fasta` files) and utilizes a dual-layer machine learning pipeline to recommend precise antibiotic treatments.

---

## ✨ Key Features

### 💻 Frontend (React + Tailwind + Framer Motion)
*   **Intelligence Hub (Analytics):** Fully interactive, responsive dashboard featuring custom canvas-rendered Donut and Bar charts, time-range filtering, and live pathogen detection tracking. Designed with premium glassmorphic UI and animated interactions.
*   **Patient Management:** Comprehensive patient record directory with real-time search, CRUD capabilities, and high-fidelity "Details Modals" linking patients directly to their AI-generated ML reports and recommended treatment courses.
*   **Genomic File Dropzone:** Intuitive drag-and-drop interface for uploading raw genomic sequence data, complete with a terminal-style simulation loader.
*   **Adaptive Navigation:** Context-aware routing that dynamically switches between public landing page flows and secure dashboard variants.

### ⚙️ Backend (Node.js + Express + MongoDB)
*   **Robust Authentication:** Secure JWT-based authentication pipeline utilizing `bcryptjs` for password hashing and custom middleware for Role-Based Access Control (RBAC) supporting `admin`, `doctor`, and `researcher` roles.
*   **Relational Data Modeling:** Mongoose schemas designed to intrinsically link `User` profiles with their respective `Analysis` reports and patient metadata.
*   **Scalable API Architecture:** Modular routing structure prepared to handle heavy data ingress from the ML pipeline and serve it rapidly to the frontend dashboards.

### 🧠 AI Model Pipeline (Python + Scikit-Learn)
*   **Dual-Layer Deterministic Engine:** Combines a primary CARD database gene scanner with a secondary MutationScanner to ensure high-confidence AMR predictions.
*   **Broad Spectrum Analysis:** Capable of predicting susceptibility and resistance profiles across 35 distinct antibiotics.
*   **API Integration:** Exposed via a Flask REST API to seamlessly communicate feature vectors and prediction confidence scores to the Node.js backend.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, HTML5 Canvas |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JSON Web Tokens (JWT) |
| **AI/ML Engine** | Python, Flask, Scikit-Learn, Pandas, NumPy |
| **Deployment** | Vercel (Frontend & Serverless API wrapping) |

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed on your local development machine:
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [Python](https://www.python.org/) (3.10+ recommended)
*   [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/shreyshNair/Zenthera.git
cd Zenthera
```

### 2. Setup the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be available at `http://localhost:5173`*

### 3. Setup the Backend
Open a new terminal window:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=4000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/zenthera
JWT_SECRET=your_super_secret_jwt_key
```

Start the backend server:
```bash
npm run dev
```
*The backend API will run on `http://localhost:4000`*

### 4. Setup the AI Engine (If applicable)
Open a third terminal window:
```bash
cd aiModel
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*The Flask prediction server typically runs on `http://localhost:5000`*

---

## 📂 Project Structure

```text
Zenthera/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Analytics, Patients, Navbar)
│   │   ├── App.tsx           # Main application routing
│   │   ├── index.css         # Global Tailwind directives & custom animations
│   │   └── main.tsx          # React DOM entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js Express API
│   ├── models/               # Mongoose schemas (User.js, Analysis.js)
│   ├── middleware/           # Custom Express middleware (auth.js)
│   ├── routes/               # API endpoint definitions
│   ├── server.js             # Main backend entry point
│   └── package.json
├── aiModel/                  # Python Machine Learning Pipeline
│   ├── model.pkl             # Trained Random Forest model
│   ├── app.py                # Flask API serving predictions
│   └── requirements.txt
├── api/                      # Serverless deployment wrappers (e.g., index.py for Vercel)
└── README.md
```

---

## 🎨 Design Philosophy

Zenthera follows a "Dark-First" premium aesthetic. 
*   **Typography:** We utilize `Playfair Display` (Italic) for bold, authoritative headers, paired with `Inter` for highly legible, data-dense interface elements.
*   **Color Palette:** Built on deep, sleek dark modes accented by a vibrant `brand-orange` (`#F15A24`) to draw attention to critical interactions and alerts.
*   **Interactivity:** Heavy utilization of `framer-motion` for micro-interactions, ensuring the app feels alive, responsive, and satisfying to navigate.

---

## 🔒 Security & Data Compliance

All genomic sequences uploaded to Zenthera are processed within isolated sandboxes. We adhere to strict data-minimization principles; sequences are not persisted post-analysis unless explicitly requested for longitudinal research collaboration. Authentication is strictly enforced on all clinical dashboard routes.

---
*Developed with precision for the future of diagnostics.*
