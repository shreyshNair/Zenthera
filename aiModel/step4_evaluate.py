"""
step4_evaluate.py
==================
Produces a TRUSTWORTHY holdout-set evaluation using genome-level
splitting — no genome appears in both train and test sets.

This simulates the real-world scenario: a lab uploads a genome the
model has NEVER seen before.

Run:
    python step4_evaluate.py

Output:
    Console report + logs/eval_report.txt
"""

import os
import logging
import warnings

import numpy as np
import pandas as pd
import joblib
from scipy.sparse import load_npz
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    accuracy_score,
)

from config import (
    FEATURES_FILE,
    PROCESSED_DATA_FILE,
    MODELS_DIR,
    LOGS_DIR,
    LABEL_ENCODER_FILE,
    VECTORIZER_FILE,
    RF_MODEL_FILE,
    LR_MODEL_FILE,
    TEST_SIZE,
    RANDOM_STATE,
)

warnings.filterwarnings("ignore")
os.makedirs(LOGS_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(f"{LOGS_DIR}/eval.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def load_all():
    X = load_npz(FEATURES_FILE.replace(".npz", ".npz"))
    y = np.load(FEATURES_FILE.replace(".npz", "_labels.npy"))
    le = joblib.load(LABEL_ENCODER_FILE)
    rf = joblib.load(RF_MODEL_FILE)
    lr = joblib.load(LR_MODEL_FILE)
    df = pd.read_csv(PROCESSED_DATA_FILE, low_memory=False)
    return X, y, le, rf, lr, df


def evaluate_model(name: str, model, X_test, y_test, le) -> str:
    y_pred = model.predict(X_test)

    # ROC-AUC (binary)
    try:
        y_prob = model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_prob)
        auc_str = f"{auc:.4f}"
    except Exception:
        auc_str = "N/A"

    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=le.classes_)

    lines = [
        f"\n{'=' * 55}",
        f"  {name}",
        f"{'=' * 55}",
        f"  Accuracy : {acc:.4f}",
        f"  ROC-AUC  : {auc_str}",
        "",
        "  Confusion Matrix:",
        f"    Predicted ->  {le.classes_[0]:<15} {le.classes_[1]}",
    ]
    for i, row in enumerate(cm):
        lines.append(f"  Actual {le.classes_[i]:<12}  {row[0]:<15} {row[1]}")

    lines += ["", "  Classification Report:", ""]
    for line in report.splitlines():
        lines.append("    " + line)

    return "\n".join(lines)


def per_antibiotic_auc(model, X_test, y_test, df_test, le) -> str:
    """Compute ROC-AUC per antibiotic on the held-out set."""
    lines = ["\n  Per-Antibiotic ROC-AUC (Random Forest):", "  " + "-" * 40]
    try:
        y_prob = model.predict_proba(X_test)[:, 1]
    except Exception:
        return ""

    for ab in sorted(df_test["antibiotic"].unique()):
        mask = df_test["antibiotic"] == ab
        if mask.sum() < 10:
            continue
        y_ab = y_test[mask.values]
        p_ab = y_prob[mask.values]
        if len(np.unique(y_ab)) < 2:
            lines.append(f"    {ab:<22}  AUC=N/A (single class in test)")
            continue
        try:
            auc = roc_auc_score(y_ab, p_ab)
            n = mask.sum()
            lines.append(f"    {ab:<22}  AUC={auc:.4f}  (n={n})")
        except Exception:
            pass

    return "\n".join(lines)


def rf_feature_importance(rf, n_top: int = 20) -> str:
    """Top-N feature importances from the Random Forest."""
    importances = rf.feature_importances_
    idx = np.argsort(importances)[::-1][:n_top]
    lines = [f"\n  Random Forest - Top {n_top} Feature Importances:", "  " + "-" * 40]
    for rank, i in enumerate(idx, 1):
        lines.append(f"    {rank:>2}. Feature[{i:>4}]  importance={importances[i]:.5f}")
    return "\n".join(lines)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("=" * 60)
    log.info("Zenthera AMR - Evaluation (Genome-Level Split)")
    log.info("=" * 60)

    X, y, le, rf, lr, df = load_all()
    log.info(f"Loaded {X.shape[0]:,} samples, {X.shape[1]:,} features")

    # ── GENOME-LEVEL SPLIT ─────────────────────────────────────────────────
    # This ensures NO genome appears in both train and test sets.
    # This is the ONLY honest way to evaluate because in production,
    # the lab uploads a genome we have NEVER seen before.

    genome_ids = df["genome_id"].values
    n_unique = len(np.unique(genome_ids))
    log.info(f"Unique genomes: {n_unique:,}")

    gss = GroupShuffleSplit(
        n_splits=1,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )
    train_idx, test_idx = next(gss.split(X, y, groups=genome_ids))

    X_test = X[test_idx]
    y_test = y[test_idx]
    df_test = df.iloc[test_idx].reset_index(drop=True)

    # Count unique genomes in each split
    train_genomes = set(genome_ids[train_idx])
    test_genomes = set(genome_ids[test_idx])
    overlap = train_genomes & test_genomes

    log.info(f"Train set: {len(train_idx):,} samples ({len(train_genomes):,} unique genomes)")
    log.info(f"Test set : {len(test_idx):,} samples ({len(test_genomes):,} unique genomes)")
    log.info(f"Genome overlap between sets: {len(overlap)}  (should be 0)")

    r_count = int((y_test == le.transform(["Resistant"])[0]).sum()) if "Resistant" in le.classes_ else 0
    s_count = int((y_test == le.transform(["Susceptible"])[0]).sum()) if "Susceptible" in le.classes_ else 0
    log.info(f"Test distribution: R={r_count}, S={s_count}")

    # ── Evaluate ───────────────────────────────────────────────────────────

    full_report = []

    full_report.append(
        "\n  EVALUATION METHOD: Genome-level holdout split"
        "\n  No genome appears in both train and test sets."
        "\n  This simulates a lab uploading a truly unseen genome."
    )

    full_report.append(evaluate_model("Random Forest", rf, X_test, y_test, le))
    full_report.append(evaluate_model("Logistic Regression", lr, X_test, y_test, le))
    full_report.append(per_antibiotic_auc(rf, X_test, y_test, df_test, le))
    full_report.append(rf_feature_importance(rf))

    output = "\n".join(full_report)
    print(output)

    eval_report_path = f"{LOGS_DIR}/eval_report.txt"
    with open(eval_report_path, "w", encoding="utf-8") as f:
        f.write(output)
    log.info(f"\nEvaluation report saved -> {eval_report_path}")


if __name__ == "__main__":
    main()
