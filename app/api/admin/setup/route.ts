/**
 * /api/admin/setup
 * One-time setup endpoint that creates ALL required Supabase tables.
 * Visit /api/admin/setup once after deployment to initialize the database.
 *
 * Tables created:
 *   - veri9_integrations  (admin-saved payment gateway credentials)
 *   - veri9_settings      (generic key/value admin settings)
 *   - veri9_submissions   (form submissions: contact, brand reg, reports, newsletter, donations)
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TABLES = {
  veri9_integrations: `
    CREATE TABLE IF NOT EXISTS veri9_integrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      connected boolean DEFAULT false,
      credentials jsonb DEFAULT '{}',
      updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE veri9_integrations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_access" ON veri9_integrations;
    CREATE POLICY "service_role_access" ON veri9_integrations FOR ALL USING (true) WITH CHECK (true);
  `,
  veri9_settings: `
    CREATE TABLE IF NOT EXISTS veri9_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key text UNIQUE NOT NULL,
      value jsonb DEFAULT '{}',
      updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE veri9_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_access" ON veri9_settings;
    CREATE POLICY "service_role_access" ON veri9_settings FOR ALL USING (true) WITH CHECK (true);
  `,
  veri9_submissions: `
    CREATE TABLE IF NOT EXISTS veri9_submissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL,
      data jsonb NOT NULL,
      read boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS veri9_submissions_created_at_idx ON veri9_submissions(created_at DESC);
    CREATE INDEX IF NOT EXISTS veri9_submissions_type_idx ON veri9_submissions(type);
    ALTER TABLE veri9_submissions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_access" ON veri9_submissions;
    CREATE POLICY "service_role_access" ON veri9_submissions FOR ALL USING (true) WITH CHECK (true);
  `,
}

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const status: Record<string, string> = {}

  for (const [table, sql] of Object.entries(TABLES)) {
    // Check if exists
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    if (checkRes.ok) {
      status[table] = '✅ exists'
      continue
    }

    // Try to create via various RPCs
    let created = false
    for (const rpcName of ['run_sql', 'exec_sql', 'execute_sql', 'sql']) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpcName}`, {
          method: 'POST',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql, query: sql }),
        })
        if (r.ok) { created = true; break }
      } catch { /* continue */ }
    }

    status[table] = created
      ? '✅ created'
      : `❌ needs manual creation`
  }

  const allSql = Object.values(TABLES).join('\n\n')
  const allOk = Object.values(status).every(s => s.startsWith('✅'))

  return NextResponse.json({
    success: allOk,
    status,
    message: allOk
      ? 'All tables are ready! Your Veri9 app is fully set up.'
      : 'Some tables need manual creation. Please run the SQL below in Supabase SQL Editor.',
    instructions: allOk ? null : [
      '1. Go to https://supabase.com/dashboard/project/_/sql/new',
      '2. Paste the SQL below',
      '3. Click "Run"',
      '4. Refresh this URL to verify',
    ],
    sql: allOk ? undefined : allSql,
  }, { status: allOk ? 200 : 200 })
}
