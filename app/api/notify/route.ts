import { NextResponse } from 'next/server'
import { getSendGridCreds } from '@/lib/gateway-credentials'
import { storeSubmission, getSetting, logEmailAttempt } from '@/lib/integrations-store'

/**
 * /api/notify
 * POST — store a form submission AND send an admin notification email if SendGrid is configured.
 *
 * Body: { type, data }
 * Submission is ALWAYS stored so admin sees it in the Submissions section.
 */

interface NotifyBody {
  type: string
  data: Record<string, string>
}

async function getNotifSettings(): Promise<{ adminEmail: string; ccEmail: string; prefs: Record<string, boolean> }> {
  const defaults = {
    adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@veri9.com',
    ccEmail: '',
    prefs: {} as Record<string, boolean>,
  }
  try {
    const raw = await getSetting('notifications')
    let value: Record<string, unknown> | null = null
    if (typeof raw === 'string') {
      try { value = JSON.parse(raw) as Record<string, unknown> } catch {}
    } else if (raw && typeof raw === 'object') {
      value = raw as Record<string, unknown>
    }
    if (!value) return defaults
    return {
      adminEmail: (value.adminEmail as string) || defaults.adminEmail,
      ccEmail: (value.ccEmail as string) || '',
      prefs: (value.prefs as Record<string, boolean>) || {},
    }
  } catch {
    return defaults
  }
}

function isNotifEnabled(type: string, prefs: Record<string, boolean>): boolean {
  const mapping: Record<string, string> = {
    contact: 'newUserRegistrations',
    brand_register: 'brandRegistrations',
    community_report: 'counterfeitReports',
    newsletter: 'newUserRegistrations',
    donation: 'counterfeitReports',
    general: 'newUserRegistrations',
  }
  const prefKey = mapping[type]
  if (!prefKey) return true
  return prefs[prefKey] !== false
}

function buildEmailHtml(type: string, data: Record<string, string>): { subject: string; html: string; text: string } {
  const titles: Record<string, string> = {
    contact:          '📬 New Contact Form Submission — Veri9',
    brand_register:   '🏷️ New Brand Registration Request — Veri9',
    community_report: '⚠️ New Community Report Submitted — Veri9',
    newsletter:       '📧 New Newsletter Subscriber — Veri9',
    donation:         '💙 New Donation Received — Veri9',
    general:          '📌 New Form Submission — Veri9',
  }
  const subject = titles[type] || titles.general

  const rows = Object.entries(data)
    .filter(([, v]) => v && v !== '—')
    .map(([k, v]) =>
      `<tr>
        <td style="padding:10px 14px;font-weight:700;color:#374151;white-space:nowrap;background:#f9fafb;border:1px solid #e5e7eb;font-size:0.85rem">${k}</td>
        <td style="padding:10px 14px;color:#0f172a;border:1px solid #e5e7eb;font-size:0.85rem;word-break:break-word">${String(v).replace(/</g, '&lt;')}</td>
      </tr>`
    ).join('')

  const plainRows = Object.entries(data)
    .filter(([, v]) => v && v !== '—')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto 48px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#635bff 100%);padding:28px 32px">
      <span style="font-size:1.2rem;font-weight:900;color:#fff;letter-spacing:-0.03em">Veri<span style="color:#a5b4fc">9</span></span>
      <span style="float:right;font-size:0.75rem;color:rgba(255,255,255,0.65);font-weight:600">Admin Notification</span>
    </div>
    <div style="padding:28px 32px">
      <h2 style="margin:0 0 6px;font-size:1.15rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${subject.replace(' — Veri9', '')}</h2>
      <p style="margin:0 0 20px;font-size:0.82rem;color:#64748b">Received ${new Date().toUTCString()}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden">${rows}</table>
      <div style="margin-top:20px;padding:12px 16px;background:#f0f0ff;border-radius:10px;border-left:4px solid #635bff">
        <p style="margin:0;font-size:0.78rem;color:#4338ca;font-weight:600">🔔 Log in to your admin dashboard to manage this submission.</p>
      </div>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#fafafa">
      <p style="margin:0;font-size:0.72rem;color:#94a3b8;text-align:center">
        Automated notification from <a href="https://veri9.com" style="color:#635bff;text-decoration:none;font-weight:600">veri9.com</a>
      </p>
    </div>
  </div>
</body></html>`

  const text = `${subject}\n${'─'.repeat(40)}\n${plainRows}\n\nReceived: ${new Date().toUTCString()}\n\n— Veri9 Automated Notification`
  return { subject, html, text }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as NotifyBody
    const { type, data } = body
    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    // 1. ALWAYS store (best-effort — don't let a DB failure block the response)
    try { await storeSubmission(type, data) } catch { /* continue even if store fails */ }

    // 2. Check prefs (best-effort)
    let adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@veri9.com'
    let ccEmail = ''
    let prefs: Record<string, boolean> = {}
    try {
      const settings = await getNotifSettings()
      adminEmail = settings.adminEmail
      ccEmail = settings.ccEmail
      prefs = settings.prefs
    } catch { /* use defaults */ }
    if (!isNotifEnabled(type, prefs)) {
      await logEmailAttempt({
        status: 'skipped',
        to: adminEmail, cc: ccEmail, subject: `[${type}] Notification skipped (type disabled)`,
        source: type, provider: 'none',
        error: 'Notification type disabled in admin settings',
      })
      return NextResponse.json({ success: true, method: 'stored', note: 'Notification type disabled' })
    }

    const { subject, html, text } = buildEmailHtml(type, data)
    const replyEmail = data['Email'] || data['Contact Email'] || data['Subscriber Email'] || data['Reporter Email'] || ''
    const replyName  = data['Name'] || data['Company Name'] || data['Reporter Name'] || ''

    // 3. SendGrid
    const sgCreds = await getSendGridCreds()
    if (sgCreds.apiKey) {
      const personalization: Record<string, unknown> = {
        to: [{ email: adminEmail }],
        subject,
      }
      if (ccEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccEmail)) {
        personalization.cc = [{ email: ccEmail }]
      }
      const payload: Record<string, unknown> = {
        personalizations: [personalization],
        from: { email: sgCreds.fromEmail, name: 'Veri9 Notifications' },
        content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }],
      }
      if (replyEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail)) {
        payload.reply_to = { email: replyEmail, name: replyName || replyEmail }
      }

      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sgCreds.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (sgRes.ok || sgRes.status === 202) {
        console.log(`[Notify] ✅ Email sent to ${adminEmail} (type: ${type})`)
        await logEmailAttempt({
          status: 'sent',
          to: adminEmail, cc: ccEmail, subject,
          source: type, provider: 'sendgrid', error: '',
        })
        return NextResponse.json({ success: true, method: 'sendgrid' })
      }
      const errBody = await sgRes.text().catch(() => '(no body)')
      console.error(`[Notify] ❌ SendGrid error ${sgRes.status}:`, errBody)
      await logEmailAttempt({
        status: 'failed',
        to: adminEmail, cc: ccEmail, subject,
        source: type, provider: 'sendgrid',
        error: `SendGrid ${sgRes.status}: ${errBody.slice(0, 300)}`,
      })
    } else {
      await logEmailAttempt({
        status: 'stored',
        to: adminEmail, cc: ccEmail, subject,
        source: type, provider: 'none',
        error: 'SendGrid not configured — submission stored only',
      })
    }

    return NextResponse.json({
      success: true,
      method: 'stored',
      note: 'Submission saved. Configure SendGrid in Admin → Integrations for email alerts.',
    })
  } catch (e) {
    console.error('[Notify] Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
