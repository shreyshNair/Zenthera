"""
step1_fetch_data.py
====================
Streams AMR phenotype records from the BV-BRC public API for the 15
most commonly used antibiotics in India.  Data is fetched in batches,
never fully held in memory, and written incrementally to CSV.

Run:
    python step1_fetch_data.py

Output:
    data/amr_raw.csv      (~5 000 rows)
"""

import os
import csv
import time
import logging
import requests
from tqdm import tqdm
from config import (
    API_BASE_URL,
    INDIA_ANTIBIOTICS,
    TARGET_RECORDS_PER_ANTIBIOTIC,
    API_BATCH_SIZE,
    API_TIMEOUT_SEC,
    API_RETRY_ATTEMPTS,
    EVIDENCE_TYPES,
    DATA_DIR,
    RAW_DATA_FILE,
    LOGS_DIR,
)

# ── Setup ──────────────────────────────────────────────────────────────────────
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(f"{LOGS_DIR}/fetch.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ── Columns we want from the API ───────────────────────────────────────────────
SELECT_FIELDS = [
    "genome_id",
    "genome_name",
    "taxon_id",
    "antibiotic",
    "resistant_phenotype",
    "evidence",
    "measurement",
    "measurement_unit",
    "laboratory_typing_method",
    "testing_standard",
]

# ── Resistance labels we keep (drop "Intermediate" for binary classification) ──
KEEP_PHENOTYPES = {"Resistant", "Susceptible"}


def build_url(antibiotic: str, start: int, limit: int) -> str:
    """Build BV-BRC RQL URL for a single antibiotic batch."""
    evidence_filter = ",".join(EVIDENCE_TYPES)
    fields = ",".join(SELECT_FIELDS)
    # Build RQL: antibiotic = X AND evidence IN (Lab, Phenotype)
    query = (
        f"and("
        f"eq(antibiotic,{antibiotic}),"
        f"in(evidence,({evidence_filter}))"
        f")"
        f"&select({fields})"
        f"&limit({limit},{start})"
        f"&sort(+genome_id)"
    )
    return f"{API_BASE_URL}/genome_amr/?{query}"


def fetch_batch(url: str, session: requests.Session) -> list[dict]:
    """Fetch one batch with retry logic."""
    headers = {"Accept": "application/json"}
    for attempt in range(1, API_RETRY_ATTEMPTS + 1):
        try:
            resp = session.get(url, headers=headers, timeout=API_TIMEOUT_SEC)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            log.warning(f"Attempt {attempt}/{API_RETRY_ATTEMPTS} failed: {exc}")
            if attempt < API_RETRY_ATTEMPTS:
                time.sleep(2 ** attempt)   # exponential back-off
    log.error(f"All retries exhausted for URL: {url}")
    return []


def fetch_antibiotic(
    antibiotic: str,
    session: requests.Session,
    writer: csv.DictWriter,
    target: int,
) -> int:
    """Stream records for one antibiotic and write to CSV. Returns count written."""
    start = 0
    total_written = 0

    with tqdm(
        total=target,
        desc=f"  {antibiotic:<20}",
        unit="rec",
        leave=False,
        colour="cyan",
    ) as pbar:
        while total_written < target:
            limit = min(API_BATCH_SIZE, target - total_written)
            url = build_url(antibiotic, start, limit)
            batch = fetch_batch(url, session)

            if not batch:
                log.info(f"{antibiotic}: no more records at offset {start}")
                break

            written_this_batch = 0
            for record in batch:
                phenotype = record.get("resistant_phenotype", "").strip()
                if phenotype not in KEEP_PHENOTYPES:
                    continue
                row = {f: record.get(f, "") for f in SELECT_FIELDS}
                writer.writerow(row)
                written_this_batch += 1

            total_written += written_this_batch
            pbar.update(written_this_batch)
            start += len(batch)

            # If the API returned fewer records than asked, we've hit the end
            if len(batch) < limit:
                break

    return total_written


def main() -> None:
    log.info("=" * 60)
    log.info("Zenthera AMR Data Fetcher — BV-BRC API")
    log.info(f"Target antibiotics : {len(INDIA_ANTIBIOTICS)}")
    log.info(f"Records per drug   : {TARGET_RECORDS_PER_ANTIBIOTIC}")
    log.info(f"Output file        : {RAW_DATA_FILE}")
    log.info("=" * 60)

    session = requests.Session()
    grand_total = 0

    with open(RAW_DATA_FILE, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=SELECT_FIELDS)
        writer.writeheader()

        for drug in INDIA_ANTIBIOTICS:
            log.info(f"\n⟳  Fetching: {drug}")
            count = fetch_antibiotic(
                drug, session, writer, TARGET_RECORDS_PER_ANTIBIOTIC
            )
            log.info(f"   ✓  {drug}: {count} records written")
            grand_total += count

    session.close()
    log.info("")
    log.info("=" * 60)
    log.info(f"✅ Done! Total records fetched: {grand_total}")
    log.info(f"   Saved to: {RAW_DATA_FILE}")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
