import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function Page() {
  const titles: Record<string, string> = {
    blog: 'Blog', privacy: 'Privacy Policy', terms: 'Terms of Service', security: 'Security'
  }
  const name = 'privacy'
  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4F46E5 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{titles[name]}</h1>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px,6vw,80px) 24px' }}>
        <p style={{ fontSize: '1rem', color: '#4b5563', lineHeight: 1.85 }}>
          This page is coming soon. Please check back later or <a href="/contact" style={{ color: '#4F46E5' }}>contact us</a> for more information.
        </p>
      </div>
      <Footer />
    </>
  )
}
