import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Google Pay also uses Stripe Checkout — proxy to applepay route with gateway=googlepay
export async function POST(req: NextRequest) {
  const body = await req.json()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://veri9.com'

  const r = await fetch(`${appUrl}/api/donate/applepay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, gateway: 'googlepay' }),
  })

  const data = await r.json()
  return NextResponse.json(data, { status: r.status })
}
