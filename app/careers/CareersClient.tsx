'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { usePlatformConfig } from '@/lib/platform-config'


const openRoles = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    type: 'Full-time',
    location: 'Remote (Worldwide)',
    color: '#635bff', bg: '#f0f0ff',
    desc: 'Build and scale the core verification platform. Work with Next.js, TypeScript, Supabase, and distributed systems.',
  },
  {
    title: 'Data Engineer',
    team: 'Data',
    type: 'Full-time',
    location: 'Remote (Worldwide)',
    color: '#0ea5e9', bg: '#f0f9ff',
    desc: 'Design and maintain our product intelligence pipelines. Work with global data sources and verification systems.',
  },
  {
    title: 'Product Designer (UI/UX)',
    team: 'Design',
    type: 'Full-time',
    location: 'Remote (Worldwide)',
    color: '#ec4899', bg: '#fdf2f8',
    desc: 'Shape the user experience of Veri9. Design intuitive interfaces that help millions verify products safely.',
  },
  {
    title: 'Brand Partnership Manager',
    team: 'Business',
    type: 'Full-time',
    location: 'New York / London / Remote',
    color: '#10b981', bg: '#f0fdf4',
    desc: 'Build and grow our network of verified brand partners. Develop relationships with manufacturers worldwide.',
  },
  {
    title: 'Security Engineer',
    team: 'Engineering',
    type: 'Full-time',
    location: 'Remote (Worldwide)',
    color: '#f59e0b', bg: '#fffbeb',
    desc: 'Protect our platform and users from threats. Lead security audits, penetration testing, and compliance work.',
  },
  {
    title: 'Content & SEO Specialist',
    team: 'Marketing',
    type: 'Full-time',
    location: 'Remote (Worldwide)',
    color: '#8b5cf6', bg: '#f5f3ff',
    desc: 'Create compelling content about product safety and counterfeit awareness. Drive organic growth through SEO.',
  },
]

const perks = [
  { icon: '🌍', title: 'Fully Remote', desc: 'Work from anywhere in the world. We believe great work happens everywhere.' },
  { icon: '💰', title: 'Competitive Pay', desc: 'Market-rate salaries with equity options for all full-time employees.' },
  { icon: '🏥', title: 'Health Coverage', desc: 'Comprehensive health, dental, and vision insurance for you and your family.' },
  { icon: '📚', title: 'Learning Budget', desc: '$2,000/year for courses, books, conferences, and professional development.' },
  { icon: '⏰', title: 'Flexible Hours', desc: 'Work when you\'re most productive. We care about output, not clock-watching.' },
  { icon: '🏖️', title: 'Unlimited PTO', desc: 'Take the time you need to recharge. Minimum 20 days encouraged per year.' },
]

export default function CareersPage() {
  const platformCfg = usePlatformConfig()

  if (!platformCfg.careersPage) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>Careers — Coming Soon</h1>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
              We&apos;re growing! Our careers page is being set up. Check back soon or reach out to us directly.
            </p>
            <Link href="/contact" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #635bff, #7c3aed)', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>
              Contact Us
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{ background: '#fff' }}>

        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
          padding: 'clamp(60px, 10vw, 96px) 24px clamp(50px, 8vw, 80px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 9999, padding: '5px 14px', marginBottom: 20,
              fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)',
            }}>
              We're Hiring
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>
              Join the team making the world's products safe to buy
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
              We're a small, fully remote team on a mission to eliminate counterfeit products globally. 
              Help us build the infrastructure for consumer trust.
            </p>
          </div>
        </section>

        {/* Perks */}
        <section style={{ padding: 'clamp(60px, 8vw, 90px) 24px', background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 10 }}>
                Why work at Veri9?
              </h2>
              <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
                We take care of our team so our team can take care of our mission
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              {perks.map(p => (
                <div key={p.title} style={{
                  background: '#fff', borderRadius: 16, padding: '24px',
                  border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>{p.icon}</div>
                  <h3 style={{ fontSize: '0.97rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Roles */}
        <section style={{ padding: 'clamp(60px, 8vw, 90px) 24px', background: '#fff' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 9999, padding: '4px 14px', marginBottom: 14,
                fontSize: '0.75rem', fontWeight: 600, color: '#10b981',
              }}>
                {openRoles.length} Open Positions
              </div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                Open Roles
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {openRoles.map(role => (
                <div key={role.title} style={{
                  background: '#fff', borderRadius: 16, padding: '24px 28px',
                  border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: role.bg, color: role.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 800,
                  }}>
                    {role.team[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{role.title}</h3>
                      <span style={{
                        padding: '2px 10px', borderRadius: 9999,
                        fontSize: '0.72rem', fontWeight: 600,
                        background: role.bg, color: role.color,
                        border: `1px solid ${role.color}30`,
                      }}>{role.team}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{role.desc}</p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {role.type}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {role.location}
                      </span>
                    </div>
                  </div>
                  <Link href="/contact" style={{
                    padding: '10px 22px', borderRadius: 10, fontSize: '0.875rem',
                    fontWeight: 700, color: '#fff',
                    background: `linear-gradient(135deg, ${role.color}, ${role.color}cc)`,
                    textDecoration: 'none', flexShrink: 0,
                    boxShadow: `0 2px 8px ${role.color}40`,
                    alignSelf: 'center',
                  }}>
                    Apply →
                  </Link>
                </div>
              ))}
            </div>

            {/* No role? */}
            <div style={{
              marginTop: 32, padding: '28px', borderRadius: 16,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Don't see a role that fits?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 16 }}>
                We're always looking for exceptional people. Send us your story.
              </p>
              <Link href="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 10, fontSize: '0.875rem',
                fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #635bff, #4f46e5)',
                textDecoration: 'none', boxShadow: '0 2px 8px rgba(99,91,255,0.3)',
              }}>
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}