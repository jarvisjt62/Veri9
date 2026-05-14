-- Veri9 Verification Cache Table
-- Stores product verification results so repeat scans of the same barcode
-- always return consistent, fast results.
--
-- Run this in your Supabase SQL editor once.

CREATE TABLE IF NOT EXISTS public.verification_cache (
  barcode        text PRIMARY KEY,
  status         text NOT NULL,
  trust_score    integer NOT NULL DEFAULT 0,
  product_name   text,
  brand          text,
  result_json    jsonb NOT NULL,
  ttl_level      text NOT NULL DEFAULT 'stable',  -- 'stable' | 'transient'
  cached_at      timestamptz NOT NULL DEFAULT now(),
  hit_count      integer NOT NULL DEFAULT 1
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS verification_cache_status_idx
  ON public.verification_cache (status);

CREATE INDEX IF NOT EXISTS verification_cache_cached_at_idx
  ON public.verification_cache (cached_at DESC);

-- RLS: only service role can read/write (admin operations).
-- Regular clients go through the /api/verify route using service-role key.
ALTER TABLE public.verification_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_cache_service_only_select"
  ON public.verification_cache FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "verification_cache_service_only_write"
  ON public.verification_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: scheduled cleanup of expired entries (Supabase pg_cron)
-- Transient entries expire after 1 day, stable after 7 days.
-- If you don't have pg_cron, the engine's getCached() handles expiration.
--
-- SELECT cron.schedule(
--   'veri9-cache-cleanup',
--   '0 3 * * *',
--   $$ DELETE FROM public.verification_cache
--      WHERE (ttl_level = 'transient' AND cached_at < now() - interval '1 day')
--         OR (ttl_level = 'stable'    AND cached_at < now() - interval '7 days'); $$
-- );
