'use client'

import Link from 'next/link'
import { usePlatformConfig } from '@/lib/platform-config'

export default function FeaturesSection() {
  const cfg = usePlatformConfig()
  if (!cfg.featuredSection) return null

  return (
    <section style={{ padding: 'clamp(64px, 8vw, 100px) 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <style>{`
          @media (max-width: 767px) {
            .features-layout { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center' }} className="features-layout">

          {/* Feature list */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f0f0ff', border: '1px solid #e0e0ff',
              borderRadius: 9999, padding: '4px 14px',
              fontSize: '0.75rem', fontWeight: 600, color: '#635bff',
              marginBottom: 16,
            }}>
              Why Veri9
            </div>
            <h2 style={{
              fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)',
              fontWeight: 800, color: '#0f172a',
              letterSpacing: '-0.03em', marginBottom: 16,
            }}>
              The most comprehensive product verification platform
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.8, marginBottom: 36 }}>
              Veri9 combines data from the world's leading product databases to give you the most accurate verification result possible.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '🔍', title: '30+ Verification Databases', desc: 'GS1, OpenFDA, USDA, Open Food Facts and more.' },
                { icon: '⚡', title: 'Real-time Results', desc: 'Get your verification results in under 3 seconds.' },
                { icon: '🌍', title: 'Global Coverage', desc: 'Products from 150+ countries and regions covered.' },
                { icon: '📊', title: 'Trust Score Algorithm', desc: 'Proprietary scoring system based on 20+ data points.' },
                { icon: '👥', title: 'Community Reports', desc: 'User-submitted counterfeit reports for extra safety.' },
              ].map(feat => (
                <div key={feat.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {feat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{feat.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: 24, padding: 32,
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Database Coverage
                </div>
                {[
                  { name: 'GS1 Global Registry', pct: 98, color: '#635bff' },
                  { name: 'OpenFDA (US)', pct: 94, color: '#0ea5e9' },
                  { name: 'Open Food Facts', pct: 91, color: '#10b981' },
                  { name: 'USDA Products', pct: 87, color: '#f59e0b' },
                  { name: 'UPCitemdb', pct: 85, color: '#ec4899' },
                ].map(db => (
                  <div key={db.name} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 500 }}>{db.name}</span>
                      <span style={{ fontSize: '0.82rem', color: db.color, fontWeight: 700 }}>{db.pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 9999 }}>
                      <div style={{
                        height: '100%', width: `${db.pct}%`,
                        background: `linear-gradient(90deg, ${db.color}, ${db.color}aa)`,
                        borderRadius: 9999,
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                {[
                  { value: '2M+', label: 'Scans', color: '#635bff' },
                  { value: '99.9%', label: 'Uptime', color: '#10b981' },
                  { value: '< 3s', label: 'Avg. Time', color: '#0ea5e9' },
                  { value: '150+', label: 'Countries', color: '#f59e0b' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.03em' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CtaSection() {
  const cfg = usePlatformConfig()
  if (!cfg.ctaSection) return null

  return (
    <section style={{
      padding: 'clamp(64px, 8vw, 100px) 0',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,91,255,0.15) 0%, transparent 70%)',
      }} />
      <div style={{
        maxWidth: 680, margin: '0 auto', padding: '0 24px',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,91,255,0.2)', border: '1px solid rgba(99,91,255,0.4)',
          borderRadius: 9999, padding: '5px 14px',
          fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc',
          marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#635bff', display: 'inline-block' }}/>
          Free for Everyone
        </div>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 3rem)',
          fontWeight: 900, color: '#fff',
          letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1,
        }}>
          Start verifying products today — it&apos;s completely free
        </h2>
        <p style={{
          fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.75, marginBottom: 36,
        }}>
          No credit card required. No subscription needed. Just scan and verify.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/scanner" style={{
            padding: '14px 32px', borderRadius: 10, fontSize: '1rem',
            fontWeight: 700, color: '#fff',
            background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(99,91,255,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10M12 7v10"/>
            </svg>
            Scan a Product
          </Link>
          <Link href="/signup" style={{
            padding: '14px 32px', borderRadius: 10, fontSize: '1rem',
            fontWeight: 600, color: '#fff',
            background: 'rgba(255,255,255,0.1)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            Create Free Account
          </Link>
        </div>
      </div>
    </section>
  )
}
