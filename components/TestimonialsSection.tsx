'use client'

import { usePlatformConfig } from '@/lib/platform-config'

export default function TestimonialsSection() {
  const cfg = usePlatformConfig()
  if (!cfg.testimonialSection) return null

  const testimonials = [
    { quote: "Scanned a luxury watch I was about to buy and Veri9 flagged it as a counterfeit immediately. Saved me $1,800!", name: "James K.", role: "Collector, New York", avatar: "JK", color: "#635bff" },
    { quote: "As a food blogger, I use Veri9 to verify organic products. The Open Food Facts integration is incredibly accurate.", name: "Sarah M.", role: "Food Blogger, London", avatar: "SM", color: "#10b981" },
    { quote: "Running a small pharmacy, Veri9 helps us quickly verify pharmaceutical products and check for FDA recalls.", name: "Dr. Chen W.", role: "Pharmacist, Toronto", avatar: "CW", color: "#0ea5e9" },
    { quote: "Simple, fast, and incredibly reliable. Every parent should have Veri9 to check children's products for safety.", name: "Maria L.", role: "Parent, Sydney", avatar: "ML", color: "#f59e0b" },
    { quote: "Used Veri9 at a market and found counterfeit cosmetics being sold. The community report feature is essential.", name: "Aisha T.", role: "Consumer Advocate, Lagos", avatar: "AT", color: "#ec4899" },
    { quote: "The API access for our e-commerce platform is seamless. Our customers can verify products before checkout.", name: "Alex R.", role: "E-commerce Developer", avatar: "AR", color: "#8b5cf6" },
  ]

  return (
    <section style={{ padding: 'clamp(64px, 8vw, 100px) 0', background: '#fafafa', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 56px)' }}>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Trusted by consumers worldwide
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
            Join 250,000+ people who use Veri9 every day
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {testimonials.map(t => (
            <div key={t.name} style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', marginBottom: 14 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" style={{ marginRight: 2 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color + '20', color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
