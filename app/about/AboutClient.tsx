'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { usePlatformConfig } from '@/lib/platform-config'

const team = [
  { name: 'Dr. Sarah Chen', role: 'CEO & Co-Founder', bio: 'Former FDA product safety analyst. PhD in Consumer Protection. Led the team that built the original barcode verification prototype.', initials: 'SC' },
  { name: 'Michael Torres', role: 'CTO & Co-Founder', bio: '15 years in distributed systems. Previously at Google. Architected our real-time verification engine.', initials: 'MT' },
  { name: 'Emma Williams', role: 'Head of Data', bio: 'Data scientist specializing in product authenticity. Manages our verification intelligence and trust score algorithm.', initials: 'EW' },
  { name: 'James Rivera', role: 'Head of Partnerships', bio: 'Built relationships with 150+ brand partners. Expert in global supply chain transparency and brand protection.', initials: 'JR' },
  { name: 'Lisa Park', role: 'Head of Product', bio: 'Former UX lead at Shopify. Obsessed with making product safety accessible and effortless for every consumer.', initials: 'LP' },
  { name: 'David Kim', role: 'Head of Security', bio: 'Security researcher with 10+ years. Keeps our platform and user data safe from threats.', initials: 'DK' },
]

const values = [
  {
    icon: '🔍',
    title: 'Radical Transparency',
    desc: 'We show you exactly how we verify each product and how we calculate your trust score. No black boxes.',
  },
  {
    icon: '❤️',
    title: 'Consumer First',
    desc: 'Veri9 is and will always be free for consumers. We will never put a paywall on basic product safety.',
  },
  {
    icon: '🌍',
    title: 'Open Data',
    desc: 'We use and contribute to open data initiatives worldwide. Better data means better protection for everyone.',
  },
  {
    icon: '🛡️',
    title: 'Proactive Safety',
    desc: 'We don\'t just verify — we monitor. Active recall tracking and instant alerts when your products are flagged.',
  },
]

const milestones = [
  { year: '2021', event: 'Veri9 founded in San Francisco. First prototype verifies products across multiple sources.' },
  { year: '2022', event: 'Expanded verification coverage to 9+ global sources. Launched public beta with 10,000 users.' },
  { year: '2023', event: 'Reached 1M scans. Launched brand registration and partnership program.' },
  { year: '2024', event: '2M+ scans. 150+ brand partners. Launched community reporting platform.' },
  { year: '2025', event: 'Introducing camera scanning, API access, and enterprise partnerships.' },
]

export default function AboutPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
      <AboutPageInner />
    </Suspense>
  )
}

