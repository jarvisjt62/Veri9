/**
 * Server-side integration credentials + generic KV store.
 * Uses the Supabase veri9_integrations table (which always exists).
 *
 * Integration names = payment gateway / provider name (e.g. "PayPal", "Stripe")
 * Setting names = "setting:<key>" (e.g. "setting:notifications")
 * Submissions = stored as "submission:<timestamp>:<random>"
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export interface IntegrationRecord {
  name: string
  connected: boolean
  credentials: Record<string, string>
  updated_at?: string
}

// In-process memory fallback (survives within one Vercel function instance)
const memoryStore: Record<string, IntegrationRecord> = {}

async function sbFetch(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    next: { revalidate: 0 },
  })
}

// ─── Read all integrations (payment gateways only — filters out settings/submissions) ──
export async function getAllIntegrations(): Promise<Record<string, IntegrationRecord>> {
  if (!SUPABASE_URL || !SERVICE_KEY) return memoryStore

  try {
    const r = await sbFetch('veri9_integrations?select=*')
    if (!r.ok) return memoryStore
    const rows: IntegrationRecord[] = await r.json()
    const result: Record<string, IntegrationRecord> = {}
    for (const row of rows) {
      // Filter out internal namespaces that aren't real integrations
      if (row.name.startsWith('setting:')) continue
      if (row.name.startsWith('submission:')) continue
      if (row.name.startsWith('donation:')) continue
      if (row.name.startsWith('emaillog:')) continue
      if (row.name.startsWith('__gateway_active_')) continue
      result[row.name] = row
    }
    return result
  } catch {
    return memoryStore
  }
}

// ─── Read single integration ──
export async function getIntegration(name: string): Promise<IntegrationRecord | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return memoryStore[name] ?? null

  try {
    const r = await sbFetch(`veri9_integrations?name=eq.${encodeURIComponent(name)}&limit=1`)
    if (!r.ok) return memoryStore[name] ?? null
    const rows: IntegrationRecord[] = await r.json()
    return rows[0] ?? null
  } catch {
    return memoryStore[name] ?? null
  }
}

// ─── Get credential value ──
export async function getCredential(integrationName: string, field: string): Promise<string> {
  const rec = await getIntegration(integrationName)
  if (!rec?.connected) return ''
  return rec.credentials?.[field] ?? ''
}

// ─── Upsert integration ──
export async function upsertIntegration(record: IntegrationRecord): Promise<void> {
  memoryStore[record.name] = record
  if (!SUPABASE_URL || !SERVICE_KEY) return

  try {
    // Use on_conflict=name to make the merge-duplicates behavior actually work
    await sbFetch('veri9_integrations?on_conflict=name', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        name: record.name,
        connected: record.connected,
        credentials: record.credentials,
        updated_at: new Date().toISOString(),
      }),
    })
  } catch { /* memory updated */ }
}

