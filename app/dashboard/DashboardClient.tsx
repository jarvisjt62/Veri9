'use client'

import React, { useEffect, useState, useRef, useCallback, Component, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { usePlatformConfig } from '@/lib/platform-config'
import { getScanHistory, saveScanToHistory, SCAN_HISTORY_KEY } from '@/lib/utils'
import toast from 'react-hot-toast'
import ReCAPTCHA from 'react-google-recaptcha'

// ─── Dashboard Error Boundary ─────────────────────────────────────────────────
// Catches React render errors so the whole page never shows "This page couldn't load"
class DashboardErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string; stack: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '', stack: '' }
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, error: err instanceof Error ? err.message : String(err) }
  }
  componentDidCatch(err: unknown, info: { componentStack?: string }) {
    console.error('[Veri9 Dashboard] Render error:', err, info?.componentStack)
    this.setState({ stack: info?.componentStack || '' })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'Inter, -apple-system, sans-serif' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 24, maxWidth: 360, lineHeight: 1.6 }}>
            The dashboard encountered an unexpected error. Your scan history is safe. Try refreshing the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: '', stack: '' }); window.location.reload() }}
            style={{ padding: '12px 28px', borderRadius: 11, background: 'linear-gradient(135deg, #635bff, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,91,255,0.3)' }}
          >
            🔄 Reload Dashboard
          </button>
          {this.state.error && (
            <pre style={{ marginTop: 20, fontSize: '0.72rem', color: '#ef4444', background: '#fef2f2', padding: 12, borderRadius: 8, maxWidth: 660, width: '100%', overflowX: 'auto', textAlign: 'left' }}>
              {`ERROR: ${this.state.error}\n\nCOMPONENT STACK:${this.state.stack}`}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

type Section = 'overview' | 'scanner' | 'scans' | 'profile' | 'security' | 'settings' | 'donate' | 'community' | 'brands' | 'blog' | 'about' | 'contact' | 'privacy' | 'terms'
type ScanTab = 'camera' | 'manual' | 'serial' | 'photo' | 'qr'
type ScannerView = 'scanner' | 'verifying' | 'result'

// ─── ScanResult Interface (matches scanner/page.tsx) ────────────────────────
export interface ScanResult {
  barcode: string
  productName: string
  brand: string
  manufacturer: string
  category: string
  trustScore: number
  status: 'authentic' | 'suspicious' | 'not_found' | 'VERIFIED' | 'LIKELY_AUTHENTIC' | 'INSUFFICIENT_DATA' | 'SUSPICIOUS' | 'NOT_FOUND' | 'COUNTERFEIT' | 'counterfeit' | 'UNREADABLE' | 'RECALLED' | 'recalled'
  sources: { name: string; found: boolean; info?: string }[]
  recall: boolean
  recallInfo?: string
  timestamp: number
  country?: string
  description?: string
  image?: string
  gs1Region?: string
  barcodeType?: string
  ingredients?: string
  nutritionGrade?: string
  quantity?: string
  verificationTime?: string
  crossRefPassed?: number
  crossRefTotal?: number
  regulatoryAgency?: string
  whoMedicine?: boolean
  gs1Prefix?: string
  isBook?: boolean
  weight?: string
  dimensions?: string
  color?: string
  size?: string
  activeIngredients?: string
  dosageForm?: string
  packaging?: string
  labels?: string[]
  authorName?: string
  publishYear?: string
  publisher?: string
  counterfeitSignals?: {
    isCounterfeit: boolean
    confidence: number
    signalCount: number
    signals: { type: string; severity: string; description: string }[]
  }
}

// ─── API call ─────────────────────────────────────────────────────────────────
async function verifyBarcode(barcode: string, force: boolean = false): Promise<ScanResult> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode, force }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || `Server error ${res.status}`)
  }
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Verification failed')
  const d = json.data
  const pi = d.productInfo || {}
  const engineStatus = d.status as string
  const status: ScanResult['status'] = (['VERIFIED','LIKELY_AUTHENTIC','INSUFFICIENT_DATA','NOT_FOUND','SUSPICIOUS','COUNTERFEIT','UNREADABLE','RECALLED','recalled'].includes(engineStatus))
    ? (engineStatus as ScanResult['status'])
    : d.trustScore >= 70 ? 'authentic' : d.trustScore >= 35 ? 'suspicious' : 'not_found'
  const rawSources = d.sources || {}
  const sourceMap: ScanResult['sources'] = []
  const addSource = (key: string, label: string, src: Record<string, unknown>) => {
    if (!src) return
    const found = src.found === true
    let info = ''
    if (found) {
      const n = (src.name || src.brandName || '') as string
      const br = (src.brand || '') as string
      info = [n, br].filter(Boolean).join(' · ').slice(0, 60) || 'Found'
    }
    sourceMap.push({ name: label, found, info: found ? info : undefined })
  }
  addSource('off', 'Product Intelligence', rawSources.openFoodFacts)
  addSource('fda', 'Drug Intelligence', rawSources.openFDA)
  addSource('obf', 'Cosmetics Intelligence', rawSources.openBeautyFacts)
  addSource('upc', 'Product Registry', rawSources.upcItemDb)
  addSource('dtk', 'Grocery Intelligence', rawSources.datakick)
  addSource('lib', 'Publication Registry', rawSources.openLibrary)
  addSource('gs1', 'Trade Item Registry', rawSources.gs1CompanyDb)
  addSource('ean', 'EAN Search', rawSources.eanSearch)
  addSource('usda', 'USDA FoodData', rawSources.usdaFoodData)
  addSource('gup', 'Go-UPC Global', rawSources.goUpc)
  addSource('opr', 'Open Prices', rawSources.openPrices)
  addSource('opd', 'Open Product Data', rawSources.openProductData)
  addSource('rxa', 'NIH RxNav', rawSources.nihRxNav)
  addSource('cpc', 'CPSC Recalls', rawSources.cpscRecalls)

  return {
    barcode,
    productName: pi.name || d.productName || 'Unknown Product',
    brand: pi.brand || pi.manufacturer || d.brand || '',
    manufacturer: pi.manufacturer || pi.brand || '',
    category: d.productType || pi.category || 'Product',
    trustScore: d.trustScore ?? 0,
    status,
    sources: sourceMap,
    recall: !!(d.recalls?.length) || !!(d.sources?.cpscRecalls?.recall),
    recallInfo: d.recalls?.[0]?.description || d.recalls?.[0]?.reason || d.sources?.cpscRecalls?.recallReason,
    timestamp: Date.now(),
    country: pi.country || d.gs1Info?.country,
    description: pi.description,
    image: pi.image || undefined,
    gs1Region: d.gs1Info?.country,
    barcodeType: d.barcodeType || d.gs1Info?.barcodeType,
    ingredients: pi.details?.ingredients,
    nutritionGrade: pi.details?.nutritionGrade,
    quantity: pi.details?.quantity || pi.details?.size,
    verificationTime: d.verificationTime,
    crossRefPassed: d.crossReference?.passed,
    crossRefTotal: d.crossReference?.total,
    regulatoryAgency: d.regulatoryAgencies ? Object.keys(d.regulatoryAgencies).find(k => d.sources?.[k]?.found) : undefined,
    whoMedicine: d.whoEssentialMedicine?.isEssential === true,
    gs1Prefix: d.gs1Info?.prefix,
    isBook: d.sources?.openLibrary?.found === true,
    weight: pi.details?.weight,
    color: pi.details?.color,
    size: pi.details?.size,
    packaging: pi.details?.packaging,
    labels: pi.details?.labels,
    activeIngredients: pi.details?.activeIngredients,
    dosageForm: pi.details?.dosageForm,
    authorName: pi.details?.authors?.[0],
    publishYear: pi.details?.publishYear,
    publisher: pi.details?.publishers?.[0],
    counterfeitSignals: d.counterfeitSignals || undefined,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCountryFlag(country?: string): string {
  if (!country) return ''
  const flags: Record<string, string> = {
    'US': '🇺🇸','United States': '🇺🇸','GB': '🇬🇧','United Kingdom': '🇬🇧',
    'FR': '🇫🇷','France': '🇫🇷','DE': '🇩🇪','Germany': '🇩🇪',
    'JP': '🇯🇵','Japan': '🇯🇵','CN': '🇨🇳','China': '🇨🇳',
    'IN': '🇮🇳','India': '🇮🇳','BR': '🇧🇷','Brazil': '🇧🇷',
    'AU': '🇦🇺','Australia': '🇦🇺','CA': '🇨🇦','Canada': '🇨🇦',
    'IT': '🇮🇹','Italy': '🇮🇹','ES': '🇪🇸','Spain': '🇪🇸',
    'MX': '🇲🇽','Mexico': '🇲🇽','KR': '🇰🇷','South Korea': '🇰🇷',
    'NL': '🇳🇱','Netherlands': '🇳🇱','SE': '🇸🇪','Sweden': '🇸🇪',
    'NZ': '🇳🇿','New Zealand': '🇳🇿','SG': '🇸🇬','Singapore': '🇸🇬',
    'ZA': '🇿🇦','South Africa': '🇿🇦','NG': '🇳🇬','Nigeria': '🇳🇬',
    'AE': '🇦🇪','UAE': '🇦🇪','SA': '🇸🇦','Saudi Arabia': '🇸🇦',
  }
  return flags[country] || '🌍'
}

// ─── TrustRing ────────────────────────────────────────────────────────────────
function TrustRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fontSize={size > 60 ? '15' : '12'} fontWeight="800" fill={color}>{score}</text>
    </svg>
  )
}

// ─── Verifying Screen ─────────────────────────────────────────────────────────
function VerifyingScreen({ barcode }: { barcode: string }) {
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(0)

  // Detect mode from the pending text
  const isQrUrl = /^https?:\/\//i.test(barcode) || /^www\./i.test(barcode) || barcode.includes('…')
  const isSerial = barcode.length > 0 && !/^\d{8,14}$/.test(barcode) && !isQrUrl
  const steps = isQrUrl ? [
    'Reading QR code…', 'Extracting URL…', 'Following redirects…',
    'Checking domain reputation…', 'Inspecting brand page…', 'Analysing page content…',
    'Running trust analysis…', 'Finalising result…',
  ] : isSerial ? [
    'Parsing serial format…', 'Querying trade registries…', 'Checking regulatory records…',
    'Matching brand patterns…', 'Running trust analysis…', 'Finalising result…',
  ] : [
    'Decoding barcode format…', 'Querying product intelligence…', 'Checking drug registries…',
    'Cross-referencing trade data…', 'Scanning product registries…', 'Checking food safety data…',
    'Running cross-reference checks…', 'Running trust analysis…', 'Finalising verification…',
  ]

  useEffect(() => {
    const id = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1))
      setPct(p => Math.min(p + Math.ceil(100 / steps.length), 98))
    }, 450)
    return () => clearInterval(id)
  }, [steps.length])

  const r = 46; const circ = 2 * Math.PI * r
  const displayText = isQrUrl
    ? (barcode.length > 40 ? barcode.slice(0, 40) + '…' : barcode)
    : barcode

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, padding: '36px 24px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 110, height: 110, marginBottom: 24 }}>
        <svg width="110" height="110" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke="#635bff" strokeWidth="8"
            strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 0.45s ease' }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo-new.png" alt="Veri9" width="42" height="42" style={{ objectFit: 'contain', borderRadius: '50%' }} />
        </div>
      </div>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
        {isQrUrl ? 'Verifying QR Code' : isSerial ? 'Looking Up Serial Number' : 'Verifying Product'}
      </h2>
      <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: 6, maxWidth: 280, wordBreak: 'break-all' }}>{displayText}</p>
      <p style={{ fontSize: '0.87rem', color: '#635bff', fontWeight: 600, minHeight: 22, marginBottom: 20 }}>{steps[step]}</p>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#635bff', marginBottom: 6 }}>{pct}%</div>
      <div style={{ width: '100%', maxWidth: 260, height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #635bff, #a5b4fc)', borderRadius: 99, width: `${pct}%`, transition: 'width 0.45s ease' }} />
      </div>
      <p style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 10 }}>
        {isQrUrl ? 'Following URL → checking brand domain reputation' : isSerial ? 'Checking trade registries, regulatory records, and brand patterns' : 'Cross-referencing 18+ global intelligence sources'}
      </p>
    </div>
  )
}

