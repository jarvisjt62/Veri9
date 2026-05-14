'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
// navigation handled via window.location.href to avoid Next.js App Router #310 bug
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { REMEMBERED_EMAIL_KEY } from '@/lib/utils'
import ReCAPTCHA from 'react-google-recaptcha'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const { signIn, user, isAdmin, loading: authLoading } = useAuth()

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (saved) { setEmail(saved); setRememberMe(true) }
  }, [])

  // Redirect already-logged-in users to the correct destination.
  // Use window.location.href (full navigation) instead of router.push to avoid
  // Next.js App Router's pending-transition bug that causes React error #310.
  useEffect(() => {
    if (!authLoading && user) {
      const dest = isAdmin ? '/admin' : '/dashboard'
      window.location.href = dest
    }
  }, [user, authLoading, isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    if (!captchaToken) { toast.error('Please complete the reCAPTCHA check'); return }
    setLoading(true)
    try {
      // Verify reCAPTCHA token server-side first
      const captchaRes = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      if (!captchaRes.ok) {
        const d = await captchaRes.json()
        toast.error(d.error || 'reCAPTCHA verification failed. Please try again.')
        recaptchaRef.current?.reset(); setCaptchaToken(null)
        setLoading(false); return
      }
      const { error } = await signIn(email, password)
      if (error) {
        // If Supabase rejects sign-in because the email isn't confirmed,
        // send the user to /verify-email where they can enter the code.
        const err = error.toLowerCase()
        if (err.includes('email not confirmed') || err.includes('not verified') || err.includes('not confirmed')) {
          toast('Your email isn\'t verified yet — redirecting to the verification page.', { icon: '📧', duration: 4000 })
          const dest = `/verify-email?email=${encodeURIComponent(email)}`
          setTimeout(() => { window.location.href = dest }, 200)
          return
        }
        // Any other error — surface and keep the user on /login
        toast.error(error)
        recaptchaRef.current?.reset(); setCaptchaToken(null)
        setLoading(false)
        return
      }
      if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      toast.success('Welcome back!')
      // Use window.location.href (full navigation) to avoid Next.js App Router
      // pending-transition bug (React error #310) triggered by router.push.
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      const dest = email === adminEmail ? '/admin' : '/dashboard'
      setTimeout(() => { window.location.href = dest }, 100)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid credentials')
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setLoading(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 12,
    fontSize: '1rem',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f0f0ff 100%)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .login-input:focus { border-color: #635bff !important; box-shadow: 0 0 0 3px rgba(99,91,255,0.12) !important; }
        .login-card { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 8px 32px rgba(0,0,0,0.08); padding: 32px; }
        .login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,91,255,0.45) !important; }
        .login-btn { transition: all 0.2s; }
        @media (max-width: 480px) {
          .login-card { padding: 24px 20px !important; border-radius: 16px !important; }
          .login-header-logo { width: 56px !important; height: 56px !important; }
          .login-header-title { font-size: 1.5rem !important; }
          .login-topbar { padding: 0 16px !important; flex-wrap: wrap; gap: 8px; min-height: 56px; height: auto !important; padding-top: 10px !important; padding-bottom: 10px !important; }
          .login-topbar-right { font-size: 0.82rem !important; }
          .login-wrapper { padding: 20px 16px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="login-topbar" style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logo-new.png" alt="Veri9" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
            Veri<span style={{ color: '#635bff' }}>9</span>
          </span>
        </Link>
        <p className="login-topbar-right" style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>

      {/* Main */}
      <div className="login-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img
              className="login-header-logo"
              src="/logo-new.png"
              alt="Veri9"
              style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }}
            />
            <h1 className="login-header-title" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Sign in to your Veri9 account</p>
          </div>

          {/* Card */}
          <div className="login-card">
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  className="login-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ ...inputBase, borderColor: focusedField === 'email' ? '#635bff' : '#e2e8f0', boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(99,91,255,0.12)' : 'none' }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Password</label>
                  <Link href="/reset-password" style={{ fontSize: '0.8rem', color: '#635bff', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ ...inputBase, paddingRight: 48, borderColor: focusedField === 'password' ? '#635bff' : '#e2e8f0', boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(99,91,255,0.12)' : 'none' }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', alignItems: 'center', minWidth: 28, minHeight: 28, justifyContent: 'center' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <div
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onClick={() => setRememberMe(!rememberMe)}
                  onKeyDown={e => e.key === ' ' && setRememberMe(!rememberMe)}
                  style={{ width: 20, height: 20, borderRadius: 5, cursor: 'pointer', border: `2px solid ${rememberMe ? '#635bff' : '#d1d5db'}`, background: rememberMe ? '#635bff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
                >
                  {rememberMe && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <label onClick={() => setRememberMe(!rememberMe)} style={{ fontSize: '0.875rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                  Remember my email
                </label>
              </div>

              {/* reCAPTCHA */}
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              </div>

              {/* Submit */}
              <button
                className="login-btn"
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: '1rem', fontWeight: 700, color: '#fff', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(99,91,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

          </div>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.875rem', color: '#64748b' }}>
            New to Veri9?{' '}
            <Link href="/signup" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
