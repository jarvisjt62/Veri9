'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { usePlatformConfig } from '@/lib/platform-config'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subState, setSubState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [subMsg, setSubMsg] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const platformCfg = usePlatformConfig()
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubMsg('Please enter a valid email address.')
      setSubState('error')
      return
    }
    if (!captchaToken) {
      setSubMsg('Please complete the reCAPTCHA check.')
      setSubState('error')
      return
    }
    setSubState('pending')
    try {
      // Verify reCAPTCHA token server-side
      const captchaRes = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      if (!captchaRes.ok) {
        const d = await captchaRes.json()
        setSubMsg(d.error || 'reCAPTCHA verification failed. Please try again.')
        setSubState('error')
        recaptchaRef.current?.reset()
        setCaptchaToken(null)
        return
      }
      // TODO: wire to your email list provider (Mailchimp, Resend, etc.)
      // Send admin notification about new subscriber
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'newsletter',
            data: { 'Subscriber Email': email },
          }),
        })
      } catch {}
      // For now we just acknowledge the subscription
      setSubState('success')
      setSubMsg('You\'re subscribed! We\'ll send product safety tips and counterfeit alerts.')
      setEmail('')
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    } catch {
      setSubMsg('Something went wrong. Please try again.')
      setSubState('error')
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    }
  }

  return (
    <footer style={{
      background: '#0a0e1a',
      color: '#94a3b8',
      paddingTop: 'clamp(48px, 8vw, 80px)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Top section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'clamp(32px, 5vw, 48px)',
          paddingBottom: 48,
        }}>
          {/* Brand column */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', marginBottom: 16,
            }}>
              <div style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Image src="/logo.png" alt="Veri9 Shield Logo" width={36} height={36} style={{ objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                Veri<span style={{ color: '#635bff' }}>9</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#64748b', maxWidth: 220 }}>
              Real-time product verification across 9+ global databases. Protect yourself from counterfeits.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {[
                { icon: 'twitter', href: '#', label: 'Twitter', path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                { icon: 'linkedin', href: '#', label: 'LinkedIn', path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
                { icon: 'github', href: '#', label: 'GitHub', path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' },
              ].map(social => (
                <a key={social.icon} href={social.href} aria-label={social.label} style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={social.path}/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Product
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/scanner', label: 'Scanner' },
                { href: '/community', label: 'Community Reports' },
                { href: '/brands', label: 'For Brands' },
                ...(platformCfg.apiDevPage ? [{ href: '/api-docs', label: 'API / Developers' }] : []),
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{
                    fontSize: '0.875rem', color: '#64748b',
                    textDecoration: 'none', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#cbd5e1'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Company
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/about', label: 'About Us' },
                { href: '/blog', label: 'Blog' },
                ...(platformCfg.careersPage ? [{ href: '/careers', label: 'Careers' }] : []),
                { href: '/contact', label: 'Contact Us' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{
                    fontSize: '0.875rem', color: '#64748b',
                    textDecoration: 'none', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#cbd5e1'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Legal
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/cookies', label: 'Cookie Policy' },
                ...(platformCfg.securityPage ? [{ href: '/security', label: 'Security' }] : []),
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{
                    fontSize: '0.875rem', color: '#64748b',
                    textDecoration: 'none', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#cbd5e1'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Stay Updated
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>
              Get tips on product safety and counterfeit alerts.
            </p>

            {subState === 'success' ? (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                fontSize: '0.82rem', color: '#86efac', lineHeight: 1.5,
              }}>
                ✅ {subMsg}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setSubState('idle'); setSubMsg('') }}
                  placeholder="your@email.com"
                  required
                  style={{
                    padding: '9px 14px', borderRadius: 8, fontSize: '0.875rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${subState === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff', outline: 'none', width: '100%',
                  }}
                />

                {/* reCAPTCHA widget */}
                <div style={{ transform: 'scale(0.82)', transformOrigin: 'left top', height: 65, overflow: 'hidden' }}>
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                    theme="dark"
                    onChange={(token) => { setCaptchaToken(token); setSubState('idle'); setSubMsg('') }}
                    onExpired={() => { setCaptchaToken(null) }}
                  />
                </div>

                {/* Error message */}
                {subState === 'error' && subMsg && (
                  <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '2px 0 0', lineHeight: 1.4 }}>
                    ⚠️ {subMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={subState === 'pending'}
                  style={{
                    padding: '9px 14px', borderRadius: 8, fontSize: '0.875rem',
                    fontWeight: 600, color: '#fff',
                    background: subState === 'pending'
                      ? 'rgba(99,91,255,0.5)'
                      : 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                    border: 'none', cursor: subState === 'pending' ? 'not-allowed' : 'pointer',
                    width: '100%', transition: 'opacity 0.2s',
                  }}
                >
                  {subState === 'pending' ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 0',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: '0.82rem', color: '#475569' }}>
            © {currentYear} Veri9. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem', color: '#475569',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Made with ♥ for consumers
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
