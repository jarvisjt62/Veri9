import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD', donorName, donorEmail } = await req.json()

    const creds = await getGatewayCredentials('stripe')
    if (!creds.secretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Add your Stripe credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

    // Zero-decimal currencies (no cents)
    const zeroDecimal = ['JPY','KRW','VND','CLP','GNF','MGA','PYG','RWF','UGX','XAF','XOF']
    const unitAmount  = zeroDecimal.includes(currency.toUpperCase())
      ? Math.round(Number(amount))
      : Math.round(Number(amount) * 100)

    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(unitAmount),
      'line_items[0][price_data][product_data][name]': 'Donation to Veri9',
      'line_items[0][price_data][product_data][description]': `Thank you, ${donorName || donorEmail || 'Anonymous'}!`,
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'success_url': `${appUrl}/dashboard?tab=donate&success=stripe&amount=${amount}&currency=${currency}`,
      'cancel_url':  `${appUrl}/dashboard?tab=donate&cancelled=stripe`,
      'customer_email': donorEmail || '',
      'metadata[donorName]': donorName || '',
      'metadata[gateway]': 'stripe',
    })

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!sessionRes.ok) {
      const err = await sessionRes.text()
      console.error('Stripe session error:', err)
      return NextResponse.json({ error: 'Failed to create Stripe checkout session.' }, { status: 502 })
    }

    const session = await sessionRes.json()
    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id })
  } catch (e) {
    console.error('Stripe route error:', e)
    return NextResponse.json({ error: 'Unexpected error processing Stripe request.' }, { status: 500 })
  }
}
