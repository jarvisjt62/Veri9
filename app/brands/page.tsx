'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

export default function BrandsPage() {
  const [form, setForm] = useState({ companyName: '', website: '', email: '', phone: '', country: '', description: '', plan: 'basic' })
  const [submitting, setSubmitting] = useState(false)

  const plans = [
    { id: 'basic', name: 'Basic', price: 'Free', features: ['5 products registered', 'Basic verification badge', 'Community reports access', 'Email support'] },
    { id: 'professional', name: 'Professional', price: '$49/mo', features: ['Unlimited products', 'Premium verification badge', 'Analytics dashboard', 'Priority support', 'API access'] },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'White-label options'] },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName || !form.email) { toast.error('Please fill in required fields'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false)
    toast.success('Registration submitted! Our team will contact you within 24 hours.')
    setForm({ companyName: '', website: '', email: '', phone: '', country: '', description: '', plan: 'basic' })
  }

  return (
    <>
      <Navbar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #312e81 100%)', padding: 'clamp(60px, 10vw, 100px) 24px clamp(50px, 8vw, 80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)', borderRadius: 9999, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 24 }}>
            <i className="fas fa-building"></i> For Brand Owners
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', marginBottom: 20, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Protect Your Brand from<br />
            <span style={{ color: '#818cf8' }}>Counterfeits</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 36 }}>
            Register your brand on Veri9 to add an extra layer of authentication. When customers scan your products, they'll see your verified brand badge.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#register" style={{ padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem', fontWeight: 700, color: '#4F46E5', background: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-shield-alt"></i> Register Your Brand
            </a>
            <a href="#plans" style={{ padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}>
              View Plans
            </a>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 12 }}>
              Why Register on Veri9?
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b' }}>Give your customers confidence and fight counterfeits at scale.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: 'fa-shield-alt', color: '#4F46E5', bg: '#eef2ff', title: 'Verified Brand Badge', desc: 'Display a trusted verification badge on your product pages. Customers see your brand is registered when they scan.' },
              { icon: 'fa-chart-line', color: '#10b981', bg: '#ecfdf5', title: 'Analytics Dashboard', desc: 'See how often your products are scanned, where your customers are located, and detect potential counterfeit hotspots.' },
              { icon: 'fa-bell', color: '#f59e0b', bg: '#fffbeb', title: 'Counterfeit Alerts', desc: 'Get notified immediately when community members report suspicious products using your brand name.' },
              { icon: 'fa-code', color: '#8b5cf6', bg: '#f5f3ff', title: 'API Integration', desc: 'Integrate Veri9 directly into your e-commerce platform or app for seamless product verification.' },
            ].map(b => (
              <div key={b.title} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 14, padding: '24px 22px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <i className={`fas ${b.icon}`} style={{ color: b.color, fontSize: '1.15rem' }}></i>
                </div>
                <h3 style={{ fontSize: '0.97rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" style={{ padding: 'clamp(60px, 8vw, 100px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 12 }}>Choose Your Plan</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ background: plan.id === 'professional' ? '#4F46E5' : '#fff', border: `2px solid ${plan.id === 'professional' ? '#4F46E5' : '#e5e7eb'}`, borderRadius: 16, padding: '28px 24px', position: 'relative' }}>
                {plan.id === 'professional' && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 14px', borderRadius: 9999 }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: plan.id === 'professional' ? '#fff' : '#0f172a', marginBottom: 6 }}>{plan.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: plan.id === 'professional' ? '#fff' : '#0f172a', marginBottom: 20, letterSpacing: '-0.03em' }}>{plan.price}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: plan.id === 'professional' ? 'rgba(255,255,255,0.85)' : '#4b5563' }}>
                      <i className="fas fa-check" style={{ color: plan.id === 'professional' ? '#a5b4fc' : '#10b981', fontSize: '0.75rem', flexShrink: 0 }}></i>
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => { setForm({...form, plan: plan.id}); document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ width: '100%', padding: '11px', borderRadius: 9, fontSize: '0.9rem', fontWeight: 700, color: plan.id === 'professional' ? '#4F46E5' : '#fff', background: plan.id === 'professional' ? '#fff' : '#4F46E5', border: 'none', cursor: 'pointer' }}>
                  {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" style={{ padding: 'clamp(60px, 8vw, 100px) 24px', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 12 }}>
              Register Your Brand
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b' }}>Fill in the form below and our team will review your registration within 24 hours.</p>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(24px, 4vw, 40px)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Company Name *</label>
                  <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="Acme Corp" required
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Business Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contact@company.com" required
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Website</label>
                  <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://yourcompany.com"
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 (555) 000-0000"
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Plan</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {plans.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 9, border: `2px solid ${form.plan === p.id ? '#4F46E5' : '#e5e7eb'}`, background: form.plan === p.id ? '#eef2ff' : '#f9fafb', cursor: 'pointer', fontSize: '0.87rem', fontWeight: 600, color: form.plan === p.id ? '#4F46E5' : '#6b7280' }}>
                      <input type="radio" name="plan" value={p.id} checked={form.plan === p.id} onChange={e => setForm({...form, plan: e.target.value})} style={{ display: 'none' }} />
                      {p.name} ({p.price})
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Brand Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Briefly describe your company, products, and why you want to register..." rows={4}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none', resize: 'vertical' }} />
              </div>
              <button type="submit" disabled={submitting} style={{ padding: '13px 32px', borderRadius: 10, fontSize: '0.97rem', fontWeight: 700, color: '#fff', background: submitting ? '#818cf8' : '#4F46E5', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
                {submitting ? <><i className="fas fa-circle-notch fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Registration</>}
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}