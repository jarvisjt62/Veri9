/**
 * /api/admin/settings
 * Simple key-value settings store.
 * GET  /api/admin/settings?key=notifications
 * POST /api/admin/settings  { key, value }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSetting, setSetting } from '@/lib/integrations-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
  const raw = await getSetting(key)
  let value: unknown = raw
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw) } catch {}
  }
  return NextResponse.json({ key, value })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, value } = body
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    await setSetting(key, value)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
