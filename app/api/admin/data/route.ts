import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Admin data API — uses service role key to bypass RLS.
 * Returns all users, scans, reports, and brands for the admin dashboard.
 * Protected: only returns data if the caller is the admin email.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL

    // Security: only admin email is allowed to read all data
    if (!userEmail || userEmail !== adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    // Create admin client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch all data in parallel
    const [usersRes, scansRes, reportsRes, brandsRes] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(500),
      supabase.from('scan_history').select('*', { count: 'exact' }).order('scanned_at', { ascending: false }).limit(500),
      supabase.from('community_reports').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(500),
      supabase.from('brands').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(500),
    ])

    return NextResponse.json({
      users: usersRes.data || [],
      usersCount: usersRes.count || 0,
      scans: scansRes.data || [],
      scansCount: scansRes.count || 0,
      reports: reportsRes.data || [],
      reportsCount: reportsRes.count || 0,
      brands: brandsRes.data || [],
      brandsCount: brandsRes.count || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[Admin Data API] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
