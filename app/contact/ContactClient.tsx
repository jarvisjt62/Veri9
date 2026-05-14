'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReCAPTCHA from 'react-google-recaptcha'

export default function ContactPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
      <ContactPageInner />
    </Suspense>
  )
}

function ContactPageInner() {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  // ── reCAPTCHA responsive scaling ────────────────────────────────────────────
  // The reCAPTCHA widget is hard-coded to 304 px wide by Google.  We measure
  // the available width inside the form card and compute a scale factor so the
  // widget always fits without clipping.  Using inline styles (not styled-jsx)
  // avoids hydration scope mismatches that silently prevent CSS from applying.
  const formRef = useRef<HTMLDivElement>(null)
  const [captchaScale, setCaptchaScale] = useState(1)
  const RECAPTCHA_WIDTH = 304 // px — fixed by Google

  useEffect(() => {
    const updateScale = () => {
      if (!formRef.current) return
      // clientWidth = inner width (excludes border, includes padding).
      // Subtract the card's left+right padding to get the content area the
      // reCAPTCHA actually sits inside.
      const cs = getComputedStyle(formRef.current)
      const padL = parseFloat(cs.paddingLeft) || 0
      const padR = parseFloat(cs.paddingRight) || 0
      const available = formRef.current.clientWidth - padL - padR
      const scale = available < RECAPTCHA_WIDTH ? Math.max(0.7, available / RECAPTCHA_WIDTH) : 1
      setCaptchaScale(scale)
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    setStatusMsg(null)

    // Client-side validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in your name, email, and message.' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    if (!captchaToken) {
      setStatusMsg({ type: 'error', text: 'Please complete the reCAPTCHA check before sending.' })
      return
    }

    setSubmitting(true)

    // Send message via notify API
    try {
      const notifyRes = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          data: {
            Name: form.name,
            Email: form.email,
            Subject: form.subject || '(no subject)',
            Message: form.message,
          },
        }),
      })
      if (!notifyRes.ok) {
        setStatusMsg({
          type: 'error',
          text: `Could not send message (error ${notifyRes.status}). Please email support@veri9.com directly.`,
        })
        setSubmitting(false)
        return
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Network error. Please check your connection or email support@veri9.com directly.',
      })
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setStatusMsg({ type: 'success', text: "Message sent! We'll reply within 24 hours." })
    setForm({ name: '', email: '', subject: '', message: '' })
    recaptchaRef.current?.reset()
    setCaptchaToken(null)
  }

  return (
    <>
      {!isEmbed && <Navbar />}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4F46E5 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>Contact Us</h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75 }}>
            Have a question or need help? We&apos;re here for you.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px,6vw,80px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 40 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Get in Touch</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: 'fa-envelope', label: 'Email', value: 'support@veri9.com' },
                { icon: 'fa-clock', label: 'Response Time', value: 'Within 24 hours' },
                { icon: 'fa-globe', label: 'Website', value: 'veri9.com' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${item.icon}`} style={{ color: '#635bff', fontSize: '0.9rem' }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div ref={formRef} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(20px,4vw,32px)' }}>
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                  { label: 'Subject', key: 'subject', type: 'text', placeholder: 'How can we help?' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{field.label}</label>
                    <input type={field.type} value={form[field.key as keyof typeof form]} onChange={e => setForm({...form, [field.key]: e.target.value})} placeholder={field.placeholder} required={field.key !== 'subject'}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</label>
                  <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Tell us how we can help..." rows={4} required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none', resize: 'vertical' }} />
                </div>

                {/* reCAPTCHA — scales down automatically to fit the form card width */}
                <div className="recaptcha-container" style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  overflow: 'visible',
                }}>
                  <div style={{
                    transform: `scale(${captchaScale})`,
                    transformOrigin: 'left top',
                    // Collapse the extra vertical space that scale() creates so
                    // there is no gap between the widget and the button below.
                    height: captchaScale < 1 ? `${Math.round(78 * captchaScale)}px` : undefined,
                  }}>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(ev) => {
                    ev.preventDefault()
                    ev.stopPropagation()
                    handleSubmit()
                  }}
                  disabled={submitting}
                  style={{
                    padding: '12px',
                    borderRadius: 9,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#fff',
                    background: submitting ? '#818cf8' : '#635bff',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    position: 'relative',
                    zIndex: 2,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'rgba(99,91,255,0.3)',
                    userSelect: 'none',
                  }}
                >
                  {submitting ? <><i className="fas fa-circle-notch fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Message</>}
                </button>

                {statusMsg && (
                  <div role="alert" style={{
                    padding: '10px 14px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    background: statusMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  }}>
                    {statusMsg.type === 'success' ? '✅ ' : '⚠️ '}{statusMsg.text}
                  </div>
                )}

                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                  🔒 Protected by Google reCAPTCHA ·{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#635bff' }}>Privacy</a>
                  {' & '}
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#635bff' }}>Terms</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
      {!isEmbed && <Footer />}
    </>
  )
}
