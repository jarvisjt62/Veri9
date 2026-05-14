'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { usePlatformConfig } from '@/lib/platform-config'

const securityPractices = [
  { icon: 'fa-shield-alt', title: 'Encryption in Transit', desc: 'All data is transmitted over HTTPS using TLS 1.3 with strong ciphers.' },
  { icon: 'fa-lock', title: 'Encryption at Rest', desc: 'User data is encrypted using AES-256 encryption for storage.' },
  { icon: 'fa-user-shield', title: 'Access Controls', desc: 'Strict role-based access with multi-factor authentication for staff.' },
  { icon: 'fa-bug', title: 'Bug Bounty Program', desc: 'We reward security researchers who responsibly disclose vulnerabilities.' },
  { icon: 'fa-eye', title: 'Security Audits', desc: 'Regular penetration testing and third-party security assessments.' },
  { icon: 'fa-server', title: 'Infrastructure Security', desc: 'Cloud infrastructure with ISO 27001, SOC 2 Type II compliance.' },
]

const badges = [
  { name: 'SOC 2 Type II', status: 'Certified' },
  { name: 'ISO 27001', status: 'Certified' },
  { name: 'GDPR Compliant', status: 'Compliant' },
  { name: 'CCPA Compliant', status: 'Compliant' },
]

export default function SecurityPage() {
  const platformCfg = usePlatformConfig()

  if (!platformCfg.securityPage) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>Security — Coming Soon</h1>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
              Our security documentation is being prepared. For security concerns, please contact us directly.
            </p>
            <a href="mailto:contact@veri9.com" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #635bff, #7c3aed)', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>
              contact@veri9.com
            </a>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 40%, #065f46 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#a7f3d0', marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Security
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>Security at Veri9</h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
            Your trust is our top priority. We employ industry-leading security practices to protect your data and ensure the integrity of our service.
          </p>
        </div>
      </div>

      {/* Compliance Badges */}
      <div style={{ maxWidth: 1100, margin: '-24px auto 48px', position: 'relative', zIndex: 10, padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 4px 30px rgba(0,0,0,0.08), 0 1px 10px rgba(0,0,0,0.04)' }}>
          {badges.map((badge, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginBottom: 4 }}>{badge.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{badge.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Security Practices */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Our Security Practices</h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: 28 }}>We employ a defense-in-depth security approach with multiple layers of protection:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {securityPractices.map((practice, idx) => (
              <div key={idx} style={{ padding: '24px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: linearGradient(idx), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fas ${practice.icon}`} style={{ color: '#fff', fontSize: '1.1rem' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{practice.title}</h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.7, margin: 0 }}>{practice.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Protection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 56 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Data Protection</h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: 20 }}>Your data is protected from the moment it leaves your device:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'End-to-end encryption for all user data', status: 'enabled' },
                { label: 'PCI DSS compliant payment processing', status: 'enabled' },
                { label: 'Regular automated backups with retention policies', status: 'enabled' },
                { label: 'Data stored in secure, geographically distributed data centers', status: 'enabled' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <i className={`fas ${item.status === 'enabled' ? 'fa-check-circle' : 'fa-circle'}`} style={{ color: '#16a34a', fontSize: '0.9rem' }}></i>
                  <span style={{ fontSize: '0.88rem', color: '#166534', fontWeight: 600 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Account Security</h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: 20 }}>Take control of your account security:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Two-factor authentication (2FA) support', status: 'enabled' },
                { label: 'Password strength requirements', status: 'enabled' },
                { label: 'Active session management', status: 'enabled' },
                { label: 'Login attempt monitoring & alerts', status: 'enabled' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <i className={`fas ${item.status === 'enabled' ? 'fa-check-circle' : 'fa-circle'}`} style={{ color: '#16a34a', fontSize: '0.9rem' }}></i>
                  <span style={{ fontSize: '0.88rem', color: '#166534', fontWeight: 600 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vulnerability Disclosure */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '36px 40px', border: '1px solid #e5e7eb', marginBottom: 56 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #635bff, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fas fa-bug" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Vulnerability Disclosure</h2>
              <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0 }}>Found a security issue? We appreciate responsible disclosure from the security community.</p>
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Email</p>
                <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 600, margin: 0 }}>security@veri9.com</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Response Time</p>
                <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 600, margin: 0 }}>Within 48 hours</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Bounty Range</p>
                <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 600, margin: 0 }}>$100 - $10,000</p>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.7, margin: 0 }}>
              We commit to responding to all reports within 48 hours and will work with researchers to verify and address vulnerabilities. Please provide detailed reproduction steps and responsible disclosure timing.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 18, padding: '40px 32px', border: '1px solid #bae6fd' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Security Questions?</h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: 20 }}>Our security team is available to answer your questions.</p>
          <a href="mailto:security@veri9.com" style={{ padding: '12px 28px', borderRadius: 10, background: '#635bff', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', display: 'inline-block', boxShadow: '0 4px 14px rgba(99,91,255,0.3)' }}>
            Contact Security Team
          </a>
        </div>
      </div>

      <Footer />
    </>
  )
}

function linearGradient(idx: number): string {
  const gradients = [
    'linear-gradient(135deg, #635bff, #7c3aed)',
    'linear-gradient(135deg, #059669, #10d4a0)',
    'linear-gradient(135deg, #d97706, #f59e0b)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
  ]
  return gradients[idx % gradients.length]
}