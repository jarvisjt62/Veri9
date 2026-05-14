import { NextRequest, NextResponse } from 'next/server'
import { getGatewayCredentials } from '@/lib/gateway-credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { amount, donorPhone } = await req.json()

    const creds = await getGatewayCredentials('mpesa')
    if (!creds.consumerKey || !creds.consumerSecret || !creds.shortcode || !creds.passkey) {
      return NextResponse.json(
        { error: 'M-Pesa is not configured. Add your Daraja credentials in the Admin → Integrations panel.' },
        { status: 503 }
      )
    }

    if (!donorPhone) {
      return NextResponse.json({ error: 'Phone number is required for M-Pesa payments.' }, { status: 400 })
    }

    const mpesaEnv = creds.env === 'production' ? 'api' : 'sandbox'
    const baseUrl  = `https://${mpesaEnv}.safaricom.co.ke`
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

    // Normalize phone: remove +, leading 0 → 254XXXXXXXXX
    let phone = String(donorPhone).replace(/\D/g, '')
    if (phone.startsWith('0'))   phone = '254' + phone.slice(1)
    if (phone.startsWith('+'))   phone = phone.slice(1)
    if (!phone.startsWith('254')) phone = '254' + phone

    // 1. Get OAuth token
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64')}`,
      },
    })
    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('M-Pesa token error:', err)
      return NextResponse.json({ error: 'M-Pesa authentication failed. Check your credentials.' }, { status: 502 })
    }
    const { access_token } = await tokenRes.json()

    // 2. Build password
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
    const password  = Buffer.from(`${creds.shortcode}${creds.passkey}${timestamp}`).toString('base64')

    // 3. STK Push
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: creds.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(Number(amount)),
        PartyA: phone,
        PartyB: creds.shortcode,
        PhoneNumber: phone,
        CallBackURL: `${appUrl}/api/donate/mpesa/callback`,
        AccountReference: 'Veri9Donation',
        TransactionDesc: 'Donation to Veri9',
      }),
    })

    const stkData = await stkRes.json()
    if (!stkRes.ok || stkData.ResponseCode !== '0') {
      console.error('M-Pesa STK error:', JSON.stringify(stkData))
      return NextResponse.json({ error: stkData.ResponseDescription || 'M-Pesa STK push failed.' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
      message: 'STK push sent. Please check your phone and enter your M-Pesa PIN.',
    })
  } catch (e) {
    console.error('M-Pesa route error:', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
