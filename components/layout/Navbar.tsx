'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, signOut, isAdmin } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname === href

  const navLinks = [
    { href: '/scanner', label: 'Scanner' },
    { href: '/community', label: 'Community' },
    { href: '/brands', label: 'For Brands' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ]

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid rgba(226,232,240,0.6)',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.2s ease',
        height: 64,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 24px', height: '100%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Image src="/logo.png" alt="Veri9 Shield Logo" width={36} height={36} style={{ objectFit: 'contain' }} priority />
            </div>
            <span style={{
              fontSize: '1.2rem', fontWeight: 800, color: '#0f172a',
              letterSpacing: '-0.03em',
            }}>
              Veri<span style={{ color: '#635bff' }}>9</span>
            </span>
          </Link>

          {/* Desktop Nav Links - center */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          }} className="hidden-mobile">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: isActive(link.href) ? 600 : 500,
                color: isActive(link.href) ? '#635bff' : '#475569',
                background: isActive(link.href) ? '#f0f0ff' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive(link.href)) {
                  (e.target as HTMLElement).style.color = '#0f172a'
                  ;(e.target as HTMLElement).style.background = '#f8fafc'
                }
              }}
              onMouseLeave={e => {
                if (!isActive(link.href)) {
                  (e.target as HTMLElement).style.color = '#475569'
                  ;(e.target as HTMLElement).style.background = 'transparent'
                }
              }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden-mobile">
            {user ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem',
                    fontWeight: 600, color: '#635bff',
                    border: '1px solid #c7d2fe',
                    background: '#f0f0ff',
                    textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                    ⚙️ Admin Panel
                  </Link>
                ) : (
                  <Link href="/dashboard" style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem',
                    fontWeight: 600, color: '#475569',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Dashboard
                  </Link>
                )}
                <button onClick={signOut} style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem',
                  fontWeight: 600, color: '#fff',
                  background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,91,255,0.3)',
                  transition: 'all 0.15s',
                }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem',
                  fontWeight: 600, color: '#475569',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}>
                  Sign In
                </Link>
                <Link href="/signup" style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem',
                  fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(99,91,255,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                  Get Started
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger — only on mobile */}
          <button
            className="show-mobile"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, borderRadius: 8,
              display: 'none', // controlled by CSS class
              flexDirection: 'column', gap: 5,
              alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40,
            }}
            aria-label="Toggle menu"
          >
            <span style={{
              display: 'block', width: 20, height: 2,
              background: '#0f172a', borderRadius: 2,
              transition: 'all 0.25s',
              transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none',
            }} />
            <span style={{
              display: 'block', width: 20, height: 2,
              background: '#0f172a', borderRadius: 2,
              transition: 'all 0.25s',
              opacity: mobileOpen ? 0 : 1,
            }} />
            <span style={{
              display: 'block', width: 20, height: 2,
              background: '#0f172a', borderRadius: 2,
              transition: 'all 0.25s',
              transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
            }} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        zIndex: 199,
        transform: mobileOpen ? 'translateY(0)' : 'translateY(-110%)',
        opacity: mobileOpen ? 1 : 0,
        transition: 'transform 0.25s ease, opacity 0.2s ease',
        padding: '16px 20px 20px',
      }} className="show-mobile-block">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '10px 14px', borderRadius: 8, fontSize: '0.95rem',
                fontWeight: isActive(link.href) ? 600 : 500,
                color: isActive(link.href) ? '#635bff' : '#475569',
                background: isActive(link.href) ? '#f0f0ff' : 'transparent',
                textDecoration: 'none', display: 'block',
              }}>
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{
          paddingTop: 12, borderTop: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/admin" onClick={() => setMobileOpen(false)} style={{
                  padding: '11px 16px', borderRadius: 10, fontSize: '0.95rem',
                  fontWeight: 600, color: '#635bff',
                  border: '1px solid #c7d2fe', background: '#f0f0ff',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  ⚙️ Admin Panel
                </Link>
              ) : (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{
                  padding: '11px 16px', borderRadius: 10, fontSize: '0.95rem',
                  fontWeight: 600, color: '#0f172a',
                  border: '1px solid #e2e8f0', background: '#fff',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  Dashboard
                </Link>
              )}
              <button onClick={() => { signOut(); setMobileOpen(false) }} style={{
                padding: '11px 16px', borderRadius: 10, fontSize: '0.95rem',
                fontWeight: 600, color: '#fff',
                background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                border: 'none', cursor: 'pointer', width: '100%',
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} style={{
                padding: '11px 16px', borderRadius: 10, fontSize: '0.95rem',
                fontWeight: 600, color: '#0f172a',
                border: '1px solid #e2e8f0', background: '#fff',
                textDecoration: 'none', display: 'block', textAlign: 'center',
              }}>
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} style={{
                padding: '11px 16px', borderRadius: 10, fontSize: '0.95rem',
                fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
                textDecoration: 'none', display: 'block', textAlign: 'center',
              }}>
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
          .show-mobile-block { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .show-mobile-block { display: block !important; }
        }
      `}</style>
    </>
  )
}