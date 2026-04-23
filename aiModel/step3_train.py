"""
step3_train.py
==============
Trains two models on the pre-built feature matrix:
  1. Random Forest  (high accuracy, handles class imbalance)
  2. Logistic Regression  (fast, interpretable baseline)

Both models use GENOME-LEVEL cross-validation: no genome appears
in both a train fold and a validation fold.  This prevents data
leakage and gives honest CV scores that predict real-world accuracy
on truly unseen genomes.

Run:
    python step3_train.py

Input:
    data/amr_features.npz           (sparse feature matrix)
    data/amr_features_labels.npy    (label array)
    data/amr_processed.csv          (for genome_id groups)
    models/label_encoder.joblib

Output:
    models/random_forest.joblib
    models/logistic_regression.joblib
    logs/training_report.txt
"""

import os
import time
import logging
import warnings

import numpy as np
import pandas as pd
import joblib
from scipy.sparse import load_npz
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold, cross_validate
from sklearn.utils.class_weight import compute_class_weight
from sklearn.calibration import CalibratedClassifierCV

from config import (
    FEATURES_FILE,
    PROCESSED_DATA_FILE,
    MODELS_DIR,
    LOGS_DIR,
    LABEL_ENCODER_FILE,
    RF_MODEL_FILE,
    LR_MODEL_FILE,
    REPORT_FILE,
    RF_PARAMS,
    LR_PARAMS,
    TEST_SIZE,
    RANDOM_STATE,
)

warnings.filterwarnings("ignore")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(f"{LOGS_DIR}/train.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

SCORING = ["accuracy", "f1_weighted", "roc_auc", "precision_weighted", "recall_weighted"]


# ── Helpers ────────────────────────────────────────────────────────────────────

def load_data() -> tuple:
    """Load the pre-built sparse feature matrix, labels, and genome groups."""
    log.info("Loading features and labels ...")
    X = load_npz(FEATURES_FILE.replace(".npz", ".npz"))
    y = np.load(FEATURES_FILE.replace(".npz", "_labels.npy"))
    le = joblib.load(LABEL_ENCODER_FILE)

    # Load genome_ids for group-aware splitting
    df = pd.read_csv(PROCESSED_DATA_FILE, low_memory=False, usecols=["genome_id"])
    genome_ids = df["genome_id"].values

    log.info(f"  X shape : {X.shape}")
    log.info(f"  y shape : {y.shape}")
    log.info(f"  Classes : {le.classes_}")
    log.info(f"  Unique genomes: {len(np.unique(genome_ids)):,}")

    dist = {cls: int((y == i).sum()) for i, cls in enumerate(le.classes_)}
    log.info(f"  Distribution: {dist}")
    return X, y, le, genome_ids


def compute_weights(y: np.ndarray) -> dict:
    """Compute balanced class weights for imbalanced datasets."""
    classes = np.unique(y)
    weights = compute_class_weight("balanced", classes=classes, y=y)
    return dict(zip(classes, weights))


def cross_validate_model(name: str, model, X, y, genome_ids, cv: int = 5) -> dict:
    """
    Run GROUP k-fold CV — genome_id is the group key.
    No genome appears in both a train fold and a validation fold.
    """
    log.info(f"\n{'─'*50}")
    log.info(f"Cross-validating {name} (k={cv}, genome-level groups) ...")
    gkf = GroupKFold(n_splits=cv)

    t0 = time.time()
    results = cross_validate(
        model, X, y,
        cv=gkf,
        groups=genome_ids,
        scoring=SCORING,
        n_jobs=-1,
        return_train_score=False,
    )
    elapsed = time.time() - t0

    summary = {}
    for metric in SCORING:
        key = f"test_{metric}"
        mean_val = results[key].mean()
        std_val = results[key].std()
        summary[metric] = {"mean": mean_val, "std": std_val}
        log.info(f"  {metric:<22} {mean_val:.4f} +/- {std_val:.4f}")
    log.info(f"  CV time: {elapsed:.1f}s")
    return summary


def train_and_save(name: str, model, X, y, save_path: str) -> None:
    """Fit model on full dataset and persist it."""
    log.info(f"\nFitting {name} on full dataset ...")
    t0 = time.time()
    model.fit(X, y)
    elapsed = time.time() - t0
    log.info(f"  ✓ Fit complete in {elapsed:.1f}s")

    joblib.dump(model, save_path, compress=3)
    size_mb = os.path.getsize(save_path) / (1024 ** 2)
    log.info(f"  Saved → {save_path}  ({size_mb:.1f} MB)")


def write_report(
    rf_cv: dict,
    lr_cv: dict,
    n_samples: int,
    n_features: int,
    le,
) -> None:
    """Write a human-readable training summary to logs/training_report.txt."""
    lines = [
        "=" * 60,
        "  ZENTHERA AMR — TRAINING REPORT",
        "=" * 60,
        f"  Dataset size   : {n_samples:,} samples",
        f"  Feature dims   : {n_features:,}",
        f"  Classes        : {list(le.classes_)}",
        "",
        "  Random Forest (5-fold CV)",
        "  " + "─" * 40,
    ]
    for metric, vals in rf_cv.items():
        lines.append(f"    {metric:<22} {vals['mean']:.4f} ± {vals['std']:.4f}")

    lines += [
        "",
        "  Logistic Regression (5-fold CV)",
        "  " + "─" * 40,
    ]
    for metric, vals in lr_cv.items():
        lines.append(f"    {metric:<22} {vals['mean']:.4f} ± {vals['std']:.4f}")

    lines += ["", "=" * 60]
    report = "\n".join(lines)

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report)

    print("\n" + report)
    log.info(f"\nReport saved → {REPORT_FILE}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("=" * 60)
    log.info("Zenthera AMR Model Trainer (Genome-Level CV)")
    log.info("=" * 60)

    X, y, le, genome_ids = load_data()
    class_weights = compute_weights(y)
    log.info(f"Class weights: {class_weights}")

    # ── Random Forest (with Calibration) ───────────────────────────────────────
    log.info("\nTraining Calibrated Random Forest ...")
    rf_base = RandomForestClassifier(**RF_PARAMS, class_weight="balanced")
    
    # We use cv='prefit' if we already fit it, but here we want to cross-validate the calibration too
    # However, since we use GroupKFold, we'll calibrate on the full set after CV
    rf_cv = cross_validate_model("Random Forest (Base)", rf_base, X, y, genome_ids)
    
    log.info("Fitting and calibrating Random Forest on full dataset ...")
    rf_base.fit(X, y)
    rf = CalibratedClassifierCV(rf_base, method='sigmoid', cv='prefit')
    rf.fit(X, y)
    
    joblib.dump(rf, RF_MODEL_FILE, compress=3)
    log.info(f"  Saved Calibrated RF → {RF_MODEL_FILE}")

    # ── Logistic Regression ────────────────────────────────────────────────────
    lr = LogisticRegression(**LR_PARAMS, class_weight="balanced")
    lr_cv = cross_validate_model("Logistic Regression", lr, X, y, genome_ids)
    train_and_save("Logistic Regression", lr, X, y, LR_MODEL_FILE)

    # ── Report ─────────────────────────────────────────────────────────────────
    write_report(rf_cv, lr_cv, X.shape[0], X.shape[1], le)

    log.info("")
    log.info("=" * 60)
    log.info("Training complete! Models saved to models/")
    log.info("=" * 60)


if __name__ == "__main__":
    main()