function AboutPageInner() {
  const platformCfg = usePlatformConfig()
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'
  return (
    <>
      {!isEmbed && <Navbar />}
      <style>{`
        .team-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
        .team-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .value-card:hover { border-color: #635bff; }
        .value-card { transition: border-color 0.2s; }
      `}</style>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 50%, #635bff 100%)', padding: 'clamp(80px,12vw,120px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,91,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.1) 0%, transparent 50%)' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: '6px 18px', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 24, backdropFilter: 'blur(8px)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Our Story
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.1 }}>
            Building a World Where<br />
            <span style={{ background: 'linear-gradient(90deg, #a5b4fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Every Product Can Be Trusted</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 36px' }}>
            Veri9 was born from a simple belief: every consumer deserves to know exactly what they're buying. We built the tools to make that possible.
          </p>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: '2M+', label: 'Products Scanned' },
              { value: '250K+', label: 'Active Users' },
              { value: '9+', label: 'Data Sources' },
              { value: '150+', label: 'Brand Partners' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(60px,8vw,96px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eef2ff', borderRadius: 9999, padding: '5px 14px', fontSize: '0.76rem', fontWeight: 700, color: '#635bff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              Our Mission
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.2 }}>
              Counterfeiting is a<br />$4.5 trillion problem.
            </h2>
            <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 20 }}>
              Counterfeit products put lives at risk. Fake medications, unsafe electronics, and fraudulent food products harm millions of consumers every year — and most people have no way to know they've been deceived.
            </p>
            <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.85, marginBottom: 28 }}>
              Veri9 changes that. By cross-referencing product barcodes against our advanced verification engine — spanning regulatory records, brand registries, and global product intelligence — we give consumers a powerful, instant trust score they can rely on.
            </p>
            <Link href={isEmbed ? "/dashboard?tab=scan" : "/scanner"} target={isEmbed ? "_top" : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: 'linear-gradient(135deg, #635bff, #7c3aed)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(99,91,255,0.3)' }}>
              Try the Scanner
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
            {[
              { icon: '🔬', label: 'Sources Queried', sub: 'Per scan, simultaneously' },
              { icon: '⚡', label: 'Average Scan Time', sub: 'Under 3 seconds' },
              { icon: '🌎', label: 'Countries Covered', sub: 'And growing daily' },
              { icon: '🆓', label: 'Always Free', sub: 'For consumers, forever' },
            ].map((item, idx) => (
              <div key={idx} style={{ background: idx % 2 === 0 ? '#635bff' : '#f8fafc', borderRadius: 16, padding: '24px 20px', border: idx % 2 !== 0 ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: idx % 2 === 0 ? '#fff' : '#0f172a', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '0.78rem', color: idx % 2 === 0 ? 'rgba(255,255,255,0.7)' : '#94a3b8', fontWeight: 500 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={{ background: '#f8fafc', padding: 'clamp(60px,8vw,96px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>Our Values</h2>
            <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 480, margin: '0 auto' }}>The principles that guide everything we build and every decision we make.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {values.map((value, idx) => (
              <div key={idx} className="value-card" style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '2px solid #e5e7eb' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 16 }}>{value.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{value.title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.75, margin: 0 }}>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Journey Timeline — admin-controlled */}
      {platformCfg.journeySection && (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(60px,8vw,96px) 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>Our Journey</h2>
          <p style={{ fontSize: '1rem', color: '#64748b' }}>From a prototype to protecting millions of consumers worldwide.</p>
        </div>
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #635bff, #c7d2fe)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {milestones.map((m, idx) => (
              <div key={idx} style={{ position: 'relative', display: 'flex', gap: 20 }}>
                <div style={{ position: 'absolute', left: -29, top: 4, width: 16, height: 16, borderRadius: '50%', background: '#635bff', border: '3px solid #fff', boxShadow: '0 0 0 3px #635bff30' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#635bff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{m.year}</div>
                  <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.7, margin: 0 }}>{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Meet the Team — admin-controlled */}
      {platformCfg.teamSection && (
      <>
      <div style={{ background: '#f8fafc', padding: 'clamp(60px,8vw,96px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>Meet the Team</h2>
            <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 480, margin: '0 auto' }}>A diverse group of product safety experts, engineers, and designers on a mission.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {team.map((member, idx) => (
              <div key={idx} className="team-card" style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1px solid #e5e7eb', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `hsl(${(idx * 47 + 240) % 360}, 70%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {member.initials}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{member.name}</h3>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#635bff', marginBottom: 10 }}>{member.role}</div>
                  <p style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.7, margin: 0 }}>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 60%, #635bff 100%)', padding: 'clamp(60px,8vw,96px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>Join the Fight Against Counterfeits</h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 32 }}>
            Scan your first product for free. No account required. Instant results.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={isEmbed ? "/dashboard?tab=scan" : "/scanner"} target={isEmbed ? "_top" : undefined} style={{ padding: '14px 32px', borderRadius: 12, background: '#635bff', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 20px rgba(99,91,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Start Scanning
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href={isEmbed ? "/dashboard" : "/careers"} target={isEmbed ? "_top" : undefined} style={{ padding: '14px 32px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              {isEmbed ? "Back to Dashboard" : "Join Our Team"}
            </Link>
          </div>
        </div>
      </div>
      </>
      )}

      {!isEmbed && <Footer />}
    </>
  )
}