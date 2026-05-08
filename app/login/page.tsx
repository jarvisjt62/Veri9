'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { REMEMBERED_EMAIL_KEY } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuth()
  const router = useRouter()

  // Load remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      toast.error(error)
    } else {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }
      toast.success('Welcome back!')
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex" style={{
        width: '45%', flexShrink: 0,
        background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4F46E5 100%)',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 48px', position: 'relative', overflow: 'hidden'
      }}>
        {/* bg decoration */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: 400, height: 400, borderRadius: '50%', background: 'rgba(129,140,248,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', pointerEvents: 'none' }} />

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <Image src="/logo.svg" alt="Veri9" width={40} height={40} />
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Veri<span style={{ color: '#a5b4fc' }}>9</span>
          </span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.03em' }}>
            Protect yourself from<br />
            <span style={{ color: '#a5b4fc' }}>counterfeit products</span>
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 40 }}>
            Join 250,000+ consumers using Veri9 to verify product authenticity before buying. Real-time verification across 9+ global databases.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'fa-shield-alt', text: 'Verify any product barcode instantly' },
              { icon: 'fa-database', text: '9+ free public databases queried in parallel' },
              { icon: 'fa-bell', text: 'Real-time recall and safety alerts' },
              { icon: 'fa-history', text: 'Full scan history & personal dashboard' },
            ].map(item => (
              <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fas ${item.icon}`} style={{ color: '#a5b4fc', fontSize: '0.9rem' }}></i>
                </div>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', position: 'relative', zIndex: 1 }}>
          © {new Date().getFullYear()} Veri9 · All rights reserved
        </p>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Image src="/logo.svg" alt="Veri9" width={36} height={36} />
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                Veri<span style={{ color: '#818cf8' }}>9</span>
              </span>
            </Link>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 28 }}>
              Sign in to your Veri9 account
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem' }}></i>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%', padding: '11px 14px 11px 38px',
                      border: '1.5px solid #e5e7eb', borderRadius: 10,
                      fontSize: '0.92rem', fontFamily: 'Inter, sans-serif',
                      background: '#f9fafb', outline: 'none', transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
                    Password
                  </label>
                  <Link href="/reset-password" style={{ fontSize: '0.78rem', color: '#4F46E5', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem' }}></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    style={{
                      width: '100%', padding: '11px 42px 11px 38px',
                      border: '1.5px solid #e5e7eb', borderRadius: 10,
                      fontSize: '0.92rem', fontFamily: 'Inter, sans-serif',
                      background: '#f9fafb', outline: 'none', transition: 'all 0.2s'
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '0.85rem' }}></i>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#4F46E5', cursor: 'pointer' }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: '#6b7280', cursor: 'pointer' }}>
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10,
                  fontSize: '0.97rem', fontWeight: 700, color: '#fff',
                  background: loading ? '#818cf8' : '#4F46E5',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', marginTop: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {loading ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Signing in...</>
                ) : (
                  <><i className="fas fa-sign-in-alt"></i> Sign In</>
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6b7280', marginTop: 24 }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}