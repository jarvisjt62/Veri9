import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSendGridCreds } from '@/lib/gateway-credentials'
import { logEmailAttempt, storeSubmission, getSetting, setSetting } from '@/lib/integrations-store'

/**
 * /api/admin/broadcast
 * POST — send an email broadcast to a filtered audience of users.
 *
 * Body: {
 *   audience: 'all' | 'admins' | 'new' | 'verified' | 'specific',
 *   recipientIds?: string[], // required when audience='specific'
 *   subject,
 *   message
 * }
 * Auth: caller must pass ?email=<admin-email> matching NEXT_PUBLIC_ADMIN_EMAIL
 *
 * Behaviour:
 *   1. Queries user_profiles from Supabase (service-role, bypasses RLS)
 *   2. Filters by audience (or uses recipientIds when audience='specific')
 *   3. For each recipient:
 *        - If SendGrid creds exist → sends real email
 *        - Otherwise → records the attempt as "stored" so admin sees it in Email Log
 *   4. Records the broadcast itself as a submission so it shows in Submissions too
 *   5. Returns stats: { total, sent, failed, stored, recipients }
 */

function isAuthorized(request: Request): boolean {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get('email')
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  return !!userEmail && userEmail === adminEmail
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceRoleKey) throw new Error('Service role key not configured')
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  is_admin?: boolean | null
  role?: string | null
  created_at: string
}

function filterByAudience(users: ProfileRow[], audience: string): ProfileRow[] {
  switch (audience) {
    case 'admins':
      return users.filter(u => u.is_admin === true || u.role === 'admin')
    case 'new': {
      // New = signed up in last 7 days
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      return users.filter(u => new Date(u.created_at).getTime() >= weekAgo)
    }
    case 'verified':
      return users.filter(u => !!u.email)
    case 'all':
    default:
      return users
  }
}

