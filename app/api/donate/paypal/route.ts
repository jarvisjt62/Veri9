import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD', donorName, donorEmail } = await req.json()

    const creds = await getGatewayCredentials('paypal')
    if (!creds.clientId || !creds.clientSecret) {
      return NextResponse.json(
        { error: 'PayPal is not configured. Add your PayPal credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    // Smart mode detection: try the configured mode first, then fall back to the other
    const configuredMode = (creds.mode || 'live') === 'sandbox' ? 'sandbox' : 'live'
    const modesToTry = configuredMode === 'live' ? ['live', 'sandbox'] : ['sandbox', 'live']
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

    let access_token = ''
    let baseUrl = ''
    let lastErr = ''
    for (const m of modesToTry) {
      const candidate = m === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
      const tRes = await fetch(`${candidate}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })
      if (tRes.ok) {
        access_token = (await tRes.json()).access_token
        baseUrl = candidate
        break
      }
      lastErr = await tRes.text().catch(() => '')
    }

    if (!access_token) {
      console.error('PayPal token error (tried both modes):', lastErr)
      return NextResponse.json(
        {
          error: 'PayPal authentication failed. Please verify your Client ID and Client Secret in Admin → Integrations → PayPal. Make sure you copy the credentials for your intended mode (Live or Sandbox) from the PayPal Developer Dashboard.',
          details: lastErr.slice(0, 200),
        },
        { status: 502 }
      )
    }

    // 2. Create order
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: Number(amount).toFixed(2),
          },
          description: `Donation to Veri9 from ${donorName || donorEmail || 'Anonymous'}`,
        }],
        application_context: {
          return_url: `${appUrl}/api/donate/paypal/capture`,
          cancel_url: `${appUrl}/dashboard?tab=donate&cancelled=paypal`,
          brand_name: 'Veri9',
          user_action: 'PAY_NOW',
        },
      }),
    })

    if (!orderRes.ok) {
      const err = await orderRes.text()
      console.error('PayPal order error:', err)
      return NextResponse.json({ error: 'Failed to create PayPal order.' }, { status: 502 })
    }

    const order = await orderRes.json()
    const approvalLink = order.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')
    if (!approvalLink) {
      return NextResponse.json({ error: 'PayPal did not return an approval URL.' }, { status: 502 })
    }

    return NextResponse.json({
      approvalUrl: approvalLink.href,
      orderId: order.id,
    })
  } catch (e) {
    console.error('PayPal route error:', e)
    return NextResponse.json({ error: 'Unexpected error processing PayPal request.' }, { status: 500 })
  }
}
