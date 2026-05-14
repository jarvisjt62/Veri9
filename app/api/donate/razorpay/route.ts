import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST — Create Razorpay order
export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'INR', donorName, donorEmail } = await req.json()

    const creds = await getGatewayCredentials('razorpay')
    if (!creds.keyId || !creds.keySecret) {
      return NextResponse.json(
        { error: 'Razorpay is not configured. Add your credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    // Amount in paise (smallest unit)
    const amountPaise = Math.round(Number(amount) * 100)

    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: currency.toUpperCase(),
        receipt: `veri9_${Date.now()}`,
        notes: { donorName: donorName || '', donorEmail: donorEmail || '' },
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      console.error('Razorpay order error:', JSON.stringify(data))
      return NextResponse.json({ error: data.error?.description || 'Razorpay order creation failed.' }, { status: 502 })
    }

    return NextResponse.json({
      keyId: creds.keyId,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      donorName,
      donorEmail,
    })
  } catch (e) {
    console.error('Razorpay route error:', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}

// PUT — Verify Razorpay payment signature after client-side completion
export async function PUT(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    const creds = await getGatewayCredentials('razorpay')
    if (!creds.keySecret) {
      return NextResponse.json({ error: 'Razorpay not configured.' }, { status: 503 })
    }

    const expectedSig = crypto
      .createHmac('sha256', creds.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 })
    }

    return NextResponse.json({ verified: true })
  } catch (e) {
    console.error('Razorpay verify error:', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
