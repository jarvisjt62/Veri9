import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section style={{
          padding: 'clamp(80px, 10vw, 136px) 0 clamp(60px, 8vw, 96px)',
          background: '#fff', position: 'relative', overflow: 'hidden'
        }}>
          {/* Background gradient blobs */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 60% -10%, rgba(79,70,229,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 90% 60%, rgba(6,182,212,0.05) 0%, transparent 70%)'
          }} />
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'clamp(300px, 55%, 640px) 1fr', gap: 64, alignItems: 'center' }}
              className="hero-grid">
              {/* Left */}
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#f0f4ff', border: '1px solid #c7d2fe',
                  borderRadius: 9999, padding: '5px 14px',
                  fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', marginBottom: 28
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5', display: 'inline-block' }}></span>
                  Trusted by 250,000+ consumers worldwide
                </div>
                <h1 style={{
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1,
                  color: '#0f172a', letterSpacing: '-0.035em', marginBottom: 22
                }}>
                  Verify Any Product,{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Anywhere in the World
                  </span>
                </h1>
                <p style={{ fontSize: '1.05rem', color: '#4b5563', lineHeight: 1.78, marginBottom: 36, maxWidth: 460 }}>
                  Scan any barcode to instantly verify product authenticity. Protect yourself from counterfeit goods with real-time cross-referencing across 9+ global databases.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
                  <Link href="/scanner" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem',
                    fontWeight: 700, color: '#fff', background: '#4F46E5',
                    textDecoration: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.35)'
                  }}>
                    <i className="fas fa-barcode"></i> Scan a Product
                  </Link>
                  <Link href="/signup" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem',
                    fontWeight: 600, color: '#0f172a', background: '#fff',
                    border: '1.5px solid #e5e7eb', textDecoration: 'none'
                  }}>
                    Get Started Free <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
                  </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { num: '250K+', label: 'Users' },
                    { num: '9+', label: 'Databases' },
                    { num: '99.9%', label: 'Uptime' },
                  ].map(stat => (
                    <div key={stat.num} style={{ paddingRight: 20, borderRight: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{stat.num}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Scanner Visual */}
              <div className="hero-visual" style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  background: '#f8fafc', borderRadius: 24, padding: 32, border: '1px solid #e5e7eb',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.10)', maxWidth: 380, width: '100%'
                }}>
                  {/* Mock scanner card */}
                  <div style={{ background: '#0f172a', borderRadius: 12, padding: 24, marginBottom: 16, textAlign: 'center', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.15)' }}>
                      <i className="fas fa-barcode"></i>
                    </div>
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#818cf8,transparent)', top: '40%', animation: 'none' }}></div>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Scanning product...</div>
                    <div style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #4F46E5, #818cf8)', borderRadius: 2 }}></div>
                    </div>
                  </div>
                  {/* Result preview */}
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.9rem' }}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>Verified Authentic</div>
                      <div style={{ fontSize: '0.75rem', color: '#059669' }}>Found in 4 databases · Trust Score: 92%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section style={{ background: '#0f172a', padding: '60px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 1, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden'
            }}>
              {[
                { num: '150M+', label: 'Products in Database' },
                { num: '9+',    label: 'Verification Sources' },
                { num: '195',   label: 'Countries Covered' },
                { num: '250K+', label: 'Verified Scans' },
                { num: '99.9%', label: 'Platform Uptime' },
                { num: 'Free',  label: 'Always Free to Scan' },
              ].map(stat => (
                <div key={stat.num} style={{ padding: '28px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>
                    {stat.num}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: '100px 0', background: '#f8fafc' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 56px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4F46E5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 9999, padding: '4px 12px', marginBottom: 18 }}>
                <span style={{ width: 5, height: 5, background: '#4F46E5', borderRadius: '50%', display: 'inline-block' }}></span>
                How It Works
              </div>
              <h2 style={{ fontSize: 'clamp(1.9rem, 3vw, 2.75rem)', fontWeight: 900, lineHeight: 1.13, letterSpacing: '-0.028em', color: '#0f172a', marginBottom: 18 }}>
                Verify in 3 Simple Steps
              </h2>
              <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.78 }}>
                No technical knowledge required. Just scan, check, and shop with confidence.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                { step: '01', icon: 'fa-barcode', title: 'Scan the Barcode', desc: 'Use your phone camera or type the barcode number of any product you want to verify.', color: '#4F46E5' },
                { step: '02', icon: 'fa-database', title: 'Cross-Reference 9+ Databases', desc: 'We instantly query Open Food Facts, OpenFDA, UPCitemdb, Open Library, USDA, GS1 and more.', color: '#06b6d4' },
                { step: '03', icon: 'fa-shield-alt', title: 'Get Instant Results', desc: 'See a trust score, authenticity status, product details, and recall alerts in seconds.', color: '#10b981' },
              ].map(item => (
                <div key={item.step} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '32px 28px', position: 'relative' }}>
                  <div style={{ fontSize: '4rem', fontWeight: 900, color: `${item.color}15`, position: 'absolute', top: 16, right: 20, lineHeight: 1, letterSpacing: '-0.05em' }}>{item.step}</div>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: '1.3rem' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{item.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding: '100px 0', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {[
                { icon: 'fa-shield-alt', color: '#4F46E5', bg: '#eef2ff', title: 'Multi-Database Verification', desc: '9 parallel database queries including OpenFDA, Open Food Facts, UPCitemdb, Open Library, USDA FoodData and GS1 country lookup.' },
                { icon: 'fa-bolt', color: '#f59e0b', bg: '#fffbeb', title: 'Instant Results', desc: 'Get verification results in under 3 seconds with a detailed trust score, product info, and recall alerts.' },
                { icon: 'fa-globe', color: '#06b6d4', bg: '#ecfeff', title: 'Global Coverage', desc: 'Support for 195+ countries via GS1 prefix database. Identify product origin from any barcode worldwide.' },
                { icon: 'fa-book', color: '#8b5cf6', bg: '#f5f3ff', title: 'Books & ISBNs', desc: 'Scan ISBN barcodes to verify books against Open Library\'s 30M+ titles. Perfect for textbooks and collectibles.' },
                { icon: 'fa-pills', color: '#ef4444', bg: '#fef2f2', title: 'FDA Drug Verification', desc: 'Verify pharmaceutical products against the FDA National Drug Code database. Check for recalls and safety alerts.' },
                { icon: 'fa-users', color: '#10b981', bg: '#ecfdf5', title: 'Community Reports', desc: 'Report suspicious products and view community-sourced alerts. Collective intelligence to fight counterfeits.' },
              ].map(f => (
                <div key={f.title} style={{ padding: '28px 24px', border: '1px solid #f1f5f9', borderRadius: 16, background: '#fafafa', transition: 'all 0.2s' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <i className={`fas ${f.icon}`} style={{ color: f.color, fontSize: '1.15rem' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: '0.87rem', color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DATA SOURCES */}
        <section style={{ padding: '80px 0', background: '#f8fafc' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.025em' }}>
                Powered by 9+ Free Public Databases
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748b' }}>No paywalls. No hidden fees. All verified through open, trusted global databases.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {[
                { name: 'Open Food Facts', icon: 'fa-apple-alt', color: '#10b981', records: '3M+ foods' },
                { name: 'OpenFDA', icon: 'fa-pills', color: '#ef4444', records: '4M+ drugs' },
                { name: 'UPCitemdb', icon: 'fa-tag', color: '#4F46E5', records: '150M+ products' },
                { name: 'Open Library', icon: 'fa-book', color: '#8b5cf6', records: '30M+ books' },
                { name: 'USDA FoodData', icon: 'fa-leaf', color: '#f59e0b', records: '900K+ foods' },
                { name: 'Open Beauty Facts', icon: 'fa-spa', color: '#ec4899', records: '800K+ cosmetics' },
                { name: 'GS1 Database', icon: 'fa-globe', color: '#06b6d4', records: '195 countries' },
                { name: 'NHTSA Vehicles', icon: 'fa-car', color: '#64748b', records: '50K+ vehicles' },
                { name: 'WHO Medicines', icon: 'fa-hospital', color: '#dc2626', records: '500+ essentials' },
              ].map(db => (
                <div key={db.name} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${db.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <i className={`fas ${db.icon}`} style={{ color: db.color, fontSize: '1rem' }}></i>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{db.name}</div>
                  <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{db.records}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ padding: '100px 0', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(1.9rem, 3vw, 2.75rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.028em', marginBottom: 12 }}>
                Trusted by Shoppers Worldwide
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                { quote: "I scanned a luxury perfume I almost bought online and Veri9 flagged it as suspicious. Saved me $200!", name: "Sarah K.", role: "Online Shopper", stars: 5 },
                { quote: "As a pharmacist I use Veri9 to verify unfamiliar drug NDC codes. The FDA database integration is excellent.", name: "Dr. James O.", role: "Pharmacist", stars: 5 },
                { quote: "We use Veri9 to verify all our imported inventory before it hits shelves. It's become essential to our process.", name: "Maria L.", role: "Retail Business Owner", stars: 5 },
              ].map(t => (
                <div key={t.name} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 24px' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <i key={i} className="fas fa-star" style={{ color: '#f59e0b', fontSize: '0.85rem' }}></i>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #4F46E5 0%, #3730a3 100%)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 18 }}>
              Start Verifying Products for Free
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.7 }}>
              No credit card required. Scan unlimited products and protect yourself from counterfeit goods today.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/scanner" style={{
                padding: '14px 32px', borderRadius: 10, fontSize: '1rem',
                fontWeight: 700, color: '#4F46E5', background: '#fff',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8
              }}>
                <i className="fas fa-barcode"></i> Scan a Product
              </Link>
              <Link href="/signup" style={{
                padding: '14px 32px', borderRadius: 10, fontSize: '1rem',
                fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.3)', textDecoration: 'none'
              }}>
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none !important; }
        }
        @media (max-width: 480px) {
          section { padding: 60px 0 !important; }
        }
      `}</style>
    </>
  )
}