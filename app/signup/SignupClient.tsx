'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
// navigation handled via window.location.href to avoid Next.js App Router #310 bug
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import ReCAPTCHA from 'react-google-recaptcha'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const { signUp, user } = useAuth()

  // Use window.location.href (full navigation) to avoid Next.js App Router
  // pending-transition bug that causes React error #310 on router.push.
  useEffect(() => {
    if (user) { window.location.href = '/dashboard' }
  }, [user])

  const passwordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const strengthInfo = (score: number) => {
    if (score === 0) return { label: '', color: '#e2e8f0' }
    if (score === 1) return { label: 'Weak', color: '#ef4444' }
    if (score === 2) return { label: 'Fair', color: '#f59e0b' }
    if (score === 3) return { label: 'Good', color: '#10b981' }
    return { label: 'Strong', color: '#635bff' }
  }

  const strength = passwordStrength(form.password)
  const { label: strengthLabel, color: strengthColor } = strengthInfo(strength)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { toast.error('Please fill in all fields'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (!agreed) { toast.error('Please agree to the Terms of Service'); return }
    if (!captchaToken) { toast.error('Please complete the reCAPTCHA check'); return }
    setLoading(true)
    try {
      // Verify reCAPTCHA server-side
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
      const { error, needsEmailConfirmation } = await signUp(form.email, form.password, form.name)
      if (error) {
        toast.error(error)
        recaptchaRef.current?.reset(); setCaptchaToken(null)
        setLoading(false)
        return
      }
      if (needsEmailConfirmation) {
        // Supabase sent an OTP code (6 or 8 digits, depending on project config) to the user's inbox.
        // Route them to /verify-email?email=xxx so they can enter the code
        // right inside the app — no more "email not verified" bounce loop.
        toast.success('Account created! Enter the verification code we just emailed you.', { duration: 5500 })
        const dest = `/verify-email?email=${encodeURIComponent(form.email)}`
        setTimeout(() => { window.location.href = dest }, 300)
        return
      }
      // Session is already active — go to dashboard
      toast.success('Welcome to Veri9! 💙')
      setTimeout(() => { window.location.href = '/dashboard' }, 100)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
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
    transition: 'all 0.15s',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f0f0ff 100%)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .signup-input:focus { border-color: #635bff !important; box-shadow: 0 0 0 3px rgba(99,91,255,0.12) !important; }
        .signup-card { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 8px 32px rgba(0,0,0,0.08); padding: 28px; }
        .signup-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,91,255,0.45) !important; }
        .signup-btn { transition: all 0.2s; }
        @media (max-width: 480px) {
          .signup-card { padding: 20px 16px !important; border-radius: 16px !important; }
          .signup-header-logo { width: 52px !important; height: 52px !important; }
          .signup-header-title { font-size: 1.45rem !important; }
          .signup-topbar { padding: 0 16px !important; flex-wrap: wrap; gap: 6px; min-height: 52px; height: auto !important; padding-top: 10px !important; padding-bottom: 10px !important; }
          .signup-topbar-right { font-size: 0.82rem !important; }
          .signup-wrapper { padding: 20px 16px !important; }
          .signup-benefits { gap: 10px !important; }
          .signup-benefit-item { font-size: 0.78rem !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="signup-topbar" style={{
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
        <p className="signup-topbar-right" style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
          Have an account?{' '}
          <Link href="/login" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>

      <div className="signup-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img
              className="signup-header-logo"
              src="/logo-new.png"
              alt="Veri9"
              style={{ width: 60, height: 60, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }}
            />
            <h1 className="signup-header-title" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Create your account
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Join 250,000+ people verifying products</p>
          </div>

          {/* Benefits row */}
          <div className="signup-benefits" style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: '⚡', text: 'Instant verification' },
              { icon: '📊', text: 'Scan history' },
              { icon: '🔔', text: 'Recall alerts' },
            ].map(b => (
              <div key={b.text} className="signup-benefit-item" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#64748b', fontWeight: 500, background: '#f8fafc', padding: '5px 10px', borderRadius: 20, border: '1px solid #e5e7eb' }}>
                <span>{b.icon}</span> {b.text}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="signup-card">
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Full name
                </label>
                <input
                  className="signup-input"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  style={{ ...inputBase, borderColor: focusedField === 'name' ? '#635bff' : '#e2e8f0', boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(99,91,255,0.12)' : 'none' }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="name"
                  required
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Email address
                </label>
                <input
                  className="signup-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  style={{ ...inputBase, borderColor: focusedField === 'email' ? '#635bff' : '#e2e8f0', boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(99,91,255,0.12)' : 'none' }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="signup-input"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    style={{ ...inputBase, paddingRight: 48, borderColor: focusedField === 'password' ? '#635bff' : '#e2e8f0', boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(99,91,255,0.12)' : 'none' }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', alignItems: 'center', minWidth: 28, minHeight: 28, justifyContent: 'center' }}>
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
                {/* Password strength */}
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 9999, background: i <= strength ? strengthColor : '#e2e8f0', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: strengthColor, fontWeight: 700 }}>{strengthLabel}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="signup-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    style={{
                      ...inputBase,
                      paddingRight: form.confirmPassword ? 78 : 48,
                      borderColor: form.confirmPassword
                        ? form.confirmPassword !== form.password ? '#ef4444' : '#10b981'
                        : focusedField === 'confirm' ? '#635bff' : '#e2e8f0',
                      boxShadow: focusedField === 'confirm' && !form.confirmPassword ? '0 0 0 3px rgba(99,91,255,0.12)' : 'none',
                    }}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="new-password"
                    required
                  />
                  {/* Eye toggle — always visible */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', alignItems: 'center', minWidth: 28, minHeight: 28, justifyContent: 'center' }}
                  >
                    {showConfirmPassword ? (
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
                  {/* Match check icon — sits to the left of the eye when present */}
                  {form.confirmPassword && (
                    <div style={{ position: 'absolute', right: 46, top: '50%', transform: 'translateY(-50%)', color: form.confirmPassword === form.password ? '#10b981' : '#ef4444', pointerEvents: 'none' }}>
                      {form.confirmPassword === form.password ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
                <div
                  role="checkbox"
                  aria-checked={agreed}
                  tabIndex={0}
                  onClick={() => setAgreed(!agreed)}
                  onKeyDown={e => e.key === ' ' && setAgreed(!agreed)}
                  style={{ width: 20, height: 20, borderRadius: 5, cursor: 'pointer', border: `2px solid ${agreed ? '#635bff' : '#d1d5db'}`, background: agreed ? '#635bff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0, marginTop: 1 }}
                >
                  {agreed && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <label onClick={() => setAgreed(!agreed)} style={{ fontSize: '0.83rem', color: '#475569', cursor: 'pointer', lineHeight: 1.6, userSelect: 'none' }}>
                  I agree to Veri9&apos;s{' '}
                  <Link href="/terms" style={{ color: '#635bff', textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
                  {' & '}
                  <Link href="/privacy" style={{ color: '#635bff', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
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
                className="signup-btn"
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: '1rem', fontWeight: 700, color: '#fff', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(99,91,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Free Account
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: '#64748b' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