function buildBroadcastHtml(subject: string, message: string): string {
  // Simple user-facing template. Paragraphs preserved via whitespace-pre-line.
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto 48px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#635bff 100%);padding:28px 32px">
      <span style="font-size:1.2rem;font-weight:900;color:#fff;letter-spacing:-0.03em">Veri<span style="color:#a5b4fc">9</span></span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 16px;font-size:1.25rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${escapeHtml(subject)}</h2>
      <div style="font-size:0.95rem;color:#334155;line-height:1.7;white-space:pre-line">${escapeHtml(message)}</div>
    </div>
    <div style="padding:18px 32px;border-top:1px solid #f1f5f9;background:#fafafa">
      <p style="margin:0;font-size:0.72rem;color:#94a3b8;text-align:center">
        You're receiving this because you have an account on <a href="https://veri9.com" style="color:#635bff;text-decoration:none;font-weight:600">veri9.com</a>.
      </p>
    </div>
  </div>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendOneViaSendGrid(
  apiKey: string,
  fromEmail: string,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject }],
        from: { email: fromEmail, name: 'Veri9' },
        content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }],
      }),
    })
    if (res.ok || res.status === 202) return { ok: true, status: res.status }
    const err = await res.text().catch(() => '')
    return { ok: false, status: res.status, error: err.slice(0, 200) }
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'fetch failed' }
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      audience = 'all',
      recipientIds = [],
      subject = '',
      message = '',
    } = body as { audience?: string; recipientIds?: string[]; subject?: string; message?: string }

    if (!subject.trim() || !message.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    if (audience === 'specific' && (!Array.isArray(recipientIds) || recipientIds.length === 0)) {
      return NextResponse.json({ error: 'recipientIds required when audience=specific' }, { status: 400 })
    }

    // 1. Fetch users
    const supabase = getAdminClient()
    const { data: usersData, error: usersErr } = await supabase
      .from('user_profiles')
      .select('id,email,full_name,is_admin,role,created_at')
      .limit(2000)

    if (usersErr) {
      console.error('[Broadcast] user_profiles query failed:', usersErr)
      return NextResponse.json({ error: 'Could not load users' }, { status: 500 })
    }

    let filtered: ProfileRow[]
    if (audience === 'specific') {
      // Filter by provided IDs
      const idSet = new Set(recipientIds)
      filtered = (usersData || []).filter(u => idSet.has(u.id))
    } else {
      // Use audience preset
      filtered = filterByAudience(usersData || [], audience)
    }

    // Only keep users with valid emails
    filtered = filtered.filter(u => u.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email))

    if (filtered.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0, sent: 0, failed: 0, stored: 0,
        note: 'No recipients matched the selected audience.',
      })
    }

    // 2. Record broadcast in submissions (so admin sees it in Submissions tab)
    try {
      await storeSubmission('broadcast', {
        Audience: audience,
        Subject: subject,
        Message: message,
        Recipients: String(filtered.length),
      })
    } catch { /* best-effort */ }

    // 3. Build email content
    const html = buildBroadcastHtml(subject, message)
    const text = `${subject}\n${'─'.repeat(40)}\n${message}\n\n— Veri9\nhttps://veri9.com`

    // 4. Attempt to send via SendGrid
    const sgCreds = await getSendGridCreds()
    let sent = 0
    let failed = 0
    let stored = 0

    if (sgCreds.apiKey && sgCreds.fromEmail) {
      // Send sequentially with a tiny delay to avoid hitting burst limits
      for (const u of filtered) {
        const r = await sendOneViaSendGrid(sgCreds.apiKey, sgCreds.fromEmail, u.email, subject, html, text)
        if (r.ok) {
          sent++
          await logEmailAttempt({
            status: 'sent',
            to: u.email, cc: '',
            subject: `[broadcast] ${subject}`,
            source: 'broadcast', provider: 'sendgrid', error: '',
          }).catch(() => {})
        } else {
          failed++
          await logEmailAttempt({
            status: 'failed',
            to: u.email, cc: '',
            subject: `[broadcast] ${subject}`,
            source: 'broadcast', provider: 'sendgrid',
            error: `SendGrid ${r.status}: ${r.error || 'unknown'}`,
          }).catch(() => {})
        }
        // small delay between sends
        await new Promise(r => setTimeout(r, 50))
      }
    } else {
      // No SendGrid — record every attempt as 'stored' so admin sees them in Email Log
      for (const u of filtered) {
        stored++
        await logEmailAttempt({
          status: 'stored',
          to: u.email, cc: '',
          subject: `[broadcast] ${subject}`,
          source: 'broadcast', provider: 'none',
          error: 'SendGrid not configured — message stored only',
        }).catch(() => {})
      }
    }

    const finalStatus = sgCreds.apiKey ? (sent > 0 ? 'sent' : 'failed') : 'stored'

    // Persist broadcast to DB so it survives page refreshes
    const broadcastRecord = {
      id: Date.now(),
      subject,
      audience: audience === 'specific' ? `${filtered.length} specific users` : audience,
      sentAt: new Date().toLocaleString(),
      recipients: filtered.length,
      sent,
      failed,
      stored,
      status: finalStatus,
    }
    try {
      const existing = await getSetting('broadcast_history')
      let history: typeof broadcastRecord[] = []
      if (typeof existing === 'string') {
        try { history = JSON.parse(existing) } catch {}
      } else if (Array.isArray(existing)) {
        history = existing
      }
      history = [broadcastRecord, ...history].slice(0, 50) // keep last 50
      await setSetting('broadcast_history', history)
    } catch { /* best-effort */ }

    return NextResponse.json({
      success: true,
      total: filtered.length,
      sent,
      failed,
      stored,
      hasProvider: !!sgCreds.apiKey,
      broadcast: broadcastRecord,
      note: sgCreds.apiKey
        ? `Broadcast sent to ${sent} recipients (${failed} failed).`
        : `Broadcast stored for ${stored} recipients. Configure SendGrid in Integrations to send real emails.`,
    })
  } catch (e) {
    console.error('[Broadcast] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
