import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * /api/admin/scans/bulk-delete
 *   POST  { ids: string[] }  — delete multiple scan records at once
 *
 * Security: caller must pass x-user-email header matching NEXT_PUBLIC_ADMIN_EMAIL
 */

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceRoleKey) throw new Error('Service role key not configured')
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function isAuthorized(request: Request): boolean {
  const userEmail = request.headers.get('x-user-email')
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  return !!userEmail && userEmail === adminEmail
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id.trim()) : []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 records per bulk delete' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Try scan_history first
    const { error } = await supabase
      .from('scan_history')
      .delete()
      .in('id', ids)

    if (error) {
      // Fallback to scans table
      const { error: error2 } = await supabase
        .from('scans')
        .delete()
        .in('id', ids)
      if (error2) {
        return NextResponse.json({ error: error2.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
