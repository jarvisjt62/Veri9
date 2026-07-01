import { NextResponse } from 'next/server'
import {
  storeDonation,
  getAllDonations,
  updateDonationStatus,
  updateDonation,
  deleteDonation,
  bulkDeleteDonations,
} from '@/lib/integrations-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * /api/donations
 *
 * POST   — record a donation intent (called by /donate page)
 *          OR perform a bulk action when body.action is set:
 *            { action: 'bulk-delete',        ids: string[] }
 *            { action: 'bulk-status', status: string, ids: string[] }
 * GET    — list all donations (used by admin dashboard)
 * PATCH  — update a donation. Two modes:
 *            status-only : { id, status, paymentId? }
 *            full edit   : { id, fields: { amount, currency, name, email, ... } }
 * DELETE — remove a donation   ?id=<id>
 *
 * Security: mutating actions (bulk, full edit, delete) require the caller to
 * pass an x-user-email header matching NEXT_PUBLIC_ADMIN_EMAIL.
 */

function isAdmin(request: Request): boolean {
  const userEmail = request.headers.get('x-user-email')
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  return !!adminEmail && !!userEmail && userEmail.toLowerCase() === adminEmail.toLowerCase()
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    // ── Bulk admin actions ───────────────────────────────────────────────
    if (body?.action) {
      if (!isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      const ids: string[] = Array.isArray(body.ids)
        ? body.ids.filter((x: unknown) => typeof x === 'string' && x.trim())
        : []
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No donation IDs provided' }, { status: 400 })
      }
      if (ids.length > 1000) {
        return NextResponse.json({ error: 'Maximum 1000 records per bulk action' }, { status: 400 })
      }

      if (body.action === 'bulk-delete') {
        const removed = await bulkDeleteDonations(ids)
        return NextResponse.json({ success: true, removed })
      }

      if (body.action === 'bulk-status') {
        const status = String(body.status || '').trim()
        if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })
        let updated = 0
        for (const id of ids) {
          try {
            await updateDonationStatus(id, status)
            updated++
          } catch {}
        }
        return NextResponse.json({ success: true, updated })
      }

      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 })
    }

    // ── Record a new donation intent (public, from /donate) ──────────────
    const {
      amount, currency, usdEquivalent, gateway, gatewayName,
      anonymous, name, email, message, status, paymentId,
      recurring, tier,
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
      recurring: Boolean(recurring),
      tier: String(tier || ''),
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
    const { id, status, paymentId, fields } = body || {}
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Full-field edit requires admin auth
    if (fields && typeof fields === 'object') {
      if (!isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      const clean: Record<string, unknown> = {}
      const allowed = [
        'amount', 'currency', 'usdEquivalent', 'gateway', 'gatewayName',
        'anonymous', 'name', 'email', 'message', 'status', 'paymentId',
        'recurring', 'tier',
      ]
      for (const k of allowed) {
        if (k in fields) clean[k] = (fields as Record<string, unknown>)[k]
      }
      if ('amount' in clean) clean.amount = Number(clean.amount) || 0
      const ok = await updateDonation(String(id), clean)
      if (!ok) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    // Status-only update (used by gateway callbacks AND admin quick actions)
    if (!status) return NextResponse.json({ error: 'Missing status or fields' }, { status: 400 })
    // Status changes from the admin dashboard require auth; gateway callbacks
    // are server-to-server and won't carry the header — allow those too since
    // they only ever set 'completed'/'failed'. To be safe, require admin for
    // anything other than the gateway-completion statuses.
    const gatewayStatuses = ['completed', 'failed', 'refunded']
    if (!gatewayStatuses.includes(String(status)) && !isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    await updateDonationStatus(String(id), String(status), paymentId ? String(paymentId) : undefined)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteDonation(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
