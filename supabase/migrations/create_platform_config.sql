-- Platform Config table: stores all admin site controls that sync to the user dashboard
-- Run this in your Supabase SQL Editor

-- Create platform_config table
CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by text
);

-- Allow anyone to READ the config (so user dashboard can check maintenance mode etc)
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform config" ON public.platform_config
  FOR SELECT USING (true);

-- Only service role (admin) can write
CREATE POLICY "Service role can write platform config" ON public.platform_config
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default config row
INSERT INTO public.platform_config (key, value, updated_by)
VALUES (
  'site_config',
  '{
    "maintenanceMode": false,
    "registrationEnabled": true,
    "scannerEnabled": true,
    "userDashboardEnabled": true,
    "communityReportsEnabled": true,
    "darkModeForced": false,
    "darkModeDefault": "system",
    "announcementEnabled": false,
    "announcementText": "🎉 New feature: Real-time barcode scanning with 13 databases!",
    "announcementColor": "#635bff",
    "maintenanceMessage": "We are performing scheduled maintenance. We will be back shortly."
  }',
  'admin@veri9.com'
)
ON CONFLICT (key) DO NOTHING;

-- Fix scan_history RLS policies to allow authenticated users to insert/select their own rows
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Users can insert own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Service role has full access to scan_history" ON public.scan_history;

-- Create proper policies
CREATE POLICY "Users can view own scan history" ON public.scan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history" ON public.scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to scan_history" ON public.scan_history
  FOR ALL USING (auth.role() = 'service_role');
