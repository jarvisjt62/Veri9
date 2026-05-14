import { NextResponse } from 'next/server'
import { getActiveGatewayMap } from '@/lib/integrations-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * /api/public/active-gateways
 *
 * Publicly readable — returns which payment gateways are currently enabled by admin.
 * Response: { map: { [gatewayName]: boolean } }
 *
 * A gateway is ACTIVE unless explicitly toggled off (map[name] === false).
 * Gateway names match the canonical admin list:
 *   Stripe, PayPal, Apple Pay, Google Pay, Paystack, Flutterwave, M-Pesa,
 *   Razorpay, Alipay, WeChat Pay, Mercado Pago, Coinbase Commerce
 */
export async function GET() {
  try {
    const map = await getActiveGatewayMap()
    return NextResponse.json({ success: true, map })
  } catch (e) {
    return NextResponse.json({ success: false, map: {}, error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
