'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 32px', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Image src="/logo.svg" alt="Veri9" width={32} height={32} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Veri<span style={{ color: '#818cf8' }}>9</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2, marginLeft: 20 }}>
            {[
              { href: '/', label: 'Home' },
              { href: '/scanner', label: 'Scan' },
              { href: '/community', label: 'Community' },
              { href: '/brands', label: 'For Brands' },
              { href: '/blog', label: 'Blog' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: '0.875rem',
                fontWeight: 500, color: isActive(link.href) ? '#4F46E5' : '#4b5563',
                background: isActive(link.href) ? '#eef2ff' : 'transparent',
                textDecoration: 'none', transition: 'all 0.18s'
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <Link href="/dashboard" style={{
                padding: '7px 16px', borderRadius: 8, fontSize: '0.85rem',
                fontWeight: 600, color: '#0f172a', border: '1.5px solid #e5e7eb',
                background: '#fff', textDecoration: 'none'
              }}>
                <i className="fas fa-user" style={{ marginRight: 6 }}></i> Dashboard
              </Link>
              <button onClick={signOut} style={{
                padding: '7px 16px', borderRadius: 8, fontSize: '0.85rem',
                fontWeight: 600, color: '#fff', background: '#4F46E5',
                border: 'none', cursor: 'pointer'
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                padding: '7px 16px', borderRadius: 8, fontSize: '0.85rem',
                fontWeight: 600, color: '#0f172a', border: '1.5px solid #e5e7eb',
                background: '#fff', textDecoration: 'none'
              }}>
                Sign In
              </Link>
              <Link href="/signup" style={{
                padding: '7px 16px', borderRadius: 8, fontSize: '0.85rem',
                fontWeight: 600, color: '#fff', background: '#4F46E5',
                textDecoration: 'none'
              }}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', gap: 5 }}
          aria-label="Toggle menu"
        >
          <span style={{
            display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2,
            transition: 'all 0.3s',
            transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none'
          }} />
          <span style={{
            display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2,
            transition: 'all 0.3s',
            opacity: menuOpen ? 0 : 1
          }} />
          <span style={{
            display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2,
            transition: 'all 0.3s',
            transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none'
          }} />
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 64, left: 0, right: 0,
          background: '#fff', zIndex: 199,
          borderTop: '1px solid #f1f5f9',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '12px 20px 16px', gap: 4
        }}>
          {[
            { href: '/', label: 'Home', icon: 'fa-home' },
            { href: '/scanner', label: 'Scan Product', icon: 'fa-barcode' },
            { href: '/community', label: 'Community', icon: 'fa-users' },
            { href: '/brands', label: 'For Brands', icon: 'fa-building' },
            { href: '/blog', label: 'Blog', icon: 'fa-newspaper' },
          ].map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '10px 12px', borderRadius: 8, fontSize: '0.95rem',
                fontWeight: 500, color: '#4b5563', textDecoration: 'none', display: 'block'
              }}>
              <i className={`fas ${link.icon}`} style={{ marginRight: 10, width: 18, textAlign: 'center' }}></i>
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: '0.95rem',
                  fontWeight: 600, color: '#0f172a', border: '1.5px solid #e5e7eb',
                  background: '#fff', textDecoration: 'none', textAlign: 'center'
                }}>
                  <i className="fas fa-user" style={{ marginRight: 8 }}></i> Dashboard
                </Link>
                <button onClick={() => { signOut(); setMenuOpen(false) }} style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: '0.95rem',
                  fontWeight: 600, color: '#fff', background: '#4F46E5',
                  border: 'none', cursor: 'pointer', width: '100%'
                }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: '0.95rem',
                  fontWeight: 600, color: '#0f172a', border: '1.5px solid #e5e7eb',
                  background: '#fff', textDecoration: 'none', display: 'block', textAlign: 'center'
                }}>
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: '0.95rem',
                  fontWeight: 600, color: '#fff', background: '#4F46E5',
                  textDecoration: 'none', display: 'block', textAlign: 'center'
                }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}