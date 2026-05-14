'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'


const endpoints = [
  {
    method: 'GET',
    path: '/api/verify',
    title: 'Verify a Product',
    desc: 'Verify a product barcode against all 9+ global intelligence sources and return a comprehensive verification result.',
    params: [
      { name: 'barcode', type: 'string', required: true, desc: 'The product barcode (EAN-8, EAN-13, UPC-A, ISBN)' },
    ],
    example: `GET https://veri9.com/api/verify?barcode=5901234123457

Response:
{
  "barcode": "5901234123457",
  "status": "authentic",
  "trustScore": 94,
  "productType": "Food",
  "productInfo": {
    "name": "Organic Olive Oil 500ml",
    "brand": "Terra Delyssa",
    "country": "Tunisia",
    "barcodeType": "EAN-13"
  },
  "sources": {
    "openFoodFacts": { "found": true },
    "gs1CompanyDb": { "found": true },
    "openFDA": { "found": false }
  },
  "crossReference": {
    "passed": 7,
    "total": 9,
    "percentage": 77
  },
  "verifiedAt": "2025-06-10T12:34:56.789Z"
}`,
    color: '#10b981', colorBg: '#f0fdf4',
  },
  {
    method: 'GET',
    path: '/api/product',
    title: 'Get Product Info',
    desc: 'Retrieve detailed product information from our verification engine without full verification scoring.',
    params: [
      { name: 'barcode', type: 'string', required: true, desc: 'The product barcode' },
      { name: 'source', type: 'string', required: false, desc: 'Specific source to query (e.g. openFoodFacts, openFDA)' },
    ],
    example: `GET https://veri9.com/api/product?barcode=0049000028911

Response:
{
  "barcode": "0049000028911",
  "name": "Coca-Cola Classic 355ml",
  "brand": "The Coca-Cola Company",
  "category": "Beverages",
  "ingredients": "...",
  "nutritionFacts": { ... },
  "images": ["https://..."]
}`,
    color: '#635bff', colorBg: '#f0f0ff',
  },
  {
    method: 'POST',
    path: '/api/report',
    title: 'Submit a Report',
    desc: 'Submit a counterfeit report for a specific product barcode. Requires authentication.',
    params: [
      { name: 'barcode', type: 'string', required: true, desc: 'The suspect product barcode' },
      { name: 'description', type: 'string', required: true, desc: 'Description of why you believe it is counterfeit' },
      { name: 'location', type: 'string', required: false, desc: 'Location where found' },
      { name: 'images', type: 'string[]', required: false, desc: 'Base64 encoded images of the suspect product' },
    ],
    example: `POST https://veri9.com/api/report
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "barcode": "0885909950805",
  "description": "Packaging looks off, charger gets extremely hot",
  "location": "Lagos, Nigeria"
}

Response:
{
  "reportId": "RPT-2025-001234",
  "status": "submitted",
  "message": "Report received and under review"
}`,
    color: '#f59e0b', colorBg: '#fffbeb',
  },
]

