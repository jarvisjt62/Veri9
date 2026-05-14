'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'services', title: 'Our Services' },
  { id: 'user-accounts', title: 'User Accounts' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'intellectual', title: 'Intellectual Property' },
  { id: 'disclaimer', title: 'Disclaimers & Warranties' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'termination', title: 'Termination' },
  { id: 'governing', title: 'Governing Law' },
  { id: 'changes', title: 'Changes to Terms' },
]

export default function TermsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
      <TermsPageInner />
    </Suspense>
  )
}

function TermsPageInner() {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'
  return (
    <>
      {!isEmbed && <Navbar />}
      <style>{`
        .toc-link.active { color: #635bff; font-weight: 700; border-left: 3px solid #635bff; background: #f0f0ff; }
        .toc-link { transition: all 0.15s; }
        @media (max-width: 767px) {
          .terms-wrapper { grid-template-columns: 1fr !important; gap: 0 !important; }
          .terms-toc-aside { position: static !important; max-height: none !important; overflow: visible !important; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
          .terms-toc-nav-list { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }
          .toc-link { padding: 5px 10px !important; border-left: none !important; border-radius: 6px !important; border: 1px solid #e5e7eb !important; font-size: 0.78rem !important; }
          .toc-link.active { border-left: none !important; border: 1px solid #635bff !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 60%, #635bff 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Legal
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>Terms of Service</h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
            Last updated: January 2025 • Effective Date: January 15, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,5vw,48px) 24px 80px' }}>
        <div className="terms-wrapper" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48, alignItems: 'start' }}>
          {/* TOC */}
          <aside className="terms-toc-aside" style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <nav>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>On this page</p>
              <div className="terms-toc-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sections.map(section => (
                  <a key={section.id} href={`#${section.id}`}
                    className="toc-link"
                    style={{ textAlign: 'left', display: 'block', padding: '8px 14px', borderRadius: 6, fontSize: '0.82rem', color: '#64748b', border: '1px solid transparent', textDecoration: 'none', borderLeft: '3px solid #e5e7eb', transition: 'all 0.15s' }}>
                    {section.title}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main>
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '28px 32px', border: '1px solid #e5e7eb', marginBottom: 36 }}>
              <p style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.85, margin: 0 }}>
                These Terms of Service ("Terms") govern your use of the Veri9 platform, website, and mobile applications (collectively, the "Service"). By accessing or using Veri9, you agree to be bound by these Terms.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {/* Acceptance */}
              <section id="acceptance">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>1. Acceptance of Terms</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85 }}>
                  By accessing or using Veri9, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time, and continued use after changes constitutes acceptance of the updated Terms.
                </p>
              </section>

              {/* Services */}
              <section id="services">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>2. Our Services</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  Veri9 provides a product verification service that cross-references product barcodes against global intelligence sources to help consumers verify product authenticity. Our services include:
                </p>
                <ul style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.8, paddingLeft: 24, marginTop: 12, marginBottom: 0 }}>
                  <li style={{ marginBottom: 8 }}>Barcode scanning and product verification</li>
                  <li style={{ marginBottom: 8 }}>Access to product recall and safety alerts</li>
                  <li style={{ marginBottom: 8 }}>Scan history and account management</li>
                  <li>Community reporting of suspicious products</li>
                </ul>
              </section>

              {/* User Accounts */}
              <section id="user-accounts">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>3. User Accounts</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  To access certain features of the Service, you may need to create an account. You agree to:
                </p>
                <ul style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.8, paddingLeft: 24, marginTop: 12, marginBottom: 0 }}>
                  <li style={{ marginBottom: 8 }}>Provide accurate, current, and complete registration information</li>
                  <li style={{ marginBottom: 8 }}>Maintain the security of your password and account</li>
                  <li style={{ marginBottom: 8 }}>Notify us immediately of any unauthorized use</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              {/* Acceptable Use */}
              <section id="acceptable-use">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>4. Acceptable Use</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  You agree not to use the Service for any unlawful purpose or in any way that could damage the Service. Specifically, you must not:
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { text: 'Use automated tools to scan or access the Service excessively', severity: 'high' },
                    { text: 'Attempt to reverse engineer or tamper with the Service', severity: 'high' },
                    { text: 'Use the Service to distribute malware or harmful content', severity: 'critical' },
                    { text: 'Submit false or misleading product reports', severity: 'medium' },
                    { text: 'Impersonate others or provide false information', severity: 'medium' },
                    { text: 'Violate any applicable laws or regulations', severity: 'critical' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', background: item.severity === 'critical' ? '#fef2f2' : item.severity === 'high' ? '#fffbeb' : '#f8fafc', borderRadius: 8, borderLeft: `4px solid ${item.severity === 'critical' ? '#ef4444' : item.severity === 'high' ? '#f59e0b' : '#94a3b8'}` }}>
                      <span style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 600 }}>❌ {item.text}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Intellectual Property */}
              <section id="intellectual">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>5. Intellectual Property</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  The Service and its original content, features, and functionality are owned by Veri9 and are protected by international copyright, trademark, and other intellectual property laws. You may not:
                </p>
                <ul style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.8, paddingLeft: 24, marginTop: 12, marginBottom: 0 }}>
                  <li style={{ marginBottom: 8 }}>Copy, modify, or distribute any part of the Service</li>
                  <li style={{ marginBottom: 8 }}>Use our trademarks or logos without express permission</li>
                  <li>Create derivative works based on the Service</li>
                </ul>
              </section>

              {/* Disclaimer */}
              <section id="disclaimer">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>6. Disclaimers & Warranties</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  The Service is provided "as is" without warranties of any kind. We make no guarantee that:
                </p>
                <ul style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.8, paddingLeft: 24, marginTop: 12, marginBottom: 0 }}>
                  <li style={{ marginBottom: 8 }}>Verification results are 100% accurate or complete</li>
                  <li style={{ marginBottom: 8 }}>The Service will be uninterrupted or error-free</li>
                  <li>Defects will be corrected</li>
                </ul>
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 20px', marginTop: 20 }}>
                  <p style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>
                    Product verification results are for informational purposes only and do not guarantee authenticity. Always exercise due diligence when making purchasing decisions.
                  </p>
                </div>
              </section>

              {/* Liability */}
              <section id="liability">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>7. Limitation of Liability</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85 }}>
                  To the maximum extent permitted by law, Veri9 shall not be liable for any indirect, incidental, special, or consequential damages arising from your use or inability to use the Service, even if we have been advised of the possibility of such damages. Our total liability shall not exceed the amount you paid (if any) to use the Service in the past 12 months.
                </p>
              </section>

              {/* Termination */}
              <section id="termination">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>8. Termination</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 16 }}>
                  We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, without prior notice, for any reason, including but not limited to:
                </p>
                <ul style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.8, paddingLeft: 24, marginTop: 12, marginBottom: 0 }}>
                  <li style={{ marginBottom: 8 }}>Violation of these Terms</li>
                  <li style={{ marginBottom: 8 }}>Suspicious or fraudulent activity</li>
                  <li>Extended inactivity</li>
                </ul>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.7, marginTop: 16, marginBottom: 0 }}>
                  Upon termination, your right to use the Service will immediately cease.
                </p>
              </section>

              {/* Governing Law */}
              <section id="governing">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>9. Governing Law</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85 }}>
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, United States. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in San Francisco, California.
                </p>
              </section>

              {/* Changes */}
              <section id="changes">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>10. Changes to Terms</h2>
                <p style={{ fontSize: '0.94rem', color: '#4b5563', lineHeight: 1.85 }}>
                  We may modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes constitutes your acceptance of the updated Terms. Material changes will be highlighted and you may be notified via email.
                </p>
              </section>
            </div>
          </main>
        </div>
      </div>

      {!isEmbed && <Footer />}
    </>
  )
}