"""
run_pipeline.py
================
Master runner -- executes all pipeline steps in order.

Run:
    python run_pipeline.py                    # Full pipeline (with FASTA fetch)
    python run_pipeline.py --skip-fetch       # Skip Step 1 (reuse existing data)
    python run_pipeline.py --skip-fasta       # Skip Step 1b (no sequence fetch)
    python run_pipeline.py --steps 3 4        # Run only training + evaluation

Steps:
    1   ->  Fetch AMR data from BV-BRC API        (~5-10 min)
    1b  ->  Fetch genome FASTA sequences          (~30-60 min)
    2   ->  Preprocess + feature engineering      (~1-2 min)
    3   ->  Train Random Forest + Logistic Reg.   (~2-5 min)
    4   ->  Evaluate on holdout set               (~30 sec)
"""

import argparse
import importlib
import logging
import sys
import time
from pathlib import Path

# -- Logger --
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

BANNER = """
+----------------------------------------------------------+
|          Z E N T H E R A  --  AMR Pipeline               |
|     Antibiotic Resistance ML Training System              |
|                                                           |
|  Data Source: BV-BRC (www.bv-brc.org)                    |
|  Models:      Random Forest  |  Logistic Regression       |
+----------------------------------------------------------+
"""

# Steps labelled as strings so "1b" works naturally
STEPS = {
    "1":  ("Fetch AMR Data (BV-BRC API)",       "step1_fetch_data"),
    "1b": ("Fetch Genome FASTA Sequences",      "step1b_fetch_sequences"),
    "2":  ("Preprocess + Feature Engineering",   "step2_preprocess"),
    "3":  ("Train Models",                       "step3_train"),
    "4":  ("Evaluate Models",                    "step4_evaluate"),
}

ALL_STEPS = ["1", "1b", "2", "3", "4"]


def run_step(step_key: str) -> bool:
    name, module_name = STEPS[step_key]
    log.info(f"\n{'=' * 58}")
    log.info(f"  STEP {step_key}: {name}")
    log.info(f"{'=' * 58}")
    t0 = time.time()

    try:
        module = importlib.import_module(module_name)
        module.main()
        elapsed = time.time() - t0
        log.info(f"\n  Step {step_key} complete in {elapsed:.1f}s")
        return True
    except Exception as exc:
        elapsed = time.time() - t0
        log.error(f"\n  Step {step_key} FAILED after {elapsed:.1f}s: {exc}")
        import traceback
        traceback.print_exc()
        return False


def check_prerequisites() -> None:
    """Verify required packages are installed before we start."""
    packages = {
        "requests": "requests",
        "pandas": "pandas",
        "numpy": "numpy",
        "sklearn": "scikit-learn",
        "joblib": "joblib",
        "tqdm": "tqdm",
        "scipy": "scipy",
    }
    missing = []
    for imp, pip_name in packages.items():
        try:
            importlib.import_module(imp)
        except ImportError:
            missing.append(pip_name)

    if missing:
        log.error(
            f"\nMissing packages: {', '.join(missing)}\n"
            f"   Run:  pip install {' '.join(missing)}"
        )
        sys.exit(1)


def print_summary(results: dict, total_time: float) -> None:
    print(f"\n{'=' * 58}")
    print("  PIPELINE SUMMARY")
    print(f"{'=' * 58}")
    all_ok = True
    for step_key, success in results.items():
        name = STEPS[step_key][0]
        status = "OK" if success else "FAILED"
        print(f"  Step {step_key:<3}  {status:<10}  {name}")
        if not success:
            all_ok = False

    print(f"{'-' * 58}")
    print(f"  Total time: {total_time:.1f}s")
    if all_ok:
        print("\n  Pipeline completed successfully!")
        print("  Models saved to:  aiModel/models/")
        print("  Logs saved to:    aiModel/logs/")
        print("\n  To run predictions:")
        print('    python predict.py --genome_name "Escherichia coli" --antibiotic ciprofloxacin')
        print('    python predict.py --genome_name "Klebsiella pneumoniae"')
    else:
        print("\n  Some steps failed. Check logs/ for details.")
    print(f"{'=' * 58}\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Zenthera AMR Pipeline -- trains ML models for antibiotic resistance prediction"
    )
    parser.add_argument(
        "--skip-fetch",
        action="store_true",
        help="Skip Step 1 (data fetch) if data/amr_raw.csv already exists",
    )
    parser.add_argument(
        "--skip-fasta",
        action="store_true",
        help="Skip Step 1b (FASTA sequence fetch) -- uses genome-name k-mers instead",
    )
    parser.add_argument(
        "--steps",
        nargs="+",
        type=str,
        choices=["1", "1b", "2", "3", "4"],
        help="Run only specific steps (e.g. --steps 3 4)",
    )
    args = parser.parse_args()

    print(BANNER)
    check_prerequisites()

    # Determine which steps to run
    if args.steps:
        steps_to_run = [s for s in ALL_STEPS if s in args.steps]
    else:
        steps_to_run = list(ALL_STEPS)

    if args.skip_fetch and "1" in steps_to_run:
        raw_csv = Path("data/amr_raw.csv")
        if raw_csv.exists():
            log.info(f"--skip-fetch: reusing existing {raw_csv}")
            steps_to_run.remove("1")
        else:
            log.warning("--skip-fetch: data/amr_raw.csv not found -- running Step 1")

    if args.skip_fasta and "1b" in steps_to_run:
        steps_to_run.remove("1b")
        log.info("--skip-fasta: skipping FASTA sequence fetch")

    log.info(f"Steps to run: {steps_to_run}")

    results = {}
    pipeline_start = time.time()

    for step in steps_to_run:
        success = run_step(step)
        results[step] = success
        if not success and step in ("1", "2"):
            # Critical steps -- abort
            log.error(f"Critical step {step} failed -- aborting pipeline.")
            for remaining in steps_to_run:
                if remaining not in results:
                    results[remaining] = False
            break
        if not success and step == "1b":
            # Non-critical: sequence fetch failure is OK, preprocessor has fallback
            log.warning("Step 1b failed -- continuing with genome-name k-mers as fallback.")

    total_time = time.time() - pipeline_start
    print_summary(results, total_time)


if __name__ == "__main__":
    main()
