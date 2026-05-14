import { NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cache = require('@/lib/verification/cache')

/**
 * /api/user/cache
 *   DELETE — clear the in-memory verification cache (server-side)
 *
 * Any authenticated user can call this. It only clears the in-memory cache
 * on the current server instance. The Supabase DB cache is NOT wiped here
 * (the ENGINE_VERSION mechanism handles that automatically when the engine updates).
 *
 * This is the "I got a wrong result on mobile, give me a fresh scan" button.
 */
export async function DELETE(request: Request) {
  try {
    // Require a logged-in user (x-user-email must be present and non-empty)
    const userEmail = request.headers.get('x-user-email')
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    // If a specific barcode is provided, invalidate only that entry
    if (body && typeof body.barcode === 'string' && body.barcode.trim()) {
      await cache.invalidate(body.barcode.trim())
      return NextResponse.json({
        success: true,
        mode: 'single',
        barcode: body.barcode.trim(),
        message: 'Cached result cleared — next scan will fetch fresh data',
      })
    }

    // Otherwise clear the entire in-memory cache (server restarts clear it anyway)
    // We do NOT wipe Supabase DB cache for regular users — only admin can do that
    // The mem cache clearing is enough to fix stale results on mobile
    const memCount: number = (cache.getMemCacheSize ? cache.getMemCacheSize() : 0)
    cache.clearMemCache ? cache.clearMemCache() : null

    return NextResponse.json({
      success: true,
      mode: 'mem-only',
      cleared: memCount,
      message: 'Cache cleared — your next scans will get fresh results from all databases',
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
