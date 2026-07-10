# Historical scan_history correction scripts

## Background
The verification engine had two bugs (fixed in Round 30d / 30f) that caused
some legitimate products to be falsely flagged COUNTERFEIT or SUSPICIOUS.
Fixing the *engine* does not retroactively fix rows already written to
`scan_history` — those rows store a frozen JSON snapshot (`full_result`) of
the verdict at scan time. This directory contains the audit + backfill
tooling used to correct those historical rows in place.

## Scripts

- `audit_scan_history.js` — READ ONLY. Lists every scan_history row
  currently flagged COUNTERFEIT/SUSPICIOUS, re-verifies each unique barcode
  against the CURRENT engine, and reports what would change. Safe to run
  anytime for a health check.

- `backfill_scan_history.js` — Re-verifies every COUNTERFEIT/SUSPICIOUS row
  and updates it IN PLACE (status, trust_score, full_result) when the
  verdict changed. Preserves scanned_at/barcode/user_id. Stores
  `full_result.previousStatus` / `previousTrustScore` / `correctedAt` /
  `correctionNote` for internal audit trail (not shown to users).
  - Defaults to **dry run** (no writes).
  - Pass `--apply` to actually write changes.
  - Writes a JSON log of every action to `scripts/archive/backfill_log_<ts>.json`.

## Usage

```bash
# 1. Dry run first — always review before applying
node scripts/audit_scan_history.js
node scripts/backfill_scan_history.js

# 2. Apply for real once reviewed
node scripts/backfill_scan_history.js --apply
```

## History

- **2026-07-10**: Ran after Round 30d (UPC-A/Cuba misidentification) and
  Round 30f (UPCitemdb timing-driven GS1_COUNTRY_MISMATCH severity flakiness)
  engine fixes. 33 rows across 22 unique barcodes / 12 users were corrected;
  0 remained COUNTERFEIT/SUSPICIOUS afterward. Logs archived in
  `scripts/archive/backfill_log_*.json`.
