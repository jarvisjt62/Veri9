-- Round 25 / 25c / 25d: engine_version column for auto-invalidation of
-- stale cached verdicts when scoring logic changes.
--
-- Run this once in Supabase SQL Editor. Safe to re-run (all statements are
-- idempotent). After running, old wrong verdicts are evicted and users will
-- get fresh, corrected results on their next scan.

ALTER TABLE public.verification_cache
  ADD COLUMN IF NOT EXISTS engine_version integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS verification_cache_engine_version_idx
  ON public.verification_cache (engine_version);

-- ─── Evict bad verdicts from all engine versions < 4 ───────────────────────
--
-- v1/v2: UPC-A barcodes were misclassified as foreign EAN-13, causing
--   US products to be flagged as COUNTERFEIT due to "South Africa/Cuba" GS1
--   prefix matches.
--
-- v2/v3: "united-states" (hyphenated, from OpenFoodFacts) was NOT matching
--   "United States / Canada" (from GS1 lookup) because of the hyphen-vs-space
--   and slash difference. Every scan of any US product via OpenFoodFacts
--   triggered a GS1_COUNTRY_MISMATCH HIGH signal → COUNTERFEIT verdict.
--
-- v3: check-digit misreads (UNREADABLE) were cached under the wrong barcode
--   number; the real product should get a fresh lookup.
--
-- All of these are false positives. Evict them all.

DELETE FROM public.verification_cache
WHERE engine_version < 4;

-- (Optionally keep authenticated/known-good entries by only deleting COUNTERFEIT:)
-- DELETE FROM public.verification_cache
-- WHERE engine_version < 4 AND status IN ('COUNTERFEIT', 'UNREADABLE');
