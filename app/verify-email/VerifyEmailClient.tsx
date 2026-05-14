'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

// Supabase can be configured to send 6-OR-8 digit OTP codes. We default to
// 8 (which is the current Supabase default for most new projects) and
// auto-shrink to 6 if the user pastes a shorter code.
const DEFAULT_CODE_LEN = 8

function VerifyEmailContent() {
  const { verifyEmailOtp, resendEmailOtp, user } = useAuth()
  const searchParams = useSearchParams()
  const initialEmail = searchParams?.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [codeLen, setCodeLen] = useState<number>(DEFAULT_CODE_LEN)
  const [digits, setDigits] = useState<string[]>(() => Array(DEFAULT_CODE_LEN).fill(''))
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // If the user is already authenticated, send them straight to dashboard.
  // Use window.location.href to avoid Next.js App Router #310 bug on router.push.
  useEffect(() => {
    if (user) { window.location.href = '/dashboard' }
  }, [user])

  // Cooldown countdown for the resend button
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Keep digits length in sync when codeLen changes
  useEffect(() => {
    setDigits(prev => {
      const next = Array(codeLen).fill('')
      for (let i = 0; i < Math.min(prev.length, codeLen); i++) next[i] = prev[i]
      return next
    })
  }, [codeLen])

  const handleDigitChange = (idx: number, value: string) => {
    // Allow pasting the whole code into the first field. Accept 6 OR 8 digits
    // and auto-switch the grid size to match what was pasted.
    if (value.length > 1) {
      const clean = value.replace(/\D/g, '')
      if (clean.length === 6 || clean.length === 8) {
        const newLen = clean.length
        setCodeLen(newLen)
        const arr = clean.split('')
        setDigits(arr)
        setTimeout(() => {
          inputRefs.current[newLen - 1]?.focus()
          attemptVerify(arr.join(''))
        }, 50)
        return
      }
      // Partial paste — still spread what we have
      const arr = Array(codeLen).fill('')
      clean.slice(0, codeLen).split('').forEach((c, i) => { arr[i] = c })
      setDigits(arr)
      const nextFocus = Math.min(clean.length, codeLen - 1)
      inputRefs.current[nextFocus]?.focus()
      return
    }
    const ch = value.replace(/\D/g, '').slice(0, 1)
    const next = [...digits]
    next[idx] = ch
    setDigits(next)
    if (ch && idx < codeLen - 1) inputRefs.current[idx + 1]?.focus()
    // Auto-submit when the last box is filled
    if (idx === codeLen - 1 && ch) {
      const code = next.join('')
      if (code.length === codeLen) setTimeout(() => attemptVerify(code), 50)
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < codeLen - 1) inputRefs.current[idx + 1]?.focus()
  }

  const attemptVerify = async (codeArg?: string) => {
    const code = codeArg ?? digits.join('')
    if (code.length !== 6 && code.length !== 8) {
      toast.error(`Please enter the full ${codeLen}-digit code`); return
    }
    if (!email) { toast.error('Please enter your email address'); return }
    setVerifying(true)
    const { error } = await verifyEmailOtp(email, code)
    if (error) {
      // Scrub the code so the user doesn't see the bad digits
      setDigits(Array(codeLen).fill(''))
      inputRefs.current[0]?.focus()
      toast.error(error === 'Token has expired or is invalid'
        ? 'That code is invalid or expired — please request a new one.'
        : error)
      setVerifying(false)
      return
    }
    toast.success('Email verified! Welcome to Veri9 💙')
    // auth-state change will fire and the useEffect above will redirect,
    // but also kick off a direct hard redirect as fallback.
    setTimeout(() => { window.location.href = '/dashboard' }, 300)
  }

  const handleResend = async () => {
    if (!email) { toast.error('Please enter your email address'); return }
    if (cooldown > 0) return
    setResending(true)
    const { error } = await resendEmailOtp(email)
    setResending(false)
    if (error) { toast.error(error); return }
    toast.success(`A new verification code has been sent to ${email}`)
    setCooldown(45)
  }

  const toggleCodeLen = () => {
    setCodeLen(prev => (prev === 8 ? 6 : 8))
  }

  // Base style is now responsive via CSS classes — the inline fallback is
  // conservative so it still works if the @media rules don't match.
  const inputBase: React.CSSProperties = {
    textAlign: 'center',
    fontWeight: 800, color: '#0f172a',
    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
    outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box',
    WebkitAppearance: 'none',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f0f0ff 100%)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .otp-input {
          width: 48px; height: 56px; font-size: 1.5rem;
        }
        .otp-input:focus { border-color: #635bff!important; box-shadow: 0 0 0 3px rgba(99,91,255,0.18)!important; background: #fff!important; }
        .otp-input.filled { border-color: #635bff!important; background: #eef2ff!important; }
        .verify-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,91,255,0.45)!important; }
        .verify-btn { transition: all 0.2s; }
        .otp-row { display: flex; justify-content: center; gap: 8px; flex-wrap: nowrap; }
        .otp-row.len-8 .otp-input { width: 40px; height: 52px; font-size: 1.25rem; }

        @media (max-width: 480px) {
          .otp-row { gap: 6px; }
          .otp-row.len-6 .otp-input { width: 44px; height: 54px; font-size: 1.35rem; }
          .otp-row.len-8 .otp-input { width: 34px; height: 48px; font-size: 1.05rem; }
        }
        @media (max-width: 380px) {
          .otp-row { gap: 5px; }
          .otp-row.len-6 .otp-input { width: 40px; height: 50px; font-size: 1.2rem; }
          .otp-row.len-8 .otp-input { width: 30px; height: 44px; font-size: 0.95rem; }
        }
        @media (max-width: 340px) {
          .otp-row { gap: 4px; }
          .otp-row.len-8 .otp-input { width: 27px; height: 40px; font-size: 0.85rem; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo-new.png" alt="Veri9" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Veri<span style={{ color: '#635bff' }}>9</span></span>
        </Link>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          <Link href="/login" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>← Back to sign in</Link>
        </p>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #635bff, #4f46e5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: '1.6rem' }}>📧</div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>Verify your email</h1>
            <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.55, maxWidth: 380, margin: '0 auto' }}>
              We sent a verification code to {email ? <strong style={{ color: '#0f172a' }}>{email}</strong> : 'your email address'}. Enter it below to activate your account.
            </p>
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', padding: 'clamp(22px, 5vw, 32px)' }}>
            {/* Email field (only shown if not pre-populated from ?email=) */}
            {!initialEmail && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: '0.95rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none' }}
                />
              </div>
            )}

            {/* OTP grid — variable length (6 or 8) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{codeLen}-digit verification code</label>
              <button
                type="button"
                onClick={toggleCodeLen}
                style={{ background: 'none', border: 'none', color: '#635bff', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {codeLen === 8 ? 'My code is 6 digits' : 'My code is 8 digits'}
              </button>
            </div>
            <div className={`otp-row len-${codeLen}`} style={{ marginBottom: 20 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  className={`otp-input${d ? ' filled' : ''}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={i === 0 ? codeLen : 1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  style={inputBase}
                />
              ))}
            </div>

            {/* Submit */}
            <button
              className="verify-btn"
              type="button"
              onClick={() => attemptVerify()}
              disabled={verifying || digits.join('').length !== codeLen}
              style={{ width: '100%', padding: 14, borderRadius: 12, fontSize: '1rem', fontWeight: 700, color: '#fff', background: (verifying || digits.join('').length !== codeLen) ? '#94a3b8' : 'linear-gradient(135deg, #635bff, #4f46e5)', border: 'none', cursor: (verifying || digits.join('').length !== codeLen) ? 'not-allowed' : 'pointer', boxShadow: verifying ? 'none' : '0 4px 14px rgba(99,91,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 }}
            >
              {verifying ? (
                <>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                  Verifying…
                </>
              ) : (
                <>Verify email</>
              )}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Didn&apos;t receive a code?{' '}</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                style={{ background: 'none', border: 'none', color: (resending || cooldown > 0) ? '#94a3b8' : '#635bff', fontWeight: 700, fontSize: '0.85rem', cursor: (resending || cooldown > 0) ? 'not-allowed' : 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Can&apos;t find the email? Check your spam folder. The code is valid for 60 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
