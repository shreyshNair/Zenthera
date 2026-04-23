"""
step1b_fetch_sequences.py
==========================
Fetches a DNA sequence sample for each unique genome in amr_raw.csv
from the BV-BRC genome_sequence API.

Optimised for speed:
  - Fetches only the FIRST contig per genome (limit=1)
  - Keeps only the first 10,000 bases (enough for k-mer extraction)
  - Uses concurrent requests with ThreadPoolExecutor
  - Supports resume if interrupted

Run AFTER step1:
    python step1b_fetch_sequences.py

Input:
    data/amr_raw.csv

Output:
    data/genome_sequences.csv   (genome_id, genome_name, seq_length, gc_pct, seq_sample)
"""

import os
import gc
import csv
import time
import logging
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

from config import (
    API_BASE_URL,
    API_TIMEOUT_SEC,
    API_RETRY_ATTEMPTS,
    DATA_DIR,
    RAW_DATA_FILE,
    LOGS_DIR,
)

# ── Settings ───────────────────────────────────────────────────────────────────
GENOME_SEQ_FILE = f"{DATA_DIR}/genome_sequences.csv"
SEQ_SAMPLE_LEN  = 10_000     # Store first 10 kbp in CSV (enough for k-mers)
MAX_WORKERS     = 16          # Concurrent API requests
API_DELAY_SEC   = 0.05        # Delay between queuing requests

SEQ_CSV_FIELDS = [
    "genome_id",
    "genome_name",
    "seq_length",
    "gc_pct",
    "seq_sample",
]

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(f"{LOGS_DIR}/fetch_sequences.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def load_unique_genomes(raw_csv: str) -> list[dict]:
    """Return list of {genome_id, genome_name} — one per unique genome."""
    seen = {}
    with open(raw_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            gid = row.get("genome_id", "").strip()
            gname = row.get("genome_name", "").strip()
            if gid and gid not in seen:
                seen[gid] = gname
    return [{"genome_id": k, "genome_name": v} for k, v in seen.items()]


def gc_content(seq: str) -> float:
    if not seq:
        return 0.0
    gc = sum(1 for b in seq.upper() if b in ("G", "C"))
    return round(gc / len(seq) * 100, 2)


def fetch_one_genome(genome: dict, session: requests.Session) -> dict:
    """
    Fetch first contig for one genome. Returns a dict ready for CSV writing.
    Only fetches 1 contig and takes first SEQ_SAMPLE_LEN bases.
    """
    gid = genome["genome_id"]
    gname = genome["genome_name"]

    url = (
        f"{API_BASE_URL}/genome_sequence/"
        f"?eq(genome_id,{gid})"
        f"&select(sequence)"
        f"&limit(1,0)"
    )
    headers = {"Accept": "application/json"}

    for attempt in range(1, API_RETRY_ATTEMPTS + 1):
        try:
            resp = session.get(url, headers=headers, timeout=API_TIMEOUT_SEC)
            resp.raise_for_status()
            contigs = resp.json()
            break
        except requests.RequestException:
            if attempt < API_RETRY_ATTEMPTS:
                time.sleep(2 ** attempt)
            else:
                return {
                    "genome_id": gid,
                    "genome_name": gname,
                    "seq_length": 0,
                    "gc_pct": 0.0,
                    "seq_sample": "",
                }

    if not contigs:
        return {
            "genome_id": gid,
            "genome_name": gname,
            "seq_length": 0,
            "gc_pct": 0.0,
            "seq_sample": "",
        }

    raw_seq = contigs[0].get("sequence", "") or ""
    # Keep only valid DNA bases
    cleaned = "".join(b for b in raw_seq.upper() if b in "ACGTN")
    sample = cleaned[:SEQ_SAMPLE_LEN]

    return {
        "genome_id": gid,
        "genome_name": gname,
        "seq_length": len(cleaned),
        "gc_pct": gc_content(sample),
        "seq_sample": sample,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("=" * 60)
    log.info("Zenthera -- Genome Sequence Fetcher (BV-BRC)")
    log.info(f"  Fetching first contig per genome (max {SEQ_SAMPLE_LEN:,} bp)")
    log.info(f"  Concurrent workers: {MAX_WORKERS}")
    log.info("=" * 60)

    genomes = load_unique_genomes(RAW_DATA_FILE)
    log.info(f"Unique genomes to fetch: {len(genomes):,}")

    # Resume support: skip already-fetched genomes
    done_ids = set()
    if os.path.exists(GENOME_SEQ_FILE):
        with open(GENOME_SEQ_FILE, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                gid = row.get("genome_id", "").strip()
                if gid:
                    done_ids.add(gid)
        log.info(f"Resuming -- {len(done_ids)} genomes already fetched.")

    remaining = [g for g in genomes if g["genome_id"] not in done_ids]
    log.info(f"Remaining: {len(remaining):,}")

    if not remaining:
        log.info("All genomes already fetched. Nothing to do.")
        return

    session = requests.Session()
    success = 0
    failed = 0

    write_header = not os.path.exists(GENOME_SEQ_FILE) or len(done_ids) == 0
    mode = "w" if write_header else "a"

    with open(GENOME_SEQ_FILE, mode, newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=SEQ_CSV_FIELDS)
        if write_header:
            writer.writeheader()

        # Use ThreadPoolExecutor for concurrent fetches
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {}
            for genome in remaining:
                future = executor.submit(fetch_one_genome, genome, session)
                futures[future] = genome
                time.sleep(API_DELAY_SEC)

            with tqdm(total=len(remaining), desc="Fetching sequences", unit="genome") as pbar:
                for future in as_completed(futures):
                    try:
                        result = future.result(timeout=120)
                        writer.writerow(result)
                        csvfile.flush()

                        if result["seq_length"] > 0:
                            success += 1
                        else:
                            failed += 1
                    except Exception as exc:
                        gid = futures[future]["genome_id"]
                        log.error(f"  {gid}: error -- {exc}")
                        failed += 1

                    pbar.update(1)
                    pbar.set_postfix(ok=success, fail=failed)

    session.close()
    gc.collect()

    log.info("")
    log.info("=" * 60)
    log.info(f"Sequences fetched : {success:,}")
    log.info(f"Failed / empty    : {failed:,}")
    log.info(f"Saved to          : {GENOME_SEQ_FILE}")
    log.info("=" * 60)
    log.info("")
    log.info("Next: python run_pipeline.py --skip-fetch --steps 2 3 4")


if __name__ == "__main__":
    main()
