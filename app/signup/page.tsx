'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const { signUp, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak', color: '#ef4444' },
      { score: 2, label: 'Fair', color: '#f59e0b' },
      { score: 3, label: 'Good', color: '#3b82f6' },
      { score: 4, label: 'Strong', color: '#10b981' },
    ]
    return levels[score] || levels[4]
  }

  const pwStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !email || !password) { toast.error('Please fill in all required fields'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (!agreed) { toast.error('Please accept the Terms of Service'); return }

    setLoading(true)
    const { error } = await signUp(email, password, `${firstName} ${lastName}`.trim())
    setLoading(false)

    if (error) {
      toast.error(error)
    } else {
      setOtpSent(true)
      toast.success('Verification code sent to your email!')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 6) { toast.error('Please enter the verification code'); return }
    setVerifying(true)
    try {
      const { getSupabaseClient } = await import('@/lib/supabase')
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Email verified! Welcome to Veri9!')
        router.push('/dashboard')
      }
    } catch {
      toast.error('Verification failed. Please try again.')
    }
    setVerifying(false)
  }

  if (otpSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16, padding: '40px 36px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fas fa-envelope-open" style={{ fontSize: '1.6rem', color: '#4F46E5' }}></i>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Check your email</h2>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              We sent a verification code to<br />
              <strong style={{ color: '#0f172a' }}>{email}</strong>
            </p>
          </div>
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Enter 6-8 digit code"
                maxLength={8}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                  fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', textAlign: 'center',
                  letterSpacing: '0.2em', background: '#f9fafb', outline: 'none'
                }}
              />
            </div>
            <button type="submit" disabled={verifying} style={{
              width: '100%', padding: '13px', borderRadius: 10, fontSize: '0.97rem',
              fontWeight: 700, color: '#fff', background: verifying ? '#818cf8' : '#4F46E5',
              border: 'none', cursor: verifying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              {verifying ? <><i className="fas fa-circle-notch fa-spin"></i> Verifying...</> : <><i className="fas fa-check-circle"></i> Verify Email</>}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', marginTop: 20 }}>
            Didn't receive the code?{' '}
            <button onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              Go back
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex" style={{
        width: '42%', flexShrink: 0,
        background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4F46E5 100%)',
        flexDirection: 'column', justifyContent: 'center', padding: '48px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(129,140,248,0.12)', pointerEvents: 'none' }} />

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 60, position: 'relative', zIndex: 1 }}>
          <Image src="/logo.svg" alt="Veri9" width={40} height={40} />
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Veri<span style={{ color: '#a5b4fc' }}>9</span>
          </span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.6rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.03em' }}>
            Join the fight against<br />
            <span style={{ color: '#a5b4fc' }}>counterfeit products</span>
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 40 }}>
            Create your free Veri9 account and start verifying products in seconds. Protect yourself, your family, and your business.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: 'fa-check-circle', text: 'Free forever — no credit card needed' },
              { icon: 'fa-check-circle', text: 'Unlimited barcode scans' },
              { icon: 'fa-check-circle', text: 'Full scan history dashboard' },
              { icon: 'fa-check-circle', text: 'Recall and safety alerts' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className={`fas ${item.icon}`} style={{ color: '#a5b4fc', fontSize: '0.9rem' }}></i>
                <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.78)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Image src="/logo.svg" alt="Veri9" width={32} height={32} />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Veri<span style={{ color: '#818cf8' }}>9</span>
              </span>
            </Link>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Create your account
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: 24 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>First Name *</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Email address *</label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-envelope" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.82rem' }}></i>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.82rem' }}></i>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required
                    style={{ width: '100%', padding: '10px 40px 10px 36px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '0.82rem' }}></i>
                  </button>
                </div>
                {/* Password strength */}
                {password && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwStrength.score ? pwStrength.color : '#e5e7eb', transition: 'all 0.3s' }} />
                    ))}
                    <span style={{ fontSize: '0.73rem', color: pwStrength.color, fontWeight: 600, marginLeft: 6, whiteSpace: 'nowrap' }}>{pwStrength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.82rem' }}></i>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1.5px solid ${confirmPassword && confirmPassword !== password ? '#ef4444' : '#e5e7eb'}`, borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              {/* Terms */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input type="checkbox" id="agreeTerms" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: 2, width: 15, height: 15, accentColor: '#4F46E5', cursor: 'pointer', flexShrink: 0 }} />
                <label htmlFor="agreeTerms" style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5, cursor: 'pointer' }}>
                  I agree to Veri9's{' '}
                  <Link href="/terms" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
                </label>
              </div>

              <button type="submit" disabled={loading || !agreed}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10, fontSize: '0.97rem',
                  fontWeight: 700, color: '#fff', background: loading || !agreed ? '#818cf8' : '#4F46E5',
                  border: 'none', cursor: loading || !agreed ? 'not-allowed' : 'pointer',
                  marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Creating account...</> : <><i className="fas fa-user-plus"></i> Create Account</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}