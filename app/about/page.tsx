import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4F46E5 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>About Veri9</h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75 }}>
            We're on a mission to build a world where every consumer can trust the products they buy.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px,6vw,80px) 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 14, letterSpacing: '-0.02em' }}>Our Mission</h2>
            <p style={{ fontSize: '0.97rem', color: '#4b5563', lineHeight: 1.85 }}>
              Veri9 was founded with a simple but powerful mission: to make product verification accessible to everyone. Counterfeiting costs the global economy over $4.5 trillion every year and puts consumers' health and safety at risk. We believe technology can change that.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 14, letterSpacing: '-0.02em' }}>How We Work</h2>
            <p style={{ fontSize: '0.97rem', color: '#4b5563', lineHeight: 1.85 }}>
              Our platform cross-references product barcodes against 9+ trusted global databases simultaneously — including Open Food Facts, the FDA National Drug Code database, UPCitemdb, Open Library, USDA FoodData Central, GS1 country prefix data, and more. This multi-source approach gives you a comprehensive trust score you can rely on.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 14, letterSpacing: '-0.02em' }}>Our Values</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {[
                { icon: 'fa-lock', title: 'Transparency', desc: 'We show you exactly which databases we query and what they returned.' },
                { icon: 'fa-heart', title: 'Consumer First', desc: 'We are always free for consumers. No paywalls on verification.' },
                { icon: 'fa-globe', title: 'Open Data', desc: 'We use and contribute to open data initiatives worldwide.' },
                { icon: 'fa-shield-alt', title: 'Safety', desc: 'We flag recalled products and report safety hazards immediately.' },
              ].map(v => (
                <div key={v.title} style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 18px', border: '1px solid #e5e7eb' }}>
                  <i className={`fas ${v.icon}`} style={{ color: '#4F46E5', fontSize: '1.2rem', marginBottom: 10, display: 'block' }}></i>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{v.title}</h3>
                  <p style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.65 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}