// ─── Disconnect ──
export async function disconnectIntegration(name: string): Promise<void> {
  memoryStore[name] = { name, connected: false, credentials: {} }
  if (!SUPABASE_URL || !SERVICE_KEY) return

  try {
    await sbFetch(`veri9_integrations?name=eq.${encodeURIComponent(name)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ connected: false, credentials: {}, updated_at: new Date().toISOString() }),
    })
  } catch { /* memory updated */ }
}

// ═════════════════════════════════════════════════════════════════════════════
// Generic Settings Store (uses veri9_integrations with "setting:" prefix)
// ═════════════════════════════════════════════════════════════════════════════

export async function getSetting(key: string): Promise<unknown> {
  const rec = await getIntegration(`setting:${key}`)
  return rec?.credentials?.value ?? null
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await upsertIntegration({
    name: `setting:${key}`,
    connected: true,
    credentials: { value: JSON.stringify(value) } as Record<string, string>,
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// Submissions Store (uses veri9_integrations with "submission:" prefix)
// ═════════════════════════════════════════════════════════════════════════════

export interface SubmissionRecord {
  id: string
  type: string
  data: Record<string, string>
  read: boolean
  created_at: string
}

export async function storeSubmission(type: string, data: Record<string, string>): Promise<void> {
  const now = new Date().toISOString()
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  await upsertIntegration({
    name: `submission:${id}`,
    connected: true,
    credentials: {
      type,
      data: JSON.stringify(data),
      read: 'false',
      created_at: now,
    } as Record<string, string>,
  })
}

export async function getAllSubmissions(): Promise<SubmissionRecord[]> {
  if (!SUPABASE_URL || !SERVICE_KEY) return []
  try {
    const r = await sbFetch(`veri9_integrations?name=like.submission:*&select=*&order=updated_at.desc&limit=500`)
    if (!r.ok) return []
    const rows: IntegrationRecord[] = await r.json()
    return rows.map(row => {
      const c = row.credentials || {}
      let data: Record<string, string> = {}
      try { data = typeof c.data === 'string' ? JSON.parse(c.data) : (c.data as unknown as Record<string, string>) } catch {}
      return {
        id: row.name.replace('submission:', ''),
        type: c.type || 'unknown',
        data,
        read: c.read === 'true',
        created_at: c.created_at || row.updated_at || '',
      }
    })
  } catch {
    return []
  }
}

export async function markSubmissionRead(id: string, read: boolean = true): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return
  try {
    const current = await getIntegration(`submission:${id}`)
    if (!current) return
    await upsertIntegration({
      name: `submission:${id}`,
      connected: true,
      credentials: { ...current.credentials, read: String(read) },
    })
  } catch {}
}

export async function deleteSubmission(id: string): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return
  try {
    await sbFetch(`veri9_integrations?name=eq.submission:${id}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    })
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Email Log Store (uses veri9_integrations with "emaillog:" prefix)
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmailLogRecord {
  id: string
  status: 'sent' | 'failed' | 'stored' | 'skipped'
  to: string
  cc: string
  subject: string
  source: string     // e.g. "contact", "brand_registration", "newsletter"
  provider: string   // e.g. "sendgrid", "none"
  error: string
  created_at: string
}

export async function logEmailAttempt(entry: Omit<EmailLogRecord, 'id' | 'created_at'>): Promise<void> {
  const now = new Date().toISOString()
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  await upsertIntegration({
    name: `emaillog:${id}`,
    connected: true,
    credentials: {
      status: entry.status,
      to: entry.to || '',
      cc: entry.cc || '',
      subject: entry.subject || '',
      source: entry.source || '',
      provider: entry.provider || 'none',
      error: entry.error || '',
      created_at: now,
    } as Record<string, string>,
  })
}

export async function getAllEmailLog(): Promise<EmailLogRecord[]> {
  if (!SUPABASE_URL || !SERVICE_KEY) return []
  try {
    const r = await sbFetch(`veri9_integrations?name=like.emaillog:*&select=*&order=updated_at.desc&limit=500`)
    if (!r.ok) return []
    const rows: IntegrationRecord[] = await r.json()
    return rows.map(row => {
      const c = row.credentials || {}
      return {
        id: row.name.replace('emaillog:', ''),
        status: (c.status as EmailLogRecord['status']) || 'failed',
        to: c.to || '',
        cc: c.cc || '',
        subject: c.subject || '',
        source: c.source || '',
        provider: c.provider || 'none',
        error: c.error || '',
        created_at: c.created_at || row.updated_at || '',
      }
    })
  } catch {
    return []
  }
}

export async function deleteEmailLog(id: string): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return
  try {
    await sbFetch(`veri9_integrations?name=eq.emaillog:${id}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    })
  } catch {}
}

export async function clearEmailLog(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return
  try {
    await sbFetch(`veri9_integrations?name=like.emaillog:*`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    })
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Donations Store (uses veri9_integrations with "donation:" prefix)
// Every donation attempt from /donate is persisted here so ALL admins see it,
// regardless of which browser the donor used.
// ═══════════════════════════════════════════════════════════════════════════════

export interface DonationRecord {
  id: string
  amount: number
  currency: string
  usdEquivalent: string
  gateway: string
  gatewayName: string
  anonymous: boolean
  name: string
  email: string
  message: string
  status: string           // pending_gateway_config | completed | failed
  paymentId: string        // gateway's payment/order id (if captured)
  createdAt: string
}

export async function storeDonation(donation: Omit<DonationRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<string> {
  const createdAt = donation.createdAt || new Date().toISOString()
  const id = donation.id || `don_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  await upsertIntegration({
    name: `donation:${id}`,
    connected: true,
    credentials: {
      amount: String(donation.amount ?? 0),
      currency: donation.currency || 'USD',
      usdEquivalent: donation.usdEquivalent || '0',
      gateway: donation.gateway || '',
      gatewayName: donation.gatewayName || '',
      anonymous: String(donation.anonymous || false),
      name: donation.name || '',
      email: donation.email || '',
      message: donation.message || '',
      status: donation.status || 'pending_gateway_config',
      paymentId: donation.paymentId || '',
      createdAt,
    } as Record<string, string>,
  })
  return id
}

export async function getAllDonations(): Promise<DonationRecord[]> {
  if (!SUPABASE_URL || !SERVICE_KEY) return []
  try {
    const r = await sbFetch(`veri9_integrations?name=like.donation:*&select=*&order=updated_at.desc&limit=1000`)
    if (!r.ok) return []
    const rows: IntegrationRecord[] = await r.json()
    return rows.map(row => {
      const c = row.credentials || {}
      return {
        id: row.name.replace('donation:', ''),
        amount: parseFloat(c.amount || '0') || 0,
        currency: c.currency || 'USD',
        usdEquivalent: c.usdEquivalent || '0',
        gateway: c.gateway || '',
        gatewayName: c.gatewayName || '',
        anonymous: c.anonymous === 'true',
        name: c.name || '',
        email: c.email || '',
        message: c.message || '',
        status: c.status || 'pending_gateway_config',
        paymentId: c.paymentId || '',
        createdAt: c.createdAt || row.updated_at || '',
      }
    })
  } catch {
    return []
  }
}

export async function updateDonationStatus(id: string, status: string, paymentId?: string): Promise<void> {
  const current = await getIntegration(`donation:${id}`)
  if (!current) return
  await upsertIntegration({
    name: `donation:${id}`,
    connected: true,
    credentials: {
      ...current.credentials,
      status,
      ...(paymentId ? { paymentId } : {}),
    },
  })
}

/**
 * Full-field edit of a donation record. Only the keys present in `fields`
 * are overwritten; everything else (createdAt, etc.) is preserved.
 * Returns false if the record does not exist.
 */
export async function updateDonation(
  id: string,
  fields: Partial<Omit<DonationRecord, 'id' | 'createdAt'>>,
): Promise<boolean> {
  const current = await getIntegration(`donation:${id}`)
  if (!current) return false
  const merged: Record<string, string> = { ...current.credentials }
  const setIf = (key: string, val: unknown) => {
    if (val !== undefined && val !== null) merged[key] = String(val)
  }
  setIf('amount', fields.amount)
  setIf('currency', fields.currency)
  setIf('usdEquivalent', fields.usdEquivalent)
  setIf('gateway', fields.gateway)
  setIf('gatewayName', fields.gatewayName)
  setIf('anonymous', fields.anonymous)
  setIf('name', fields.name)
  setIf('email', fields.email)
  setIf('message', fields.message)
  setIf('status', fields.status)
  setIf('paymentId', fields.paymentId)
  await upsertIntegration({ name: `donation:${id}`, connected: true, credentials: merged })
  return true
}

/**
 * Find a donation by its gateway paymentId/orderId and flip its status.
 * Used by gateway capture/callback routes to mark a donation completed once
 * the payment actually settles. Returns the matched donation id or null.
 */
export async function markDonationCompletedByPayment(
  paymentId: string,
  opts?: { gateway?: string; email?: string },
): Promise<string | null> {
  if (!paymentId) return null
  try {
    const all = await getAllDonations()
    // 1) exact paymentId match
    let match = all.find(d => d.paymentId && d.paymentId === paymentId)
    // 2) fall back to most recent pending donation for this gateway/email
    if (!match && (opts?.gateway || opts?.email)) {
      const candidates = all
        .filter(d =>
          d.status === 'pending_gateway_config' &&
          (opts?.gateway ? d.gateway === opts.gateway : true) &&
          (opts?.email ? d.email === opts.email : true),
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      match = candidates[0]
    }
    if (!match) return null
    await updateDonation(match.id, { status: 'completed', paymentId })
    return match.id
  } catch {
    return null
  }
}

export async function deleteDonation(id: string): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return
  try {
    await sbFetch(`veri9_integrations?name=eq.donation:${id}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    })
  } catch {}
}

/**
 * Delete multiple donations at once. Returns the count successfully removed.
 */
export async function bulkDeleteDonations(ids: string[]): Promise<number> {
  if (!SUPABASE_URL || !SERVICE_KEY) return 0
  const clean = ids.filter(Boolean)
  if (clean.length === 0) return 0
  let removed = 0
  // PostgREST `in` filter: name=in.(donation:a,donation:b,...)
  const inList = clean.map(id => `donation:${id}`).join(',')
  try {
    const r = await sbFetch(
      `veri9_integrations?name=in.(${encodeURIComponent(inList)})`,
      { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
    )
    if (r.ok) removed = clean.length
  } catch {
    // fall back to per-row deletes
    for (const id of clean) {
      try {
        await deleteDonation(id)
        removed++
      } catch {}
    }
  }
  return removed
}

// ═══════════════════════════════════════════════════════════════════════════════
// Active Payment Gateway helpers
// Admin toggles are stored as __gateway_active_<Name> with connected=true/false
// where connected=true means ACTIVE/enabled, connected=false means DISABLED.
// If no record exists at all for a gateway, default is ACTIVE (consumer should
// check `map[gw] !== false`).
// ═══════════════════════════════════════════════════════════════════════════════

export async function getActiveGatewayMap(): Promise<Record<string, boolean>> {
  if (!SUPABASE_URL || !SERVICE_KEY) return {}
  try {
    const r = await sbFetch(`veri9_integrations?name=like.__gateway_active_*&select=name,connected`)
    if (!r.ok) return {}
    const rows: { name: string; connected: boolean }[] = await r.json()
    const map: Record<string, boolean> = {}
    for (const row of rows) {
      const gw = row.name.replace(/^__gateway_active_/, '')
      map[gw] = row.connected === true
    }
    return map
  } catch {
    return {}
  }
}
