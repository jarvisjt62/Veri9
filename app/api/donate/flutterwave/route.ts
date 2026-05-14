import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD', donorName, donorEmail } = await req.json()

    const creds = await getGatewayCredentials('flutterwave')
    if (!creds.secretKey) {
      return NextResponse.json(
        { error: 'Flutterwave is not configured. Add your credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'
    const txRef  = `veri9_fw_${Date.now()}`

    const r = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: Number(amount),
        currency: currency.toUpperCase(),
        redirect_url: `${appUrl}/dashboard?tab=donate&success=flutterwave&amount=${amount}&currency=${currency}`,
        customer: { email: donorEmail || 'donor@veri9.com', name: donorName || 'Anonymous' },
        customizations: { title: 'Donate to Veri9', description: 'Support Veri9 product safety mission', logo: `${appUrl}/logo.png` },
        meta: { source: 'veri9_dashboard' },
      }),
    })

    const data = await r.json()
    if (!r.ok || data.status !== 'success') {
      console.error('Flutterwave error:', JSON.stringify(data))
      return NextResponse.json({ error: data.message || 'Flutterwave payment initialization failed.' }, { status: 502 })
    }

    return NextResponse.json({ paymentUrl: data.data.link, txRef })
  } catch (e) {
    console.error('Flutterwave route error:', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