export default function ApiDocsPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#fafafa', minHeight: '100vh' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #312e81 100%)',
          padding: 'clamp(48px, 8vw, 80px) 24px clamp(40px, 6vw, 64px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 60% at 70% 50%, rgba(99,91,255,0.2) 0%, transparent 70%)' }} />
          <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,91,255,0.2)', border: '1px solid rgba(99,91,255,0.4)',
              borderRadius: 9999, padding: '4px 14px', marginBottom: 20,
              fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc',
            }}>
              Developer API
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>
              Veri9 API Documentation
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 28, maxWidth: 560 }}>
              Integrate Veri9's product verification directly into your apps, e-commerce platforms, or internal tools with our simple REST API.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                REST API
              </div>
              <div style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                JSON Responses
              </div>
              <div style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Free Tier Available
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 36, alignItems: 'start' }} className="api-layout">

            {/* Sidebar */}
            <div style={{
              position: 'sticky', top: 80,
              background: '#fff', borderRadius: 14,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Contents
              </div>
              {['Authentication', 'Base URL', 'Rate Limits', 'Endpoints', 'Error Codes', 'SDKs'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} style={{
                  display: 'block', padding: '9px 16px',
                  fontSize: '0.875rem', color: '#475569', fontWeight: 500,
                  textDecoration: 'none', borderBottom: '1px solid #f8fafc',
                  transition: 'color 0.15s',
                }}>
                  {item}
                </a>
              ))}
            </div>

            {/* Main docs */}
            <div>
              {/* Authentication */}
              <section id="authentication" style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  Authentication
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.75, marginBottom: 16 }}>
                  The Veri9 API uses API keys for authentication. Include your API key in the request header:
                </p>
                <div style={{
                  background: '#0f172a', borderRadius: 12, padding: '16px 20px',
                  fontFamily: 'monospace', fontSize: '0.875rem', color: '#94a3b8',
                  marginBottom: 16, overflow: 'auto',
                }}>
                  <span style={{ color: '#64748b' }}>Authorization: </span>
                  <span style={{ color: '#34d399' }}>Bearer </span>
                  <span style={{ color: '#818cf8' }}>v9_live_xxxxxxxxxxxxxxxxxxxxxxxx</span>
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: '#f0f9ff', border: '1px solid #bae6fd',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  fontSize: '0.875rem', color: '#0369a1',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>The <strong>/api/verify</strong> endpoint is publicly accessible without authentication for up to 100 requests per day. An API key is required for higher limits.</span>
                </div>
              </section>

              {/* Base URL */}
              <section id="base-url" style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  Base URL
                </h2>
                <div style={{
                  background: '#0f172a', borderRadius: 12, padding: '16px 20px',
                  fontFamily: 'monospace', fontSize: '0.875rem', marginBottom: 12,
                }}>
                  <span style={{ color: '#34d399' }}>https://</span>
                  <span style={{ color: '#f8fafc' }}>veri9.com</span>
                  <span style={{ color: '#818cf8' }}>/api</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.75 }}>
                  All API requests must be made over HTTPS. HTTP requests will be rejected.
                </p>
              </section>

              {/* Rate Limits */}
              <section id="rate-limits" style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  Rate Limits
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                  {[
                    { tier: 'Free', limit: '100 req/day', color: '#64748b', bg: '#f8fafc' },
                    { tier: 'Registered', limit: '1,000 req/day', color: '#635bff', bg: '#f0f0ff' },
                    { tier: 'Brand Partner', limit: '10,000 req/day', color: '#10b981', bg: '#f0fdf4' },
                    { tier: 'Enterprise', limit: 'Unlimited', color: '#f59e0b', bg: '#fffbeb' },
                  ].map(t => (
                    <div key={t.tier} style={{
                      padding: '16px', borderRadius: 12,
                      background: t.bg, border: `1px solid ${t.color}30`,
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: t.color, marginBottom: 6 }}>{t.tier}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{t.limit}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Endpoints */}
              <section id="endpoints" style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  Endpoints
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {endpoints.map(ep => (
                    <div key={ep.path} style={{
                      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
                      overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                      {/* Endpoint header */}
                      <div style={{
                        padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                      }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 6,
                          fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em',
                          background: ep.colorBg, color: ep.color, fontFamily: 'monospace',
                        }}>
                          {ep.method}
                        </span>
                        <code style={{
                          fontSize: '0.9rem', fontWeight: 600, color: '#0f172a',
                          background: '#f8fafc', padding: '4px 10px', borderRadius: 6,
                          border: '1px solid #e2e8f0',
                        }}>
                          {ep.path}
                        </code>
                        <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{ep.title}</span>
                      </div>
                      <div style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>{ep.desc}</p>
                        {/* Parameters */}
                        <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Parameters
                        </h4>
                        <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                          {ep.params.map((p, i) => (
                            <div key={p.name} style={{
                              display: 'grid', gridTemplateColumns: '120px 80px 60px 1fr',
                              padding: '10px 14px', gap: 12, alignItems: 'center',
                              background: i % 2 === 0 ? '#f8fafc' : '#fff',
                              borderBottom: i < ep.params.length - 1 ? '1px solid #f1f5f9' : 'none',
                              fontSize: '0.82rem',
                            }}>
                              <code style={{ fontWeight: 700, color: '#635bff' }}>{p.name}</code>
                              <span style={{ color: '#94a3b8' }}>{p.type}</span>
                              <span style={{
                                padding: '2px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 600,
                                background: p.required ? '#fef2f2' : '#f8fafc',
                                color: p.required ? '#ef4444' : '#94a3b8',
                              }}>
                                {p.required ? 'required' : 'optional'}
                              </span>
                              <span style={{ color: '#64748b' }}>{p.desc}</span>
                            </div>
                          ))}
                        </div>
                        {/* Example */}
                        <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Example
                        </h4>
                        <pre style={{
                          background: '#0f172a', borderRadius: 10, padding: '16px',
                          fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8',
                          overflow: 'auto', lineHeight: 1.7, margin: 0,
                        }}>
                          {ep.example}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Error Codes */}
              <section id="error-codes" style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  Error Codes
                </h2>
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {[
                    { code: '200', status: 'OK', desc: 'Successful request' },
                    { code: '400', status: 'Bad Request', desc: 'Invalid or missing barcode parameter' },
                    { code: '401', status: 'Unauthorized', desc: 'Invalid or missing API key' },
                    { code: '404', status: 'Not Found', desc: 'Product not found in our system' },
                    { code: '429', status: 'Too Many Requests', desc: 'Rate limit exceeded' },
                    { code: '500', status: 'Server Error', desc: 'Internal server error, please retry' },
                  ].map((e, i) => (
                    <div key={e.code} style={{
                      display: 'grid', gridTemplateColumns: '60px 140px 1fr',
                      padding: '12px 20px', gap: 16, alignItems: 'center',
                      borderBottom: i < 5 ? '1px solid #f8fafc' : 'none',
                      fontSize: '0.875rem',
                    }}>
                      <code style={{
                        fontWeight: 800,
                        color: e.code.startsWith('2') ? '#10b981' : e.code.startsWith('4') ? '#f59e0b' : '#ef4444',
                        fontFamily: 'monospace', fontSize: '0.875rem',
                      }}>{e.code}</code>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{e.status}</span>
                      <span style={{ color: '#64748b' }}>{e.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* SDKs */}
              <section id="sdks" style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  SDKs & Libraries
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {[
                    { lang: 'JavaScript / Node.js', icon: '🟨', status: 'Coming Soon' },
                    { lang: 'Python', icon: '🐍', status: 'Coming Soon' },
                    { lang: 'PHP', icon: '🐘', status: 'Coming Soon' },
                    { lang: 'Ruby', icon: '💎', status: 'Planned' },
                  ].map(sdk => (
                    <div key={sdk.lang} style={{
                      padding: '18px', borderRadius: 12,
                      background: '#fff', border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>{sdk.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{sdk.lang}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{sdk.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 20, padding: '16px 20px', borderRadius: 12,
                  background: '#f0f0ff', border: '1px solid #e0e0ff',
                  fontSize: '0.875rem', color: '#4f46e5', lineHeight: 1.7,
                }}>
                  In the meantime, you can use any HTTP client library to call our REST API directly. 
                  <Link href="/contact" style={{ color: '#635bff', fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}>
                    Contact us
                  </Link> to get early API access.
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .api-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}