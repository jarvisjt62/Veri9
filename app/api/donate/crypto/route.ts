import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD', donorName, donorEmail } = await req.json()

    const creds = await getGatewayCredentials('crypto')
    if (!creds.apiKey) {
      return NextResponse.json(
        { error: 'Crypto (Coinbase Commerce) is not configured. Add your credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

    const r = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'X-CC-Api-Key': creds.apiKey,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Donation to Veri9',
        description: `Donation from ${donorName || donorEmail || 'Anonymous'}`,
        pricing_type: 'fixed_price',
        local_price: { amount: String(Number(amount).toFixed(2)), currency: currency.toUpperCase() },
        metadata: { donorName: donorName || '', donorEmail: donorEmail || '' },
        redirect_url: `${appUrl}/dashboard?tab=donate&success=crypto&amount=${amount}&currency=${currency}`,
        cancel_url:   `${appUrl}/dashboard?tab=donate&cancelled=crypto`,
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      console.error('Coinbase Commerce error:', JSON.stringify(data))
      return NextResponse.json({ error: data.error?.message || 'Coinbase Commerce charge creation failed.' }, { status: 502 })
    }

    return NextResponse.json({
      checkoutUrl: data.data.hosted_url,
      chargeId: data.data.id,
      chargeCode: data.data.code,
    })
  } catch (e) {
    console.error('Crypto route error:', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
