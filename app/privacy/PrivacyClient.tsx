'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const sections = [
  { id: 'overview', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Your Information' },
  { id: 'sharing', title: 'Information Sharing' },
  { id: 'security', title: 'Data Security' },
  { id: 'cookies', title: 'Cookies & Tracking' },
  { id: 'rights', title: 'Your Rights' },
  { id: 'updates', title: 'Policy Updates' },
  { id: 'contact', title: 'Contact Us' },
]

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
      <PrivacyPageInner />
    </Suspense>
  )
}

function PrivacyPageInner() {
  const [activeSection, setActiveSection] = useState('overview')
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'

  return (
    <>
      {!isEmbed && <Navbar />}
      <style>{`
        .toc-link.active { color: #635bff; font-weight: 700; border-left: 3px solid #635bff; background: #f0f0ff; }
        .toc-link { transition: all 0.15s; }
        @media (max-width: 767px) {
          .policy-wrapper { grid-template-columns: 1fr !important; gap: 0 !important; }
          .policy-toc-aside { position: static !important; max-height: none !important; overflow: visible !important; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
          .policy-toc-nav-list { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }
          .toc-link { padding: 5px 10px !important; border-left: none !important; border-radius: 6px !important; border: 1px solid #e5e7eb !important; font-size: 0.78rem !important; }
          .toc-link.active { border-left: none !important; border: 1px solid #635bff !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 60%, #635bff 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Legal
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
            Last updated: January 2025 • Effective Date: January 15, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,5vw,48px) 24px 80px' }}>
        <div className="policy-wrapper" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48, alignItems: 'start' }}>
          {/* TOC */}
          <aside className="policy-toc-aside" style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <nav>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>On this page</p>
              <div className="policy-toc-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sections.map(section => (
                  <button key={section.id} onClick={() => {
                    setActiveSection(section.id)
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                    className={`toc-link ${activeSection === section.id ? 'active' : ''}`}
                    style={{ textAlign: 'left', padding: '8px 14px', borderRadius: 6, fontSize: '0.84rem', color: '#64748b', border: '1px solid transparent', cursor: 'pointer', borderLeft: activeSection === section.id ? '3px solid #635bff' : '3px solid transparent', background: activeSection === section.id ? '#f0f0ff' : 'transparent' }}>
                    {section.title}
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '28px 32px', border: '1px solid #e5e7eb', marginBottom: 36 }}>
              <p style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.85, margin: 0 }}>
                At Veri9, we take your privacy seriously. This policy explains what information we collect, how we use it, and your rights regarding your personal data. By using Veri9, you agree to this privacy policy.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {/* Overview */}
              <section id="overview">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Information We Collect</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  We collect information to provide, improve, and protect our services. This includes:
                </p>
                <div style={{ display: 'grid', gap: 16 }}>
                  {[
                    { title: 'Account Information', desc: 'Name, email address, and optional profile information when you create an account.' },
                    { title: 'Scan History', desc: 'Barcodes you scan, scan timestamps, and verification results (stored securely).' },
                    { title: 'Device Information', desc: 'IP address, browser type, device type, and operating system for security and analytics.' },
                    { title: 'Usage Data', desc: 'Pages visited, features used, and time spent to improve our service.' },
                    { title: 'Communication Data', desc: 'Support tickets, feedback, and correspondence with our team.' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                      <h3 style={{ fontSize: '0.97rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{item.title}</h3>
                      <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* How We Use */}
              <section id="how-we-use">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>How We Use Your Information</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85 }}>
                  We use your information to:
                </p>
                <ul style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.8, paddingLeft: 24, marginTop: 12, marginBottom: 0 }}>
                  <li style={{ marginBottom: 8 }}>Provide and maintain the Veri9 scanning service</li>
                  <li style={{ marginBottom: 8 }}>Improve product verification accuracy </li>
                  <li style={{ marginBottom: 8 }}>Send you service updates, safety alerts, and recall notices</li>
                  <li style={{ marginBottom: 8 }}>Respond to support requests and customer inquiries</li>
                  <li style={{ marginBottom: 8 }}>Analyze usage patterns to enhance user experience</li>
                  <li style={{ marginBottom: 8 }}>Detect and prevent fraud, abuse, and security threats</li>
                  <li>Comply with legal obligations and protect our rights</li>
                </ul>
              </section>

              {/* Sharing */}
              <section id="sharing">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Information Sharing</h2>
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                  <p style={{ fontSize: '0.88rem', color: '#166534', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>
                    <i className="fas fa-shield-alt" style={{ marginRight: 8 }}></i>
                    We never sell your personal information to third parties.
                  </p>
                </div>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  We only share your information in the following limited circumstances:
                </p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { title: 'Service Providers', desc: 'With trusted partners who perform services on our behalf (data storage, analytics, security), under strict confidentiality agreements.' },
                    { title: 'Legal Requirements', desc: 'When required by law, court order, or to protect our rights, safety, or property.' },
                    { title: 'Business Transfers', desc: 'In connection with a merger, acquisition, or sale of assets (with advance notice).' },
                    { title: 'With Your Consent', desc: 'When you explicitly authorize us to share your information.' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{item.title}</h3>
                      <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Security */}
              <section id="security">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Data Security</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  We implement industry-standard security measures to protect your information:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    'End-to-end encryption',
                    'Secure HTTPS connections',
                    'Regular security audits',
                    'Limited access controls',
                    'Automated threat monitoring',
                    'ISO 27001 compliant infrastructure',
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <i className="fas fa-check-circle" style={{ color: '#16a34a', fontSize: '0.8rem' }}></i>
                      <span style={{ fontSize: '0.84rem', color: '#166534', fontWeight: 600 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Cookies & Tracking</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  We use cookies and similar technologies to:
                </p>
                <ul style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.8, paddingLeft: 24, marginTop: 12, marginBottom: 0 }}>
                  <li style={{ marginBottom: 8 }}>Remember your preferences and login status</li>
                  <li style={{ marginBottom: 8 }}>Analyze site traffic and usage patterns</li>
                  <li style={{ marginBottom: 8 }}>Improve performance and user experience</li>
                  <li>Provide personalized content where available</li>
                </ul>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.7, marginTop: 16, marginBottom: 0 }}>
                  You can manage cookie preferences through your browser settings. See our <a href="/cookies" style={{ color: '#635bff', fontWeight: 600 }}>Cookie Policy</a> for details.
                </p>
              </section>

              {/* Rights */}
              <section id="rights">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Your Rights</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  You have the right to:
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    'Access, view, and download your personal data',
                    'Request correction of inaccurate or incomplete data',
                    'Request deletion of your personal data (where legally permissible)',
                    'Opt-out of marketing communications',
                    'Export your data in a machine-readable format',
                    'Withdraw consent at any time',
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#635bff', fontSize: '0.7rem', fontWeight: 800, marginTop: 2 }}>{idx + 1}</div>
                      <span style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Updates */}
              <section id="updates">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Policy Updates</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 0 }}>
                  We may update this privacy policy occasionally. We will notify you of any material changes by email or by posting a prominent notice on our website. Your continued use of Veri9 after such changes constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Contact */}
              <section id="contact">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Contact Us</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  If you have questions or concerns about this privacy policy or our data practices, please contact us:
                </p>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0 0 8px 0' }}><strong>Email:</strong> contact@veri9.com</p>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>We will respond within 30 days of receiving your inquiry.</p>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {!isEmbed && <Footer />}
    </>
  )
}