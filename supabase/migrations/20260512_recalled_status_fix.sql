-- Migration: Round 25e — Fix recalled products stored as COUNTERFEIT
-- ──────────────────────────────────────────────────────────────────
-- Traditional Medicinals teas (032917000521, 032917000545) were cached as
-- COUNTERFEIT because their ACTIVE_RECALL signal accidentally triggered the
-- counterfeit threshold. ENGINE_VERSION is now 5 — these rows will be
-- auto-evicted on the next scan. But for scan_history we update them now
-- so the history UI shows RECALLED instead of COUNTERFEIT.

-- 1. Evict all cache rows below version 5 (engine logic has changed)
DELETE FROM verification_cache
WHERE engine_version IS NULL OR engine_version < 5;

-- 2. Fix scan_history: mark known recalled products correctly
--    (These are Traditional Medicinals barcodes with confirmed FDA Salmonella recall)
UPDATE scan_history
SET status = 'RECALLED'
WHERE status IN ('COUNTERFEIT', 'counterfeit')
  AND barcode IN (
    '032917000521',  -- Traditional Medicinals Organic Peppermint Tea
    '032917000545'   -- Traditional Medicinals Organic Chamomile with Lavender Tea
  );

-- 3. General safety net: fix any other scan_history rows where the stored
--    full_result JSON contains an ACTIVE_RECALL signal but status is COUNTERFEIT.
--    The full_result column is jsonb — use the @> operator to match.
UPDATE scan_history
SET status = 'RECALLED'
WHERE status IN ('COUNTERFEIT', 'counterfeit')
  AND full_result IS NOT NULL
  AND full_result->'counterfeitSignals'->'signals' @> '[{"type":"ACTIVE_RECALL"}]';
