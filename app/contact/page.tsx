'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    toast.success('Message sent! We\'ll reply within 24 hours.')
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4F46E5 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>Contact Us</h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75 }}>
            Have a question or need help? We're here for you.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px,6vw,80px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
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
                    <i className={`fas ${item.icon}`} style={{ color: '#4F46E5', fontSize: '0.9rem' }}></i>
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
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(20px,4vw,32px)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <button type="submit" disabled={submitting} style={{ padding: '12px', borderRadius: 9, fontSize: '0.95rem', fontWeight: 700, color: '#fff', background: submitting ? '#818cf8' : '#4F46E5', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {submitting ? <><i className="fas fa-circle-notch fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Message</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}