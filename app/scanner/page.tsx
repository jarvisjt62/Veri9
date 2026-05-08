'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { saveScanToHistory, getScanHistory, getStatusColor, isValidBarcode, cleanBarcode } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ScanResult {
  barcode: string
  status: string
  trustScore: number
  productType: string
  productInfo: {
    name: string | null
    brand: string | null
    manufacturer: string | null
    country: string | null
    image: string | null
    description: string | null
    gs1Region: string | null
    barcodeType: string | null
    details: Record<string, unknown>
  }
  sources: Record<string, { found: boolean; source?: string }>
  crossReference: {
    checks: Array<{ check: string; passed: boolean | null; details: string }>
    passed: number
    total: number
    percentage: number
  }
  recalls: Array<{ productDescription: string; reason: string; classification: string }> | null
  gs1Info: { country: string; prefix: string; barcodeType: string } | null
  verificationTime: string
  verifiedAt: string
}

type TabType = 'manual' | 'history'

const SOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  openFoodFacts: { label: 'Open Food Facts', icon: 'fa-apple-alt' },
  openFDA: { label: 'OpenFDA', icon: 'fa-pills' },
  openBeautyFacts: { label: 'Open Beauty Facts', icon: 'fa-spa' },
  barcodeLookup: { label: 'Barcode Lookup', icon: 'fa-barcode' },
  upcItemDb: { label: 'UPCitemdb', icon: 'fa-tag' },
  openLibrary: { label: 'Open Library', icon: 'fa-book' },
  datakick: { label: 'Datakick', icon: 'fa-shopping-cart' },
  gs1CompanyDb: { label: 'GS1 / USDA', icon: 'fa-globe' },
  eanSearch: { label: 'EAN Search', icon: 'fa-search' },
}

