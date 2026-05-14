import { NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cache = require('@/lib/verification/cache')

/**
 * /api/admin/cache
 *   GET    — return cache statistics
 *   DELETE — clear all cache entries (mem + Supabase)
 *
 * Security: caller must pass x-user-email header matching NEXT_PUBLIC_ADMIN_EMAIL
 */

function isAuthorized(request: Request): boolean {
  const userEmail = request.headers.get('x-user-email')
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  return !!userEmail && userEmail === adminEmail
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const stats = await cache.getStats()
    return NextResponse.json({ success: true, stats })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    // Single-barcode invalidation
    if (body && typeof body.barcode === 'string' && body.barcode.trim()) {
      await cache.invalidate(body.barcode.trim())
      return NextResponse.json({ success: true, mode: 'single', barcode: body.barcode.trim() })
    }

    // Clear ALL
    const result = await cache.clearAll()
    return NextResponse.json({
      success: true,
      mode: 'all',
      cleared: { mem: result.memCount, db: result.dbCount },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
