import { NextRequest, NextResponse } from 'next/server'
import { loadEngineConfig } from '@/lib/verification/engineConfig'

// Dynamic import to avoid ESM issues with require()
async function getEngine() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/verification/engine')
}

function isValidBarcode(barcode: string): boolean {
  return /^\d{6,14}$/.test(barcode.replace(/[\s-]/g, ''))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcode, force } = body

    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'Barcode is required' },
        { status: 400 }
      )
    }

    const cleanBarcode = String(barcode).replace(/[\s-]/g, '')

    if (!isValidBarcode(cleanBarcode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid barcode format', message: 'Barcode must be 6-14 digits' },
        { status: 400 }
      )
    }

    // Round 25c — `force: true` invalidates any cached result before verifying,
    // so the user can manually refresh a stale/wrong verdict without waiting
    // for the 7-day TTL. Powers the "Re-verify" button on the result card.
    if (force) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const cache = require('@/lib/verification/cache')
        await cache.invalidate(cleanBarcode)
      } catch (e) {
        console.warn('[VERIFY] cache invalidate failed:', (e as Error).message)
      }
    }

    const { verifyProduct } = await getEngine()
    // Load admin toggle state (cached 30s) so disabled sources are skipped.
    const cfg = await loadEngineConfig()
    const result = await verifyProduct(cleanBarcode, cfg)

    // Strip internal debug fields that should never reach the client
    const { _debugFoundSources, ...cleanResult } = result as any;

    return NextResponse.json({ success: true, data: cleanResult })
  } catch (error) {
    console.error('[VERIFY] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed', message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json({ success: false, error: 'Barcode required as ?barcode= param' }, { status: 400 })
  }

  const cleanBarcode = barcode.replace(/[\s-]/g, '')
  if (!isValidBarcode(cleanBarcode)) {
    return NextResponse.json({ success: false, error: 'Invalid barcode' }, { status: 400 })
  }

  try {
    const { verifyProduct } = await getEngine()
    const cfg = await loadEngineConfig()
    const result = await verifyProduct(cleanBarcode, cfg)
    const { _debugFoundSources, ...cleanResult } = result as any;
    return NextResponse.json({ success: true, data: cleanResult })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}