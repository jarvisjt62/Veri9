import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * /api/admin/scans/[id]
 *   PATCH  - update scan status
 *   DELETE - permanently delete a scan record
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

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (typeof body.status === 'string') updates.status = body.status
    if (typeof body.trust_score === 'number') updates.trust_score = body.trust_score
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('scan_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      // Try alternate table name
      const { data: data2, error: error2 } = await supabase
        .from('scans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
      return NextResponse.json({ success: true, scan: data2 })
    }
    return NextResponse.json({ success: true, scan: data })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { id } = await ctx.params
    const supabase = getAdminClient()
    // Try scan_history first, then scans table
    const { error } = await supabase.from('scan_history').delete().eq('id', id)
    if (error) {
      const { error: error2 } = await supabase.from('scans').delete().eq('id', id)
      if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
