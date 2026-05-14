import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD', donorName, donorEmail } = await req.json()

    const creds = await getGatewayCredentials('mercadopago')
    if (!creds.accessToken) {
      return NextResponse.json(
        { error: 'Mercado Pago is not configured. Add your credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          id: `veri9_donation_${Date.now()}`,
          title: 'Donation to Veri9',
          quantity: 1,
          unit_price: Number(amount),
          currency_id: currency.toUpperCase(),
        }],
        payer: { name: donorName || 'Anonymous', email: donorEmail || 'donor@veri9.com' },
        back_urls: {
          success: `${appUrl}/dashboard?tab=donate&success=mercadopago&amount=${amount}&currency=${currency}`,
          failure: `${appUrl}/dashboard?tab=donate&error=mercadopago_failed`,
          pending: `${appUrl}/dashboard?tab=donate&pending=mercadopago`,
        },
        auto_return: 'approved',
        statement_descriptor: 'Veri9 Donation',
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      console.error('Mercado Pago error:', JSON.stringify(data))
      return NextResponse.json({ error: data.message || 'Mercado Pago preference creation failed.' }, { status: 502 })
    }

    return NextResponse.json({
      checkoutUrl: data.init_point,
      preferenceId: data.id,
    })
  } catch (e) {
    console.error('Mercado Pago route error:', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
