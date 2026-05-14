/**
 * /api/admin/submissions
 * GET    — list all form submissions (newest first)
 * PATCH  — mark as read/unread: { id, read }
 * DELETE — remove: ?id=xxx
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAllSubmissions, markSubmissionRead, deleteSubmission } from '@/lib/integrations-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = await getAllSubmissions()
  return NextResponse.json({ submissions: rows })
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, read } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await markSubmissionRead(id, !!read)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteSubmission(id)
  return NextResponse.json({ ok: true })
}
