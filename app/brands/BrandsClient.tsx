'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

function BrandsPageInner() {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'
  const [form, setForm] = useState({
    companyName: '', website: '', email: '',
    phone: '', country: '', description: '', productCategory: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName || !form.email) {
      toast.error('Company name and email are required')
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    // Send admin notification
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'brand_register',
          data: {
            'Company Name': form.companyName,
            'Contact Email': form.email,
            'Website': form.website || '—',
            'Phone': form.phone || '—',
            'Country': form.country || '—',
            'Product Category': form.productCategory || '—',
            'Description': form.description || '—',
          },
        }),
      })
    } catch {}
    setSubmitting(false)
    setSubmitted(true)
    toast.success('Registration submitted! Our team will contact you within 24 hours.')
  }

  const inputStyle = (field: string) => ({
    width: '100%', padding: '12px 16px',
    borderRadius: 10, fontSize: '0.9rem',
    background: '#f8fafc',
    border: `1.5px solid ${focusedField === field ? '#635bff' : '#e2e8f0'}`,
    color: '#0f172a', outline: 'none',
    transition: 'all 0.15s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(99,91,255,0.1)' : 'none',
    boxSizing: 'border-box' as const,
  })

  return (
    <>
      {!isEmbed && <Navbar />}
      <main style={{ background: '#fafafa', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
          padding: 'clamp(60px, 10vw, 96px) 24px clamp(50px, 8vw, 80px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(99,91,255,0.2) 0%, transparent 70%)',
          }} />
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,91,255,0.2)', border: '1px solid rgba(99,91,255,0.4)',
              borderRadius: 9999, padding: '5px 14px', marginBottom: 24,
              fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              For Brand Owners & Manufacturers
            </div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1,
            }}>
              Protect Your Brand from{' '}
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Counterfeits</span>
            </h1>
            <p style={{
              fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.75, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px',
            }}>
              Register your brand on Veri9 to add an extra layer of authentication. 
              When customers scan your products, they'll see your verified brand badge — completely free.
            </p>
            <a href="#register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 32px', borderRadius: 10, fontSize: '0.97rem',
              fontWeight: 700, color: '#4f46e5', background: '#fff',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Register Your Brand — It's Free
            </a>
          </div>
        </section>

        {/* Benefits */}
        <section style={{ padding: 'clamp(60px, 8vw, 90px) 24px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 56px)' }}>
              <h2 style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800,
                color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12,
              }}>
                Why register on Veri9?
              </h2>
              <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
                Give consumers confidence and protect your brand's reputation
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
              gap: 24,
            }}>
              {[
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                  color: '#635bff', bg: '#f0f0ff',
                  title: 'Verified Brand Badge',
                  desc: 'Your products show a blue "Verified Brand" checkmark when scanned by consumers.',
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
                  color: '#0ea5e9', bg: '#f0f9ff',
                  title: 'Brand Analytics',
                  desc: 'See how many times your products are being scanned and where in the world.',
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
                  color: '#f59e0b', bg: '#fffbeb',
                  title: 'Counterfeit Alerts',
                  desc: 'Get notified instantly when community members report suspicious versions of your products.',
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                  color: '#10b981', bg: '#f0fdf4',
                  title: 'Product Registration',
                  desc: 'Register all your product barcodes so consumers can always verify authentic products.',
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  color: '#8b5cf6', bg: '#f5f3ff',
                  title: 'Consumer Trust',
                  desc: 'Build deeper trust with consumers who know they can verify your products are genuine.',
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
                  color: '#ec4899', bg: '#fdf2f8',
                  title: 'API Integration',
                  desc: 'Integrate Veri9 verification directly into your own apps and e-commerce platforms.',
                },
              ].map(b => (
                <div key={b.title} style={{
                  padding: '24px', borderRadius: 16,
                  background: '#fff', border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: b.bg, color: b.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    {b.icon}
                  </div>
                  <h3 style={{ fontSize: '0.97rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.65 }}>
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section style={{
          background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
          padding: '40px 24px',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 24, textAlign: 'center',
            }}>
              {[
                { value: '250K+', label: 'Active Consumers' },
                { value: '2M+', label: 'Scans Per Month' },
                { value: '150+', label: 'Countries Covered' },
                { value: '100%', label: 'Free for Brands' },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: 6 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section id="register" style={{ padding: 'clamp(60px, 8vw, 90px) 24px', background: '#fafafa' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f0f0ff', border: '1px solid #e0e0ff',
                borderRadius: 9999, padding: '4px 14px', marginBottom: 14,
                fontSize: '0.75rem', fontWeight: 600, color: '#635bff',
              }}>
                Brand Registration — Free
              </div>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800,
                color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 10,
              }}>
                Register your brand
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7 }}>
                Fill out the form below and our team will reach out within 24 hours to verify and set up your brand account.
              </p>
            </div>

            {submitted ? (
              <div style={{
                background: '#fff', borderRadius: 20,
                border: '1px solid #bbf7d0',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                padding: '48px 32px', textAlign: 'center',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: '#f0fdf4', border: '2px solid #bbf7d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                  Application Received!
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
                  Thank you for registering <strong>{form.companyName}</strong> with Veri9. 
                  Our team will review your application and contact you at <strong>{form.email}</strong> within 24 hours.
                </p>
                <button onClick={() => { setSubmitted(false); setForm({ companyName: '', website: '', email: '', phone: '', country: '', description: '', productCategory: '' }) }} style={{
                  padding: '12px 28px', borderRadius: 10, fontSize: '0.9rem',
                  fontWeight: 600, color: '#635bff',
                  background: '#f0f0ff', border: '1px solid #e0e0ff',
                  cursor: 'pointer',
                }}>
                  Register Another Brand
                </button>
              </div>
            ) : (
              <div style={{
                background: '#fff', borderRadius: 20,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                padding: '36px',
              }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        Company Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={e => setForm({ ...form, companyName: e.target.value })}
                        placeholder="Acme Corporation"
                        style={inputStyle('companyName')}
                        onFocus={() => setFocusedField('companyName')}
                        onBlur={() => setFocusedField(null)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        Website
                      </label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={e => setForm({ ...form, website: e.target.value })}
                        placeholder="https://yourcompany.com"
                        style={inputStyle('website')}
                        onFocus={() => setFocusedField('website')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        Business Email <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="contact@company.com"
                        style={inputStyle('email')}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        style={inputStyle('phone')}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        Country
                      </label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={e => setForm({ ...form, country: e.target.value })}
                        placeholder="United States"
                        style={inputStyle('country')}
                        onFocus={() => setFocusedField('country')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        Product Category
                      </label>
                      <select
                        value={form.productCategory}
                        onChange={e => setForm({ ...form, productCategory: e.target.value })}
                        style={{ ...inputStyle('category'), cursor: 'pointer' }}
                        onFocus={() => setFocusedField('category')}
                        onBlur={() => setFocusedField(null)}
                      >
                        <option value="">Select category</option>
                        <option>Food & Beverages</option>
                        <option>Pharmaceuticals</option>
                        <option>Cosmetics & Beauty</option>
                        <option>Electronics</option>
                        <option>Fashion & Apparel</option>
                        <option>Luxury Goods</option>
                        <option>Books & Media</option>
                        <option>Health & Wellness</option>
                        <option>Sports & Outdoors</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                      Tell us about your brand
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe your brand, products, and why you want to join Veri9..."
                      rows={4}
                      style={{
                        ...inputStyle('description'),
                        resize: 'vertical',
                        minHeight: 100,
                        fontFamily: 'inherit',
                        lineHeight: 1.6,
                      }}
                      onFocus={() => setFocusedField('description')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>

                  {/* reCAPTCHA notice */}
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 20,
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Protected by reCAPTCHA · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style={{ color: '#635bff', textDecoration: 'none' }}>Privacy</a> & <a href="https://policies.google.com/terms" target="_blank" rel="noopener" style={{ color: '#635bff', textDecoration: 'none' }}>Terms</a>
                    </span>
                  </div>

                  <button type="submit" disabled={submitting} style={{
                    width: '100%', padding: '13px',
                    borderRadius: 10, fontSize: '0.97rem',
                    fontWeight: 700, color: '#fff',
                    background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                    border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: submitting ? 'none' : '0 4px 14px rgba(99,91,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}>
                    {submitting ? (
                      <>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Submit Brand Registration
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
      {!isEmbed && <Footer />}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

export default function BrandsPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}>
      <BrandsPageInner />
    </Suspense>
  )
}
