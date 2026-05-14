'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ReCAPTCHA from 'react-google-recaptcha'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [focused, setFocused] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email'); return }
    if (!captchaToken) { toast.error('Please complete the reCAPTCHA check'); return }
    setLoading(true)

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

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      recaptchaRef.current?.reset(); setCaptchaToken(null)
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reset-card { animation: fadeIn 0.5s ease; }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        {/* Top bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #635bff, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '-0.02em' }}>V9</span>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Veri<span style={{ color: '#635bff' }}>9</span></span>
          </Link>
          <Link href="/login" style={{ fontSize: '0.85rem', color: '#635bff', fontWeight: 600, textDecoration: 'none' }}>Back to Sign In</Link>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="reset-card" style={{ width: '100%', maxWidth: 420 }}>
            {sent ? (
              <div style={{ background: '#fff', borderRadius: 18, padding: '40px 36px', border: '1px solid #e5e7eb', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>Check your inbox</h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                  We sent a password reset link to<br />
                  <strong style={{ color: '#0f172a' }}>{email}</strong>
                </p>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 24 }}>Didn&apos;t receive it? Check your spam folder or try again.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => { setSent(false); recaptchaRef.current?.reset(); setCaptchaToken(null) }} style={{ padding: '12px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, color: '#635bff', background: '#eef2ff', border: 'none', cursor: 'pointer' }}>
                    Try another email
                  </button>
                  <Link href="/login" style={{ padding: '12px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #635bff, #7c3aed)', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 18, padding: '40px 36px', border: '1px solid #e5e7eb', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.03em' }}>Reset your password</h1>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.65 }}>Enter your email address and we&apos;ll send you a secure reset link.</p>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Email address</label>
                    <div style={{ position: 'relative' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused ? '#635bff' : '#94a3b8'} strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', transition: 'stroke 0.15s' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="you@example.com"
                        required
                        style={{ width: '100%', padding: '13px 14px 13px 42px', border: `1.5px solid ${focused ? '#635bff' : '#e5e7eb'}`, borderRadius: 11, fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none', boxShadow: focused ? '0 0 0 3px rgba(99,91,255,0.15)' : 'none', transition: 'all 0.15s', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* reCAPTCHA */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                    />
                  </div>

                  <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 11, fontSize: '1rem', fontWeight: 800, color: '#fff', background: loading ? 'rgba(99,91,255,0.6)' : 'linear-gradient(135deg, #635bff, #7c3aed)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: loading ? 'none' : '0 4px 14px rgba(99,91,255,0.3)', transition: 'all 0.2s' }}>
                    {loading ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                        Sending reset link...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Remember your password?{' '}
                    <Link href="/login" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
