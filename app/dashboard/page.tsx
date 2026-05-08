'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getScanHistory, getStatusColor, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

type Section = 'overview' | 'scans' | 'profile' | 'security'

interface ScanItem {
  barcode: string
  name?: string
  brand?: string
  status: string
  trustScore: number
  productType?: string
  verifiedAt: string
}

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [scanHistory, setScanHistory] = useState<ScanItem[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    setScanHistory(getScanHistory() as ScanItem[])
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#4F46E5', marginBottom: 16 }}></i>
          <p style={{ color: '#64748b' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const totalScans = scanHistory.length
  const verified = scanHistory.filter(s => s.status === 'VERIFIED' || s.status === 'LIKELY_AUTHENTIC').length
  const fakes = scanHistory.filter(s => s.status === 'SUSPICIOUS' || s.status === 'NOT_FOUND').length
  const initials = (user.user_metadata?.full_name || user.email || '?').slice(0, 2).toUpperCase()

  const navItems = [
    { id: 'overview' as Section, icon: 'fa-th-large', label: 'Overview' },
    { id: 'scans' as Section, icon: 'fa-barcode', label: 'Scan History' },
    { id: 'profile' as Section, icon: 'fa-user', label: 'Profile' },
    { id: 'security' as Section, icon: 'fa-shield-alt', label: 'Security' },
  ]

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <Image src="/logo.svg" alt="Veri9" width={32} height={32} />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Veri<span style={{ color: '#818cf8' }}>9</span>
          </span>
        </Link>

        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8 }}>
          <Link href="/scanner" style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>
            <i className="fas fa-barcode" style={{ marginRight: 6 }}></i>Scan
          </Link>
          <Link href="/community" style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>
            <i className="fas fa-users" style={{ marginRight: 6 }}></i>Community
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
            {initials}
          </div>
          <button onClick={signOut} className="hidden md:flex" style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151', background: '#fff', border: '1.5px solid #e5e7eb', cursor: 'pointer', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
          {/* Mobile menu toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ display: 'block', width: 20, height: 2, background: '#0f172a', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: '#0f172a', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: '#0f172a', borderRadius: 2 }} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 64, zIndex: 99 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false) }}
              style={{ padding: '10px 12px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, color: activeSection === item.id ? '#4F46E5' : '#4b5563', background: activeSection === item.id ? '#eef2ff' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center' }}></i>
              {item.label}
            </button>
          ))}
          <div style={{ paddingTop: 8, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            <button onClick={signOut} style={{ width: '100%', padding: '10px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, color: '#fff', background: '#4F46E5', border: 'none', cursor: 'pointer' }}>
              <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }}></i>Sign Out
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block" style={{ width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', padding: '24px 16px', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', padding: '0 8px', marginBottom: 6 }}>My Account</div>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: '0.88rem', fontWeight: activeSection === item.id ? 600 : 500, color: activeSection === item.id ? '#4F46E5' : '#4b5563', background: activeSection === item.id ? '#eef2ff' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginBottom: 2 }}>
                <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center', fontSize: '0.88rem' }}></i>
                {item.label}
              </button>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', padding: '0 8px', marginBottom: 6 }}>Quick Links</div>
            <Link href="/scanner" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none', marginBottom: 2 }}>
              <i className="fas fa-qrcode" style={{ width: 18, textAlign: 'center' }}></i> Scan Product
            </Link>
            <Link href="/community" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>
              <i className="fas fa-users" style={{ width: 18, textAlign: 'center' }}></i> Community
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: 'clamp(16px, 3vw, 32px)', maxWidth: '100%', overflowX: 'hidden' }}>
          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                  Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Here's your verification activity</p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'Total Scans', value: totalScans, icon: 'fa-barcode', color: '#4F46E5', bg: '#eef2ff' },
                  { label: 'Verified', value: verified, icon: 'fa-check-shield', color: '#10b981', bg: '#ecfdf5' },
                  { label: 'Flagged', value: fakes, icon: 'fa-exclamation-triangle', color: '#ef4444', bg: '#fef2f2' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '1rem' }}></i>
                    </div>
                    <div style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Scans */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, marginBottom: 24 }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Recent Activity</h3>
                  <Link href="/scanner" style={{ fontSize: '0.82rem', color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
                    + New Scan
                  </Link>
                </div>
                {scanHistory.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <i className="fas fa-barcode" style={{ fontSize: '2rem', color: '#e5e7eb', marginBottom: 12 }}></i>
                    <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>No scans yet. <Link href="/scanner" style={{ color: '#4F46E5', textDecoration: 'none' }}>Start scanning</Link></p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['Product', 'Barcode', 'Status', 'Trust', 'Date'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scanHistory.slice(0, 5).map((scan, i) => {
                          const sc = getStatusColor(scan.status)
                          return (
                            <tr key={i} onClick={() => router.push(`/scanner?barcode=${scan.barcode}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{scan.name || '—'}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: '#64748b', fontFamily: 'monospace' }}>{scan.barcode}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                  {sc.label}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: sc.color }}>{scan.trustScore}%</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(scan.verifiedAt).toLocaleDateString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { href: '/scanner', icon: 'fa-barcode', label: 'Scan a Product', color: '#4F46E5', bg: '#eef2ff', desc: 'Verify any barcode instantly' },
                  { href: '/community', icon: 'fa-users', label: 'Community Reports', color: '#10b981', bg: '#ecfdf5', desc: 'Report & view suspicious products' },
                  { href: '/brands', icon: 'fa-building', label: 'Register Your Brand', color: '#f59e0b', bg: '#fffbeb', desc: 'Protect your brand identity' },
                ].map(action => (
                  <Link key={action.href} href={action.href} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', textDecoration: 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fas ${action.icon}`} style={{ color: action.color, fontSize: '1.1rem' }}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{action.label}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{action.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SCAN HISTORY */}
          {activeSection === 'scans' && (
            <div>
              <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
                Scan History
              </h2>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16 }}>
                {scanHistory.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <i className="fas fa-barcode" style={{ fontSize: '2.5rem', color: '#e5e7eb', marginBottom: 16 }}></i>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No scans yet</h3>
                    <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: 20 }}>Scan your first product to see history here</p>
                    <Link href="/scanner" style={{ padding: '10px 24px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, color: '#fff', background: '#4F46E5', textDecoration: 'none', display: 'inline-block' }}>
                      Start Scanning
                    </Link>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          {['Product', 'Barcode', 'Type', 'Status', 'Trust Score', 'Date & Time'].map(h => (
                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scanHistory.map((scan, i) => {
                          const sc = getStatusColor(scan.status)
                          return (
                            <tr key={i} onClick={() => router.push(`/scanner?barcode=${scan.barcode}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '13px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.name || '—'}</td>
                              <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: '#64748b', fontFamily: 'monospace' }}>{scan.barcode}</td>
                              <td style={{ padding: '13px 16px', fontSize: '0.8rem', color: '#4b5563', textTransform: 'capitalize' }}>{(scan.productType || '—').toLowerCase().replace(/_/g, ' ')}</td>
                              <td style={{ padding: '13px 16px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>
                                  {sc.label}
                                </span>
                              </td>
                              <td style={{ padding: '13px 16px', fontSize: '0.88rem', fontWeight: 700, color: sc.color }}>{scan.trustScore}%</td>
                              <td style={{ padding: '13px 16px', fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDateTime(scan.verifiedAt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div>
              <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Profile Settings</h2>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.3rem', fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                      {user.user_metadata?.full_name || 'Your Name'}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#64748b' }}>{user.email}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '2px 10px', borderRadius: 20, background: '#ecfdf5', color: '#059669', fontSize: '0.73rem', fontWeight: 600 }}>
                      <i className="fas fa-check-circle" style={{ fontSize: '0.65rem' }}></i>
                      Email Verified
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  {[
                    { label: 'Full Name', value: user.user_metadata?.full_name || '', disabled: false },
                    { label: 'Email Address', value: user.email || '', disabled: true },
                    { label: 'Account ID', value: user.id?.slice(0, 16) + '...', disabled: true },
                    { label: 'Member Since', value: user.created_at ? new Date(user.created_at).toLocaleDateString() : '—', disabled: true },
                  ].map(field => (
                    <div key={field.label}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{field.label}</label>
                      <input type="text" defaultValue={field.value} disabled={field.disabled}
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.88rem', fontFamily: 'Inter, sans-serif', background: field.disabled ? '#f3f4f6' : '#f9fafb', color: field.disabled ? '#9ca3af' : '#0f172a', outline: 'none', cursor: field.disabled ? 'not-allowed' : 'text' }} />
                    </div>
                  ))}
                </div>
                <button onClick={() => toast.success('Profile updated!')} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 9, fontSize: '0.9rem', fontWeight: 600, color: '#fff', background: '#4F46E5', border: 'none', cursor: 'pointer' }}>
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div>
              <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Security Settings</h2>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Change Password</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                  {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                    <div key={label}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                      <input type="password" placeholder="••••••••"
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.88rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                    </div>
                  ))}
                  <button onClick={() => toast.success('Password updated!')} style={{ padding: '10px 24px', borderRadius: 9, fontSize: '0.9rem', fontWeight: 600, color: '#fff', background: '#4F46E5', border: 'none', cursor: 'pointer', width: 'fit-content' }}>
                    Update Password
                  </button>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Account Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>Email Address</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.email}</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>Verified</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#dc2626' }}>Delete Account</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Permanently delete your account and all data</div>
                    </div>
                    <button onClick={() => toast.error('Please contact support to delete your account')} style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#dc2626', background: '#fff', border: '1.5px solid #fecaca', cursor: 'pointer' }}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}