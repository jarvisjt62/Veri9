-- =====================================================
-- Veri9 Scan History Table Migration
-- ─────────────────────────────────────────────────
-- RUN THIS IN: Supabase Dashboard → SQL Editor
-- This enables cross-device scan history sync.
-- =====================================================

-- Step 1: Create scan_history table
CREATE TABLE IF NOT EXISTS public.scan_history (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode       text NOT NULL,
  product_name  text,
  brand         text,
  category      text,
  trust_score   integer,
  status        text,
  country       text,
  image_url     text,
  full_result   jsonb,
  scanned_at    timestamptz DEFAULT now() NOT NULL
);

-- Step 2: Performance indexes
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id
  ON public.scan_history(user_id);

CREATE INDEX IF NOT EXISTS idx_scan_history_user_scanned
  ON public.scan_history(user_id, scanned_at DESC);

-- Step 3: Enable Row Level Security
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Users can read own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can insert own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can delete own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Service role has full access" ON public.scan_history;

-- Step 5: Create RLS policies
-- Users can read ONLY their own scans
CREATE POLICY "Users can read own scan history"
  ON public.scan_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scan history"
  ON public.scan_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scan history"
  ON public.scan_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFY: Run this query to confirm the table exists:
-- SELECT COUNT(*) FROM public.scan_history;
-- =====================================================
