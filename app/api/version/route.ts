import { NextResponse } from 'next/server'
import { BUILD_VERSION, BUILD_COMMIT, BUILT_AT } from '@/lib/build-info'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Returns the version stamp baked into THIS deployed build.
 *
 * The client polls this every 60s. When the returned version differs from
 * the one that was bundled into the running tab (BUILD_VERSION), the
 * UpdateChecker shows a toast prompting the user to reload.
 *
 * Always served with no-store so we always see the freshest deploy.
 */
export async function GET() {
  return NextResponse.json(
    {
      version: BUILD_VERSION,
      commit: BUILD_COMMIT,
      builtAt: BUILT_AT,
      now: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    }
  )
}
