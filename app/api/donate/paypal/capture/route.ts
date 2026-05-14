import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token   = searchParams.get('token')
  const orderId = searchParams.get('orderId') || token
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

  if (!orderId) {
    return NextResponse.redirect(`${appUrl}/dashboard?tab=donate&error=missing_token`)
  }

  try {
    const creds = await getGatewayCredentials('paypal')
    if (!creds.clientId || !creds.clientSecret) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=donate&error=paypal_not_configured`)
    }

    // Smart mode detection: try both modes
    const configuredMode = (creds.mode || 'live') === 'sandbox' ? 'sandbox' : 'live'
    const modesToTry = configuredMode === 'live' ? ['live', 'sandbox'] : ['sandbox', 'live']

    let access_token = ''
    let baseUrl = ''
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
    }

    if (!access_token) {
      return NextResponse.redirect(`${appUrl}/dashboard?tab=donate&error=paypal_auth_failed`)
    }

    // 2. Capture the order
    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })

    const capture = await captureRes.json()
    if (!captureRes.ok) {
      console.error('PayPal capture error:', JSON.stringify(capture))
      return NextResponse.redirect(`${appUrl}/dashboard?tab=donate&error=capture_failed`)
    }

    const captureUnit = capture.purchase_units?.[0]
    const captureAmt  = captureUnit?.payments?.captures?.[0]?.amount
    const amount   = captureAmt?.value || '0'
    const currency = captureAmt?.currency_code || 'USD'

    // 3. Send admin notification
    try {
      await fetch(`${appUrl}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'donation',
          gateway: 'PayPal',
          amount,
          currency,
          donorEmail: capture.payer?.email_address || 'unknown',
          donorName: `${capture.payer?.name?.given_name || ''} ${capture.payer?.name?.surname || ''}`.trim() || 'Anonymous',
          status: 'completed',
          orderId,
        }),
      })
    } catch { /* notification failure should not block redirect */ }

    return NextResponse.redirect(
      `${appUrl}/dashboard?tab=donate&success=paypal&amount=${amount}&currency=${currency}`
    )
  } catch (e) {
    console.error('PayPal capture route error:', e)
    return NextResponse.redirect(`${appUrl}/dashboard?tab=donate&error=unexpected`)
  }
}
