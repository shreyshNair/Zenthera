"""
app.py — Zenthera AMR Prediction Web Interface
================================================
A local Flask web app for uploading FASTA files and getting
antibiotic resistance predictions.

Run:
    python app.py

Then open http://localhost:5000 in your browser.
"""

import os
import tempfile
import logging
from flask import Flask, request, jsonify, render_template_string

# Import the prediction pipeline
from predict import ZentheraPipeline, get_clinical_context, generate_recommendation, ANTIBIOTIC_INFO

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB max upload

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Load model once at startup
log.info("Loading Zenthera ML models ...")
pipeline = ZentheraPipeline()
log.info("Models loaded successfully.")

# ── HTML Template ──────────────────────────────────────────────────────────────

HTML_TEMPLATE = r"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenthera v2 — AMR Predictor (CARD Enabled)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg-primary: #0a0e1a;
            --bg-secondary: #111827;
            --bg-card: #1a1f35;
            --bg-card-hover: #222842;
            --border: #2a3050;
            --border-glow: #3b82f680;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --accent: #3b82f6;
            --accent-glow: #3b82f640;
            --resistant: #ef4444;
            --resistant-bg: #ef444415;
            --resistant-glow: #ef444440;
            --susceptible: #22c55e;
            --susceptible-bg: #22c55e15;
            --susceptible-glow: #22c55e40;
            --warning: #f59e0b;
        }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Animated background grid */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background:
                linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            z-index: 0;
        }

        /* Top gradient orb */
        body::after {
            content: '';
            position: fixed;
            top: -300px;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 600px;
            background: radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%);
            z-index: 0;
            pointer-events: none;
        }

        .container {
            position: relative;
            z-index: 1;
            max-width: 960px;
            margin: 0 auto;
            padding: 40px 24px 80px;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 48px;
        }

        .logo {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }

        .logo-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, var(--accent), #8b5cf6);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 0 30px var(--accent-glow);
        }

        .logo-text {
            font-size: 28px;
            font-weight: 800;
            background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
        }

        .header p {
            color: var(--text-secondary);
            font-size: 15px;
            max-width: 500px;
            margin: 0 auto;
            line-height: 1.6;
        }

        /* Upload Zone */
        .upload-zone {
            background: var(--bg-card);
            border: 2px dashed var(--border);
            border-radius: 20px;
            padding: 60px 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .upload-zone::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(59,130,246,0.05), transparent);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .upload-zone:hover,
        .upload-zone.drag-over {
            border-color: var(--accent);
            box-shadow: 0 0 40px var(--accent-glow);
        }

        .upload-zone:hover::before,
        .upload-zone.drag-over::before {
            opacity: 1;
        }

        .upload-icon {
            font-size: 56px;
            margin-bottom: 16px;
            display: block;
            filter: grayscale(0.3);
        }

        .upload-zone h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .upload-zone p {
            color: var(--text-muted);
            font-size: 14px;
        }

        .upload-zone .browse-btn {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 28px;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            pointer-events: none;
        }

        .upload-zone:hover .browse-btn {
            background: #2563eb;
            box-shadow: 0 4px 20px var(--accent-glow);
        }

        #file-input { display: none; }

        /* File info bar */
        .file-info {
            display: none;
            align-items: center;
            gap: 14px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 16px 24px;
            margin-top: 20px;
        }

        .file-info.visible { display: flex; }

        .file-info .file-icon { font-size: 28px; }

        .file-info .file-details { flex: 1; }

        .file-info .file-name {
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
        }

        .file-info .file-size {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .file-info .remove-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .file-info .remove-btn:hover {
            color: var(--resistant);
            background: var(--resistant-bg);
        }

        /* Predict button */
        .predict-btn {
            display: none;
            width: 100%;
            padding: 16px;
            margin-top: 20px;
            background: linear-gradient(135deg, var(--accent), #8b5cf6);
            color: #fff;
            border: none;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            letter-spacing: 0.3px;
        }

        .predict-btn.visible { display: block; }

        .predict-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px var(--accent-glow);
        }

        .predict-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        /* Loading */
        .loading {
            display: none;
            text-align: center;
            padding: 40px;
        }

        .loading.visible { display: block; }

        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loading p {
            color: var(--text-secondary);
            font-size: 14px;
        }

        /* Results */
        .results {
            display: none;
            margin-top: 40px;
        }

        .results.visible { display: block; }

        .results-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 16px;
        }

        .results-header h2 {
            font-size: 22px;
            font-weight: 700;
        }

        /* Genome info cards */
        .genome-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-bottom: 28px;
        }

        .info-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
        }

        .info-card .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            margin-bottom: 6px;
        }

        .info-card .value {
            font-size: 16px;
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
        }

        /* Summary stats */
        .summary-strip {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }

        .summary-chip {
            padding: 8px 18px;
            border-radius: 100px;
            font-size: 13px;
            font-weight: 600;
        }

        .summary-chip.resistant {
            background: var(--resistant-bg);
            color: var(--resistant);
            border: 1px solid var(--resistant-glow);
        }

        .summary-chip.susceptible {
            background: var(--susceptible-bg);
            color: var(--susceptible);
            border: 1px solid var(--susceptible-glow);
        }

        /* Trust panel */
        .trust-panel {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 20px 24px;
            margin-bottom: 24px;
        }
        .trust-panel h3 { font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
        .trust-checks { display: flex; gap: 16px; flex-wrap: wrap; }
        .trust-check { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 14px; border-radius: 8px; background: #111827; }
        .trust-check.pass { color: var(--susceptible); }
        .trust-check.warn { color: var(--warning); }
        .trust-check.fail { color: var(--resistant); }

        /* Trust badge on drug card */
        .trust-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .trust-badge.high { background: #22c55e20; color: #22c55e; }
        .trust-badge.moderate { background: #f59e0b20; color: #f59e0b; }
        .trust-badge.low { background: #ef444420; color: #ef4444; }
        .trust-badge.gene { background: #fbbf2430; color: #fbbf24; border: 1px solid #fbbf2440; }
        .trust-badge.mutation { background: #a78bfa22; color: #a78bfa; border: 1px solid #a78bfa44; }

        /* Clinical sections */
        .clinical-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; }
        .clinical-section h3 { font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .disease-list { list-style: none; padding: 0; }
        .disease-list li { padding: 6px 0; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid #1e293b; }
        .disease-list li:last-child { border-bottom: none; }
        .disease-list li::before { content: '\25B8'; margin-right: 8px; color: var(--accent); }
        .clinical-note { font-size: 12px; color: var(--warning); margin-top: 10px; font-style: italic; }
        .rec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
        .rec-card { padding: 14px; border-radius: 10px; font-size: 13px; }
        .rec-card.first-line { background: #22c55e10; border: 1px solid #22c55e30; }
        .rec-card.last-resort { background: #f59e0b10; border: 1px solid #f59e0b30; }
        .rec-card.avoid { background: #ef444410; border: 1px solid #ef444430; }
        .rec-card .rec-name { font-weight: 700; font-size: 14px; text-transform: capitalize; margin-bottom: 4px; }
        .rec-card .rec-class { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .rec-card .rec-use { color: var(--text-secondary); margin-top: 4px; }
        .rec-card .rec-conf { font-family: 'JetBrains Mono', monospace; font-size: 12px; margin-top: 6px; }
        .disclaimer { font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 24px; padding: 12px; border: 1px dashed var(--border); border-radius: 10px; }

        /* Drug result cards */
        .drug-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }

        .drug-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 18px 24px;
            display: grid;
            grid-template-columns: 1fr auto auto;
            align-items: center;
            gap: 20px;
            transition: all 0.2s;
        }

        .drug-card:hover {
            background: var(--bg-card-hover);
            border-color: var(--border-glow);
        }

        .drug-card.resistant { border-left: 4px solid var(--resistant); }
        .drug-card.susceptible { border-left: 4px solid var(--susceptible); }
        .drug-card.insufficient-data { border-left: 4px solid #f59e0b; }

        .drug-name {
            font-size: 15px;
            font-weight: 600;
            text-transform: capitalize;
        }

        .drug-phenotype {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            min-width: 130px;
            justify-content: center;
        }

        .drug-phenotype.resistant {
            background: var(--resistant-bg);
            color: var(--resistant);
        }

        .drug-phenotype.susceptible {
            background: var(--susceptible-bg);
            color: var(--susceptible);
        }

        .drug-phenotype.insufficient-data {
            background: rgba(255, 170, 0, 0.1);
            color: #fbbf24;
            border: 1px solid rgba(255, 170, 0, 0.2);
        }

        .drug-confidence {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 200px;
        }

        .confidence-bar-track {
            flex: 1;
            height: 8px;
            background: #1e293b;
            border-radius: 100px;
            overflow: hidden;
        }

        .confidence-bar-fill {
            height: 100%;
            border-radius: 100px;
            transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .confidence-bar-fill.resistant {
            background: linear-gradient(90deg, var(--resistant), #f87171);
        }

        .confidence-bar-fill.susceptible {
            background: linear-gradient(90deg, var(--susceptible), #4ade80);
        }

        .confidence-bar-fill.insufficient-data {
            background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        .confidence-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            font-weight: 600;
            min-width: 50px;
            text-align: right;
        }

        /* Error */
        .error-box {
            display: none;
            background: var(--resistant-bg);
            border: 1px solid var(--resistant-glow);
            border-radius: 14px;
            padding: 20px 24px;
            margin-top: 20px;
            color: var(--resistant);
        }

        .error-box.visible { display: block; }

        .error-box strong { display: block; margin-bottom: 4px; }

        /* Responsive */
        @media (max-width: 640px) {
            .container { padding: 24px 16px 60px; }
            .upload-zone { padding: 40px 24px; }
            .drug-card {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            .drug-confidence { min-width: unset; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div class="logo">
                    <div class="logo-icon">🧬</div>
                    <span class="logo-text">Zenthera</span>
                </div>
                <span style="background: rgba(59,130,246,0.1); color: var(--accent); padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; border: 1px solid var(--accent-glow)">v2 CARD ENABLED</span>
            </div>
            <p>Clinical Antimicrobial Resistance Predictor — Deterministic & ML Pipeline</p>
        </div>

        <!-- Upload Zone -->
        <div class="upload-zone" id="upload-zone">
            <span class="upload-icon">📄</span>
            <h2>Drop your FASTA file here</h2>
            <p>Supports .fasta, .fa, .fna files — up to 50 MB</p>
            <span class="browse-btn">Browse Files</span>
            <input type="file" id="file-input" accept=".fasta,.fa,.fna,.txt,.gz">
        </div>

        <!-- File Info -->
        <div class="file-info" id="file-info">
            <span class="file-icon">🧬</span>
            <div class="file-details">
                <div class="file-name" id="file-name"></div>
                <div class="file-size" id="file-size"></div>
            </div>
            <button class="remove-btn" id="remove-btn" title="Remove file">✕</button>
        </div>

        <!-- Predict Button -->
        <button class="predict-btn" id="predict-btn">Analyse Resistance Profile</button>

        <!-- Loading -->
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Extracting k-mers and running prediction models...</p>
        </div>

        <!-- Error -->
        <div class="error-box" id="error-box">
            <strong>Prediction Error</strong>
            <span id="error-msg"></span>
        </div>

        <!-- Results -->
        <div class="results" id="results">
            <div class="results-header">
                <h2>Resistance Profile</h2>
                <div class="model-selector">
                    <label style="color:var(--text-secondary); margin-right:8px; font-size:14px;">View Model:</label>
                    <select id="model-select" style="background:var(--bg-card-hover); color:white; border:1px solid var(--border); padding:6px 12px; border-radius:6px; outline:none; font-family:'Inter',sans-serif; cursor:pointer;">
                        <option value="rf">Random Forest</option>
                        <option value="lr">Logistic Regression</option>
                    </select>
                </div>
            </div>


            <div class="genome-info" id="genome-info"></div>
            <div id="disease-section"></div>
            <div class="trust-panel" id="trust-panel"></div>
            <div class="summary-strip" id="summary-strip"></div>
            <div id="recommendation-section"></div>
            <div class="drug-grid" id="drug-grid"></div>
            <div class="disclaimer" id="disclaimer"></div>
        </div>
    </div>

    <script>
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        const removeBtn = document.getElementById('remove-btn');
        const predictBtn = document.getElementById('predict-btn');
        const loading = document.getElementById('loading');
        const errorBox = document.getElementById('error-box');
        const errorMsg = document.getElementById('error-msg');
        const results = document.getElementById('results');
        const modelSelect = document.getElementById('model-select');

        let selectedFile = null;
        let lastData = null;

        modelSelect.addEventListener('change', () => {
            if (lastData) renderResults(lastData);
        });

        // --- Upload zone events ---
        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleFile(fileInput.files[0]);
            }
        });

        removeBtn.addEventListener('click', () => {
            selectedFile = null;
            fileInput.value = '';
            fileInfo.classList.remove('visible');
            predictBtn.classList.remove('visible');
            results.classList.remove('visible');
            errorBox.classList.remove('visible');
            uploadZone.style.display = '';
        });

        function handleFile(file) {
            selectedFile = file;
            fileName.textContent = file.name;
            fileSize.textContent = formatSize(file.size);
            fileInfo.classList.add('visible');
            predictBtn.classList.add('visible');
            uploadZone.style.display = 'none';
            results.classList.remove('visible');
            errorBox.classList.remove('visible');
        }

        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        // --- Predict ---
        predictBtn.addEventListener('click', async () => {
            if (!selectedFile) return;

            predictBtn.disabled = true;
            loading.classList.add('visible');
            results.classList.remove('visible');
            errorBox.classList.remove('visible');

            const formData = new FormData();
            formData.append('fasta', selectedFile);

            try {
                const resp = await fetch('/predict', { method: 'POST', body: formData });
                const data = await resp.json();

                if (!resp.ok) throw new Error(data.error || 'Prediction failed');

                lastData = data;
                renderResults(data);
            } catch (err) {
                errorMsg.textContent = err.message;
                errorBox.classList.add('visible');
            } finally {
                predictBtn.disabled = false;
                loading.classList.remove('visible');
            }
        });

        // --- Render results ---
        function renderResults(data) {
            const { genome } = data;
            const selectedModel = document.getElementById('model-select').value;
            
            // Map predictions based on selected model
            const predictions = data.predictions.map(p => {
                if (selectedModel === 'lr') {
                    return {
                        ...p,
                        phenotype: p.alt_phenotype,
                        confidence: p.alt_confidence,
                        model: 'Logistic Regression'
                    };
                }
                return p;
            });

            // Genome info cards
            const orgStatus = genome.organism_match
                ? `<span style="color:var(--susceptible)">✓ ${genome.matched_genus} (trained)</span>`
                : `<span style="color:var(--warning)">⚠ Not in training data</span>`;
            const infoHtml = `
                <div class="info-card">
                    <div class="label">Organism</div>
                    <div class="value">${genome.header || 'Unknown'}</div>
                </div>
                <div class="info-card">
                    <div class="label">Sequence Length</div>
                    <div class="value">${Number(genome.seq_length).toLocaleString()} bp</div>
                </div>
                <div class="info-card">
                    <div class="label">GC Content</div>
                    <div class="value">${genome.gc_pct}%</div>
                </div>
                <div class="info-card">
                    <div class="label">Model</div>
                    <div class="value">${selectedModel === 'rf' ? 'Random Forest' : 'Logistic Regression'}</div>
                </div>
            `;
            document.getElementById('genome-info').innerHTML = infoHtml;

            // Trust panel
            const sqClass = genome.seq_quality === 'good' ? 'pass' : (genome.seq_quality === 'fair' ? 'warn' : 'fail');
            const sqIcon = genome.seq_quality === 'good' ? '✓' : (genome.seq_quality === 'fair' ? '~' : '✕');
            const orgClass = genome.organism_match ? 'pass' : 'warn';
            const orgIcon = genome.organism_match ? '✓' : '⚠';
            const agreeCount = predictions.filter(p => p.models_agree).length;
            const agreeClass = agreeCount >= 12 ? 'pass' : (agreeCount >= 8 ? 'warn' : 'fail');
            const avgTrust = Math.round(predictions.reduce((s,p) => s + p.trust_score, 0) / predictions.length);
            const avgClass = avgTrust >= 70 ? 'pass' : (avgTrust >= 40 ? 'warn' : 'fail');

            document.getElementById('trust-panel').innerHTML = `
                <h3>Should you trust these results?</h3>
                <div class="trust-checks">
                    <div class="trust-check ${orgClass}">${orgIcon} Organism: ${genome.organism_match ? genome.matched_genus + ' (seen in training)' : 'Unknown genus — predictions may be less accurate'}</div>
                    <div class="trust-check ${sqClass}">${sqIcon} Sequence: ${genome.seq_quality_note}</div>
                    <div class="trust-check ${agreeClass}">${agreeCount >= 12 ? '✓' : '⚠'} Model Agreement: ${agreeCount}/15 drugs agree across both models</div>
                    <div class="trust-check ${avgClass}">Overall Trust Score: ${avgTrust}/100</div>
                </div>
            `;

            // Summary chips
            const rCount = predictions.filter(p => p.phenotype === 'Resistant').length;
            const sCount = predictions.filter(p => p.phenotype === 'Susceptible').length;
            const iCount = predictions.filter(p => p.phenotype === 'Insufficient Data').length;
            let summaryHtml = `
                <span class="summary-chip resistant">⚠ ${rCount} Resistant</span>
                <span class="summary-chip susceptible">✓ ${sCount} Susceptible</span>
            `;
            if (iCount > 0) {
                summaryHtml += `<span class="summary-chip" style="background:rgba(255,170,0,0.1);color:#fbbf24;border:1px solid rgba(255,170,0,0.2)">? ${iCount} Insufficient Data</span>`;
            }
            document.getElementById('summary-strip').innerHTML = summaryHtml;

            // Drug cards — sort order: Resistant first, then Insufficient Data, then Susceptible
            const phenoOrder = {'Resistant': 0, 'Insufficient Data': 1, 'Susceptible': 2};
            const sorted = [...predictions].sort((a, b) => {
                const orderA = phenoOrder[a.phenotype] ?? 1;
                const orderB = phenoOrder[b.phenotype] ?? 1;
                if (orderA !== orderB) return orderA - orderB;
                return b.confidence - a.confidence;
            });

            let cardsHtml = '';
            sorted.forEach((p, i) => {
                let cls, icon;
                if (p.phenotype === 'Resistant') { cls = 'resistant'; icon = '\uD83D\uDED1'; }
                else if (p.phenotype === 'Insufficient Data') { cls = 'insufficient-data'; icon = '\u2753'; }
                else { cls = 'susceptible'; icon = '\u2705'; }
                
                const isDet = p.det_found;
                const detType = p.det_type; // 'GENE' or 'MUTATION'
                
                let tierCls = p.confidence_tier.toLowerCase();
                let tierLabel = p.confidence_tier;
                let detLabel = 'DETERMINISTIC';
                let detColor = '#fbbf24'; // default gold
                
                if (isDet) {
                    tierCls = detType.toLowerCase();
                    tierLabel = `🧬 ${detType}`;
                    detLabel = detType === 'MUTATION' ? '🧬 MUTATION MATCH' : '🧬 CARD GENE MATCH';
                    detColor = detType === 'MUTATION' ? '#a78bfa' : '#fbbf24'; // Purple for mutation, gold for gene
                }

                const detHtml = isDet 
                    ? `<div class="gene-list" style="grid-column: 1 / -1; font-size: 11px; margin-top: 8px; color: ${detColor}; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                         <span style="background: ${detColor}20; padding: 2px 6px; border-radius: 4px; margin-right: 6px; font-weight: bold; color: ${detColor};">${detLabel}</span>
                         Found: ${p.detected_features.join(', ')}
                       </div>` 
                    : '';

                const phenotypeStyle = isDet ? `background: ${detColor}20; border: 1px solid ${detColor}40; color: ${detColor};` : '';

                cardsHtml += `
                    <div class="drug-card ${cls}" style="animation: fadeIn 0.3s ${i * 0.04}s both">
                        <div class="drug-name">
                            ${p.antibiotic}
                            <span class="trust-badge ${tierCls}">${tierLabel}</span>
                        </div>
                        <div class="drug-phenotype ${cls}" style="${phenotypeStyle}">${icon} ${p.phenotype}</div>
                        <div class="drug-confidence">
                            <div class="confidence-bar-track">
                                <div class="confidence-bar-fill ${cls}" style="width: ${p.confidence}%"></div>
                            </div>
                            <span class="confidence-value">${p.confidence}%</span>
                        </div>
                        ${detHtml}
                    </div>
                `;
            });

            document.getElementById('drug-grid').innerHTML = cardsHtml;

            // Disease context
            if (data.clinical) {
                const c = data.clinical;
                let diseaseHtml = `<div class="clinical-section"><h3>\uD83E\uDDA0 Disease Patterns for ${c.name}</h3><ul class="disease-list">`;
                c.diseases.forEach(d => { diseaseHtml += `<li>${d}</li>`; });
                diseaseHtml += `</ul>`;
                if (c.notes) diseaseHtml += `<div class="clinical-note">\u26A0 ${c.notes}</div>`;
                diseaseHtml += `</div>`;
                document.getElementById('disease-section').innerHTML = diseaseHtml;
            }

            // Recommendations
            if (data.recommendation) {
                const rec = data.recommendation;
                let recHtml = '';

                if (rec.first_line.length) {
                    recHtml += `<div class="clinical-section"><h3>\u2705 Recommended Antibiotics (Susceptible)</h3><div class="rec-grid">`;
                    rec.first_line.forEach(r => {
                        recHtml += `<div class="rec-card first-line">
                            <div class="rec-name">${r.antibiotic}</div>
                            <div class="rec-class">${r.drug_class} &middot; ${r.route}</div>
                            <div class="rec-use">${r.clinical_use}</div>
                            <div class="rec-conf" style="color:var(--susceptible)">Susceptible ${r.confidence}%</div>
                        </div>`;
                    });
                    recHtml += `</div></div>`;
                }

                if (rec.last_resort.length) {
                    recHtml += `<div class="clinical-section"><h3>\u26A0\uFE0F Last-Resort Antibiotics (use only if first-line fails)</h3><div class="rec-grid">`;
                    rec.last_resort.forEach(r => {
                        recHtml += `<div class="rec-card last-resort">
                            <div class="rec-name">${r.antibiotic}</div>
                            <div class="rec-class">${r.drug_class} &middot; ${r.route}</div>
                            <div class="rec-use">${r.clinical_use}</div>
                            <div class="rec-conf" style="color:var(--warning)">Susceptible ${r.confidence}% (reserve drug)</div>
                        </div>`;
                    });
                    recHtml += `</div></div>`;
                }

                if (rec.avoid.length) {
                    recHtml += `<div class="clinical-section"><h3>\uD83D\uDED1 Avoid These Antibiotics (Resistant)</h3><div class="rec-grid">`;
                    rec.avoid.forEach(r => {
                        recHtml += `<div class="rec-card avoid">
                            <div class="rec-name">${r.antibiotic}</div>
                            <div class="rec-class">${r.drug_class} &middot; ${r.route}</div>
                            <div class="rec-conf" style="color:var(--resistant)">Resistant ${r.confidence}%</div>
                        </div>`;
                    });
                    recHtml += `</div></div>`;
                }

                if (rec.inconclusive && rec.inconclusive.length) {
                    recHtml += `<div class="clinical-section"><h3>\u2753 Insufficient Data (Requires Lab Confirmation)</h3><div class="rec-grid">`;
                    rec.inconclusive.forEach(r => {
                        recHtml += `<div class="rec-card" style="border-left:3px solid #f59e0b">
                            <div class="rec-name">${r.antibiotic}</div>
                            <div class="rec-class">${r.drug_class} &middot; ${r.route}</div>
                            <div class="rec-conf" style="color:#fbbf24">Inconclusive ${r.confidence}% — order AST</div>
                        </div>`;
                    });
                    recHtml += `</div></div>`;
                }

                document.getElementById('recommendation-section').innerHTML = recHtml;
            }

            document.getElementById('disclaimer').innerHTML = '\u26A0\uFE0F This is an AI-assisted screening tool trained on 2,769 genomes. Results must be confirmed by laboratory antimicrobial susceptibility testing (AST). Do not use as sole basis for clinical treatment decisions.';

            results.classList.add('visible');
        }
    </script>

    <style>
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</body>
</html>
"""


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route("/predict", methods=["POST"])
def predict():
    if "fasta" not in request.files:
        return jsonify({"error": "No FASTA file uploaded"}), 400

    file = request.files["fasta"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        # Read the FASTA content as string
        fasta_content = file.read().decode("utf-8", errors="ignore")

        if not fasta_content.strip():
            return jsonify({"error": "File is empty"}), 400

        # Run prediction
        results = pipeline.predict_from_fasta_string(fasta_content)

        # Extract genome info from first result
        genome_info = {
            "header": results[0].get("genome_header", "Unknown") if results else "Unknown",
            "seq_length": results[0].get("seq_length", 0) if results else 0,
            "gc_pct": results[0].get("gc_pct", 0) if results else 0,
        }

        # Clean results for JSON
        predictions = []
        for r in results:
            trust = r.get("trust", {})
            predictions.append({
                "antibiotic": r["antibiotic"],
                "phenotype": r["phenotype"],
                "confidence": r["confidence"],
                "model": r["model"],
                "trust_score": trust.get("trust_score", 0),
                "confidence_tier": trust.get("confidence_tier", "LOW"),
                "models_agree": trust.get("models_agree", False),
                "organism_match": trust.get("organism_match", False),
                "seq_quality": trust.get("seq_quality", "poor"),
                "alt_phenotype": trust.get("alt_model_phenotype", "Unknown"),
                "alt_confidence": trust.get("alt_model_confidence", 0),
                "det_found": r.get("det_found", False),
                "det_type": r.get("det_type"),
                "detected_features": r.get("detected_features", []),
            })

        print(f"DEBUG: Returning {len(predictions)} predictions. Deterministic found: {any(p['det_found'] for p in predictions)}")


        # Global trust info
        first_trust = results[0].get("trust", {}) if results else {}
        genome_info["organism_match"] = first_trust.get("organism_match", False)
        genome_info["matched_genus"] = first_trust.get("matched_genus", None)
        genome_info["seq_quality"] = first_trust.get("seq_quality", "poor")
        genome_info["seq_quality_note"] = first_trust.get("seq_quality_note", "")

        # Clinical context
        header = results[0].get("genome_header", "") if results else ""
        first_trust = results[0].get("trust", {}) if results else {}
        matched_genus = first_trust.get("matched_genus", None)
        
        clinical = get_clinical_context(header)
        recommendation = generate_recommendation(results, matched_genus=matched_genus)

        return jsonify({
            "genome": genome_info,
            "predictions": predictions,
            "clinical": clinical,
            "recommendation": recommendation,
        })

    except Exception as e:
        log.exception("Prediction error")
        return jsonify({"error": str(e)}), 500


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "=" * 55)
    print("  Zenthera AMR Predictor — Web Interface")
    print("  Open: http://localhost:5001")
    print("=" * 55 + "\n")

    # Change port to 5001 to ensure we are running the new version
    app.run(host="0.0.0.0", port=5001, debug=False)
