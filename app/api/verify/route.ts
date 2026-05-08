import { NextRequest, NextResponse } from 'next/server'

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
    const { barcode } = body

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

    const { verifyProduct } = await getEngine()
    const result = await verifyProduct(cleanBarcode)

    return NextResponse.json({ success: true, data: result })
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
    const result = await verifyProduct(cleanBarcode)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}