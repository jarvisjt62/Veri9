import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'NGN', donorName, donorEmail } = await req.json()

    const creds = await getGatewayCredentials('paystack')
    if (!creds.secretKey) {
      return NextResponse.json(
        { error: 'Paystack is not configured. Add your Paystack credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    if (!donorEmail) {
      return NextResponse.json({ error: 'Email is required for Paystack payments.' }, { status: 400 })
    }

    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'
    const amountKobo = Math.round(Number(amount) * 100)

    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: donorEmail,
        amount: amountKobo,
        currency: currency.toUpperCase(),
        metadata: { donorName, custom_fields: [{ display_name: 'Donor', variable_name: 'donor', value: donorName }] },
        callback_url: `${appUrl}/dashboard?tab=donate&success=paystack&amount=${amount}&currency=${currency}`,
      }),
    })

    const data = await r.json()
    if (!r.ok || !data.status) {
      console.error('Paystack error:', JSON.stringify(data))
      return NextResponse.json({ error: data.message || 'Paystack initialization failed.' }, { status: 502 })
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    })
  } catch (e) {
    console.error('Paystack route error:', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
