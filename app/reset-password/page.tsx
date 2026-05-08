'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email'); return }
    setLoading(true)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Image src="/logo.svg" alt="Veri9" width={36} height={36} />
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              Veri<span style={{ color: '#818cf8' }}>9</span>
            </span>
          </Link>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '36px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="fas fa-check" style={{ fontSize: '1.6rem', color: '#10b981' }}></i>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Check your email</h2>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 24 }}>
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <Link href="/login" style={{ padding: '11px 24px', borderRadius: 9, fontSize: '0.9rem', fontWeight: 600, color: '#fff', background: '#4F46E5', textDecoration: 'none', display: 'inline-block' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Reset your password</h1>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: 24 }}>Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem' }}></i>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                      style={{ width: '100%', padding: '11px 14px 11px 38px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.92rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ padding: '13px', borderRadius: 10, fontSize: '0.97rem', fontWeight: 700, color: '#fff', background: loading ? '#818cf8' : '#4F46E5', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', marginTop: 20 }}>
                Remember your password?{' '}
                <Link href="/login" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}