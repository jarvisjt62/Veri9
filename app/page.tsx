import Link from 'next/link'
import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AuthRedirect from '@/components/AuthRedirect'
import TestimonialsSection from '@/components/TestimonialsSection'
import FeaturesSection, { CtaSection } from '@/components/FeaturesSection'
import { homeMetadata } from '@/lib/seo'

export const metadata: Metadata = homeMetadata

export default function HomePage() {
  return (
    <>
      {/* Redirect logged-in users straight to dashboard */}
      <AuthRedirect />
      <Navbar />
      <main style={{ background: '#fff' }}>

        {/* ── HERO ── */}
        <section style={{
          position: 'relative', overflow: 'hidden',
          padding: 'clamp(80px, 10vw, 130px) 0 clamp(60px, 8vw, 100px)',
          background: '#fff',
        }}>
          {/* Gradient mesh background */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 70% 60% at 50% -5%, rgba(99,91,255,0.08) 0%, transparent 65%),
              radial-gradient(ellipse 40% 40% at 85% 50%, rgba(6,182,212,0.05) 0%, transparent 60%),
              radial-gradient(ellipse 30% 30% at 15% 70%, rgba(99,91,255,0.04) 0%, transparent 60%)
            `,
          }} />
          {/* Subtle grid */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4,
            backgroundImage: `linear-gradient(rgba(99,91,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,91,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
              gap: 'clamp(40px, 6vw, 80px)',
              alignItems: 'center',
            }} className="hero-layout">

              {/* Left copy */}
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#f0f0ff', border: '1px solid #c7d2fe',
                  borderRadius: 9999, padding: '5px 14px',
                  fontSize: '0.75rem', fontWeight: 600, color: '#635bff', marginBottom: 28,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#635bff', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
                  Trusted by 250,000+ consumers worldwide
                </div>

                <h1 style={{
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)',
                  fontWeight: 900, lineHeight: 1.08,
                  color: '#0f172a', letterSpacing: '-0.04em',
                  marginBottom: 24,
                }}>
                  Verify Any Product,{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #635bff 0%, #06b6d4 60%, #635bff 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Anywhere
                  </span>
                </h1>

                <p style={{
                  fontSize: '1.05rem', color: '#64748b',
                  lineHeight: 1.8, marginBottom: 36, maxWidth: 480,
                }}>
                  Scan any barcode instantly to verify product authenticity. 
                  Protect yourself from counterfeit goods with real-time 
                  cross-referencing across 30+ global intelligence sources.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
                  <Link href="/scanner" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem',
                    fontWeight: 700, color: '#fff',
                    background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                    textDecoration: 'none',
                    boxShadow: '0 4px 20px rgba(99,91,255,0.4)',
                    transition: 'all 0.2s',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10M12 7v10"/>
                    </svg>
                    Scan a Product
                  </Link>
                  <Link href="/signup" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem',
                    fontWeight: 600, color: '#0f172a',
                    background: '#fff', border: '1.5px solid #e2e8f0',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}>
                    Get Started Free
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                  {[
                    { num: '250K+', label: 'Active Users' },
                    { num: '30+', label: 'Data Sources' },
                    { num: '99.9%', label: 'Uptime' },
                    { num: '2M+', label: 'Scans Made' },
                  ].map((stat, i) => (
                    <div key={stat.num} style={{
                      padding: '0 24px 0 0', marginRight: 24,
                      borderRight: i < 3 ? '1px solid #e2e8f0' : 'none',
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {stat.num}
                      </div>
                      <div style={{ fontSize: '0.77rem', color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Scanner mockup */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                  width: '100%', maxWidth: 420,
                  background: '#fff',
                  borderRadius: 24,
                  boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  border: '1px solid #f1f5f9',
                }}>
                  {/* Card header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10M12 7v10"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Veri9 Scanner</div>
                      <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Product Verified ✓</div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '20px 24px' }}>
                    {/* Trust score */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 12,
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      marginBottom: 16,
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Trust Score</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>96/100</div>
                      </div>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'conic-gradient(#22c55e 0% 96%, #e2e8f0 96% 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Product info */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Product Details
                      </div>
                      {[
                        { label: 'Product', value: 'Organic Olive Oil 500ml' },
                        { label: 'Brand', value: 'Terra Delyssa' },
                        { label: 'Origin', value: 'Tunisia 🇹🇳' },
                        { label: 'Barcode', value: '6191508103116' },
                      ].map(item => (
                        <div key={item.label} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '7px 0',
                          borderBottom: '1px solid #f1f5f9',
                          fontSize: '0.85rem',
                        }}>
                          <span style={{ color: '#94a3b8' }}>{item.label}</span>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Sources */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['Registries', 'Regulatory', 'Safety', 'Trade'].map(src => (
                        <span key={src} style={{
                          padding: '3px 10px', borderRadius: 9999,
                          background: '#f0f0ff', color: '#635bff',
                          fontSize: '0.72rem', fontWeight: 600,
                          border: '1px solid #e0e0ff',
                        }}>{src} ✓</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom logos strip — Stripe-style infinite scrolling carousel */}
          <div style={{
            maxWidth: 1200, margin: '60px auto 0', padding: '0 24px',
            position: 'relative', zIndex: 1,
          }}>
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, marginBottom: 20, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Verifying products from the world&apos;s most trusted brands
            </p>
            <style>{`
              @keyframes veri9-logo-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .veri9-logo-marquee {
                overflow: hidden;
                position: relative;
                mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
                -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
              }
              .veri9-logo-track {
                display: flex;
                gap: clamp(40px, 5vw, 72px);
                width: max-content;
                animation: veri9-logo-scroll 40s linear infinite;
                align-items: center;
              }
              .veri9-logo-marquee:hover .veri9-logo-track { animation-play-state: paused; }
              .veri9-brand-logo {
                display: inline-flex; align-items: center; justify-content: center;
                height: 40px;
                color: #64748b;
                flex-shrink: 0;
                opacity: 0.75;
                transition: all 0.25s ease;
                filter: grayscale(1);
              }
              .veri9-brand-logo:hover { opacity: 1; filter: grayscale(0); transform: translateY(-2px); }
              .veri9-brand-logo svg { height: 100%; width: auto; max-width: 140px; }
              .veri9-brand-logo .wm {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-weight: 800; font-size: 1.35rem; letter-spacing: -0.02em;
                color: #475569; white-space: nowrap;
              }
            `}</style>
            <div className="veri9-logo-marquee">
              <div className="veri9-logo-track">
                {[
                  // Real world-class trusted brands whose products are commonly verified
                  { name: 'Coca-Cola', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="22" fill="currentColor">Coca-Cola</text></svg> },
                  { name: 'Nike', svg: <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg"><path d="M10 25 Q 25 10, 55 15 Q 75 18, 85 22 Q 60 12, 40 18 Q 25 22, 10 25 Z" fill="currentColor"/></svg> },
                  { name: 'Apple', svg: <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M27 14c-1 0-3 1-4 1s-3-1-4-1c-3 0-6 2-6 7 0 6 4 13 6 13 1 0 2-1 4-1s3 1 4 1c2 0 6-7 6-13 0-3-2-5-4-6 1-1 2-2 2-4-2 0-3 1-4 3zm-2-5c0 1-1 3-2 3 0-1 0-3 2-3z" fill="currentColor"/></svg> },
                  { name: 'Samsung', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="20" fill="currentColor" letterSpacing="1">SAMSUNG</text></svg> },
                  { name: 'Toyota', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><ellipse cx="30" cy="20" rx="18" ry="12" fill="none" stroke="currentColor" strokeWidth="2"/><ellipse cx="30" cy="15" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="30" y1="10" x2="30" y2="30" stroke="currentColor" strokeWidth="2"/><text x="110" y="27" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="18" fill="currentColor" letterSpacing="2">TOYOTA</text></svg> },
                  { name: 'Nestle', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="400" fontSize="22" fill="currentColor">Nestlé</text></svg> },
                  { name: 'Pfizer', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontStyle="italic" fontWeight="700" fontSize="22" fill="currentColor">Pfizer</text></svg> },
                  { name: 'Rolex', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><path d="M30 12 L24 20 L30 28 L36 20 Z M26 20 L20 26 M34 20 L40 26 M30 8 L30 14" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="120" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="currentColor" letterSpacing="3">ROLEX</text></svg> },
                  { name: 'Louis Vuitton', svg: <svg viewBox="0 0 240 40" xmlns="http://www.w3.org/2000/svg"><text x="120" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="16" fill="currentColor" letterSpacing="2">LOUIS VUITTON</text></svg> },
                  { name: 'Gucci', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="currentColor" letterSpacing="4">GUCCI</text></svg> },
                  { name: 'Chanel', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="18" fill="currentColor" letterSpacing="6">CHANEL</text></svg> },
                  { name: 'Sony', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="24" fill="currentColor" fontStyle="italic">SONY</text></svg> },
                  { name: 'Unilever', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="20" fill="currentColor">Unilever</text></svg> },
                  { name: "L'Oréal", svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="400" fontSize="20" fill="currentColor" letterSpacing="3">L&apos;ORÉAL</text></svg> },
                  { name: 'Johnson & Johnson', svg: <svg viewBox="0 0 240 40" xmlns="http://www.w3.org/2000/svg"><text x="120" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="400" fontSize="18" fill="currentColor">Johnson &amp; Johnson</text></svg> },
                  { name: 'P&G', svg: <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><text x="60" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="currentColor">P&amp;G</text></svg> },
                ].concat([
                  { name: 'Coca-Cola', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="22" fill="currentColor">Coca-Cola</text></svg> },
                  { name: 'Nike', svg: <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg"><path d="M10 25 Q 25 10, 55 15 Q 75 18, 85 22 Q 60 12, 40 18 Q 25 22, 10 25 Z" fill="currentColor"/></svg> },
                  { name: 'Apple', svg: <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M27 14c-1 0-3 1-4 1s-3-1-4-1c-3 0-6 2-6 7 0 6 4 13 6 13 1 0 2-1 4-1s3 1 4 1c2 0 6-7 6-13 0-3-2-5-4-6 1-1 2-2 2-4-2 0-3 1-4 3zm-2-5c0 1-1 3-2 3 0-1 0-3 2-3z" fill="currentColor"/></svg> },
                  { name: 'Samsung', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="20" fill="currentColor" letterSpacing="1">SAMSUNG</text></svg> },
                  { name: 'Toyota', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><ellipse cx="30" cy="20" rx="18" ry="12" fill="none" stroke="currentColor" strokeWidth="2"/><ellipse cx="30" cy="15" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="30" y1="10" x2="30" y2="30" stroke="currentColor" strokeWidth="2"/><text x="110" y="27" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="18" fill="currentColor" letterSpacing="2">TOYOTA</text></svg> },
                  { name: 'Nestle', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="400" fontSize="22" fill="currentColor">Nestlé</text></svg> },
                  { name: 'Pfizer', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontStyle="italic" fontWeight="700" fontSize="22" fill="currentColor">Pfizer</text></svg> },
                  { name: 'Rolex', svg: <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><path d="M30 12 L24 20 L30 28 L36 20 Z M26 20 L20 26 M34 20 L40 26 M30 8 L30 14" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="120" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="currentColor" letterSpacing="3">ROLEX</text></svg> },
                ]).map((brand, idx) => (
                  <span key={`${brand.name}-${idx}`} className="veri9-brand-logo" title={brand.name} aria-label={brand.name}>
                    {brand.svg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{
          padding: 'clamp(64px, 8vw, 100px) 0',
          background: '#fafafa',
          borderTop: '1px solid #f1f5f9',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 60px)' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f0f0ff', border: '1px solid #e0e0ff',
                borderRadius: 9999, padding: '4px 14px',
                fontSize: '0.75rem', fontWeight: 600, color: '#635bff',
                marginBottom: 16,
              }}>
                Simple Process
              </div>
              <h2 style={{
                fontSize: 'clamp(1.7rem, 3.5vw, 2.8rem)',
                fontWeight: 800, color: '#0f172a',
                letterSpacing: '-0.03em', marginBottom: 14,
              }}>
                How Veri9 Works
              </h2>
              <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
                Three simple steps to verify any product in seconds
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
            }}>
              {[
                {
                  step: '01',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10M12 7v10"/></svg>,
                  title: 'Scan or Enter Barcode',
                  desc: 'Use your camera to scan a barcode, or manually enter the barcode number from the product.',
                  color: '#635bff',
                  bg: '#f0f0ff',
                },
                {
                  step: '02',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
                  title: 'AI-Powered Analysis',
                  desc: 'We instantly cross-reference 30+ global intelligence sources to verify product authenticity.',
                  color: '#0ea5e9',
                  bg: '#f0f9ff',
                },
                {
                  step: '03',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                  title: 'Get Instant Verdict',
                  desc: 'Receive a comprehensive trust score, product details, and authenticity verdict within seconds.',
                  color: '#10b981',
                  bg: '#f0fdf4',
                },
              ].map(step => (
                <div key={step.step} style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: '32px 28px',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    position: 'absolute', top: 24, right: 24,
                    fontSize: '2rem', fontWeight: 900, color: '#f1f5f9',
                    letterSpacing: '-0.04em',
                  }}>
                    {step.step}
                  </div>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: step.bg, color: step.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    {step.icon}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES — admin-controlled via usePlatformConfig */}
        <FeaturesSection />

        {/* ── TESTIMONIALS (admin-controlled via usePlatformConfig) ── */}
        <TestimonialsSection />

        {/* CTA — admin-controlled via usePlatformConfig */}
        <CtaSection />

      </main>
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .hero-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}