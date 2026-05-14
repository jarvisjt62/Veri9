import { NextResponse } from 'next/server'

/**
 * POST /api/donate/mpesa/callback
 * Receives M-Pesa STK Push result callback from Safaricom.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const stkCallback = body?.Body?.stkCallback
    const resultCode  = stkCallback?.ResultCode
    const resultDesc  = stkCallback?.ResultDesc
    const metadata    = stkCallback?.CallbackMetadata?.Item as { Name: string; Value: string | number }[] | undefined

    const amount   = metadata?.find(i => i.Name === 'Amount')?.Value
    const mpesaRef = metadata?.find(i => i.Name === 'MpesaReceiptNumber')?.Value
    const phone    = metadata?.find(i => i.Name === 'PhoneNumber')?.Value

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

    if (resultCode === 0) {
      // Payment successful
      try {
        await fetch(`${appUrl}/api/notify`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'donation', data: {
            Gateway: 'M-Pesa', Amount: `KES ${amount}`,
            Phone: String(phone), Status: '✅ Payment Completed',
            'M-Pesa Receipt': String(mpesaRef),
          }}),
        })
      } catch {}
    } else {
      console.log('[M-Pesa Callback] Payment failed/cancelled:', resultCode, resultDesc)
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (e) {
    console.error('[M-Pesa Callback] Error:', e)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
