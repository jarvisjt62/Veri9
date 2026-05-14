import { NextResponse } from 'next/server'
import { storeDonation, getAllDonations, updateDonationStatus, deleteDonation } from '@/lib/integrations-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * /api/donations
 *
 * POST   — record a donation intent (called by /donate page)
 * GET    — list all donations (used by admin dashboard)
 * PATCH  — update donation status (e.g. when gateway completes)  body: { id, status, paymentId? }
 * DELETE — remove a donation   ?id=<id>
 */

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      amount, currency, usdEquivalent, gateway, gatewayName,
      anonymous, name, email, message, status, paymentId,
    } = body || {}

    if (!amount || !currency || !gateway) {
      return NextResponse.json({ error: 'Missing required fields: amount, currency, gateway' }, { status: 400 })
    }

    const id = await storeDonation({
      amount: Number(amount) || 0,
      currency: String(currency),
      usdEquivalent: String(usdEquivalent ?? ''),
      gateway: String(gateway),
      gatewayName: String(gatewayName || gateway),
      anonymous: Boolean(anonymous),
      name: String(name || ''),
      email: String(email || ''),
      message: String(message || ''),
      status: String(status || 'pending_gateway_config'),
      paymentId: String(paymentId || ''),
    })

    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const donations = await getAllDonations()
    return NextResponse.json({ success: true, donations })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { id, status, paymentId } = body || {}
    if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    await updateDonationStatus(String(id), String(status), paymentId ? String(paymentId) : undefined)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteDonation(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
