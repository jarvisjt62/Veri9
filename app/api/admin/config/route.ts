import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clearEngineConfigCache } from '@/lib/verification/engineConfig'

/**
 * Platform config API.
 * GET: returns current platform_config stored in admin's user_profiles.metadata
 * POST: saves new platform_config (admin only)
 */

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL

    if (!serviceRoleKey || !adminEmail) {
      return NextResponse.json({ config: null, error: 'Service not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('user_profiles')
      .select('metadata')
      .eq('email', adminEmail)
      .single()

    if (error || !data) {
      return NextResponse.json({ config: null })
    }

    const config = (data.metadata as Record<string, unknown>)?.platform_config || null
    return NextResponse.json({ config, timestamp: new Date().toISOString() })
  } catch (e) {
    console.error('[Platform Config GET] Error:', e)
    return NextResponse.json({ config: null, error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userEmail, config } = body

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (!userEmail || userEmail !== adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error } = await supabase
      .from('user_profiles')
      .update({
        metadata: { platform_config: { ...config, updatedAt: new Date().toISOString() } },
      })
      .eq('email', adminEmail)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Round 29b — invalidate the in-memory engine config cache so the next
    // /api/verify call picks up the new toggle state immediately (no 30s wait).
    clearEngineConfigCache()

    return NextResponse.json({ success: true, config })
  } catch (e) {
    console.error('[Platform Config POST] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
