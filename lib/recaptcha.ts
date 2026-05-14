/**
 * Server-side reCAPTCHA v2 token verification.
 *
 * Usage (in an API route / server action):
 *   const ok = await verifyRecaptchaToken(token)
 *   if (!ok) return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 400 })
 */

export interface RecaptchaVerifyResponse {
  success: boolean
  challenge_ts?: string   // timestamp of the challenge load
  hostname?: string       // hostname of site where reCAPTCHA was solved
  'error-codes'?: string[]
}

export async function verifyRecaptchaToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false

  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    // In development without a secret key configured, log a warning but allow through
    console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY is not set — skipping server-side verification')
    return true
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })

    if (!res.ok) return false

    const data: RecaptchaVerifyResponse = await res.json()
    return data.success === true
  } catch (err) {
    console.error('[reCAPTCHA] Verification request failed:', err)
    return false
  }
}
