import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * /api/admin/users/[id]
 *   PATCH  - update user profile (full_name, role, is_admin, status)
 *   DELETE - permanently delete user (auth + profile)
 *
 * Security: caller must pass ?email=<admin-email> matching NEXT_PUBLIC_ADMIN_EMAIL
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
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get('email')
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  return !!userEmail && userEmail === adminEmail
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (typeof body.full_name === 'string') updates.full_name = body.full_name
    if (typeof body.role === 'string') updates.role = body.role
    if (typeof body.is_admin === 'boolean') updates.is_admin = body.is_admin
    if (typeof body.status === 'string') updates.status = body.status
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, user: data })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    const { id } = await ctx.params
    const supabase = getAdminClient()
    // Delete from user_profiles first (FK-safe if cascade set)
    await supabase.from('user_profiles').delete().eq('id', id)
    // Delete the auth user (requires service role)
    const { error: authErr } = await supabase.auth.admin.deleteUser(id)
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
