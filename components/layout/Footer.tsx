import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 32px 0' }}>
        {/* Top Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
              <Image src="/logo.svg" alt="Veri9" width={32} height={32} />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Veri<span style={{ color: '#818cf8' }}>9</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.87rem', lineHeight: 1.7, color: '#64748b', maxWidth: 260 }}>
              The world's most trusted product verification platform. Protect yourself from counterfeit goods with real-time verification across 9+ global databases.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {[
                { icon: 'fa-twitter', href: '#' },
                { icon: 'fa-linkedin', href: '#' },
                { icon: 'fa-instagram', href: '#' },
                { icon: 'fa-facebook', href: '#' },
              ].map(s => (
                <a key={s.icon} href={s.href} style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', fontSize: '0.9rem', transition: 'all 0.2s'
                }}>
                  <i className={`fab ${s.icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 16 }}>
              Product
            </div>
            {[
              { href: '/scanner', label: 'Scan a Product' },
              { href: '/community', label: 'Community Reports' },
              { href: '/brands', label: 'Brand Registration' },
              { href: '/api/sources', label: 'Data Sources' },
              { href: '/#pricing', label: 'Pricing' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: '0.87rem', color: '#64748b', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 16 }}>
              Company
            </div>
            {[
              { href: '/about', label: 'About Us' },
              { href: '/blog', label: 'Blog' },
              { href: '/careers', label: 'Careers' },
              { href: '/contact', label: 'Contact Us' },
              { href: '/security', label: 'Security' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: '0.87rem', color: '#64748b', textDecoration: 'none', marginBottom: 10 }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 16 }}>
              Legal
            </div>
            {[
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms', label: 'Terms of Service' },
              { href: '/cookies', label: 'Cookie Policy' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: '0.87rem', color: '#64748b', textDecoration: 'none', marginBottom: 10 }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #1e293b', padding: '20px 0',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 12
        }}>
          <p style={{ fontSize: '0.82rem', color: '#475569' }}>
            © {year} Veri9. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.78rem', fontWeight: 600
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}