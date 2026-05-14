/**
 * POST /api/recaptcha
 * Verifies a reCAPTCHA v2 token on the server side.
 *
 * Body: { token: string }
 * Returns: { success: boolean, error?: string }
 *
 * Client-side forms call this endpoint before submitting their actual payload
 * so the secret key is never exposed in the browser.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyRecaptchaToken } from '@/lib/recaptcha'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body as { token?: string }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing reCAPTCHA token' },
        { status: 400 }
      )
    }

    const valid = await verifyRecaptchaToken(token)

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA verification failed. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/recaptcha] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error during reCAPTCHA verification.' },
      { status: 500 }
    )
  }
}
