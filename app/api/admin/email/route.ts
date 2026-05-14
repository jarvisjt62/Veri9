import { NextResponse } from 'next/server'

/**
 * /api/admin/email
 * POST - log an email-to-user request (placeholder; real send requires SMTP config).
 *
 * Body: { to: string, subject: string, body: string }
 * Security: caller must pass ?email=<admin-email> matching NEXT_PUBLIC_ADMIN_EMAIL
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (!userEmail || userEmail !== adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const body = await request.json().catch(() => ({}))
    const { to, subject, body: messageBody } = body as { to?: string; subject?: string; body?: string }
    if (!to || !subject || !messageBody) {
      return NextResponse.json({ error: 'Missing to/subject/body' }, { status: 400 })
    }
    // TODO: integrate real email provider (SendGrid/SMTP). For now, log and return success.
    console.log('[Admin Email]', { to, subject, body: messageBody.substring(0, 100) })
    return NextResponse.json({
      success: true,
      message: 'Email queued. (Configure SMTP in Integrations to enable real sending.)',
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
