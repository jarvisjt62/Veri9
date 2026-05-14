import { NextResponse } from 'next/server'
import { getAllEmailLog, deleteEmailLog, clearEmailLog } from '@/lib/integrations-store'

// GET — list all email log entries
export async function GET() {
  try {
    const logs = await getAllEmailLog()
    return NextResponse.json({ success: true, logs })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}

// DELETE — remove a single log entry by id, or clear all if ?all=1
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')
    if (all === '1') {
      await clearEmailLog()
      return NextResponse.json({ success: true, cleared: true })
    }
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteEmailLog(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