export default function ScannerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [history, setHistory] = useState<Record<string, unknown>[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHistory(getScanHistory())
  }, [])

  const verifyBarcode = useCallback(async (code: string) => {
    const clean = cleanBarcode(code)
    if (!clean) { toast.error('Please enter a barcode'); return }
    if (!isValidBarcode(clean)) { toast.error('Invalid barcode — must be 6-14 digits'); return }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: clean })
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        saveScanToHistory({
          barcode: data.data.barcode,
          name: data.data.productInfo?.name,
          brand: data.data.productInfo?.brand,
          status: data.data.status,
          trustScore: data.data.trustScore,
          productType: data.data.productType,
          image: data.data.productInfo?.image,
          verifiedAt: data.data.verifiedAt
        })
        setHistory(getScanHistory())
        toast.success('Verification complete!')
      } else {
        toast.error(data.error || 'Verification failed')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyBarcode(barcode)
  }

  const statusConfig = result ? getStatusColor(result.status) : null

  return (
    <>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 6 }}>
              <i className="fas fa-barcode" style={{ color: '#4F46E5', marginRight: 10 }}></i>
              Scan & Verify
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Checking multiple databases for authenticity
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#e5e7eb', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
            {([
              { id: 'manual', icon: 'fa-keyboard', label: 'Enter Barcode' },
              { id: 'history', icon: 'fa-history', label: `History (${history.length})` },
            ] as { id: TabType; icon: string; label: string }[]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  color: activeTab === tab.id ? '#0f172a' : '#6b7280',
                  boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                }}>
                <i className={`fas ${tab.icon}`} style={{ marginRight: 6 }}></i>{tab.label}
              </button>
            ))}
          </div>

          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 24px', marginBottom: 24 }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                      <i className="fas fa-barcode" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
                      <input
                        ref={inputRef}
                        type="text"
                        value={barcode}
                        onChange={e => setBarcode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter barcode number (e.g. 5901234123457)"
                        maxLength={14}
                        style={{
                          width: '100%', padding: '13px 14px 13px 42px',
                          border: '1.5px solid #e5e7eb', borderRadius: 10,
                          fontSize: '1rem', fontFamily: 'Inter, sans-serif',
                          background: '#f9fafb', outline: 'none'
                        }}
                      />
                    </div>
                    <button type="submit" disabled={loading}
                      style={{
                        padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem',
                        fontWeight: 700, color: '#fff', background: loading ? '#818cf8' : '#4F46E5',
                        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
                      }}>
                      {loading
                        ? <><i className="fas fa-circle-notch fa-spin"></i> Verifying...</>
                        : <><i className="fas fa-shield-alt"></i> Verify</>
                      }
                    </button>
                  </div>
                </form>

                {/* Example barcodes */}
                <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginRight: 4, display: 'flex', alignItems: 'center' }}>Try:</span>
                  {[
                    { label: 'Coca-Cola', code: '5449000000996' },
                    { label: 'Aspirin', code: '00041167046028' },
                    { label: 'Book ISBN', code: '9780099549482' },
                  ].map(ex => (
                    <button key={ex.code} onClick={() => { setBarcode(ex.code); verifyBarcode(ex.code) }}
                      style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#4b5563', cursor: 'pointer' }}>
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading state */}
              {loading && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '1.6rem', color: '#4F46E5' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Verifying product...</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Querying 9 databases in parallel. This takes 2-5 seconds.</p>
                  <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {Object.values(SOURCE_LABELS).map(s => (
                      <span key={s.label} style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b' }}>
                        <i className={`fas ${s.icon}`} style={{ marginRight: 5 }}></i>{s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {result && !loading && statusConfig && (
                <div>
                  {/* Status Banner */}
                  <div style={{ background: statusConfig.bg, border: `2px solid ${statusConfig.border}`, borderRadius: 16, padding: '24px', textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: statusConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <i className="fas fa-shield-alt" style={{ fontSize: '1.6rem', color: '#fff' }}></i>
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, color: statusConfig.color, marginBottom: 8 }}>{statusConfig.label}</h2>
                    <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Barcode: {result.barcode}</p>
                  </div>

                  {/* Trust Score */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 12 }}>Trust Score</div>
                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                      <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
                        <circle cx="60" cy="60" r="52" fill="none" stroke={statusConfig.color} strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52 * (1 - result.trustScore / 100)}`}/>
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '1.8rem', fontWeight: 900, color: statusConfig.color }}>{result.trustScore}%</div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>Verified in {result.verificationTime}</p>
                  </div>

                  {/* Product Info */}
                  {(result.productInfo.name || result.productInfo.brand) && (
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
                      {result.productInfo.image && (
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={result.productInfo.image} alt={result.productInfo.name || 'Product'} style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', margin: '0 auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      )}
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>Product Information</h3>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {[
                          { label: 'Name', value: result.productInfo.name },
                          { label: 'Brand', value: result.productInfo.brand },
                          { label: 'Manufacturer', value: result.productInfo.manufacturer },
                          { label: 'Country', value: result.productInfo.country },
                          { label: 'GS1 Country', value: result.productInfo.gs1Region },
                          { label: 'Barcode Type', value: result.productInfo.barcodeType },
                          { label: 'Category', value: result.productType?.replace(/_/g, ' ') },
                        ].filter(f => f.value && f.value !== 'Unknown').map(field => (
                          <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f1f5f9', gap: 12 }}>
                            <span style={{ fontSize: '0.83rem', color: '#64748b', flexShrink: 0 }}>{field.label}</span>
                            <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0f172a', textAlign: 'right', wordBreak: 'break-word' }}>{String(field.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recall Alert */}
                  {result.recalls && result.recalls.length > 0 && (
                    <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#dc2626', marginBottom: 12 }}>
                        <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>Recall Alerts
                      </h3>
                      {result.recalls.map((r, i) => (
                        <div key={i} style={{ padding: '10px', marginBottom: 8, background: '#fff', borderRadius: 8, border: '1px solid #fecaca' }}>
                          <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{r.productDescription?.substring(0, 100)}...</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reason: {r.reason} · Class: {r.classification}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Verification Checks */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                      Verification Checks
                      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#94a3b8', marginLeft: 8 }}>
                        {result.crossReference.passed}/{result.crossReference.total} passed ({result.crossReference.percentage}%)
                      </span>
                    </h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {result.crossReference.checks.map((check, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8,
                          background: check.passed === true ? '#f0fdf4' : check.passed === false ? '#fef2f2' : '#f8fafc'
                        }}>
                          <i className={`fas ${check.passed === true ? 'fa-check-circle' : check.passed === false ? 'fa-times-circle' : 'fa-minus-circle'}`}
                            style={{ color: check.passed === true ? '#059669' : check.passed === false ? '#dc2626' : '#94a3b8', marginTop: 2, flexShrink: 0 }}></i>
                          <div>
                            <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0f172a' }}>{check.check}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{check.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Sources */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Data Sources</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 14 }}>
                      {Object.values(result.sources).filter(s => s?.found).length} of {Object.keys(result.sources).length} databases found this product
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {Object.entries(result.sources).map(([key, src]) => {
                        if (!src) return null
                        const info = SOURCE_LABELS[key] || { label: key, icon: 'fa-database' }
                        const isFound = src.found || (key === 'barcodeLookup' && Array.isArray((src as Record<string, unknown>).sources) && ((src as Record<string, unknown>).sources as unknown[]).length > 0)
                        return (
                          <span key={key} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 20, fontSize: '0.77rem', fontWeight: 600,
                            background: isFound ? '#f0fdf4' : '#f8fafc',
                            color: isFound ? '#059669' : '#94a3b8',
                            border: `1px solid ${isFound ? '#a7f3d0' : '#e2e8f0'}`
                          }}>
                            <i className={`fas ${isFound ? info.icon : 'fa-minus'}`}></i>
                            {info.label}
                          </span>
                        )
                      })}
                    </div>
                    {result.gs1Info?.country && result.gs1Info.country !== 'Unknown' && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-map-marker-alt" style={{ color: '#4F46E5', fontSize: '0.85rem' }}></i>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          GS1 Country of Origin: <strong style={{ color: '#0f172a' }}>{result.gs1Info.country}</strong>
                          {result.gs1Info.barcodeType && <> &nbsp;·&nbsp; {result.gs1Info.barcodeType}</>}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '0.75rem' }}>
                    Verified in {result.verificationTime} · {new Date(result.verifiedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              {history.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <i className="fas fa-history" style={{ fontSize: '1.4rem', color: '#94a3b8' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No scan history yet</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 20 }}>Start scanning products to see your history here</p>
                  <button onClick={() => setActiveTab('manual')}
                    style={{ padding: '10px 24px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, color: '#fff', background: '#4F46E5', border: 'none', cursor: 'pointer' }}>
                    Scan a Product
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => { localStorage.removeItem('veri9_history'); setHistory([]) }}
                      style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#dc2626', background: '#fff', border: '1.5px solid #fecaca', cursor: 'pointer' }}>
                      <i className="fas fa-trash" style={{ marginRight: 6 }}></i> Clear History
                    </button>
                  </div>
                  {history.map((scan, i) => {
                    const s = scan as { barcode: string; name?: string; brand?: string; status: string; trustScore: number; productType?: string; verifiedAt: string }
                    const sc = getStatusColor(s.status)
                    return (
                      <div key={i} onClick={() => { setBarcode(s.barcode); setActiveTab('manual'); verifyBarcode(s.barcode) }}
                        style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="fas fa-barcode" style={{ color: sc.color, fontSize: '1rem' }}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                            {s.name || s.barcode}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {s.brand && s.brand !== 'Unknown' ? `${s.brand} · ` : ''}{s.barcode}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {sc.label}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(s.verifiedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}