// ─── ProductResultCard Error Boundary ────────────────────────────────────────
// Isolates render crashes inside the result card so a broken scan doesn't
// take down the whole dashboard.
class ProductResultCardBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, error: err instanceof Error ? err.message : String(err) }
  }
  componentDidCatch(err: unknown, info: { componentStack?: string }) {
    console.error('[Veri9 ResultCard] Render error:', err, info?.componentStack)
    this.setState({ error: (err instanceof Error ? err.message : String(err)) + '\n' + (info?.componentStack || '') })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>⚠️ Could not display scan result</p>
          <p style={{ fontSize: '0.82rem', color: '#b91c1c', marginBottom: 14 }}>
            The result data may be in an unexpected format. Try scanning again.
          </p>
          {this.state.error && (
            <pre style={{ fontSize: '0.68rem', color: '#ef4444', background: '#fff', padding: 10, borderRadius: 8, textAlign: 'left', overflowX: 'auto', maxHeight: 200, border: '1px solid #fecaca' }}>
              {this.state.error}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            style={{ marginTop: 10, padding: '8px 20px', borderRadius: 8, background: '#635bff', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Dismiss
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── ProductResultCard ─────────────────────────────────────────────────────────
function ProductResultCard({ result, onScanAgain, onReVerify }: { result: ScanResult; onScanAgain: () => void; onReVerify?: () => void }) {
  const [showIngredients, setShowIngredients] = useState(false)
  const [reVerifying, setReVerifying] = useState(false)

  const handleReVerify = async () => {
    if (!onReVerify) return
    setReVerifying(true)
    try { await onReVerify() } finally { setReVerifying(false) }
  }

  // Simplified verdict system (Round 25):
  //   AUTHENTIC   — green  — VERIFIED or LIKELY_AUTHENTIC or authentic (legacy)
  //   SUSPICIOUS  — amber  — SUSPICIOUS or INSUFFICIENT_DATA
  //   FAKE        — red    — COUNTERFEIT
  //   RECALLED    — orange — RECALLED (real product under active FDA/CPSC recall)
  //   UNVERIFIED  — gray   — NOT_FOUND (item not in our system, NOT a fake)
  //   UNREADABLE  — blue   — barcode failed check digit (misread, please rescan)
  const verdictMap: Record<string, 'AUTHENTIC' | 'SUSPICIOUS' | 'FAKE' | 'RECALLED' | 'UNVERIFIED' | 'UNREADABLE'> = {
    authentic: 'AUTHENTIC', VERIFIED: 'AUTHENTIC', LIKELY_AUTHENTIC: 'AUTHENTIC',
    suspicious: 'SUSPICIOUS', SUSPICIOUS: 'SUSPICIOUS', INSUFFICIENT_DATA: 'SUSPICIOUS',
    counterfeit: 'FAKE', COUNTERFEIT: 'FAKE',
    RECALLED: 'RECALLED', recalled: 'RECALLED',
    not_found: 'UNVERIFIED', NOT_FOUND: 'UNVERIFIED',
    UNREADABLE: 'UNREADABLE', unreadable: 'UNREADABLE',
  }
  // Compute foundCount early so we can use it for the verdict override below
  const safeSources: ScanResult['sources'] = Array.isArray(result.sources) ? result.sources : []
  const foundCount = safeSources.filter(s => s && s.found).length

  // ── Verdict override: SUSPICIOUS with 0 DBs matched → show as UNVERIFIED ──
  // If no source matched the product at all, "SUSPICIOUS" is misleading —
  // the product isn't suspicious, it's simply not in our system.
  let verdict = verdictMap[result.status] || 'UNVERIFIED'
  if (verdict === 'SUSPICIOUS' && foundCount === 0 && (result.trustScore ?? 0) < 40) {
    verdict = 'UNVERIFIED'
  }

  // Friendly per-engine-status label (mirrors lib/utils/formatStatus.ts)
  // We surface the *exact* engine verdict here (Authentic vs. Likely Authentic),
  // so users can see the difference between multi-confirmed and single-confirmed.
  const friendlyLabelMap: Record<string, string> = {
    VERIFIED: 'Authentic',
    LIKELY_AUTHENTIC: 'Likely Authentic',
    authentic: 'Likely Authentic',
    INSUFFICIENT_DATA: 'Limited Information',
    NOT_FOUND: 'Not Found',
    not_found: 'Not Found',
    SUSPICIOUS: 'Suspicious',
    suspicious: 'Suspicious',
    COUNTERFEIT: 'Counterfeit',
    counterfeit: 'Counterfeit',
    RECALLED: 'Recalled',
    recalled: 'Recalled',
    UNREADABLE: 'Rescan Needed',
    unreadable: 'Rescan Needed',
  }
  const friendlyLabel = friendlyLabelMap[result.status] || 'Unknown'

  const scMap: Record<string, { bg: string; border: string; badgeBg: string; badgeText: string; icon: string; label: string; headline: string; tagline: string; tipsTitle?: string; tips?: string[] }> = {
    AUTHENTIC: {
      bg: '#f0fdf4', border: '#86efac', badgeBg: '#dcfce7', badgeText: '#15803d',
      icon: '✅', label: friendlyLabel, // "Authentic" or "Likely Authentic"
      headline: result.status === 'VERIFIED'
        ? 'This product is authentic'
        : 'This product appears authentic',
      tagline: 'Cross-referenced across multiple trusted sources — safe to purchase.',
    },
    SUSPICIOUS: {
      bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeText: '#b45309',
      icon: '⚠️', label: friendlyLabel, // "Suspicious" or "Limited Information"
      headline: 'Unable to fully verify this product',
      tagline: 'Some data was found but there are gaps or inconsistencies. Inspect packaging carefully before purchase.',
      tipsTitle: 'What you can do',
      tips: [
        'Inspect the packaging closely — check spelling, print quality, seals and holograms.',
        'Compare it with a photo of the genuine product from the brand’s official website.',
        'Buy only from authorised retailers; be cautious with deep discounts from unknown sellers.',
        'If something feels off, don’t consume or use it — contact the brand to confirm.',
      ],
    },
    FAKE: {
      bg: '#fff1f2', border: '#fda4af', badgeBg: '#ffe4e6', badgeText: '#9f1239',
      icon: '🚫', label: 'Counterfeit',
      headline: 'Counterfeit indicators detected',
      tagline: 'Our system identified specific red flags for this product. Do NOT purchase or consume this item.',
      tipsTitle: 'What you should do',
      tips: [
        'Do NOT use, consume, or resell this product.',
        'Keep the item and your receipt as evidence.',
        'Report the seller to the brand and your local consumer-protection agency.',
        'Request a refund or chargeback from the seller or payment provider.',
      ],
    },
    UNVERIFIED: {
      bg: '#f8fafc', border: '#cbd5e1', badgeBg: '#f1f5f9', badgeText: '#475569',
      icon: 'ℹ️', label: 'Not Found',
      headline: 'Product not found in our system',
      tagline: 'This does NOT mean the product is fake — it just means no public record has been found yet. Private-label, regional, or brand-new products often show this status.',
      tipsTitle: 'What you can do',
      tips: [
        'Double-check the barcode number you scanned matches the one on the package.',
        'Many genuine items aren’t in public databases yet — store-brand, regional or brand-new products often show this.',
        'Inspect the packaging for the usual signs of authenticity (seals, batch codes, quality of print).',
        'Help others: tap “Report / Submit this product” so we can add it to the database.',
      ],
    },
    RECALLED: {
      bg: '#fff7ed', border: '#fdba74', badgeBg: '#ffedd5', badgeText: '#c2410c',
      icon: '⚠️', label: 'Recalled',
      headline: 'This product is under an active recall',
      tagline: 'The product is real, but it has been recalled by the FDA or CPSC due to a safety issue. Stop using it immediately and check the official recall notice for return/refund instructions.',
      tipsTitle: 'What you should do',
      tips: [
        'Stop using the product immediately.',
        'Check the official recall notice (FDA / CPSC) for your batch or lot number.',
        'Follow the recall instructions — most offer a free return, repair or refund.',
        'Do not throw it away if disposal instructions are provided — follow them instead.',
      ],
    },
    UNREADABLE: {
      bg: '#eff6ff', border: '#93c5fd', badgeBg: '#dbeafe', badgeText: '#1d4ed8',
      icon: '📷', label: 'Rescan Needed',
      headline: 'We couldn\u2019t read that barcode cleanly',
      tagline: 'The scanned code failed its built-in checksum — it was likely misread by the camera. Please rescan with brighter light and the barcode fully in frame. This is NOT a counterfeit verdict.',
      tipsTitle: 'How to get a clean scan',
      tips: [
        'Rescan in good lighting — avoid glare and shadows on the barcode.',
        'Hold steady and keep the whole barcode flat and fully inside the frame.',
        'Clean the camera lens and the barcode surface if it’s smudged or wrinkled.',
        'Still no luck? Type the digits in manually using the number entry option.',
      ],
    },
  }
  const sc = scMap[verdict]

  // ── Country slug → readable name (e.g. "united-states" → "United States") ──
  const formatCountry = (raw: string): string => {
    if (!raw || typeof raw !== 'string') return ''
    return raw
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\bAnd\b/g, 'and')
      .replace(/\bOf\b/g, 'of')
      .replace(/\bThe\b/g, 'the')
      .replace(/\bUsa\b/g, 'USA')
      .replace(/\bUk\b/g, 'UK')
  }
  const rawCountry = typeof result.country === 'string' ? result.country
    : typeof result.gs1Region === 'string' ? result.gs1Region : ''
  const countryDisplay = [getCountryFlag(rawCountry), formatCountry(rawCountry)].filter(Boolean).join(' ')

  // ── Manufacturer: hide "Unknown" / empty / same-as-brand ──
  const rawManufacturer = typeof result.manufacturer === 'string' ? result.manufacturer : ''
  const safeManufacturer = rawManufacturer && rawManufacturer !== result.brand
    && !['unknown', 'n/a', 'na', '-', ''].includes(rawManufacturer.toLowerCase().trim())
    ? rawManufacturer : null

  // ── Nutri-Score: hide when meaningless ──
  const rawNutrition = typeof result.nutritionGrade === 'string' ? result.nutritionGrade : ''
  const nutriScoreRaw = rawNutrition.toUpperCase().trim()
  const nutriScoreHidden = !nutriScoreRaw
    || ['UNKNOWN', 'NOT-APPLICABLE', 'NOT APPLICABLE', 'N/A', 'NA', '-'].includes(nutriScoreRaw)

  // ── Physical-goods-only attributes (color, size from Amazon DB — noisy for food/medicine) ──
  const catUpper = (typeof result.category === 'string' ? result.category : '').toUpperCase()
  const isFoodOrMedicine = ['FOOD', 'BEVERAGE', 'DRINK', 'GROCERY', 'DRUG', 'OTC', 'MEDICINE',
    'SUPPLEMENT', 'VITAMIN', 'PHARMACEUTICAL', 'HEALTH'].some(k => catUpper.includes(k))
  // Only show color/size (Amazon-sourced) for non-food/non-medicine categories
  const showAmazonAttrs = !isFoodOrMedicine

  const isQrResult = (result as unknown as { details?: { authMethod?: string } }).details?.authMethod === 'QR_URL'
  const qrDetails = isQrResult
    ? (result as unknown as { details: { originalUrl: string; finalUrl: string; platform: string; originalDomain: string; finalDomain: string } }).details
    : null

  const infoRows = isQrResult ? [
    // QR-specific info grid — skip generic brand/category "Unknown"
    qrDetails?.originalDomain && { label: 'Domain', value: qrDetails.originalDomain, icon: '🌐' },
    qrDetails?.finalDomain && qrDetails.finalDomain !== qrDetails.originalDomain && { label: 'Final Domain', value: qrDetails.finalDomain, icon: '↳' },
    qrDetails?.platform && qrDetails.platform !== 'Unknown' && { label: 'Platform', value: qrDetails.platform, icon: '🔐' },
    result.brand && result.brand !== 'Unknown' && { label: 'Brand', value: result.brand, icon: '🏷️' },
    result.verificationTime && { label: 'Verified In', value: result.verificationTime, icon: '⚡' },
    result.crossRefPassed != null && { label: 'Cross-Ref Checks', value: `${result.crossRefPassed}/${result.crossRefTotal} passed`, icon: '✅' },
  ].filter(Boolean) as { label: string; value: string; icon: string }[] : [
    result.brand && { label: 'Brand', value: result.brand, icon: '🏷️' },
    safeManufacturer && { label: 'Manufacturer', value: safeManufacturer, icon: '🏭' },
    result.category && { label: 'Category', value: result.category, icon: '📂' },
    rawCountry && { label: 'Origin / Country', value: countryDisplay, icon: '🌍' },
    result.quantity && { label: 'Size / Quantity', value: result.quantity, icon: '📏' },
    result.weight && { label: 'Weight', value: result.weight, icon: '⚖️' },
    showAmazonAttrs && result.color && { label: 'Color', value: result.color, icon: '🎨' },
    showAmazonAttrs && result.size && result.size !== result.quantity && { label: 'Size', value: result.size, icon: '📐' },
    result.packaging && { label: 'Packaging', value: result.packaging, icon: '📦' },
    !nutriScoreHidden && { label: 'Nutri-Score', value: nutriScoreRaw, icon: '🥗' },
    result.barcodeType && { label: 'Barcode Type', value: result.barcodeType, icon: '📊' },
    result.gs1Prefix && { label: 'Registration Prefix', value: result.gs1Prefix, icon: '🔖' },
    result.isBook && result.authorName && { label: 'Author', value: result.authorName, icon: '✍️' },
    result.isBook && result.publishYear && { label: 'Published', value: result.publishYear, icon: '📅' },
    result.isBook && result.publisher && { label: 'Publisher', value: result.publisher, icon: '🏢' },
    result.dosageForm && { label: 'Dosage Form', value: result.dosageForm, icon: '💊' },
    result.regulatoryAgency && { label: 'Regulatory', value: result.regulatoryAgency, icon: '⚖️' },
    result.whoMedicine && { label: 'WHO Classification', value: 'Essential Medicine', icon: '❤️' },
    result.verificationTime && { label: 'Verified In', value: result.verificationTime, icon: '⚡' },
    result.crossRefPassed != null && { label: 'Cross-Ref Checks', value: `${result.crossRefPassed}/${result.crossRefTotal} passed`, icon: '✅' },
  ].filter(Boolean) as { label: string; value: string; icon: string }[]

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Status header */}
      <div style={{ background: sc.bg, border: `2px solid ${sc.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${sc.border}` }}>
          {/* Top row: big badge + DB count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: sc.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: sc.badgeText }}>{sc.icon}</div>
              <div>
                <div style={{ fontWeight: 900, color: sc.badgeText, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{sc.label}</div>
                <div style={{ fontSize: '0.72rem', color: sc.badgeText, opacity: 0.75, fontWeight: 600 }}>Verdict · {result.trustScore}% trust score</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {result.verificationTime && <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>⚡ {result.verificationTime}</span>}
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: foundCount > 0 ? '#10b981' : '#94a3b8', background: foundCount > 0 ? '#f0fdf4' : '#f8fafc', padding: '2px 8px', borderRadius: 9999, border: `1px solid ${foundCount > 0 ? '#bbf7d0' : '#e2e8f0'}` }}>
                {foundCount}/{safeSources.length} DBs matched
              </span>
            </div>
          </div>
          {/* Plain-English headline + tagline */}
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: sc.badgeText, margin: 0, marginBottom: 4 }}>{sc.headline}</p>
            <p style={{ fontSize: '0.8rem', color: sc.badgeText, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>{sc.tagline}</p>
            {/* Actionable "What you can do" guidance \u2014 reduces user frustration on
                NOT_FOUND / RESCAN / LIMITED-INFO verdicts by telling them next steps */}
            {sc.tips && sc.tips.length > 0 && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: sc.badgeBg, border: `1px solid ${sc.border}`, borderRadius: 10 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 800, color: sc.badgeText, margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden>{'\uD83D\uDCA1'}</span>{sc.tipsTitle || 'What you can do'}
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sc.tips.map((tip, i) => (
                    <li key={i} style={{ fontSize: '0.78rem', color: sc.badgeText, opacity: 0.92, lineHeight: 1.45 }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Recall block: only show when recall flag is set but status isn't already RECALLED
              (RECALLED verdict section already has "ACTIVE RECALL" headline — avoid duplicate) ── */}
        {result.recall && result.status !== 'RECALLED' && (() => {
          // Gather all recall descriptions from signals (de-duplicated)
          const recallSignalDescs: string[] = (result.counterfeitSignals?.signals ?? [])
            .filter((s: { type: string }) => s.type === 'ACTIVE_RECALL')
            .map((s: { description: string }) => s.description)
            .filter(Boolean)
          // Also include result.recallInfo if it's not already in the signals
          const recallInfoStr: string = result.recallInfo || ''
          const allDescs = recallInfoStr && !recallSignalDescs.some((d: string) => d.includes(recallInfoStr.slice(0, 40)))
            ? [recallInfoStr, ...recallSignalDescs]
            : recallSignalDescs.length > 0 ? recallSignalDescs : recallInfoStr ? [recallInfoStr] : []
          // De-duplicate identical descriptions
          const uniqueDescs = [...new Set(allDescs)]
          return (
            <div style={{ padding: '14px 18px', background: '#fff7ed', borderBottom: '2px solid #f97316' }}>
              <p style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.9rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠️ ACTIVE PRODUCT RECALL
              </p>
              <p style={{ fontSize: '0.82rem', color: '#9a3412', marginBottom: uniqueDescs.length > 0 ? 8 : 0, lineHeight: 1.5 }}>
                This product has been recalled by the FDA or CPSC. It is a real product, <strong>not a counterfeit</strong>. Stop using it immediately and check the official recall notice for return/refund instructions.
              </p>
              {uniqueDescs.map((desc: string, idx: number) => (
                <div key={idx} style={{ padding: '8px 10px', borderRadius: 8, background: '#ffedd5', border: '1px solid #fdba74', fontSize: '0.78rem', color: '#9a3412', lineHeight: 1.4, marginTop: idx > 0 ? 6 : 0 }}>
                  {desc}
                </div>
              ))}
            </div>
          )
        })()}

        {(result.status === 'COUNTERFEIT' || result.status === 'counterfeit') && result.counterfeitSignals && result.counterfeitSignals.signals?.length > 0 && (
          <div style={{ padding: '14px 18px', background: '#fff1f2', borderBottom: '2px solid #f43f5e' }}>
            <p style={{ fontWeight: 800, color: '#9f1239', fontSize: '0.9rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              🚫 COUNTERFEIT / FAKE PRODUCT DETECTED
              <span style={{ fontSize: '0.72rem', background: '#fda4af', color: '#9f1239', padding: '1px 8px', borderRadius: 9999, fontWeight: 700 }}>
                Confidence: {result.counterfeitSignals.confidence}%
              </span>
            </p>
            <p style={{ fontSize: '0.78rem', color: '#be123c', marginBottom: 8, lineHeight: 1.5 }}>
              Our system detected {result.counterfeitSignals.signalCount} counterfeit indicator{result.counterfeitSignals.signalCount !== 1 ? 's' : ''} for this product. Do not purchase or consume this item.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.counterfeitSignals.signals.map((sig: { type: string; severity: string; description: string }, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: sig.severity === 'HIGH' ? '#fecdd3' : '#ffe4e6', border: `1px solid ${sig.severity === 'HIGH' ? '#fda4af' : '#fecdd3'}` }}>
                  <span style={{ fontSize: '0.8rem', flexShrink: 0 }}>{sig.severity === 'HIGH' ? '🔴' : '🟡'}</span>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 2 }}>{sig.type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '0.78rem', color: '#be123c', lineHeight: 1.4 }}>{sig.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '18px', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            {result.image ? (
              <div style={{ width: 92, height: 92, borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.image} alt={result.productName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={e => { e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#cbd5e1;font-size:2rem">📦</div>' }} />
              </div>
            ) : (
              <div style={{ width: 92, height: 92, borderRadius: 12, border: '1px solid #e5e7eb', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>📦</div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 150 }}>
            <h3 style={{ fontSize: 'clamp(0.95rem,2.5vw,1.15rem)', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.3 }}>{result.productName}</h3>
            {result.brand && <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 3px 0', fontWeight: 600 }}>{result.brand}</p>}
            {result.category && <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 8px 0' }}>{result.category}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>📦 {result.barcode}</span>
              {result.labels?.map((l, i) => (
                <span key={i} style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>{l}</span>
              ))}
            </div>
            {/* ── QR URL info block ── */}
            {(result as unknown as { details?: { authMethod?: string; originalUrl?: string; finalUrl?: string; platform?: string; hops?: number } }).details?.authMethod === 'QR_URL' && (() => {
              const d = (result as unknown as { details: { originalUrl: string; finalUrl: string; platform: string; hops: number } }).details
              // Parse the structured description: first line = summary, then check lines (✓/✗/?)
              const descLines = (result.description || '').split('\n').filter(Boolean)
              const summaryLine = descLines[0] || ''
              const checkLines = descLines.filter(l => l.startsWith('✓') || l.startsWith('✗') || l.startsWith('?'))
              return (
                <div>
                  {/* Summary warning */}
                  {summaryLine && (
                    <div style={{ marginTop: 8, padding: '9px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.78rem', color: '#92400e', lineHeight: 1.5 }}>
                      {summaryLine}
                    </div>
                  )}
                  {/* URL info */}
                  <div style={{ marginTop: 10, padding: '10px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 9 }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>🔗 QR Code URL</p>
                    <p style={{ fontSize: '0.72rem', color: '#0c4a6e', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 3 }}>{d.originalUrl}</p>
                    {d.finalUrl && d.finalUrl !== d.originalUrl && (
                      <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 3 }}>↳ Redirected to: <span style={{ fontFamily: 'monospace', color: '#0369a1', wordBreak: 'break-all' }}>{d.finalUrl}</span></p>
                    )}
                    {d.platform && d.platform !== 'Unknown' && (
                      <p style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>Platform: {d.platform}</p>
                    )}
                    <a href={d.originalUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 4, fontSize: '0.72rem', fontWeight: 600, color: '#635bff', textDecoration: 'none', border: '1px solid #c7d2fe', borderRadius: 6, padding: '3px 10px', background: '#f5f3ff' }}>
                      Open URL ↗
                    </a>
                  </div>
                  {/* Check results */}
                  {checkLines.length > 0 && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9 }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Security Checks</p>
                      {checkLines.map((line, i) => {
                        const pass = line.startsWith('✓')
                        const fail = line.startsWith('✗')
                        return (
                          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: '0.75rem', color: pass ? '#15803d' : fail ? '#dc2626' : '#92400e', lineHeight: 1.4 }}>
                            <span style={{ flexShrink: 0 }}>{pass ? '✓' : fail ? '✗' : '?'}</span>
                            <span>{line.slice(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}
            {/* Description for non-QR results only */}
            {!(result as unknown as { details?: { authMethod?: string } }).details?.authMethod && result.description && (
              <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6, margin: '8px 0 0 0' }}>{result.description.slice(0, 200)}{result.description.length > 200 ? '…' : ''}</p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <TrustRing score={result.trustScore} size={76} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trust Score</span>
          </div>
        </div>
      </div>

      {/* Info grid */}
      {infoRows.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>📋 Product Details</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {infoRows.map((row, i) => (
              <div key={i} style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', borderRight: '1px solid #f8fafc' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{row.icon} {row.label}</p>
                <p style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, margin: 0, wordBreak: 'break-word' }}>{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      {(result.ingredients || result.activeIngredients) && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
          <button onClick={() => setShowIngredients(v => !v)} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>🧪 {result.activeIngredients ? 'Active Ingredients' : 'Ingredients'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ transform: showIngredients ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {showIngredients && (
            <div style={{ padding: '0 16px 14px' }}>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>{result.activeIngredients || result.ingredients}</p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onScanAgain} style={{ flex: '1 1 130px', padding: '12px 16px', borderRadius: 11, background: 'linear-gradient(135deg, #635bff, #7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
          Scan Another
        </button>
        <button onClick={() => {
          const text = `Veri9: ${result.productName} (${result.barcode}) — Trust: ${result.trustScore}/100 — ${friendlyLabel}`
          navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'))
        }} style={{ flex: '1 1 90px', padding: '12px 14px', borderRadius: 11, background: '#f1f5f9', color: '#374151', fontWeight: 600, fontSize: '0.85rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
          📋 Copy
        </button>
        <button onClick={async () => {
          try { await navigator.share({ title: 'Veri9 Scan', text: `${result.productName} - ${result.trustScore}/100`, url: window.location.href }) }
          catch { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }
        }} style={{ flex: '1 1 90px', padding: '12px 14px', borderRadius: 11, background: '#f0f0ff', color: '#635bff', fontWeight: 600, fontSize: '0.85rem', border: '1px solid #e0e7ff', cursor: 'pointer' }}>
          📤 Share
        </button>
        <button onClick={() => toast.success('Report submitted. Thank you!', { duration: 3500 })} style={{ padding: '12px 14px', borderRadius: 11, background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '0.85rem', border: '1px solid #fecaca', cursor: 'pointer' }}>
          🚩 Report
        </button>
      </div>

      {/* Re-verify button — clears cached result and runs a fresh check */}
      {onReVerify && (() => {
        const isQr = (result as unknown as { details?: { authMethod?: string } }).details?.authMethod === 'QR_URL'
        return (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleReVerify}
              disabled={reVerifying}
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 11,
                background: reVerifying ? '#f1f5f9' : '#f0fdf4',
                color: reVerifying ? '#94a3b8' : '#15803d',
                fontWeight: 700, fontSize: '0.85rem',
                border: `1px solid ${reVerifying ? '#e2e8f0' : '#bbf7d0'}`,
                cursor: reVerifying ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              {reVerifying
                ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⟳</span> Re-verifying…</>
                : isQr ? <>🔄 Re-verify QR URL</> : <>🔄 Re-verify (Clear Cached Result)</>
              }
            </button>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 5, marginBottom: 0 }}>
              {isQr ? 'Re-follows the QR URL to get a fresh domain reputation check' : 'Gets a fresh result, bypassing any saved cache for this barcode'}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

// ─── History Modal ─────────────────────────────────────────────────────────────
function HistoryModal({ result, onClose, onReVerify }: { result: ScanResult; onClose: () => void; onReVerify?: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#f8fafc', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '22px 22px 0 0', zIndex: 10 }}>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>📋 Scan Details</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
        </div>
        <div style={{ padding: '18px 18px 36px' }}>
          <ProductResultCardBoundary>
            <ProductResultCard result={result} onScanAgain={onClose} onReVerify={onReVerify} />
          </ProductResultCardBoundary>
        </div>
      </div>
    </div>
  )
}

// ─── Supabase History Sync ────────────────────────────────────────────────────
// ─── Supabase History Sync ────────────────────────────────────────────────────
// Uses a simple INSERT (no upsert) — duplicate prevention is by timestamp key
async function syncHistoryToSupabase(userId: string, scan: ScanResult) {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase')
    const supabase = getSupabaseClient()
    // Verify session exists
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('[Veri9 Sync] No session — cannot save scan history')
      return
    }
    const { error } = await supabase.from('scan_history').insert({
      user_id: userId,
      barcode: scan.barcode,
      product_name: scan.productName || 'Unknown Product',
      brand: scan.brand || null,
      category: scan.category || null,
      trust_score: scan.trustScore ?? 0,
      status: scan.status || 'not_found',
      country: scan.country || null,
      image_url: scan.image || null,
      full_result: scan,  // Store the entire scan object for full cross-device restoration
      scanned_at: scan.timestamp ? new Date(scan.timestamp).toISOString() : new Date().toISOString(),
    })
    if (error) {
      console.warn('[Veri9 Sync] INSERT failed:', error.message, error.code, error.details)
    } else {
      console.log('[Veri9 Sync] ✓ Scan saved to Supabase:', scan.barcode)
    }
  } catch (e) {
    console.warn('[Veri9 Sync] Exception:', e)
  }
}

async function loadHistoryFromSupabase(userId: string): Promise<ScanResult[]> {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase')
    const supabase = getSupabaseClient()
    
    // Verify session is active before querying
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('[Veri9 Sync] No active Supabase session — user may not be authenticated with Supabase')
      return []
    }
    
    const { data, error } = await supabase
      .from('scan_history')
      .select('id, barcode, product_name, brand, category, trust_score, status, country, image_url, full_result, scanned_at')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(100)

    if (error) {
      console.warn('[Veri9 Sync] SELECT failed:', error.message, error.code)
      return []
    }

    if (data && data.length > 0) {
      console.log(`[Veri9 Sync] ✓ Loaded ${data.length} scans from Supabase`)
      return data.map((row: Record<string, unknown>) => {
        // Use full_result if available (best data), else reconstruct from individual columns
        if (row.full_result && typeof row.full_result === 'object') {
          const fr = row.full_result as ScanResult
          return {
            ...fr,
            timestamp: fr.timestamp || new Date(row.scanned_at as string).getTime(),
          }
        }
        // Reconstruct from individual columns
        return {
          barcode: String(row.barcode || ''),
          productName: String(row.product_name || 'Unknown Product'),
          brand: String(row.brand || ''),
          manufacturer: '',
          category: String(row.category || ''),
          trustScore: Number(row.trust_score || 0),
          status: (row.status as ScanResult['status']) || 'not_found',
          sources: [],
          recall: false,
          timestamp: new Date(row.scanned_at as string).getTime(),
          country: String(row.country || ''),
          image: String(row.image_url || ''),
        }
      })
    }
    return []
  } catch (e) {
    console.warn('[Veri9 Sync] Load exception:', e)
    return []
  }
}

async function deleteScanFromSupabase(userId: string, barcode: string, timestamp: number): Promise<boolean> {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase')
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false
    const iso = new Date(timestamp).toISOString()
    // Match by user_id + barcode + scanned_at (within ±2s tolerance)
    const lo = new Date(timestamp - 2000).toISOString()
    const hi = new Date(timestamp + 2000).toISOString()
    const { error } = await supabase
      .from('scan_history')
      .delete()
      .eq('user_id', userId)
      .eq('barcode', barcode)
      .gte('scanned_at', lo)
      .lte('scanned_at', hi)
    if (error) {
      console.warn('[Veri9 Sync] DELETE failed:', error.message, 'iso:', iso)
      return false
    }
    return true
  } catch (e) {
    console.warn('[Veri9 Sync] Delete exception:', e)
    return false
  }
}

async function clearAllScansFromSupabase(userId: string): Promise<boolean> {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase')
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false
    const { error } = await supabase.from('scan_history').delete().eq('user_id', userId)
    if (error) {
      console.warn('[Veri9 Sync] CLEAR failed:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn('[Veri9 Sync] Clear exception:', e)
    return false
  }
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
// ─── SUPPORT VERI9 (DONATION PANEL) ───────────────────────────────────────
// Renders the same currency + gateway picker as /donate but inside the dashboard
// shell so the side nav stays visible. Donation intents are persisted to
// localStorage (veri9_donations) where the admin dashboard already reads them.
type PanelCurrency = { code: string; symbol: string; name: string; flag: string; rate: number; presets: number[] }
const PANEL_CURRENCIES: PanelCurrency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',          flag: '🇺🇸', rate: 1,       presets: [5, 10, 25, 50, 100] },
  { code: 'EUR', symbol: '€',   name: 'Euro',               flag: '🇪🇺', rate: 0.92,    presets: [5, 10, 25, 50, 100] },
  { code: 'GBP', symbol: '£',   name: 'British Pound',      flag: '🇬🇧', rate: 0.79,    presets: [5, 10, 20, 50, 100] },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',    flag: '🇨🇦', rate: 1.36,    presets: [10, 20, 50, 100, 200] },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',  flag: '🇦🇺', rate: 1.52,    presets: [10, 20, 50, 100, 200] },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',       flag: '🇯🇵', rate: 150,     presets: [500, 1000, 3000, 7000, 15000] },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',       flag: '🇨🇳', rate: 7.2,     presets: [30, 70, 200, 400, 700] },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',       flag: '🇮🇳', rate: 83,      presets: [100, 500, 1000, 3000, 7000] },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',     flag: '🇧🇷', rate: 5,       presets: [25, 50, 100, 250, 500] },
  { code: 'MXN', symbol: '$',   name: 'Mexican Peso',       flag: '🇲🇽', rate: 17,      presets: [50, 100, 250, 500, 1000] },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',     flag: '🇳🇬', rate: 1500,    presets: [2000, 5000, 10000, 25000, 50000] },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',    flag: '🇰🇪', rate: 150,     presets: [500, 1000, 3000, 5000, 10000] },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand', flag: '🇿🇦', rate: 18,      presets: [50, 100, 250, 500, 1000] },
  { code: 'GHS', symbol: '₵',   name: 'Ghanaian Cedi',      flag: '🇬🇭', rate: 14,      presets: [30, 70, 150, 300, 700] },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',         flag: '🇦🇪', rate: 3.67,    presets: [20, 50, 100, 200, 500] },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',   flag: '🇸🇬', rate: 1.34,    presets: [10, 20, 50, 100, 200] },
]
type PanelGateway = { id: string; name: string; adminName?: string; icon: string; currencies: string[]; color: string; desc: string }
const PANEL_GATEWAYS: PanelGateway[] = [
  { id: 'stripe',      name: 'Credit / Debit Card', adminName: 'Stripe',            icon: '💳', currencies: ['*'], color: '#635bff', desc: 'Visa, Mastercard, Amex via Stripe' },
  { id: 'paypal',      name: 'PayPal',              adminName: 'PayPal',            icon: '🅿️', currencies: ['*'], color: '#0070ba', desc: 'PayPal balance or linked cards' },
  { id: 'applepay',    name: 'Apple Pay',           adminName: 'Apple Pay',         icon: '',  currencies: ['*'], color: '#000',    desc: 'Face ID / Touch ID checkout' },
  { id: 'googlepay',   name: 'Google Pay',          adminName: 'Google Pay',        icon: 'G',  currencies: ['*'], color: '#4285f4', desc: 'Quick pay via Google account' },
  { id: 'paystack',    name: 'Paystack',            adminName: 'Paystack',          icon: '🌍', currencies: ['NGN','GHS','KES','ZAR','USD'], color: '#0ba5ec', desc: 'Nigeria · Ghana · Kenya · SA' },
  { id: 'flutterwave', name: 'Flutterwave',         adminName: 'Flutterwave',       icon: '🦋', currencies: ['NGN','GHS','KES','ZAR','USD','EUR','GBP'], color: '#f5a623', desc: 'Cards · Bank · Mobile Money across Africa' },
  { id: 'mpesa',       name: 'M-Pesa',              adminName: 'M-Pesa',            icon: '📱', currencies: ['KES'], color: '#00a650', desc: 'Kenya · Tanzania · Uganda mobile money' },
  { id: 'razorpay',    name: 'Razorpay',            adminName: 'Razorpay',          icon: '🇮🇳', currencies: ['INR','USD'], color: '#0c2451', desc: 'UPI · NetBanking · India' },
  { id: 'alipay',      name: 'Alipay',              adminName: 'Alipay',            icon: '🇨🇳', currencies: ['CNY','USD'], color: '#1677ff', desc: 'China · Hong Kong · SEA' },
  { id: 'mercadopago', name: 'Mercado Pago',        adminName: 'Mercado Pago',      icon: '🛒', currencies: ['BRL','MXN','USD'], color: '#00b1ea', desc: 'Brazil · Mexico · Argentina' },
  { id: 'crypto',      name: 'Crypto (BTC/ETH/USDT)', adminName: 'Coinbase Commerce', icon: '₿', currencies: ['*'], color: '#f7931a', desc: 'Bitcoin · Ethereum · USDT' },
]

function DonatePanel({ isDark, forcedColor, userEmail, userName }: { isDark: boolean; forcedColor: string; userEmail: string; userName: string }) {
  const [currency, setCurrency] = useState<PanelCurrency>(PANEL_CURRENCIES[0])
  const [amount, setAmount] = useState<number | ''>(PANEL_CURRENCIES[0].presets[1])
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [gateway, setGateway] = useState<string>('stripe')
  const [submitting, setSubmitting] = useState(false)
  const [donorName, setDonorName] = useState(userName || '')
  const [donorEmail, setDonorEmail] = useState(userEmail || '')
  const [donorPhone, setDonorPhone] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [donationSuccess, setDonationSuccess] = useState<{ gateway: string; amount: string; currency: string } | null>(null)

  useEffect(() => {
    setAmount(currency.presets[1])
    setCustomAmount('')
  }, [currency])

  // Check for success/error redirect params when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const success   = params.get('success')
    const cancelled = params.get('cancelled')
    const error     = params.get('error')
    if (success) {
      const amt = params.get('amount') || ''
      const cur = params.get('currency') || 'USD'
      setDonationSuccess({ gateway: success, amount: amt, currency: cur })
      window.history.replaceState({}, '', '/dashboard?tab=donate')
    } else if (cancelled) {
      toast.error('Donation cancelled.')
      window.history.replaceState({}, '', '/dashboard?tab=donate')
    } else if (error) {
      toast.error('Payment error: ' + error.replace(/_/g, ' ') + '. Please try again.')
      window.history.replaceState({}, '', '/dashboard?tab=donate')
    }
  }, [])

  // Map PANEL_GATEWAY id → admin display name for filtering
  const GATEWAY_ADMIN_NAMES: Record<string, string> = {
    stripe: 'Stripe', paypal: 'PayPal', applepay: 'Apple Pay', googlepay: 'Google Pay',
    paystack: 'Paystack', flutterwave: 'Flutterwave', mpesa: 'M-Pesa', razorpay: 'Razorpay',
    alipay: 'Alipay', mercadopago: 'Mercado Pago', crypto: 'Coinbase Commerce',
  }
  const [activeGatewayNames, setActiveGatewayNames] = useState<Record<string, boolean>>({})
  useEffect(() => {
    // Primary: fetch the server-wide admin-controlled state so toggles apply across ALL users
    let alive = true
    fetch('/api/public/active-gateways', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { map: {} })
      .then(d => { if (alive) setActiveGatewayNames(d.map || {}) })
      .catch(() => {
        // Fallback: this browser's own admin toggles (useful in local dev)
        try {
          const saved = localStorage.getItem('veri9_active_gateways')
          if (saved && alive) setActiveGatewayNames(JSON.parse(saved))
        } catch {}
      })
    return () => { alive = false }
  }, [])

  const compatible = PANEL_GATEWAYS.filter(g => {
    const currencyOk = g.currencies.includes('*') || g.currencies.includes(currency.code)
    if (!currencyOk) return false
    const adminName = GATEWAY_ADMIN_NAMES[g.id]
    // If admin has explicitly set a gateway to false, hide it; default is visible
    if (adminName && activeGatewayNames[adminName] === false) return false
    return true
  })
  useEffect(() => {
    if (!compatible.find(g => g.id === gateway)) setGateway('stripe')
  }, [currency]) // eslint-disable-line react-hooks/exhaustive-deps

  const GATEWAY_ROUTES: Record<string, string> = {
    stripe:      '/api/donate/stripe',
    paypal:      '/api/donate/paypal',
    applepay:    '/api/donate/applepay',
    googlepay:   '/api/donate/googlepay',
    paystack:    '/api/donate/paystack',
    flutterwave: '/api/donate/flutterwave',
    mpesa:       '/api/donate/mpesa',
    razorpay:    '/api/donate/razorpay',
    alipay:      '/api/donate/alipay',
    mercadopago: '/api/donate/mercadopago',
    crypto:      '/api/donate/crypto',
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalAmount = customAmount ? parseFloat(customAmount) : (amount as number)
    if (!finalAmount || finalAmount < 1) { toast.error('Please enter a valid amount'); return }
    if (!anonymous) {
      if (!donorName.trim() && !donorEmail.trim()) {
        toast.error('Please enter your name or email \u2014 or tick \u201cDonate anonymously\u201d.')
        return
      }
      if (donorEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
        toast.error('Please enter a valid email address.')
        return
      }
    }
    if (gateway === 'mpesa' && !donorPhone.trim()) {
      toast.error('Please enter your M-Pesa phone number (e.g. 0712345678).')
      return
    }
    if (!captchaToken) { toast.error('Please complete the reCAPTCHA check'); return }

    const selectedGateway = PANEL_GATEWAYS.find(g => g.id === gateway)
    setSubmitting(true)

    // Verify reCAPTCHA
    try {
      const captchaRes = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      if (!captchaRes.ok) {
        const d = await captchaRes.json()
        toast.error(d.error || 'reCAPTCHA verification failed. Please try again.')
        recaptchaRef.current?.reset(); setCaptchaToken(null)
        setSubmitting(false); return
      }
    } catch {
      toast.error('reCAPTCHA verification error. Please try again.')
      recaptchaRef.current?.reset(); setCaptchaToken(null)
      setSubmitting(false); return
    }

    const route = GATEWAY_ROUTES[gateway]
    if (!route) {
      toast.error('This payment method is not yet available.')
      setSubmitting(false); return
    }

    // ═══ Persist donation intent to server (primary source for admin) ═══
    let serverDonationId = ''
    try {
      const donRes = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency: currency.code,
          usdEquivalent: (finalAmount / currency.rate).toFixed(2),
          gateway,
          gatewayName: selectedGateway?.name || gateway,
          anonymous,
          name: anonymous ? 'Anonymous' : (donorName.trim() || 'Anonymous'),
          email: anonymous ? '' : donorEmail.trim(),
          message: message.trim(),
          status: 'pending_gateway_config',
        }),
      })
      if (donRes.ok) {
        const d = await donRes.json()
        serverDonationId = d.id || ''
      }
    } catch {}
    // Tag for later status updates via /api/donations PATCH (used by gateway callbacks)
    if (serverDonationId) { try { sessionStorage.setItem('veri9_last_donation_id', serverDonationId) } catch {} }

    // Also notify admin so it appears in Submissions + Email Log
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'donation',
          data: {
            Amount: `${currency.symbol}${finalAmount} ${currency.code} (≈ $${(finalAmount / currency.rate).toFixed(2)} USD)`,
            Gateway: selectedGateway?.name || gateway,
            Name: anonymous ? '(anonymous)' : (donorName.trim() || '—'),
            Email: anonymous ? '—' : (donorEmail.trim() || '—'),
            Message: message.trim() || '—',
            Status: 'initiated',
          },
        }),
      })
    } catch {}

    try {
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:     finalAmount,
          currency:   currency.code,
          donorName:  anonymous ? '' : donorName.trim(),
          donorEmail: anonymous ? '' : donorEmail.trim(),
          phone:      donorPhone.trim(),
          message:    message.trim(),
          gateway,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 503) {
          // Gateway not configured yet
          toast(('\u2699\ufe0f ' + (data.error || (selectedGateway?.name + ' is not yet configured by the admin.'))), { duration: 7000 })
          // Save locally as pending intent
          try {
            const intents = JSON.parse(localStorage.getItem('veri9_donations') || '[]')
            intents.push({
              id: 'don_' + Date.now(),
              amount: finalAmount, currency: currency.code,
              usdEquivalent: (finalAmount / currency.rate).toFixed(2),
              gateway, gatewayName: selectedGateway?.name,
              name: anonymous ? 'Anonymous' : (donorName.trim() || 'Anonymous'),
              email: anonymous ? '' : donorEmail.trim(),
              anonymous, message, status: 'pending_gateway_config',
              createdAt: new Date().toISOString(),
            })
            localStorage.setItem('veri9_donations', JSON.stringify(intents))
          } catch {}
        } else {
          toast.error(data.error || 'Payment failed. Please try again.')
        }
        recaptchaRef.current?.reset(); setCaptchaToken(null)
        setSubmitting(false)
        return
      }

      // Redirect-based gateways
      if (data.checkoutUrl)     { toast.success('Redirecting to ' + selectedGateway?.name + '\u2026'); window.location.href = data.checkoutUrl; return }
      if (data.approvalUrl)     { toast.success('Redirecting to PayPal\u2026'); window.location.href = data.approvalUrl; return }
      if (data.authorizationUrl){ toast.success('Redirecting to ' + selectedGateway?.name + '\u2026'); window.location.href = data.authorizationUrl; return }
      if (data.paymentUrl)      { toast.success('Redirecting to ' + selectedGateway?.name + '\u2026'); window.location.href = data.paymentUrl; return }

      // M-Pesa STK Push
      if (data.checkoutRequestId) {
        toast.success(data.message || 'STK Push sent! Check your phone and enter your M-Pesa PIN.', { duration: 8000 })
        setCustomAmount(''); setMessage(''); setAmount(currency.presets[1])
        recaptchaRef.current?.reset(); setCaptchaToken(null)
        setSubmitting(false); return
      }

      // Razorpay (client-side SDK needed)
      if (data.orderId && data.keyId) {
        toast.success('Razorpay order created! The checkout widget will open shortly.', { duration: 6000 })
        setSubmitting(false); return
      }

      toast.success('Donation initiated via ' + selectedGateway?.name + '! \ud83d\udc99')
      setCustomAmount(''); setMessage(''); setAmount(currency.presets[1])
    } catch (err) {
      console.error('[DonatePanel] Error:', err)
      toast.error('Something went wrong. Please try again.')
    }

    recaptchaRef.current?.reset(); setCaptchaToken(null)
    setSubmitting(false)
  }

  const panelCard: React.CSSProperties = {
    background: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderRadius: 14,
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }
  const inputBg = isDark ? '#0f172a' : '#fff'
  const mutedColor = isDark ? '#94a3b8' : '#64748b'
  const displayAmount = customAmount || amount || 0

  return (
    <div style={{ maxWidth: 760 }}>
      {/* ── Payment success banner (after redirect back) ── */}
      {donationSuccess && (
        <div style={{ marginBottom: 20, padding: '18px 20px', borderRadius: 14, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🎉</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#14532d', fontSize: '0.95rem' }}>
              Thank you! Your donation was received.
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#166534' }}>
              {donationSuccess.currency} {donationSuccess.amount} via {donationSuccess.gateway.charAt(0).toUpperCase() + donationSuccess.gateway.slice(1)} — we appreciate your support! 💙
            </p>
          </div>
          <button onClick={() => setDonationSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#16a34a', flexShrink: 0 }}>✕</button>
        </div>
      )}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 'clamp(1.15rem,3vw,1.6rem)', fontWeight: 900, color: forcedColor, letterSpacing: '-0.03em', marginBottom: 3 }}>💙 Support Veri9</h1>
        <p style={{ fontSize: '0.875rem', color: mutedColor }}>Veri9 is free for everyone. Your donation keeps the verification engine running and the service free for everyone.</p>
      </div>

      {/* Donation form */}
      <form onSubmit={handleDonate} style={{ ...panelCard, padding: 'clamp(18px, 3vw, 24px)' }}>
        {/* Currency */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>🌍 Currency</label>
          <select
            value={currency.code}
            onChange={e => {
              const c = PANEL_CURRENCIES.find(c => c.code === e.target.value)
              if (c) setCurrency(c)
            }}
            style={{ width: '100%', padding: '11px 14px', border: `1.5px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: 10, fontSize: '0.9rem', outline: 'none', background: inputBg, color: forcedColor, fontWeight: 600, cursor: 'pointer' }}
          >
            {PANEL_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <label style={labelStyle}>Amount</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
          {currency.presets.map(p => {
            const active = amount === p && !customAmount
            return (
              <button key={p} type="button"
                onClick={() => { setAmount(p); setCustomAmount('') }}
                style={{
                  padding: '10px 3px', borderRadius: 9, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                  background: active ? 'linear-gradient(135deg,#635bff,#4f46e5)' : (isDark ? '#0f172a' : '#f8fafc'),
                  color: active ? '#fff' : forcedColor,
                  border: active ? '2px solid #635bff' : `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  transition: 'all 0.15s',
                }}>
                {currency.symbol}{p.toLocaleString()}
              </button>
            )
          })}
        </div>
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: mutedColor, fontWeight: 700 }}>{currency.symbol}</span>
          <input type="number" min={1} value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder={`Custom (${currency.presets[2]})`} style={{ width: '100%', padding: '10px 14px 10px 30px', border: `1.5px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: 10, fontSize: '0.9rem', outline: 'none', background: inputBg, color: forcedColor, boxSizing: 'border-box' }} />
        </div>

        {/* Gateway — dropdown */}
        <label style={labelStyle}>💳 Payment method</label>
        {(() => {
          const selGw = compatible.find(g => g.id === gateway) || compatible[0]
          return (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              {/* Custom styled select trigger */}
              <div style={{ position: 'relative' }}>
                <select
                  value={gateway}
                  onChange={e => setGateway(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 44px 11px 44px',
                    border: `1.5px solid ${selGw ? selGw.color : '#635bff'}`,
                    borderRadius: 10, fontSize: '0.88rem', fontWeight: 700,
                    color: forcedColor, background: inputBg,
                    cursor: 'pointer', outline: 'none', appearance: 'none',
                    WebkitAppearance: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {compatible.map(g => (
                    <option key={g.id} value={g.id}>{g.icon} {g.name} — {g.desc}</option>
                  ))}
                </select>
                {/* Icon badge on left */}
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 24, height: 24, borderRadius: 6, pointerEvents: 'none',
                  background: selGw ? selGw.color : '#635bff', color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800,
                }}>
                  {selGw?.icon || '💳'}
                </span>
                {/* Chevron on right */}
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', color: mutedColor, fontSize: '0.7rem',
                }}>▼</span>
              </div>
              {/* Description line below */}
              {selGw && (
                <p style={{ fontSize: '0.7rem', color: mutedColor, margin: '5px 0 0 4px' }}>
                  {selGw.desc} · {compatible.length} option{compatible.length !== 1 ? 's' : ''} for {currency.code}
                </p>
              )}
            </div>
          )
        })()}

        {/* Donor identity — Name / Email / Anonymous */}
        <div style={{ padding: '14px 14px', marginBottom: 16, borderRadius: 11, background: isDark ? '#0f172a' : '#f8fafc', border: `1px dashed ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: anonymous ? 0 : 10, gap: 10, flexWrap: 'wrap' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>👤 Your details</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: forcedColor, fontWeight: 600, userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#635bff', cursor: 'pointer' }}
              />
              Donate anonymously
            </label>
          </div>
          {!anonymous && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: mutedColor, display: 'block', marginBottom: 4 }}>Name</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 9, fontSize: '0.85rem', outline: 'none', background: inputBg, color: forcedColor, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: mutedColor, display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={e => setDonorEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 9, fontSize: '0.85rem', outline: 'none', background: inputBg, color: forcedColor, boxSizing: 'border-box' }}
                />
              </div>
              {gateway === 'mpesa' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#00a650', display: 'block', marginBottom: 4 }}>📱 M-Pesa Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={e => setDonorPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or 254712345678"
                    autoComplete="tel"
                    required
                    style={{ width: '100%', padding: '9px 12px', border: `1.5px solid #00a650`, borderRadius: 9, fontSize: '0.85rem', outline: 'none', background: inputBg, color: forcedColor, boxSizing: 'border-box' }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: mutedColor }}>An STK Push will be sent to this number. Enter your M-Pesa PIN to complete.</p>
                </div>
              )}
            </div>
          )}
          {anonymous && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.74rem', color: mutedColor, lineHeight: 1.5 }}>
              Your donation will be recorded as <strong style={{ color: forcedColor }}>Anonymous</strong>. No name or email will be attached to the receipt.
            </p>
          )}
        </div>

        {/* Message */}
        <label style={labelStyle}>Message (optional)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={2}
          placeholder="Leave a supportive note…"
          style={{ width: '100%', padding: '10px 14px', marginBottom: 18, border: `1.5px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: 10, fontSize: '0.88rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: inputBg, color: forcedColor, boxSizing: 'border-box' }}
        />

        {/* reCAPTCHA */}
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
            onChange={(token: string | null) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
            theme={isDark ? 'dark' : 'light'}
          />
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting} style={{
          width: '100%', padding: 14, borderRadius: 11, border: 'none',
          background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#635bff,#4f46e5)',
          color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: submitting ? 'wait' : 'pointer',
          boxShadow: '0 4px 14px rgba(99,91,255,0.25)',
          minHeight: 50,
        }}>
          {submitting ? 'Processing…' : `💙 Donate ${currency.symbol}${Number(displayAmount).toLocaleString()} ${currency.code}`}
        </button>

        <p style={{ marginTop: 12, fontSize: '0.7rem', color: mutedColor, textAlign: 'center', lineHeight: 1.5 }}>
          🔒 Processed by {PANEL_GATEWAYS.find(g => g.id === gateway)?.name || 'Stripe'} · No recurring charges · {anonymous ? 'Donating anonymously' : (donorEmail ? `Receipt will be sent to ${donorEmail}` : 'Enter your email for a receipt')}
        </p>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Serial Number / Style Code Lookup Tab
// ──────────────────────────────────────────────────────────────────────────────
function SerialNumberTab({ onResult, onVerifying, onError }: {
  onResult: (r: ScanResult) => void
  onVerifying: () => void
  onError: () => void
}) {
  const [serial, setSerial] = useState('')
  const [brand, setBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serial.trim()) return
    setLoading(true)
    onVerifying()
    try {
      const params = new URLSearchParams({ serial: serial.trim(), brand: brand.trim() })
      const res = await fetch(`/api/verify/serial?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lookup failed')
      onResult(data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Serial lookup failed')
      onError()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
            <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Brand / Manufacturer</label>
        <input
          type="text"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          placeholder="e.g. Nike, Louis Vuitton, Samsung…"
          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', outline: 'none', background: '#f9fafb', marginBottom: 12, boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = '#635bff')}
          onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
        />
        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Serial Number / Style Code</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={serial}
            onChange={e => { setSerial(e.target.value); setHint(null) }}
            placeholder="e.g. FA8321-C7, SN:2024011502, AQ4222-106"
            maxLength={80}
            style={{ flex: 1, minWidth: 150, padding: '12px 15px', border: '1.5px solid #e5e7eb', borderRadius: 11, fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none', background: '#f9fafb' }}
            onFocus={e => (e.target.style.borderColor = '#635bff')}
            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
          />
          <button type="submit" disabled={!serial.trim() || loading}
            style={{ padding: '12px 20px', borderRadius: 11, background: !serial.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #635bff, #7c3aed)', color: !serial.trim() ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: !serial.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? '⟳ Checking…' : 'Lookup →'}
          </button>
        </div>
        {hint && <p style={{ fontSize: '0.78rem', color: '#f59e0b', marginBottom: 8 }}>{hint}</p>}
        <div style={{ marginTop: 14, padding: '10px 13px', background: '#f8fafc', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
          <strong>Where to find your code:</strong>
          <ul style={{ margin: '4px 0 0 14px', padding: 0 }}>
            <li><strong>Luxury bags:</strong> interior heat stamp, leather tab, or date code</li>
            <li><strong>Shoes/Sneakers:</strong> tongue label or inside sole tag (style + colorway + size)</li>
            <li><strong>Electronics:</strong> IMEI, model number, FCC ID on the back sticker</li>
            <li><strong>Watches:</strong> case back engraving or warranty card serial</li>
            <li><strong>Apparel:</strong> hologram tag or QR code on the garment</li>
          </ul>
        </div>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// AI Photo Authentication Tab (Google Vision)
// ──────────────────────────────────────────────────────────────────────────────
function PhotoAuthTab({ onResult, onVerifying, onError }: {
  onResult: (r: ScanResult) => void
  onVerifying: () => void
  onError: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraLoading, setCameraLoading] = useState(false)

  const handleFile = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const stopPhotoCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  const startPhotoCamera = async () => {
    setCameraError('')
    setCameraLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      // setCameraActive(true) FIRST so React renders the <video> element,
      // then attach the stream in the useEffect below once the ref is available.
      setCameraActive(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setCameraError(msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
        ? 'Camera permission denied. Please allow access in your browser.'
        : msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no camera')
          ? 'No camera detected on this device.'
          : 'Could not start camera: ' + msg)
    } finally {
      setCameraLoading(false)
    }
  }

  // Once cameraActive=true, the <video> element has been rendered.
  // Attach the stream now that videoRef.current is available.
  useEffect(() => {
    if (!cameraActive || !streamRef.current) return
    const video = videoRef.current
    if (!video) return
    video.srcObject = streamRef.current
    video.play().catch(() => { /* autoplay: user gesture already present */ })
  }, [cameraActive])

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) { toast.error('Camera not ready — please wait a moment'); return }
    // If video hasn't loaded its dimensions yet, wait for loadedmetadata
    const doCapture = () => {
      if (!video.videoWidth || !video.videoHeight) { toast.error('Camera not ready — try again'); return }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        if (!blob) { toast.error('Could not capture photo'); return }
        const capturedFile = new File([blob], `veri9-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
        handleFile(capturedFile)
        stopPhotoCamera()
      }, 'image/jpeg', 0.92)
    }
    if (video.readyState >= 2) {
      doCapture()
    } else {
      video.addEventListener('loadeddata', doCapture, { once: true })
    }
  }

  // Stop camera on unmount or mode change
  useEffect(() => () => { stopPhotoCamera() }, [stopPhotoCamera])
  useEffect(() => { if (mode !== 'camera') stopPhotoCamera() }, [mode, stopPhotoCamera])

  const handleSubmit = async () => {
    if (!file || !preview) return
    setLoading(true)
    onVerifying()
    try {
      // Strip the data:image/xxx;base64, prefix
      const base64 = preview.split(',')[1]
      const res = await fetch('/api/verify/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Photo analysis failed')
      onResult(data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Photo analysis failed')
      onError()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      
      {/* Mode toggle: Camera vs Upload */}
      {!preview && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, padding: 4, background: '#f1f5f9', borderRadius: 10 }}>
          <button
            onClick={() => setMode('camera')}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === 'camera' ? '#fff' : 'transparent',
              color: mode === 'camera' ? '#7c3aed' : '#64748b',
              fontWeight: 700, fontSize: '0.82rem',
              boxShadow: mode === 'camera' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
            📸 Use Camera
          </button>
          <button
            onClick={() => setMode('upload')}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === 'upload' ? '#fff' : 'transparent',
              color: mode === 'upload' ? '#7c3aed' : '#64748b',
              fontWeight: 700, fontSize: '0.82rem',
              boxShadow: mode === 'upload' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
            📁 Upload Photo
          </button>
        </div>
      )}

      {/* Camera view */}
      {!preview && mode === 'camera' && (
        <div style={{ marginBottom: 14 }}>
          {!cameraActive && !cameraError && (
            <div style={{ border: '2px dashed #d1d5db', borderRadius: 14, padding: 32, textAlign: 'center', background: '#f9fafb' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>📷</div>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Capture a product photo</p>
              <button
                onClick={startPhotoCamera}
                style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #635bff)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,91,255,0.3)' }}>
                Start Camera
              </button>
            </div>
          )}

          {cameraError && (
            <div style={{ border: '1px solid #fecaca', borderRadius: 12, padding: 14, background: '#fef2f2', textAlign: 'center' }}>
              <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginBottom: 10 }}>⚠️ {cameraError}</p>
              <button onClick={() => { setCameraError(''); setMode('upload') }}
                style={{ padding: '7px 14px', borderRadius: 8, background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: '0.78rem', border: '1px solid #fecaca', cursor: 'pointer' }}>
                Switch to Upload
              </button>
            </div>
          )}

          {cameraActive && (
            <div>
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#0f172a', aspectRatio: '4/3' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {/* Framing overlay */}
                <div style={{ position: 'absolute', inset: '10% 8%', border: '2px solid rgba(255,255,255,0.6)', borderRadius: 10, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600 }}>
                  📷 Frame the product label clearly
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={capturePhoto}
                  style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #635bff)', color: '#fff', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,91,255,0.3)' }}>
                  📸 Capture Photo
                </button>
                <button
                  onClick={stopPhotoCamera}
                  style={{ padding: '12px 16px', borderRadius: 12, background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drop zone for upload mode */}
      {!preview && mode === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#635bff' : '#d1d5db'}`,
            borderRadius: 14, padding: 24, textAlign: 'center', cursor: 'pointer',
            background: dragOver ? '#eef2ff' : '#f9fafb',
            marginBottom: 14, transition: 'all 0.2s',
          }}>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📁</div>
          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Drop a photo here or tap to upload</p>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>JPG, PNG, WEBP · Max 5MB · Front of product, tag, or label</p>
        </div>
      )}

      {/* Preview (same for both modes) */}
      {preview && (
        <div style={{ border: '2px solid #10b981', borderRadius: 14, padding: 18, textAlign: 'center', background: '#f0fdf4', marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 10, objectFit: 'contain', marginBottom: 10 }} />
          <br />
          <button onClick={() => { setFile(null); setPreview(null) }}
            style={{ padding: '6px 16px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}>
            ✕ Retake / Remove
          </button>
        </div>
      )}

      {preview && (
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '13px 20px', borderRadius: 12, background: loading ? '#e2e8f0' : 'linear-gradient(135deg, #7c3aed, #635bff)', color: loading ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(99,91,255,0.3)' }}>
          {loading ? '⟳ Analysing with AI…' : '🔍 Analyse Photo'}
        </button>
      )}

      <div style={{ marginTop: 14, padding: '10px 13px', background: '#f8fafc', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
        <strong>Tips for best results:</strong>
        <ul style={{ margin: '4px 0 0 14px', padding: 0 }}>
          <li>Use good lighting — avoid shadows across the label</li>
          <li>Include all visible text (brand, lot number, country of origin)</li>
          <li>Photograph the hologram or security seal if present</li>
          <li>For handbags/shoes, photograph the inside label or date code</li>
        </ul>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QR Code Tab
// Dual-mode: live camera QR scanning (via html5-qrcode) + manual URL paste
// Routes all results through /api/verify/qr → ScanResult
// ─────────────────────────────────────────────────────────────────────────────
function QrCodeTab({ onResult, onVerifying, onError }: {
  onResult: (r: ScanResult) => void
  onVerifying: () => void
  onError: () => void
}) {
  const [mode, setMode] = useState<'camera' | 'paste'>('camera')
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<unknown>(null)
  const scanLockedRef = useRef(false)
  const SCANNER_ID = 'qr-tab-scanner'

  const stopQrCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const s = scannerRef.current as { stop: () => Promise<void>; clear: () => void }
        await s.stop()
        s.clear()
      } catch { /* already stopped */ }
      scannerRef.current = null
    }
    setCameraActive(false)
    scanLockedRef.current = false
  }, [])

  const startQrCamera = useCallback(async () => {
    setCameraError('')
    scanLockedRef.current = false
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(SCANNER_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        async (text: string) => {
          if (scanLockedRef.current) return
          const trimmed = text.trim()
          const isUrl = /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)
          if (!isUrl) return
          scanLockedRef.current = true
          await stopQrCamera()
          setLoading(true)
          onVerifying()
          try {
            const res = await fetch('/api/verify/qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: trimmed }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'QR verification failed')
            onResult(data as ScanResult)
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'QR verification failed')
            onError()
          } finally {
            setLoading(false)
          }
        },
        () => { /* decode failure */ }
      )
      setCameraActive(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setCameraError(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
          ? 'Camera permission denied. Please allow access in your browser.'
          : msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no camera')
            ? 'No camera detected on this device.'
            : 'Could not start camera: ' + msg
      )
    }
  }, [onResult, onVerifying, onError, stopQrCamera])

  useEffect(() => { return () => { stopQrCamera() } }, [stopQrCamera])
  useEffect(() => { if (mode !== 'camera') stopQrCamera() }, [mode, stopQrCamera])

  const handlePasteVerify = async () => {
    const trimmed = urlInput.trim()
    if (!trimmed) { toast.error('Paste a QR code URL first'); return }
    const isUrl = /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)
    if (!isUrl) { toast.error('Please enter a valid URL from a QR code'); return }
    setLoading(true)
    onVerifying()
    try {
      const res = await fetch('/api/verify/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'QR verification failed')
      onResult(data as ScanResult)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'QR verification failed')
      onError()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, padding: 4, background: '#f1f5f9', borderRadius: 10 }}>
        <button onClick={() => setMode('camera')} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === 'camera' ? '#fff' : 'transparent', color: mode === 'camera' ? '#635bff' : '#64748b', fontWeight: mode === 'camera' ? 700 : 500, fontSize: '0.84rem', boxShadow: mode === 'camera' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
          📷 Scan QR
        </button>
        <button onClick={() => setMode('paste')} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === 'paste' ? '#fff' : 'transparent', color: mode === 'paste' ? '#635bff' : '#64748b', fontWeight: mode === 'paste' ? 700 : 500, fontSize: '0.84rem', boxShadow: mode === 'paste' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
          📋 Paste URL
        </button>
      </div>

      {mode === 'camera' && (
        <div>
          <div id={SCANNER_ID} style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000', minHeight: cameraActive ? 260 : 0 }} />
          {cameraError && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.82rem', color: '#dc2626' }}>
              ⚠️ {cameraError}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            {!cameraActive ? (
              <button onClick={startQrCamera} disabled={loading} style={{ width: '100%', padding: '13px 0', borderRadius: 11, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
                📷 Start QR Scanner
              </button>
            ) : (
              <button onClick={stopQrCamera} style={{ width: '100%', padding: '13px 0', borderRadius: 11, background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.92rem', border: 'none', cursor: 'pointer' }}>
                ✕ Stop Scanner
              </button>
            )}
          </div>
          {cameraActive && (
            <p style={{ marginTop: 10, fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
              Point your camera at a QR code on the product or packaging
            </p>
          )}
        </div>
      )}

      {mode === 'paste' && (
        <div>
          <p style={{ fontSize: '0.84rem', color: '#374151', marginBottom: 10 }}>
            Use your phone camera app to scan the QR code, copy the URL it shows, then paste it here:
          </p>
          <textarea
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://verify.brand.com/product/abc123…"
            rows={3}
            style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', outline: 'none', color: '#1e293b' }}
          />
          <button
            onClick={handlePasteVerify}
            disabled={loading || !urlInput.trim()}
            style={{ marginTop: 10, width: '100%', padding: '13px 0', borderRadius: 11, background: urlInput.trim() ? 'linear-gradient(135deg, #635bff, #7c3aed)' : '#e2e8f0', color: urlInput.trim() ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: urlInput.trim() && !loading ? 'pointer' : 'not-allowed', boxShadow: urlInput.trim() ? '0 4px 14px rgba(99,91,255,0.3)' : 'none', transition: 'all 0.2s' }}>
            {loading ? '🔍 Verifying…' : '🔍 Verify QR URL'}
          </button>
        </div>
      )}

      <div style={{ marginTop: 18, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, fontSize: '0.78rem', color: '#64748b' }}>
        <strong style={{ color: '#475569' }}>Tips for QR verification:</strong>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Look for QR codes on product labels, tags, boxes, or inner linings</li>
          <li>Luxury items (handbags, shoes) often use Certilogo or NFC QR codes</li>
          <li>Supplements & cosmetics may link to a certificate of analysis</li>
          <li>A suspicious QR domain is a strong counterfeit indicator</li>
        </ul>
      </div>
    </div>
  )
}


// ─── Main dashboard component ─────────────────────────────────────────────────
// NOTE: useSearchParams() is intentionally NOT used here — it caused React
// error #310 ("Rendered more hooks than during the previous render") because
// it triggers Suspense suspension during SSR/hydration, making hook counts
// differ between renders.  We read the initial tab from window.location.search
// in a one-time useEffect instead (see below).
function DashboardPageInner() {
  const { user, signOut, loading } = useAuth()
  const platformCfg = usePlatformConfig()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('overview')

  const setTab = (tab: Section) => {
    setActiveSection(tab)
    // History behavior for mobile back button:
    //  - overview → any tab:   PUSH a new history entry so pressing back
    //                          returns the user to the overview view.
    //  - any tab → overview:   we're returning to overview, REPLACE so we
    //                          don't leave a "dangling" entry in history.
    //  - tab → tab:            REPLACE so back still skips straight past
    //                          all intermediate tabs to the overview.
    if (tab === 'overview') {
      router.replace(`/dashboard`, { scroll: false })
    } else if (activeSection === 'overview') {
      router.push(`/dashboard?tab=${tab}`, { scroll: false })
    } else {
      router.replace(`/dashboard?tab=${tab}`, { scroll: false })
    }
  }
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [historyItem, setHistoryItem] = useState<ScanResult | null>(null)

  const [scanTab, setScanTab] = useState<ScanTab>('camera')
  const [scannerView, setScannerView] = useState<ScannerView>('scanner')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [manualBarcode, setManualBarcode] = useState('')
  const [pendingBarcode, setPendingBarcode] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const scannerInstanceRef = useRef<unknown>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerIdRef = useRef('dash-scanner-fixed')
  // Scan-stability tracking: require the SAME barcode to be decoded
  // multiple consecutive times before accepting it (prevents premature
  // scans that happen before the barcode is fully in focus).
  const lastScanCodeRef = useRef<string>('')
  const lastScanCountRef = useRef<number>(0)
  const scanLockedRef = useRef<boolean>(false)

  // User theme preference (light/dark) — hook must be at top level (not conditionally)
  const [userTheme, setUserTheme] = useState<'light' | 'dark'>('light')
  useEffect(() => {
    try {
      const saved = localStorage.getItem('veri9-user-theme') as 'light' | 'dark' | null
      if (saved === 'dark' || saved === 'light') setUserTheme(saved)
    } catch {}
  }, [])

  // Profile edit state
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileFullName, setProfileFullName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileLocation, setProfileLocation] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  // User-side verification cache clearing state (declared at top level —
  // must NEVER be declared after the early returns below or it causes React
  // error #310 "Rendered more hooks than during the previous render").
  const [userCacheClearing, setUserCacheClearing] = useState(false)
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata || {}
      setProfileFullName((meta.full_name as string) || '')
      setProfilePhone((meta.phone as string) || '')
      setProfileLocation((meta.location as string) || '')
      setProfileBio((meta.bio as string) || '')
    }
  }, [user])

  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading, router])

  // Read initial tab from URL on first client render, and keep state in sync
  // with the browser's back/forward navigation (popstate). Without a popstate
  // listener, pressing the mobile device's back button updates the URL (via
  // Next.js router history) but leaves `activeSection` stuck on the old tab,
  // forcing the user to re-open the hamburger menu to get back to overview.
  // We intentionally avoid useSearchParams() — it triggers Suspense suspension
  // during SSR/hydration which causes React error #310 (hook count mismatch).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const valid: Section[] = ['overview', 'scanner', 'scans', 'profile', 'security', 'settings', 'donate', 'community', 'brands', 'blog', 'about', 'contact', 'privacy', 'terms']

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab') as Section | null
      if (tab && valid.includes(tab)) {
        setActiveSection(tab)
      } else {
        // No ?tab= in URL → we're at the dashboard root, show overview.
        // This is what runs when the user taps the mobile back button after
        // navigating into a tab like /dashboard?tab=profile → /dashboard.
        setActiveSection('overview')
      }
      // Also close the mobile sidebar if it's open, so the user lands on
      // the overview view cleanly instead of seeing the menu again.
      setSidebarOpen(false)
      // Clear any open history detail modal too.
      setHistoryItem(null)
    }

    // Initial sync on mount
    syncFromUrl()

    // Listen for back/forward navigation (including mobile device back button)
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load history: localStorage immediately, then merge with Supabase
  useEffect(() => {
    if (!user) return
    // Normalize a scan result to ensure required fields are always present
    const normalizeScan = (s: ScanResult): ScanResult => ({
      ...s,
      sources: Array.isArray(s.sources) ? s.sources : [],
      trustScore: typeof s.trustScore === 'number' && !isNaN(s.trustScore) ? s.trustScore : 0,
      recall: typeof s.recall === 'boolean' ? s.recall : false,
      timestamp: typeof s.timestamp === 'number' ? s.timestamp : Date.now(),
      status: typeof s.status === 'string' ? s.status : 'not_found',
      manufacturer: typeof s.manufacturer === 'string' ? s.manufacturer : '',
      nutritionGrade: typeof s.nutritionGrade === 'string' ? s.nutritionGrade : '',
      category: typeof s.category === 'string' ? s.category : '',
      country: typeof s.country === 'string' ? s.country : '',
      gs1Region: typeof s.gs1Region === 'string' ? s.gs1Region : '',
    })
    const local = (getScanHistory() as ScanResult[]).map(normalizeScan)
    setScanHistory(local)
    loadHistoryFromSupabase(user.id).then(remote => {
      // Always use Supabase as source of truth (handles cross-device deletes)
      const remoteNorm = remote.map(normalizeScan)
      if (remoteNorm.length > 0) {
        // Merge local-only items that haven't synced yet
        const remoteKeys = new Set(remoteNorm.map(s => `${s.barcode}-${s.timestamp}`))
        const localOnly = local.filter(s => !remoteKeys.has(`${s.barcode}-${s.timestamp}`))
        const all = [...remoteNorm, ...localOnly]
        const seen = new Set<string>()
        const merged = all.filter(s => {
          const key = `${s.barcode}-${s.timestamp}`
          if (seen.has(key)) return false
          seen.add(key); return true
        })
        merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        const top50 = merged.slice(0, 50)
        setScanHistory(top50)
        localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(top50))
      } else {
        // Remote is empty — user cleared history on another device; clear local too
        setScanHistory([])
        try { localStorage.removeItem(SCAN_HISTORY_KEY) } catch {}
      }
      setHistoryLoaded(true)
    })
  }, [user])

  const stopCamera = useCallback(async () => {
    try {
      const inst = scannerInstanceRef.current as { stop?: () => Promise<void>; clear?: () => Promise<void> } | null
      if (inst?.stop) await inst.stop()
      if (inst?.clear) await inst.clear()
    } catch { /* ignore */ }
    scannerInstanceRef.current = null
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    // Reset scan-stability trackers so next session starts fresh
    lastScanCodeRef.current = ''
    lastScanCountRef.current = 0
    scanLockedRef.current = false
    setCameraActive(false)
  }, [])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const runVerification = useCallback(async (rawText: string) => {
    await stopCamera()
    const trimmed = rawText.trim()
    if (trimmed.length < 4) return

    // ── QR code URL detection ──────────────────────────────────────────────
    // If the scanned text is a URL (starts with http/https/www), route to
    // the QR brand URL follow endpoint instead of the barcode engine
    const isUrl = /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)
    if (isUrl) {
      setScannerView('verifying')
      setPendingBarcode(trimmed.slice(0, 60) + (trimmed.length > 60 ? '…' : ''))
      try {
        const res = await fetch('/api/verify/qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `QR lookup failed (${res.status})`)
        // data is already ScanResult-shaped
        const qrResult = data as ScanResult
        setScanResult(qrResult)
        saveScanToHistory(qrResult as unknown as Record<string, unknown>)
        setScanHistory(prev => [qrResult, ...prev.filter(s => !(s.barcode === qrResult.barcode && s.timestamp === qrResult.timestamp))].slice(0, 50))
        if (user) syncHistoryToSupabase(user.id, qrResult)
        if (qrResult.trustScore >= 75) toast.success('✓ QR verified — authentic!')
        else if (qrResult.trustScore >= 55) toast('QR destination verified — plausible', { icon: '🔗' })
        else toast.error('⚠️ QR leads to suspicious domain!')
        setScannerView('result')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'QR verification failed')
        setScannerView('scanner')
      }
      return
    }

    // ── Regular barcode ────────────────────────────────────────────────────
    const cleaned = trimmed.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
    if (cleaned.length < 4) return
    setPendingBarcode(cleaned)
    setScannerView('verifying')
    try {
      const res = await verifyBarcode(cleaned)
      setScanResult(res)
      saveScanToHistory(res as unknown as Record<string, unknown>)
      setScanHistory(prev => [res, ...prev.filter(s => !(s.barcode === res.barcode && s.timestamp === res.timestamp))].slice(0, 50))
      if (user) syncHistoryToSupabase(user.id, res)
      if (res.status === 'RECALLED' || res.status === 'recalled') toast.error('⚠️ ACTIVE RECALL! Stop using this product immediately.')
      else if (res.status === 'COUNTERFEIT' || res.status === 'counterfeit') toast.error('🚫 COUNTERFEIT DETECTED! Do not use this product.')
      else if (res.recall) toast.error('⚠️ RECALL ALERT!')
      else if (res.status === 'authentic' || res.status === 'VERIFIED') toast.success('✓ Verified authentic!')
      else if (res.status === 'LIKELY_AUTHENTIC') toast.success('✓ Likely authentic')
      else if (res.status === 'suspicious' || res.status === 'SUSPICIOUS') toast.error('⚠️ Suspicious product')
      else toast('Product not found in our system', { icon: 'ℹ️' })
      setScannerView('result')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Verification failed')
      setScannerView('scanner')
    }
  }, [stopCamera, user])

  const startCamera = useCallback(async () => {
    setCameraError(''); setCameraLoading(true)
    // Reset stability trackers on fresh camera start
    lastScanCodeRef.current = ''
    lastScanCountRef.current = 0
    scanLockedRef.current = false
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const cameras = await Html5Qrcode.getCameras()
      if (!cameras.length) throw new Error('No camera found.')
      const cam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment')) || cameras[cameras.length - 1]
      const scanner = new Html5Qrcode(scannerIdRef.current, { verbose: false })
      scannerInstanceRef.current = scanner

      // ─── Scan stability handler ──────────────────────────────────────────
      // Why: Html5Qrcode can successfully decode a blurry / partial barcode
      // and return wrong digits (e.g. 030774041930 instead of 030772011584).
      // Fix: require the SAME code to be decoded STABILITY_THRESHOLD times
      // in a row AND pass a UPC/EAN checksum before accepting it.
      const STABILITY_THRESHOLD = 5 // same decode N times in a row (~500ms @ 10fps)
      const handleDecode = (text: string) => {
        if (scanLockedRef.current) return // already accepted & verifying
        const cleaned = text.trim().replace(/[^0-9A-Za-z]/g, '').toUpperCase()
        if (cleaned.length < 4) return

        // URL / QR codes — accept immediately (no checksum applies)
        const isUrlLike = /^https?:\/\//i.test(text.trim()) || /^www\./i.test(text.trim())
        if (isUrlLike) {
          scanLockedRef.current = true
          runVerification(text.trim())
          return
        }

        // UPC/EAN checksum validation — rejects most misreads instantly.
        const isPureDigits = /^\d+$/.test(cleaned)
        const isValidLength = [8, 12, 13, 14].includes(cleaned.length)
        let checksumOk = true
        if (isPureDigits && isValidLength) {
          const digits = cleaned.split('').map(d => parseInt(d, 10))
          const check = digits.pop() as number
          // GS1 mod-10 checksum: from rightmost remaining digit, alternate *3 and *1
          let sum = 0
          for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) {
            sum += digits[i] * w
          }
          const calc = (10 - (sum % 10)) % 10
          checksumOk = calc === check
        } else if (isPureDigits && !isValidLength) {
          // Digits but wrong length → definitely a misread, reject
          checksumOk = false
        }
        if (!checksumOk) {
          // Reset stability — this decode was almost certainly a misread
          lastScanCodeRef.current = ''
          lastScanCountRef.current = 0
          return
        }

        // Count consecutive identical decodes
        if (cleaned === lastScanCodeRef.current) {
          lastScanCountRef.current += 1
        } else {
          lastScanCodeRef.current = cleaned
          lastScanCountRef.current = 1
        }

        if (lastScanCountRef.current >= STABILITY_THRESHOLD) {
          scanLockedRef.current = true
          runVerification(cleaned)
        }
      }

      await scanner.start(
        { deviceId: { exact: cam.id } },
        { fps: 10, qrbox: { width: 260, height: 180 }, aspectRatio: 1.333 },
        handleDecode,
        () => { /* decode-failure callback — ignored */ }
      )
      setCameraActive(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setCameraError(msg.includes('permission') || msg.includes('denied') ? 'Camera permission denied. Please allow access.' : msg.includes('camera') ? 'No camera detected.' : msg)
    }
    setCameraLoading(false)
  }, [runVerification])

  const manualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualBarcode.trim()) return
    await runVerification(manualBarcode.trim())
  }

  const handleScanAnother = () => {
    setScanResult(null); setPendingBarcode(''); setScannerView('scanner'); setManualBarcode('')
  }

  // Re-verify: force-bypass cache and re-run verification
  const handleReVerify = useCallback(async () => {
    if (!scanResult?.barcode) return
    const barcode = scanResult.barcode
    const authMethod = (scanResult as unknown as { details?: { authMethod?: string; originalUrl?: string } }).details?.authMethod
    const originalUrl = (scanResult as unknown as { details?: { authMethod?: string; originalUrl?: string } }).details?.originalUrl

    // QR Code re-verify — re-call /api/verify/qr with the original URL
    if (authMethod === 'QR_URL') {
      const url = originalUrl || barcode
      setScannerView('verifying')
      setPendingBarcode(url.slice(0, 60) + (url.length > 60 ? '…' : ''))
      try {
        const res = await fetch('/api/verify/qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'QR re-verification failed')
        const qrResult = data as ScanResult
        setScanResult(qrResult)
        saveScanToHistory(qrResult as unknown as Record<string, unknown>)
        setScanHistory(prev => [qrResult, ...prev.filter(s => !(s.barcode === qrResult.barcode && s.timestamp === qrResult.timestamp))].slice(0, 50))
        if (user) syncHistoryToSupabase(user.id, qrResult)
        toast.success('✓ Fresh QR verification complete')
        setScannerView('result')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'QR re-verification failed')
        setScannerView('result')
      }
      return
    }

    // Photo / Serial — can't re-verify via barcode engine
    if (barcode === 'PHOTO_AUTH' || (authMethod && authMethod !== 'QR_URL')) {
      toast.error('Re-verify is only available for barcode and QR scans. Use the Photo AI or Serial # tab again.')
      return
    }

    // Regular barcode re-verify
    setScannerView('verifying')
    setPendingBarcode(barcode)
    try {
      const res = await verifyBarcode(barcode, true) // force: true — skips cache
      setScanResult(res)
      saveScanToHistory(res as unknown as Record<string, unknown>)
      setScanHistory(prev => [res, ...prev.filter(s => !(s.barcode === res.barcode && s.timestamp === res.timestamp))].slice(0, 50))
      if (user) syncHistoryToSupabase(user.id, res)
      toast.success('✓ Fresh verification complete')
      setScannerView('result')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Re-verification failed')
      setScannerView('result')
    }
  }, [scanResult, user])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#635bff', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!user) return null

  // ── Apply admin platform config controls ──────────────────────────────────
  // Maintenance mode: block access to dashboard (admin user bypasses this)
  const isAdminUser = !!(user?.email && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
  if (platformCfg.maintenanceMode && !isAdminUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔧</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>Site Under Maintenance</h1>
        <p style={{ color: '#94a3b8', maxWidth: 420, lineHeight: 1.6, marginBottom: 24 }}>
          {platformCfg.maintenanceMessage || 'We are performing scheduled maintenance. We will be back shortly.'}
        </p>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 28px', borderRadius: 10, background: '#635bff', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>
    )
  }

  // Force dark/light mode from admin - admin force takes priority; otherwise user preference
  const applyUserTheme = (t: 'light' | 'dark') => {
    setUserTheme(t)
    try { localStorage.setItem('veri9-user-theme', t) } catch {}
    // Also dispatch an event so other mounted components can react
    try { window.dispatchEvent(new Event('veri9-theme-change')) } catch {}
  }
  const effectiveTheme: 'light' | 'dark' = platformCfg.darkModeForced
    ? (platformCfg.darkModeDefault === 'dark' ? 'dark' : 'light')
    : userTheme
  const forcedBg = effectiveTheme === 'dark' ? '#0f172a' : '#f8fafc'
  const forcedColor = effectiveTheme === 'dark' ? '#f1f5f9' : '#0f172a'
  const isDark = effectiveTheme === 'dark'

  const totalScans = scanHistory.length
  const authenticCount = scanHistory.filter(s => s.status === 'authentic' || s.status === 'VERIFIED' || s.status === 'LIKELY_AUTHENTIC').length
  const suspiciousCount = scanHistory.filter(s => s.status === 'suspicious' || s.status === 'SUSPICIOUS' || s.status === 'COUNTERFEIT' || s.status === 'counterfeit' || s.status === 'RECALLED' || s.status === 'recalled').length
  const avgScore = totalScans > 0 ? Math.round(scanHistory.reduce((sum, s) => sum + (s.trustScore || 0), 0) / totalScans) : 0

  // ── Usage-based donation prompt: count scans this month ──
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthScans = scanHistory.filter(s => s.timestamp >= monthStart).length
  const showDonatePrompt = monthScans >= 5 && monthScans % 5 === 0  // prompt at 5, 10, 15… scans/month

  // ── Donor badge: check localStorage for recurring donations ──
  const [donorBadge, setDonorBadge] = useState<string | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('veri9_donations')
      if (!raw) return
      const donations = JSON.parse(raw)
      const recurring = donations.filter((d: Record<string, unknown>) => d.recurring === true || d.recurring === 'true')
      if (recurring.length > 0) {
        // Find the highest tier
        const tierMap: Record<string, string> = { patron: '🥇 Patron', champion: '🟣 Champion', supporter: '💙 Supporter' }
        const tiers = recurring.map((d: Record<string, unknown>) => String(d.tier || 'supporter'))
        if (tiers.includes('patron')) setDonorBadge(tierMap.patron)
        else if (tiers.includes('champion')) setDonorBadge(tierMap.champion)
        else setDonorBadge(tierMap.supporter)
      }
    } catch {}
  }, [])

  const statusBadge = (status: string) => {
    // Distinguishes "Authentic" (VERIFIED, multi-confirmed) from "Likely Authentic"
    // (LIKELY_AUTHENTIC, single trusted source). All labels are human-friendly.
    const map: Record<string, { label: string; color: string; bg: string }> = {
      authentic:          { label: '✅ Likely Authentic',  color: '#15803d', bg: '#dcfce7' },
      VERIFIED:           { label: '✅ Authentic',         color: '#15803d', bg: '#dcfce7' },
      LIKELY_AUTHENTIC:   { label: '✅ Likely Authentic',  color: '#15803d', bg: '#dcfce7' },
      suspicious:         { label: '⚠️ Suspicious',         color: '#b45309', bg: '#fef3c7' },
      SUSPICIOUS:         { label: '⚠️ Suspicious',         color: '#b45309', bg: '#fef3c7' },
      INSUFFICIENT_DATA:  { label: '⚠️ Limited Information', color: '#b45309', bg: '#fef3c7' },
      not_found:          { label: 'ℹ️ Not Found',          color: '#475569', bg: '#f1f5f9' },
      NOT_FOUND:          { label: 'ℹ️ Not Found',          color: '#475569', bg: '#f1f5f9' },
      counterfeit:        { label: '🚫 Counterfeit',        color: '#9f1239', bg: '#ffe4e6' },
      COUNTERFEIT:        { label: '🚫 Counterfeit',        color: '#9f1239', bg: '#ffe4e6' },
      RECALLED:           { label: '⚠️ Recalled',           color: '#c2410c', bg: '#ffedd5' },
      recalled:           { label: '⚠️ Recalled',           color: '#c2410c', bg: '#ffedd5' },
      UNREADABLE:         { label: '📷 Rescan Needed',      color: '#1d4ed8', bg: '#dbeafe' },
      unreadable:         { label: '📷 Rescan Needed',      color: '#1d4ed8', bg: '#dbeafe' },
    }
    return map[status] || { label: status, color: '#64748b', bg: '#f8fafc' }
  }

  const navItems: { id: Section; label: string; icon: string; href?: string; group?: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'scanner', label: 'Scan Product', icon: '📷' },
    { id: 'scans', label: 'Scan History', icon: '📋' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'community', label: 'Community', icon: '🌐', href: '/community' },
    { id: 'brands', label: 'Brands', icon: '🏷️', href: '/brands' },
    { id: 'blog', label: 'Blog', icon: '📝', href: '/blog' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    // Information group — rendered as iframe in-dashboard
    { id: 'about',   label: 'About Us',       icon: 'ℹ️', group: 'Information' },
    { id: 'contact', label: 'Contact Us',     icon: '✉️', group: 'Information' },
    { id: 'privacy', label: 'Privacy Policy', icon: '🔒', group: 'Information' },
    { id: 'terms',   label: 'Terms of Service', icon: '📜', group: 'Information' },
  ]

  const goScanner = () => { setTab('scanner'); setSidebarOpen(false); setScannerView('scanner'); setScanResult(null) }

  // Delete single scan from history
  const handleDeleteScan = async (scan: ScanResult) => {
    if (!confirm(`Delete "${scan.productName || scan.barcode}" from your scan history?`)) return
    const updated = scanHistory.filter(s => !(s.barcode === scan.barcode && s.timestamp === scan.timestamp))
    setScanHistory(updated)
    try { localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated)) } catch {}
    if (user && scan.timestamp) {
      deleteScanFromSupabase(user.id, scan.barcode, scan.timestamp)
    }
    toast.success('Scan removed')
  }

  // Clear ALL scan history
  const handleClearAllScans = async () => {
    if (scanHistory.length === 0) return
    if (!confirm(`Delete ALL ${scanHistory.length} scan${scanHistory.length !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setScanHistory([])
    try { localStorage.removeItem(SCAN_HISTORY_KEY) } catch {}
    if (user) {
      const ok = await clearAllScansFromSupabase(user.id)
      if (ok) toast.success('All scan history cleared')
      else toast.error('Cleared locally — sync may have failed')
    } else {
      toast.success('Scan history cleared')
    }
  }

  // User-side verification cache clear — invalidates all cached results
  // so the NEXT scan of any barcode gets a fresh live lookup
  const handleClearUserCache = async () => {
    if (!confirm('Clear all cached verification results? Your next scans will fetch fresh data from all sources. This does NOT delete your scan history.')) return
    setUserCacheClearing(true)
    try {
      const res = await fetch('/api/user/cache', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      })
      if (res.ok) {
        toast.success('✓ Verification cache cleared — next scans will get fresh results')
      } else {
        toast.success('✓ Ready for fresh scans')
      }
    } catch {
      toast.success('✓ Ready for fresh scans')
    } finally {
      setUserCacheClearing(false)
    }
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      const { getSupabaseClient } = await import('@/lib/supabase')
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileFullName.trim(),
          phone: profilePhone.trim(),
          location: profileLocation.trim(),
          bio: profileBio.trim(),
        }
      })
      if (error) { toast.error(error.message); setProfileSaving(false); return }
      // Also update user_profiles table
      if (user) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: profileFullName.trim(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }
      toast.success('Profile updated')
      setProfileEditing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
    setProfileSaving(false)
  }


  return (
    <div style={{ minHeight: '100vh', background: forcedBg, color: forcedColor, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* ── Admin Announcement Banner ── */}
      {platformCfg.announcementEnabled && platformCfg.announcementText && (
        <div style={{ background: platformCfg.announcementColor || '#635bff', color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: '0.84rem', fontWeight: 600, position: 'relative', zIndex: 200 }}>
          {platformCfg.announcementText}
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes scanline { 0%{top:8%} 50%{top:86%} 100%{top:8%} }
        .dash-nav-btn:hover { background: ${isDark ? 'rgba(99,91,255,0.18)' : '#f0f0ff'} !important; color: #635bff !important; }
        .scan-line-dash { position: absolute; left: 6%; right: 6%; height: 2px; background: linear-gradient(90deg, transparent, #635bff, #a5b4fc, #635bff, transparent); animation: scanline 1.8s ease-in-out infinite; box-shadow: 0 0 8px #635bff; z-index: 5; }
        #${scannerIdRef.current} video { width:100%!important;height:100%!important;object-fit:cover!important;border-radius:14px; }
        #${scannerIdRef.current} { border:none!important;width:100%!important; }
        #${scannerIdRef.current} img { display:none!important; }
        .dash-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .dash-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08)!important; }
        .scan-history-row:hover { background: ${isDark ? '#1e293b' : '#f8fafc'} !important; }
        .dash-sidebar { position: fixed; left: -270px; top: 0; bottom: 0; z-index: 200; transition: left 0.25s ease; width: 252px; display: flex!important; flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .dash-sidebar.open { left: 0!important; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 199; }
        .sidebar-overlay.show { display: block; }
        .hamburger-btn { display: flex!important; }
        @media (min-width: 769px) {
          .dash-sidebar { position: relative!important; left: 0!important; flex-shrink: 0!important; display: flex!important; }
          .hamburger-btn { display: none!important; }
          .sidebar-overlay { display: none!important; }
        }
      `}</style>

      <div className={`sidebar-overlay${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Top Bar */}
      <header style={{ height: 62, background: isDark ? '#1e293b' : '#fff', borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', padding: '0 clamp(14px,3vw,22px)', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#e2e8f0' : '#0f172a'} strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
            <img src="/logo-new.png" alt="Veri9" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Veri<span style={{ color: '#635bff' }}>9</span></span>
          </Link>

        </div>
        {/* Right side of top bar intentionally minimal — scan CTA + user identity live in the sidebar */}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{ background: isDark ? '#1e293b' : '#fff', borderRight: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, flexDirection: 'column', padding: '18px 0' }}>
          <div style={{ padding: '0 14px 14px', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #635bff, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>{(user.email?.[0] || 'U').toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, padding: '1px 7px', borderRadius: 9999, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.6rem', fontWeight: 700, color: '#10b981' }}>✓ Verified</div>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '0 8px' }}>
            {navItems.filter(i => !i.group).map(item => (
              item.href ? (
                /* Tabs that show external pages embedded inside the dashboard */
                <button key={item.id} onClick={() => { setTab(item.id as Section); setSidebarOpen(false) }} className="dash-nav-btn"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 9, fontSize: '0.875rem', fontWeight: activeSection === item.id ? 700 : 500, color: activeSection === item.id ? '#635bff' : (isDark ? '#cbd5e1' : '#475569'), background: activeSection === item.id ? (isDark ? '#2d2f6e' : '#f0f0ff') : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
                  {item.label}
                </button>
              ) : (
                <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }} className="dash-nav-btn"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 9, fontSize: '0.875rem', fontWeight: activeSection === item.id ? 700 : 500, color: activeSection === item.id ? '#635bff' : (isDark ? '#cbd5e1' : '#475569'), background: activeSection === item.id ? (isDark ? '#2d2f6e' : '#f0f0ff') : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
                  {item.label}
                  {item.id === 'scanner' && null}
                  {item.id === 'scans' && totalScans > 0 && <span style={{ marginLeft: 'auto', padding: '1px 6px', borderRadius: 9999, background: '#f1f5f9', color: '#64748b', fontSize: '0.62rem', fontWeight: 700 }}>{totalScans}</span>}
                </button>
              )
            ))}
            {/* Support Veri9 — distinctive gradient button */}
            <button
              type="button"
              onClick={() => { setTab('donate'); setSidebarOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '11px 14px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 800,
                color: '#fff',
                background: activeSection === 'donate'
                  ? 'linear-gradient(135deg, #7c3aed, #635bff, #4f46e5)'
                  : 'linear-gradient(135deg, #635bff 0%, #7c3aed 60%, #db2777 100%)',
                textAlign: 'left', marginTop: 10,
                border: activeSection === 'donate' ? '1.5px solid #7c3aed' : '1.5px solid rgba(99,91,255,0.5)',
                cursor: 'pointer',
                boxShadow: activeSection === 'donate'
                  ? '0 4px 16px rgba(99,91,255,0.5)'
                  : '0 4px 14px rgba(99,91,255,0.35)',
                letterSpacing: '-0.01em',
              }}
              className="dash-nav-btn">
              <span style={{ fontSize: '1.05rem' }}>💙</span>
              Support Veri9
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(255,255,255,0.22)', borderRadius: 9999, padding: '1px 6px', fontWeight: 700 }}>♥</span>
            </button>

            {/* Information group — About, Contact, Privacy, Terms */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
              <div style={{ padding: '4px 12px 8px', fontSize: '0.66rem', fontWeight: 800, color: isDark ? '#94a3b8' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Information
              </div>
              {navItems.filter(i => i.group === 'Information').map(item => (
                <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }} className="dash-nav-btn"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 9, fontSize: '0.82rem', fontWeight: activeSection === item.id ? 700 : 500, color: activeSection === item.id ? '#635bff' : (isDark ? '#94a3b8' : '#64748b'), background: activeSection === item.id ? (isDark ? '#2d2f6e' : '#f0f0ff') : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 1 }}>
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
          <div style={{ padding: '10px 8px 0', borderTop: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, margin: '0 4px' }}>
            <button onClick={signOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 9, fontSize: '0.875rem', fontWeight: 500, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 'clamp(16px,3vw,28px)', overflowY: 'auto', minWidth: 0 }}>

          {/* ─── OVERVIEW ─── */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize: 'clamp(1.15rem,3vw,1.65rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 3 }}>
                  Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]} 👋
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Your verification activity summary</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Total Scans', value: totalScans, icon: '📊', color: '#635bff', bg: '#f0f0ff', border: '#e0e0ff' },
                  { label: 'Authentic', value: authenticCount, icon: '✅', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'Suspicious', value: suspiciousCount, icon: '⚠️', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                  { label: 'Avg Trust Score', value: avgScore > 0 ? `${avgScore}%` : '—', icon: '🛡️', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
                ].map(stat => (
                  <div key={stat.label} className="dash-stat-card" style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: `1px solid ${stat.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>{stat.label}</span>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>{stat.icon}</div>
                    </div>
                    <div style={{ fontSize: 'clamp(1.5rem,3vw,1.9rem)', fontWeight: 900, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81 50%, #4338ca)', borderRadius: 16, padding: 'clamp(18px,3vw,26px)', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Quick Action</p>
                  <h2 style={{ fontSize: 'clamp(0.95rem,2.5vw,1.2rem)', fontWeight: 900, color: '#fff', marginBottom: 4 }}>Verify a Product Now</h2>
                </div>
                <button onClick={goScanner} style={{ padding: '11px 22px', borderRadius: 10, background: '#fff', color: '#635bff', fontWeight: 800, fontSize: '0.88rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                  📷 Scan a Product →
                </button>
              </div>

              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 16 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Recent Scans</h2>
                  <button onClick={() => setTab('scans')} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#635bff', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
                </div>
                {scanHistory.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔍</div>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 14 }}>No scans yet. Start verifying!</p>
                    <button onClick={goScanner} style={{ padding: '9px 20px', borderRadius: 9, fontSize: '0.875rem', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #635bff, #4f46e5)', border: 'none', cursor: 'pointer' }}>Scan First Product</button>
                  </div>
                ) : (
                  scanHistory.slice(0, 5).map((scan, i) => {
                    const sb = statusBadge(scan.status)
                    return (
                      <div key={i} onClick={() => setHistoryItem(scan)} className="scan-history-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: i < Math.min(scanHistory.length, 5) - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}>
                        {scan.image ? (
                          <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={scan.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                          </div>
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${sb.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900, color: sb.color, flexShrink: 0 }}>{scan.trustScore || '?'}</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.productName || 'Unknown Product'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{scan.barcode}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 600, background: sb.bg, color: sb.color }}>{sb.label}</span>
                          <span style={{ color: '#cbd5e1' }}>›</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* ── Usage-based donation prompt ── */}
              {showDonatePrompt && !donorBadge && (
                <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', borderRadius: 14, padding: '18px 20px', border: '1px solid #c7d2fe', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>💜</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 800, color: '#4338ca', margin: 0, marginBottom: 4 }}>
                      You've made {monthScans} scans this month!
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      Veri9 is free thanks to supporters like you. Help keep it that way with a $3/mo subscription.
                    </p>
                  </div>
                  <button onClick={() => setTab('donate')} style={{ padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #635bff, #4f46e5)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(99,91,255,0.25)' }}>
                    Become a Supporter →
                  </button>
                </div>
              )}

              {/* ── Donor badge ── */}
              {donorBadge && (
                <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #eff6ff)', borderRadius: 14, padding: '14px 18px', border: '1px solid #c4b5fd', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.3rem' }}>🏆</span>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7c3aed', margin: 0 }}>{donorBadge}</p>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Thank you for supporting Veri9!</p>
                  </div>
                </div>
              )}


            </div>
          )}

          {/* ─── SCANNER ─── */}
          {activeSection === 'scanner' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 'clamp(1.15rem,3vw,1.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 3 }}>
                  {scannerView === 'result' ? '✓ Scan Complete' : scannerView === 'verifying' ? '🔍 Verifying…' : 'Scan a Product'}
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {scannerView === 'result' ? 'Full product details from 18+ global intelligence sources' : scannerView === 'verifying' ? 'Cross-referencing in real time…' : 'Use camera or enter a barcode to verify authenticity instantly'}
                </p>
              </div>

              {scannerView === 'verifying' && (
                <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <VerifyingScreen barcode={pendingBarcode} />
                </div>
              )}

              {scannerView === 'result' && scanResult && (
                <div style={{ maxWidth: 700, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', paddingBottom: 24 }}>
                  <ProductResultCardBoundary>
                    <ProductResultCard result={scanResult} onScanAgain={handleScanAnother} onReVerify={handleReVerify} />
                  </ProductResultCardBoundary>
                </div>
              )}

              {scannerView === 'scanner' && (
                <div style={{ maxWidth: 680, background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                  {/* Tab row — 5 auth methods */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fafafa', overflowX: 'auto' }}>
                    {([
                      { id: 'camera',  label: '📷 Camera' },
                      { id: 'manual',  label: '⌨️ Barcode' },
                      { id: 'serial',  label: '🔢 Serial #' },
                      { id: 'photo',   label: '🖼️ Photo AI' },
                      { id: 'qr',      label: '◼️ QR Code' },
                    ] as { id: ScanTab; label: string }[]).map(tab => (
                      <button key={tab.id} onClick={() => { setScanTab(tab.id); if (tab.id !== 'camera') stopCamera() }}
                        style={{ flex: '1 0 auto', padding: '13px 6px', fontSize: '0.82rem', fontWeight: scanTab === tab.id ? 800 : 500, color: scanTab === tab.id ? '#635bff' : '#64748b', background: 'none', border: 'none', cursor: 'pointer', borderBottom: scanTab === tab.id ? '3px solid #635bff' : '3px solid transparent', marginBottom: -1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: 'clamp(16px,4vw,24px)' }}>
                    {scanTab === 'camera' && (
                      <div>
                        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0a0e1a', aspectRatio: '4/3', maxWidth: 480, maxHeight: 480, margin: '0 auto 18px' }}>
                          <div id={scannerIdRef.current} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
                          {!cameraActive && !cameraLoading && (
                            <div
                              onClick={!cameraActive && !cameraLoading ? startCamera : undefined}
                              onTouchEnd={(e) => {
                                if (!cameraActive && !cameraLoading) {
                                  e.preventDefault()
                                  startCamera()
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && !cameraActive && !cameraLoading) {
                                  e.preventDefault()
                                  startCamera()
                                }
                              }}
                              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', zIndex: 10, textAlign: 'center', padding: 24, cursor: 'pointer', WebkitTapHighlightColor: 'rgba(99,91,255,0.3)', userSelect: 'none' }}
                            >
                              {cameraError ? (
                                <>
                                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>❌</div>
                                  <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.6, maxWidth: 260 }}>{cameraError}</p>
                                  <p style={{ fontSize: '0.78rem', color: '#a5b4fc', marginTop: 14, fontWeight: 600 }}>👆 Tap here to try again</p>
                                </>
                              ) : (
                                <>
                                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(99,91,255,0.18)', border: '2px dashed rgba(99,91,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '2rem' }}>📷</div>
                                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 5 }}>Ready to scan</p>
                                  <p style={{ fontSize: '0.78rem', color: '#a5b4fc', marginTop: 12, fontWeight: 700, padding: '6px 14px', background: 'rgba(99,91,255,0.18)', borderRadius: 20, border: '1px solid rgba(99,91,255,0.4)' }}>👆 Tap anywhere to start camera</p>
                                </>
                              )}
                            </div>
                          )}
                          {cameraLoading && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,26,0.92)', zIndex: 10 }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#635bff', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
                              <p style={{ color: '#a5b4fc', fontSize: '0.9rem', fontWeight: 600 }}>Starting camera…</p>
                            </div>
                          )}
                          {cameraActive && (
                            <>
                              <div className="scan-line-dash" />
                              <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 7, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '4px 10px' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff' }}>LIVE</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {!cameraActive ? (
                            <button onClick={startCamera} disabled={cameraLoading} style={{ padding: '12px 26px', borderRadius: 11, background: 'linear-gradient(135deg, #635bff, #7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(99,91,255,0.3)' }}>
                              📷 {cameraError ? 'Try Again' : 'Start Scan'}
                            </button>
                          ) : (
                            <button onClick={stopCamera} style={{ padding: '11px 22px', borderRadius: 11, background: '#f1f5f9', color: '#374151', fontWeight: 700, fontSize: '0.88rem', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                              ⏹ Stop Camera
                            </button>
                          )}
                          <button onClick={() => setScanTab('manual')} style={{ padding: '11px 16px', borderRadius: 11, background: '#f8fafc', color: '#635bff', fontWeight: 600, fontSize: '0.84rem', border: '1.5px solid #e0e7ff', cursor: 'pointer' }}>Type barcode</button>
                        </div>
                      </div>
                    )}
                    {scanTab === 'manual' && (
                      <form onSubmit={manualSubmit}>
                        <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Enter barcode number</label>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                          <input type="text" value={manualBarcode} onChange={e => setManualBarcode(e.target.value)} placeholder="e.g. 0123456789012" maxLength={50} autoFocus
                            style={{ flex: 1, minWidth: 150, padding: '12px 15px', border: '1.5px solid #e5e7eb', borderRadius: 11, fontSize: '0.97rem', fontFamily: 'monospace', outline: 'none', background: '#f9fafb' }}
                            onFocus={e => (e.target.style.borderColor = '#635bff')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
                          <button type="submit" disabled={!manualBarcode.trim()} style={{ padding: '12px 20px', borderRadius: 11, background: !manualBarcode.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #635bff, #7c3aed)', color: !manualBarcode.trim() ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: !manualBarcode.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>Verify →</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Try:</span>
                          {[{ code: '0737628064502', label: 'US' }, { code: '3017624010701', label: 'EU' }, { code: '9780545162074', label: 'Book' }].map(b => (
                            <button key={b.code} type="button" onClick={() => setManualBarcode(b.code)} style={{ padding: '3px 9px', borderRadius: 6, fontSize: '0.7rem', fontFamily: 'monospace', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer' }}>{b.code} <span style={{ color: '#94a3b8' }}>({b.label})</span></button>
                          ))}
                        </div>
                      </form>
                    )}
                    {/* ── Serial Number / Style Code Lookup ── */}
                    {scanTab === 'serial' && (
                      <SerialNumberTab onResult={(res) => {
                        setScanResult(res)
                        saveScanToHistory(res as unknown as Record<string, unknown>)
                        setScanHistory(prev => [res, ...prev.filter(s => !(s.barcode === res.barcode && s.timestamp === res.timestamp))].slice(0, 50))
                        if (user) syncHistoryToSupabase(user.id, res)
                        setScannerView('result')
                      }} onVerifying={() => setScannerView('verifying')} onError={() => setScannerView('scanner')} />
                    )}
                    {/* ── AI Photo Authentication ── */}
                    {scanTab === 'photo' && (
                      <PhotoAuthTab onResult={(res) => {
                        setScanResult(res)
                        saveScanToHistory(res as unknown as Record<string, unknown>)
                        setScanHistory(prev => [res, ...prev.filter(s => !(s.barcode === res.barcode && s.timestamp === res.timestamp))].slice(0, 50))
                        if (user) syncHistoryToSupabase(user.id, res)
                        setScannerView('result')
                      }} onVerifying={() => setScannerView('verifying')} onError={() => setScannerView('scanner')} />
                    )}
                    {/* ── QR Code Verification ── */}
                    {scanTab === 'qr' && (
                      <QrCodeTab onResult={(res) => {
                        setScanResult(res)
                        saveScanToHistory(res as unknown as Record<string, unknown>)
                        setScanHistory(prev => [res, ...prev.filter(s => !(s.barcode === res.barcode && s.timestamp === res.timestamp))].slice(0, 50))
                        if (user) syncHistoryToSupabase(user.id, res)
                        setScannerView('result')
                      }} onVerifying={() => setScannerView('verifying')} onError={() => setScannerView('scanner')} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── SCAN HISTORY ─── */}
          {activeSection === 'scans' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(1.15rem,3vw,1.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 3 }}>Scan History</h1>
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {totalScans} scan{totalScans !== 1 ? 's' : ''}
                    {historyLoaded && ' · synced across devices'}
                    {!historyLoaded && totalScans > 0 && ' · syncing…'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => {
                    setScanHistory(getScanHistory() as ScanResult[])
                    if (user) loadHistoryFromSupabase(user.id).then(r => { if (r.length > 0) setScanHistory(r) })
                    toast.success('History refreshed')
                  }} style={{ padding: '8px 13px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, color: '#635bff', background: '#f0f0ff', border: '1px solid #e0e7ff', cursor: 'pointer' }}>↻ Refresh</button>
                  {scanHistory.length > 0 && (
                    <button onClick={handleClearAllScans} style={{ padding: '8px 13px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}>🗑 Clear All</button>
                  )}
                  <button onClick={goScanner} style={{ padding: '9px 15px', borderRadius: 9, fontSize: '0.875rem', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #635bff, #4f46e5)', border: 'none', cursor: 'pointer' }}>+ New Scan</button>
                </div>
              </div>

              {scanHistory.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '52px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>📋</div>
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 18 }}>No scan history yet. Verify your first product!</p>
                  <button onClick={goScanner} style={{ padding: '10px 22px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #635bff, #4f46e5)', border: 'none', cursor: 'pointer' }}>Go to Scanner</button>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '9px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>👆</span> Tap any row to view full product details
                  </div>
                  {scanHistory.map((scan, i) => {
                    const sb = statusBadge(scan.status)
                    return (
                      <div key={i} onClick={() => setHistoryItem(scan)} className="scan-history-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', borderBottom: i < scanHistory.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}>
                        {scan.image ? (
                          <div style={{ width: 42, height: 42, borderRadius: 9, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f8fafc', flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={scan.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                          </div>
                        ) : (
                          <div style={{ width: 42, height: 42, borderRadius: 9, background: `${sb.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900, color: sb.color, border: `1px solid ${sb.color}25`, flexShrink: 0 }}>
                            {scan.trustScore || '?'}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{scan.productName || 'Unknown Product'}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{scan.barcode}</span>
                            {scan.brand && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>· {scan.brand}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 600, background: sb.bg, color: sb.color, whiteSpace: 'nowrap' }}>{sb.label}</span>
                          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{scan.timestamp ? new Date(scan.timestamp).toLocaleDateString() : '—'}</span>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteScan(scan) }}
                          title="Delete this scan"
                          aria-label="Delete scan"
                          style={{ width: 30, height: 30, borderRadius: 7, background: 'transparent', border: '1px solid transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.95rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'transparent' }}
                        >🗑</button>
                        <span style={{ color: '#cbd5e1', fontSize: '0.9rem', flexShrink: 0 }}>›</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── PROFILE ─── */}
          {activeSection === 'profile' && (
            <div style={{ maxWidth: 620 }}>
              <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(1.15rem,3vw,1.6rem)', fontWeight: 900, color: forcedColor, letterSpacing: '-0.03em', marginBottom: 3 }}>My Profile</h1>
                  <p style={{ fontSize: '0.875rem', color: isDark ? '#94a3b8' : '#64748b' }}>Your account information</p>
                </div>
                {!profileEditing ? (
                  <button onClick={() => setProfileEditing(true)} style={{ padding: '8px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#635bff,#4f46e5)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>✏️ Edit Profile</button>
                ) : (
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={() => setProfileEditing(false)} style={{ padding: '8px 14px', borderRadius: 9, background: isDark ? '#1e293b' : '#fff', color: isDark ? '#94a3b8' : '#475569', fontSize: '0.82rem', fontWeight: 600, border: `1.5px solid ${isDark ? '#334155' : '#e5e7eb'}`, cursor: 'pointer' }}>Cancel</button>
                    <button disabled={profileSaving} onClick={handleSaveProfile} style={{ padding: '8px 16px', borderRadius: 9, background: profileSaving ? '#94a3b8' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: profileSaving ? 'wait' : 'pointer' }}>{profileSaving ? 'Saving…' : '💾 Save'}</button>
                  </div>
                )}
              </div>
              <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: 18, border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ background: 'linear-gradient(135deg, #635bff, #4f46e5)', padding: 'clamp(22px,4vw,28px) clamp(18px,4vw,24px) 50px', position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: -28, left: 22, width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '3px solid #fff' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#635bff' }}>{(profileFullName || user.email?.[0] || 'U').toUpperCase()[0]}</span>
                  </div>
                </div>
                <div style={{ padding: '40px 22px 14px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: forcedColor, marginBottom: 2 }}>{profileFullName || 'No name set'}</div>
                  <div style={{ fontSize: '0.875rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: 10 }}>{user.email}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 9999, background: isDark ? 'rgba(16,185,129,0.15)' : '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>✓ Verified Account</div>
                  {donorBadge && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 9999, background: isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff', border: '1px solid #c4b5fd', fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', marginLeft: 8 }}>🏆 {donorBadge}</div>
                  )}
                </div>
                <div style={{ borderTop: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, padding: '8px 22px' }}>
                  {profileEditing ? (
                    <>
                      {[
                        { label: 'Full Name', value: profileFullName, setValue: setProfileFullName, placeholder: 'Jane Doe' },
                        { label: 'Phone', value: profilePhone, setValue: setProfilePhone, placeholder: '+1 555 0100' },
                        { label: 'Location', value: profileLocation, setValue: setProfileLocation, placeholder: 'San Francisco, CA' },
                      ].map(f => (
                        <div key={f.label} style={{ padding: '10px 0', borderBottom: `1px solid ${isDark ? '#334155' : '#f8fafc'}` }}>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 5 }}>{f.label}</label>
                          <input value={f.value} onChange={e => f.setValue(e.target.value)} placeholder={f.placeholder}
                            style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: 8, fontSize: '0.88rem', outline: 'none', background: isDark ? '#0f172a' : '#fff', color: forcedColor }} />
                        </div>
                      ))}
                      <div style={{ padding: '10px 0', borderBottom: `1px solid ${isDark ? '#334155' : '#f8fafc'}` }}>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 5 }}>Bio</label>
                        <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} rows={3} placeholder="Tell us a bit about yourself…"
                          style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${isDark ? '#334155' : '#e5e7eb'}`, borderRadius: 8, fontSize: '0.88rem', outline: 'none', resize: 'vertical', background: isDark ? '#0f172a' : '#fff', color: forcedColor, fontFamily: 'inherit' }} />
                      </div>
                      {/* Read-only meta */}
                      {[
                        { label: 'Email Address', value: user.email || '—' },
                        { label: 'Account ID', value: (user.id?.slice(0, 8) || '—').toUpperCase() + '…' },
                        { label: 'Member Since', value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
                        { label: 'Total Scans', value: `${totalScans} scan${totalScans !== 1 ? 's' : ''}` },
                      ].map((row, i, arr) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < arr.length-1 ? `1px solid ${isDark ? '#334155' : '#f8fafc'}` : 'none', flexWrap: 'wrap', gap: 4 }}>
                          <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>{row.label}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: forcedColor }}>{row.value}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        { label: 'Full Name', value: profileFullName || '—' },
                        { label: 'Phone', value: profilePhone || '—' },
                        { label: 'Location', value: profileLocation || '—' },
                        { label: 'Bio', value: profileBio || '—' },
                        { label: 'Email Address', value: user.email || '—' },
                        { label: 'Account ID', value: (user.id?.slice(0, 8) || '—').toUpperCase() + '…' },
                        { label: 'Member Since', value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
                        { label: 'Total Scans', value: `${totalScans} scan${totalScans !== 1 ? 's' : ''}` },
                        ...(donorBadge ? [{ label: 'Supporter Tier', value: donorBadge }] : []),
                      ].map((row, i, arr) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < arr.length-1 ? `1px solid ${isDark ? '#334155' : '#f8fafc'}` : 'none', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>{row.label}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: row.label === 'Supporter Tier' ? '#7c3aed' : forcedColor, maxWidth: 360, textAlign: 'right', wordBreak: 'break-word' }}>{row.value}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── SECURITY ─── */}
          {activeSection === 'security' && (
            <div style={{ maxWidth: 540 }}>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize: 'clamp(1.15rem,3vw,1.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 3 }}>Security</h1>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Manage your account security</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  { icon: '🔑', title: 'Password', desc: 'Change your account password', action: 'Change Password', href: '/reset-password', color: '#635bff' },
                  { icon: '🛡️', title: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account', action: 'Enable 2FA', href: '#', color: '#10b981' },
                  { icon: '👥', title: 'Active Sessions', desc: 'Review and manage your active login sessions', action: 'View Sessions', href: '#', color: '#0ea5e9' },
                ].map(item => (
                  <div key={item.title} style={{ background: '#fff', borderRadius: 13, border: '1px solid #e5e7eb', padding: 'clamp(14px,3vw,18px)', display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</div>
                    </div>
                    <Link href={item.href} style={{ padding: '7px 13px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, color: item.color, background: `${item.color}10`, border: `1px solid ${item.color}30`, textDecoration: 'none', whiteSpace: 'nowrap' }}>{item.action}</Link>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, padding: 'clamp(14px,3vw,18px)', background: '#fff', borderRadius: 13, border: '1px solid #fee2e2' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Danger Zone</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>Deleting your account is permanent. All your data and scan history will be erased.</p>
                <button onClick={() => toast.error('Please contact support to delete your account')} style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}>Delete Account</button>
              </div>
            </div>
          )}

          {/* ─── SETTINGS ─── */}
          {activeSection === 'settings' && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize: 'clamp(1.15rem,3vw,1.6rem)', fontWeight: 900, color: forcedColor, letterSpacing: '-0.03em', marginBottom: 3 }}>Settings</h1>
                <p style={{ fontSize: '0.875rem', color: isDark ? '#94a3b8' : '#64748b' }}>Customize your Veri9 experience</p>
              </div>

              {/* Appearance card */}
              <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, padding: 22, marginBottom: 18 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: forcedColor, marginBottom: 4 }}>🎨 Appearance</h2>
                <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: 18 }}>
                  Choose your preferred color theme.
                  {platformCfg.darkModeForced && <span style={{ display: 'block', marginTop: 4, color: '#f59e0b', fontWeight: 600 }}>⚠ Admin has forced {platformCfg.darkModeDefault} mode platform-wide. Your preference will apply once the admin removes the force.</span>}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  {(['light', 'dark'] as const).map(theme => {
                    const active = userTheme === theme
                    const forced = platformCfg.darkModeForced
                    return (
                      <button
                        key={theme}
                        onClick={() => { applyUserTheme(theme); toast.success(`Theme set to ${theme} mode`) }}
                        disabled={forced}
                        style={{
                          padding: 18,
                          borderRadius: 12,
                          border: active ? '2px solid #635bff' : `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                          background: theme === 'dark' ? '#0f172a' : '#f8fafc',
                          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                          cursor: forced ? 'not-allowed' : 'pointer',
                          opacity: forced ? 0.55 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 8,
                          transition: 'all 0.15s',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontSize: '1.8rem' }}>{theme === 'dark' ? '🌙' : '☀️'}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'capitalize' }}>{theme} mode</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{theme === 'dark' ? 'Easier on the eyes at night' : 'Bright and clear by day'}</div>
                        {active && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#635bff', marginTop: 2 }}>✓ Active</div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Scan preferences card */}
              <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, padding: 22, marginBottom: 18 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: forcedColor, marginBottom: 4 }}>📋 Scan History</h2>
                <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: 14 }}>You have {scanHistory.length} saved scan{scanHistory.length !== 1 ? 's' : ''}.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setTab('scans')} style={{ padding: '9px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700, color: '#635bff', background: isDark ? 'rgba(99,91,255,0.15)' : '#f0f0ff', border: '1px solid #e0e7ff', cursor: 'pointer' }}>View All Scans</button>
                  {scanHistory.length > 0 && (
                    <button onClick={handleClearAllScans} style={{ padding: '9px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', background: isDark ? 'rgba(220,38,38,0.15)' : '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}>🗑 Clear All Scan History</button>
                  )}
                </div>
              </div>

              {/* Verification Cache card */}
              <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, padding: 22, marginBottom: 18 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: forcedColor, marginBottom: 4 }}>🔄 Verification Cache</h2>
                <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: 6, lineHeight: 1.55 }}>
                  Veri9 caches scan results so repeated scans are instant. If a product shows an <strong>outdated or wrong result</strong>, clearing the cache forces a fresh lookup from all sources on your next scan.
                </p>
                <p style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8', marginBottom: 14, lineHeight: 1.5 }}>
                  ⓘ This only clears verification data — your scan history, account, and all other data are completely untouched.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleClearUserCache}
                    disabled={userCacheClearing}
                    style={{
                      padding: '9px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700,
                      color: userCacheClearing ? '#94a3b8' : '#15803d',
                      background: userCacheClearing
                        ? (isDark ? 'rgba(148,163,184,0.1)' : '#f1f5f9')
                        : (isDark ? 'rgba(21,128,61,0.15)' : '#f0fdf4'),
                      border: `1px solid ${userCacheClearing ? (isDark ? '#334155' : '#e2e8f0') : '#bbf7d0'}`,
                      cursor: userCacheClearing ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {userCacheClearing
                      ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Clearing…</>
                      : <>🔄 Clear Verification Cache</>
                    }
                  </button>
                </div>
              </div>

              {/* About card */}
              <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, padding: 22 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: forcedColor, marginBottom: 14 }}>ℹ️ About</h2>
                <div style={{ display: 'grid', gap: 8, fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#475569' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Application</span><span style={{ fontWeight: 700, color: forcedColor }}>Veri9</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account</span><span style={{ fontWeight: 600, color: forcedColor }}>{user?.email}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scans in sync</span><span style={{ fontWeight: 700, color: '#10b981' }}>{historyLoaded ? '✓ Up to date' : '⏳ Syncing...'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Theme source</span><span style={{ fontWeight: 600, color: forcedColor }}>{platformCfg.darkModeForced ? 'Admin (forced)' : 'User preference'}</span></div>
                </div>
              </div>
            </div>
          )}
          {/* ─── SUPPORT VERI9 (DONATE) ─── */}
          {activeSection === 'donate' && (
            <DonatePanel isDark={isDark} forcedColor={forcedColor} userEmail={user?.email || ''} userName={user?.user_metadata?.full_name || ''} />
          )}

          {/* ─── EMBEDDED PAGES (Community / Brands / Blog / About / Contact / Privacy / Terms) ─── */}
          {(activeSection === 'community' || activeSection === 'brands' || activeSection === 'blog' || activeSection === 'about' || activeSection === 'contact' || activeSection === 'privacy' || activeSection === 'terms') && (() => {
            const pageMap: Record<string, { href: string; label: string; icon: string }> = {
              community: { href: '/community?embed=1', label: 'Community',       icon: '🌐' },
              brands:    { href: '/brands?embed=1',    label: 'Brands',          icon: '🏷️' },
              blog:      { href: '/blog?embed=1',      label: 'Blog',            icon: '📝' },
              about:     { href: '/about?embed=1',     label: 'About Us',        icon: 'ℹ️' },
              contact:   { href: '/contact?embed=1',   label: 'Contact Us',      icon: '✉️' },
              privacy:   { href: '/privacy?embed=1',   label: 'Privacy Policy',  icon: '🔒' },
              terms:     { href: '/terms?embed=1',     label: 'Terms of Service',icon: '📜' },
            }
            const pg = pageMap[activeSection]
            return (
              <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: 400 }}>
                <iframe
                  src={pg.href}
                  title={pg.label}
                  style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 14, width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  loading="lazy"
                />
              </div>
            )
          })()}

        </main>
      </div>

      {/* History detail modal */}
      {historyItem && (() => {
        const histAuthMethod = (historyItem as unknown as { details?: { authMethod?: string; originalUrl?: string } }).details?.authMethod
        const histOriginalUrl = (historyItem as unknown as { details?: { authMethod?: string; originalUrl?: string } }).details?.originalUrl
        const canReVerify = historyItem.barcode
          && historyItem.barcode !== 'PHOTO_AUTH'
          && histAuthMethod !== 'SERIAL_AUTH'

        return (
          <HistoryModal
            result={historyItem}
            onClose={() => setHistoryItem(null)}
            onReVerify={
              canReVerify
                ? async () => {
                    setHistoryItem(null)
                    setTab('scanner')

                    if (histAuthMethod === 'QR_URL') {
                      const url = histOriginalUrl || historyItem.barcode!
                      setScannerView('verifying')
                      setPendingBarcode(url.slice(0, 60) + (url.length > 60 ? '…' : ''))
                      try {
                        const res = await fetch('/api/verify/qr', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || 'QR re-verification failed')
                        const qrResult = data as ScanResult
                        setScanResult(qrResult)
                        saveScanToHistory(qrResult as unknown as Record<string, unknown>)
                        setScanHistory(prev => [qrResult, ...prev.filter(s => !(s.barcode === qrResult.barcode && s.timestamp === qrResult.timestamp))].slice(0, 50))
                        if (user) syncHistoryToSupabase(user.id, qrResult)
                        toast.success('✓ Fresh QR verification complete')
                        setScannerView('result')
                      } catch (e: unknown) {
                        toast.error(e instanceof Error ? e.message : 'QR re-verification failed')
                        setScannerView('scanner')
                      }
                    } else {
                      const barcode = historyItem.barcode!
                      setScannerView('verifying')
                      setPendingBarcode(barcode)
                      try {
                        const res = await verifyBarcode(barcode, true)
                        setScanResult(res)
                        saveScanToHistory(res as unknown as Record<string, unknown>)
                        setScanHistory(prev => [res, ...prev.filter(s => !(s.barcode === res.barcode && s.timestamp === res.timestamp))].slice(0, 50))
                        if (user) syncHistoryToSupabase(user.id, res)
                        toast.success('✓ Fresh verification complete')
                        setScannerView('result')
                      } catch (e: unknown) {
                        toast.error(e instanceof Error ? e.message : 'Re-verification failed')
                        setScannerView('scanner')
                      }
                    }
                  }
                : undefined
            }
          />
        )
      })()}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardPageInner />
    </DashboardErrorBoundary>
  )
}
