'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

interface VerifyResult {
  status: string
  trustScore: number
  manufacturer: string
  brand: string
  name: string
  category: string
  country: string
  sources: string[]
  recall: boolean
  gs1Region: string
  nutritionGrade: string
}

export default function ScannerClient() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
      <ScannerClientInner />
    </Suspense>
  )
}

function ScannerClientInner() {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'
  const { user, loading: authLoading } = useAuth()
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    const clean = barcode.replace(/[\s-]/g, '')
    if (!/^\d{6,14}$/.test(clean)) {
      toast.error('Enter a valid barcode (6-14 digits)')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: clean }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || data.message || 'Verification failed')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const getTrustColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getTrustLabel = (score: number) => {
    if (score >= 80) return 'Likely Authentic'
    if (score >= 50) return 'Uncertain'
    return 'Likely Counterfeit'
  }

  const isLoggedIn = !!user

  return (
    <>
      {!isEmbed && <Navbar />}
      <main style={{ background: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
        {/* ── HERO ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4F46E5 100%)',
          padding: 'clamp(60px, 10vw, 100px) 24px clamp(40px, 6vw, 60px)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.03em',
            marginBottom: 12,
          }}>
            Free Barcode Scanner
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            color: 'rgba(255,255,255,0.8)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Scan or type any barcode to instantly verify product authenticity with Veri9's advanced verification engine.
          </p>
        </section>

        {/* ── SCANNER INPUT (gated by auth) ── */}
        <section style={{ maxWidth: 640, margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: 'clamp(20px, 4vw, 32px)',
            border: '1px solid #e5e7eb',
          }}>
            {authLoading ? (
              /* Still loading auth state — show spinner */
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid #e5e7eb', borderTopColor: '#635bff',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                }} />
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : isLoggedIn ? (
              /* ── SIGNED IN — show the scanner ── */
              <>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Enter Barcode Number
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value.replace(/[^\d\s-]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    placeholder="e.g. 8901234567890"
                    inputMode="numeric"
                    style={{
                      flex: '1 1 200px',
                      minWidth: 0,
                      padding: '12px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: 10,
                      fontSize: '1rem',
                      fontFamily: 'Inter, monospace',
                      background: '#f8fafc',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleVerify}
                    disabled={loading || !barcode.trim()}
                    style={{
                      padding: '12px 20px',
                      background: loading || !barcode.trim() ? '#a5b4fc' : '#635bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: loading || !barcode.trim() ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      flex: '1 1 auto',
                    }}
                  >
                    {loading ? (
                      <><i className="fas fa-circle-notch fa-spin" /> Scanning…</>
                    ) : (
                      <><i className="fas fa-search" /> Verify</>
                    )}
                  </button>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8 }}>
                  Supports UPC, EAN-13, EAN-8, and ISBN barcodes (6-14 digits)
                </p>

                {/* ── RESULT ── */}
                {result && (
                  <div style={{
                    marginTop: 20,
                    padding: 20,
                    background: '#f8fafc',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: `${getTrustColor(result.trustScore)}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `3px solid ${getTrustColor(result.trustScore)}`,
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: getTrustColor(result.trustScore) }}>
                          {result.trustScore}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: getTrustColor(result.trustScore) }}>
                          {getTrustLabel(result.trustScore)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                          Trust Score out of 100
                        </div>
                      </div>
                    </div>

                    {result.name && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>PRODUCT</span>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{result.name}</div>
                      </div>
                    )}
                    {result.brand && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>BRAND</span>
                        <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{result.brand}</div>
                      </div>
                    )}
                    {result.manufacturer && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>MANUFACTURER</span>
                        <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{result.manufacturer}</div>
                      </div>
                    )}
                    {result.category && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>CATEGORY</span>
                        <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{result.category}</div>
                      </div>
                    )}
                    {result.recall && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#fef2f2',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}>
                        ⚠️ ACTIVE RECALL — This product has been recalled. Do not use.
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    background: '#fef2f2',
                    borderRadius: 10,
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.9rem',
                  }}>
                    <strong>Verification Failed:</strong> {error}
                  </div>
                )}
              </>
            ) : (
              /* ── NOT SIGNED IN — show sign-in gate ── */
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: '#eef2ff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <i className="fas fa-lock" style={{ color: '#635bff', fontSize: '1.3rem' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Sign In to Scan Products
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
                  Create a free account or sign in to verify product authenticity using our barcode scanner.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href="/login"
                    style={{
                      padding: '10px 24px',
                      background: '#635bff',
                      color: '#fff',
                      borderRadius: 10,
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="fas fa-sign-in-alt" /> Sign In
                  </Link>
                  <Link
                    href="/signup"
                    style={{
                      padding: '10px 24px',
                      background: '#fff',
                      color: '#635bff',
                      border: '1.5px solid #635bff',
                      borderRadius: 10,
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="fas fa-user-plus" /> Create Free Account
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 32,
            textAlign: 'center',
          }}>
            How Barcode Verification Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 24 }}>
            {[
              { step: '1', icon: 'fa-keyboard', title: 'Enter Barcode', desc: 'Type or paste the barcode number from any product packaging. Supports UPC, EAN-13, EAN-8, and ISBN formats.' },
              { step: '2', icon: 'fa-brain', title: 'AI-Powered Analysis', desc: 'Veri9 analyzes the barcode using advanced verification intelligence to cross-check product details and brand ownership.' },
              { step: '3', icon: 'fa-shield-halved', title: 'Get Trust Score', desc: 'Receive an instant trust score from 0-100. Scores above 80 indicate authentic products; below 50 signals potential counterfeits.' },
              { step: '4', icon: 'fa-flag', title: 'Check for Recalls', desc: 'Veri9 also checks for active product safety recalls, protecting you from dangerous goods.' },
            ].map(item => (
              <div key={item.step} style={{
                padding: 24,
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: '#eef2ff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <i className={`fas ${item.icon}`} style={{ color: '#635bff', fontSize: '1.1rem' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA (only for logged-out users) ── */}
        {!isLoggedIn && (
          <section style={{ padding: 'clamp(48px, 8vw, 80px) 24px', textAlign: 'center' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: 16,
              }}>
                Start Verifying Products Now
              </h2>
              <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                Create a free account to scan barcodes, check product authenticity, view verification history, and receive recall alerts. No credit card required.
              </p>
              <Link href="/signup" style={{
                padding: '14px 32px',
                background: '#635bff',
                color: '#fff',
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '1.05rem',
                display: 'inline-block',
              }}>
                Create Free Account
              </Link>
            </div>
          </section>
        )}
      </main>
      {!isEmbed && <Footer />}
    </>
  )
}
