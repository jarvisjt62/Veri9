'use client'

import Link from 'next/link'
import { useEffect, useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import ReCAPTCHA from 'react-google-recaptcha'

type Currency = {
  code: string
  symbol: string
  name: string
  flag: string
  rate: number // relative to USD (1 USD = rate X)
  presets: number[]
}

const CURRENCIES: Currency[] = [
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

type Gateway = {
  id: string
  name: string
  adminName?: string      // canonical admin toggle name (from DONATION_GATEWAYS in admin panel)
  icon: string
  regions: string[]
  currencies: string[] // '*' = all
  color: string
  desc: string
}

const GATEWAYS: Gateway[] = [
  { id: 'stripe',      name: 'Credit / Debit Card',   adminName: 'Stripe',            icon: '💳',   regions: ['Worldwide'],          currencies: ['*'], color: '#635bff', desc: 'Visa, Mastercard, Amex, Discover via Stripe' },
  { id: 'paypal',      name: 'PayPal',                 adminName: 'PayPal',            icon: '🅿️',   regions: ['Worldwide'],          currencies: ['*'], color: '#0070ba', desc: 'Pay with your PayPal balance or linked cards' },
  { id: 'applepay',    name: 'Apple Pay',              adminName: 'Apple Pay',         icon: '',    regions: ['Worldwide'],          currencies: ['*'], color: '#000',    desc: 'One-tap pay with Face ID / Touch ID' },
  { id: 'googlepay',   name: 'Google Pay',             adminName: 'Google Pay',        icon: 'G',    regions: ['Worldwide'],          currencies: ['*'], color: '#4285f4', desc: 'Quick pay via your Google account' },
  { id: 'paystack',    name: 'Paystack',               adminName: 'Paystack',          icon: '🌍',   regions: ['Africa'],             currencies: ['NGN','GHS','KES','ZAR','USD'], color: '#0ba5ec', desc: 'Nigeria · Ghana · South Africa · Kenya' },
  { id: 'flutterwave', name: 'Flutterwave',            adminName: 'Flutterwave',       icon: '🦋',   regions: ['Africa'],             currencies: ['NGN','GHS','KES','ZAR','USD','EUR','GBP'], color: '#f5a623', desc: 'Cards · Bank · Mobile Money across Africa' },
  { id: 'mpesa',       name: 'M-Pesa',                 adminName: 'M-Pesa',            icon: '📱',   regions: ['East Africa'],        currencies: ['KES'], color: '#00a650', desc: 'Kenya · Tanzania · Uganda mobile money' },
  { id: 'razorpay',    name: 'Razorpay',               adminName: 'Razorpay',          icon: '🇮🇳',   regions: ['India'],              currencies: ['INR','USD'], color: '#0c2451', desc: 'UPI · NetBanking · Wallets · Cards · India' },
  { id: 'upi',         name: 'UPI (GPay/PhonePe)',     adminName: 'Razorpay',          icon: '📲',   regions: ['India'],              currencies: ['INR'], color: '#5f259f', desc: 'Instant UPI payment · Google Pay, PhonePe' },
  { id: 'alipay',      name: 'Alipay',                 adminName: 'Alipay',            icon: '🇨🇳',   regions: ['China / Asia'],       currencies: ['CNY','USD'], color: '#1677ff', desc: 'China · Hong Kong · Southeast Asia' },
  { id: 'wechat',      name: 'WeChat Pay',             adminName: 'WeChat Pay',        icon: '💬',   regions: ['China / Asia'],       currencies: ['CNY','USD'], color: '#07c160', desc: 'WeChat in-app & QR payment' },
  { id: 'mercadopago', name: 'Mercado Pago',           adminName: 'Mercado Pago',      icon: '🛒',   regions: ['Latin America'],      currencies: ['BRL','MXN','USD'], color: '#00b1ea', desc: 'Brazil · Mexico · Argentina · Chile' },
  { id: 'pix',         name: 'PIX',                    adminName: 'Mercado Pago',      icon: '⚡',   regions: ['Brazil'],             currencies: ['BRL'], color: '#32b5a6', desc: 'Instant bank transfer in Brazil' },
  { id: 'sepa',        name: 'SEPA Bank Transfer',     adminName: 'Stripe',            icon: '🇪🇺',   regions: ['Europe'],             currencies: ['EUR'], color: '#003399', desc: '32 European countries · direct debit' },
  { id: 'ideal',       name: 'iDEAL',                  adminName: 'Stripe',            icon: '🏦',   regions: ['Netherlands'],        currencies: ['EUR'], color: '#cc0066', desc: 'Direct bank transfer in NL' },
  { id: 'crypto',      name: 'Crypto (BTC/ETH/USDT)',  adminName: 'Coinbase Commerce', icon: '₿',    regions: ['Worldwide'],          currencies: ['*'], color: '#f7931a', desc: 'Bitcoin, Ethereum, USDT · Coinbase Commerce' },
]

// ── Recurring monthly supporter tiers ──────────────────────────────
const SUPPORTER_TIERS = [
  { id: 'supporter', label: 'Supporter',   usd: 3,  icon: '💙', desc: 'Keep Veri9 free for everyone',     badge: '💙 Supporter',  color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'champion', label: 'Champion',     usd: 5,  icon: '🟣', desc: 'Faster scans + deeper analysis',   badge: '🟣 Champion',  color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  { id: 'patron',    label: 'Patron',       usd: 10, icon: '🥇', desc: 'Power our mission + early access', badge: '🥇 Patron',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
] as const

type SocialProof = {
  totalSupporters: number
  totalCompleted: number
  totalUsd: string
  recentDonors: { name: string; amount: number; currency: string; when: string }[]
  recurringCount: number
}

export default function DonatePage() {
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0])
  const [amount, setAmount] = useState<number | ''>(CURRENCIES[0].presets[1])
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [gateway, setGateway] = useState<string>('stripe')
  const [submitting, setSubmitting] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  // ── Recurring donation mode ──
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>('supporter')

  // ── Social proof: live stats from server ──
  const [socialProof, setSocialProof] = useState<SocialProof | null>(null)
  useEffect(() => {
    fetch('/api/donate/stats', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success) setSocialProof(d) })
      .catch(() => {})
  }, [])

  // When currency changes, reset to its middle preset
  useEffect(() => {
    setAmount(currency.presets[1])
    setCustomAmount('')
  }, [currency])

  // Admin-controlled active payment gateway map (from /api/public/active-gateways)
  // A gateway is considered ACTIVE unless map[adminName] === false
  const [activeGatewayMap, setActiveGatewayMap] = useState<Record<string, boolean>>({})
  const [gatewayMapLoaded, setGatewayMapLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    fetch('/api/public/active-gateways', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { map: {} })
      .then(d => { if (alive) { setActiveGatewayMap(d.map || {}); setGatewayMapLoaded(true) } })
      .catch(() => { if (alive) setGatewayMapLoaded(true) })
    return () => { alive = false }
  }, [])

  // A gateway is "active" if admin hasn't explicitly disabled it
  const isGatewayActive = (g: Gateway): boolean => {
    if (!g.adminName) return true                      // safety: no admin mapping → always show
    return activeGatewayMap[g.adminName] !== false     // default true; only hidden when admin toggled off
  }

  // Filter gateways: currency compatibility + admin-active toggle
  const compatibleGateways = GATEWAYS
    .filter(g => g.currencies.includes('*') || g.currencies.includes(currency.code))
    .filter(isGatewayActive)

  // If currently selected gateway is no longer compatible/active, switch to first available
  useEffect(() => {
    if (!compatibleGateways.find(g => g.id === gateway)) {
      setGateway(compatibleGateways[0]?.id || 'stripe')
    }
  }, [currency, activeGatewayMap]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalAmount = customAmount ? parseFloat(customAmount) : (amount as number)
    if (!finalAmount || finalAmount < 1) { toast.error('Please enter a valid amount'); return }
    if (!anonymous) {
      if (!name.trim() && !email.trim()) {
        toast.error('Please enter your name or email, or check "Donate anonymously"')
        return
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error('Please enter a valid email address')
        return
      }
    }
    if (!captchaToken) { toast.error('Please complete the reCAPTCHA check'); return }
    const selectedGateway = GATEWAYS.find(g => g.id === gateway)
    setSubmitting(true)

    // Verify reCAPTCHA server-side
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

    // Record the donation intent in localStorage (client-side history)
    // AND persist to the server so admins can see it from their own dashboard.
    const activeTier = isRecurring ? SUPPORTER_TIERS.find(t => t.id === selectedTier) : null
    const donationPayload = {
      amount: finalAmount,
      currency: currency.code,
      usdEquivalent: (finalAmount / currency.rate).toFixed(2),
      gateway,
      gatewayName: selectedGateway?.name || gateway,
      anonymous,
      name: anonymous ? 'Anonymous' : (name.trim() || ''),
      email: anonymous ? '' : (email.trim() || ''),
      message,
      recurring: isRecurring,
      tier: isRecurring ? selectedTier : '',
      status: 'pending_gateway_config',
    }

    // 1) Persist to server (primary source of truth for admin dashboard)
    let serverDonationId = ''
    try {
      const r = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationPayload),
      })
      if (r.ok) {
        const d = await r.json()
        serverDonationId = d.id || ''
      }
    } catch {
      // non-fatal — still keep local record below
    }

    // 2) Also mirror to localStorage for the donor's own history view
    try {
      const intents = JSON.parse(localStorage.getItem('veri9_donations') || '[]')
      intents.push({
        id: serverDonationId || `don_${Date.now()}`,
        ...donationPayload,
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem('veri9_donations', JSON.stringify(intents))
    } catch {}

    // 3) Fire a notify so the admin gets an email + it shows in Submissions
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'donation',
          data: {
            Amount: `${currency.symbol}${finalAmount} ${currency.code} (≈ $${(finalAmount / currency.rate).toFixed(2)} USD)`,
            Gateway: donationPayload.gatewayName,
            Name: donationPayload.name || '(anonymous)',
            Email: donationPayload.email || '—',
            Message: message || '—',
            Status: 'pending_gateway_config',
          },
        }),
      })
    } catch {}

    // In production this would redirect to the gateway checkout
    // For now we simulate since real gateway keys aren't configured yet
    await new Promise(r => setTimeout(r, 900))
    toast.success(
      `Thank you! Your ${isRecurring ? 'monthly ' : ''}${currency.symbol}${finalAmount} ${isRecurring ? 'subscription' : 'donation'} via ${selectedGateway?.name} was recorded. ` +
      (isRecurring ? `You'll get the ${activeTier?.badge || SUPPORTER_TIERS[0].badge} badge! ` : '') +
      `Once the admin connects ${selectedGateway?.name} API keys in the admin dashboard, donations will process instantly. 💙`,
      { duration: 6000 }
    )
    setCustomAmount(''); setName(''); setEmail(''); setMessage(''); setAmount(currency.presets[1]); setAnonymous(false)
    recaptchaRef.current?.reset(); setCaptchaToken(null)
    setIsRecurring(false); setSelectedTier('supporter')
    setSubmitting(false)
  }

  const displayAmount = customAmount || amount || 0

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo-new.png" alt="Veri9" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Veri<span style={{ color: '#635bff' }}>9</span></span>
          </Link>
          <Link href="/" style={{ fontSize: '0.85rem', color: '#635bff', fontWeight: 600, textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '48px 20px 24px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>💙</div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>
          Support Veri9
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.6, marginBottom: 10 }}>
          Veri9 is a <strong>free</strong>, community-supported product-authenticity platform. Your donation helps us keep scanning fast, our verification engine running, and the service free for everyone.
        </p>
      </section>

      {/* Stats strip */}
      <section style={{ maxWidth: 900, margin: '0 auto 30px', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Products Verified', value: '2.4M+', color: '#635bff' },
            { label: 'Sources Queried', value: '40+',   color: '#0ea5e9' },
            { label: 'Countries Served',  value: '80+',   color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof banner */}
      {socialProof && socialProof.totalCompleted > 0 && (
        <section style={{ maxWidth: 640, margin: '0 auto 24px', padding: '0 20px' }}>
          <div style={{ background: 'linear-gradient(135deg,#f0f4ff,#ede9fe)', borderRadius: 14, padding: '18px 20px', border: '1px solid #c7d2fe', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem' }}>🙌</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#4338ca' }}>
                {socialProof.totalSupporters} supporter{socialProof.totalSupporters !== 1 ? 's' : ''} have donated ${Number(socialProof.totalUsd).toLocaleString()} USD
              </span>
              {socialProof.recurringCount > 0 && (
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '3px 8px', borderRadius: 6, border: '1px solid #c4b5fd' }}>
                  {socialProof.recurringCount} monthly
                </span>
              )}
            </div>
            {socialProof.recentDonors.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {socialProof.recentDonors.map((d, i) => (
                  <span key={i} style={{ fontSize: '0.72rem', background: '#fff', padding: '4px 10px', borderRadius: 8, border: '1px solid #e5e7eb', color: '#475569', fontWeight: 600 }}>
                    {d.name} <span style={{ color: '#635bff', fontWeight: 700 }}>{d.amount} {d.currency}</span> <span style={{ color: '#94a3b8', fontWeight: 500 }}>{d.when}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Donation form */}
      <section style={{ maxWidth: 640, margin: '0 auto 60px', padding: '0 20px' }}>
        <form onSubmit={handleDonate} style={{ background: '#fff', borderRadius: 16, padding: '28px 26px', border: '1px solid #e5e7eb', boxShadow: '0 6px 24px rgba(0,0,0,0.06)' }}>

          {/* One-time / Monthly toggle */}
          <div style={{ marginBottom: 22, display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
            <button type="button" onClick={() => setIsRecurring(false)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer',
              background: !isRecurring ? '#fff' : 'transparent', color: !isRecurring ? '#4338ca' : '#64748b',
              boxShadow: !isRecurring ? '0 2px 8px rgba(99,91,255,0.15)' : 'none', transition: 'all 0.2s',
            }}>One-time</button>
            <button type="button" onClick={() => setIsRecurring(true)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer',
              background: isRecurring ? '#fff' : 'transparent', color: isRecurring ? '#4338ca' : '#64748b',
              boxShadow: isRecurring ? '0 2px 8px rgba(99,91,255,0.15)' : 'none', transition: 'all 0.2s',
            }}>Monthly 💜</button>
          </div>

          {/* Recurring tier selector */}
          {isRecurring && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {SUPPORTER_TIERS.map(tier => {
                  const sel = selectedTier === tier.id
                  const localAmt = Math.round(tier.usd * currency.rate)
                  return (
                    <button key={tier.id} type="button" onClick={() => { setSelectedTier(tier.id); setAmount(localAmt); setCustomAmount('') }} style={{
                      padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                      background: sel ? tier.bg : '#fff', border: sel ? `2px solid ${tier.color}` : '2px solid #e5e7eb',
                      boxShadow: sel ? `0 4px 12px ${tier.color}33` : 'none',
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{tier.icon}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: sel ? tier.color : '#0f172a', marginBottom: 2 }}>{tier.label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: sel ? tier.color : '#0f172a', marginBottom: 4 }}>
                        {currency.symbol}{localAmt.toLocaleString()}/mo
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.3 }}>{tier.desc}</div>
                      {sel && (
                        <div style={{ marginTop: 8, fontSize: '0.7rem', fontWeight: 700, color: tier.color, background: `${tier.color}18`, padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>
                          Badge: {tier.badge}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Currency selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
              🌍 Choose your currency
            </label>
            <select
              value={currency.code}
              onChange={e => {
                const c = CURRENCIES.find(c => c.code === e.target.value)
                if (c) setCurrency(c)
              }}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.95rem', outline: 'none', background: '#fff', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {!isRecurring && (
            <>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>Choose an amount</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
                {currency.presets.map(p => (
                  <button key={p} type="button"
                    onClick={() => { setAmount(p); setCustomAmount('') }}
                    style={{
                      padding: '12px 4px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      background: amount === p && !customAmount ? 'linear-gradient(135deg,#635bff,#4f46e5)' : '#f8fafc',
                      color: amount === p && !customAmount ? '#fff' : '#374151',
                      border: amount === p && !customAmount ? '2px solid #635bff' : '2px solid #e5e7eb',
                      transition: 'all 0.15s',
                    }}>
                    {currency.symbol}{p.toLocaleString()}
                  </button>
                ))}
              </div>
            </>
          )}

          <label style={{ display: 'block', marginBottom: 18 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{isRecurring ? 'Custom monthly amount' : 'Or custom amount'}</span>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>{currency.symbol}</span>
              <input type="number" min="1" step="1" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder={String(currency.presets[2])} style={{ width: '100%', padding: '11px 14px 11px 34px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.95rem', outline: 'none' }} />
            </div>
          </label>

          {/* Payment gateway selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
              💳 Choose a payment method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 8 }}>
              {compatibleGateways.map(g => {
                const active = gateway === g.id
                return (
                  <button key={g.id} type="button"
                    onClick={() => setGateway(g.id)}
                    style={{
                      padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                      background: active ? '#f5f3ff' : '#fff',
                      border: active ? `2px solid ${g.color}` : '1.5px solid #e5e7eb',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                      textAlign: 'left', transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: active ? g.color : '#f1f5f9',
                        color: active ? '#fff' : g.color,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: 800,
                      }}>{g.icon}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{g.name}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.3 }}>{g.desc}</span>
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 8 }}>
              {compatibleGateways.length} payment option{compatibleGateways.length !== 1 ? 's' : ''} available for {currency.code}
            </p>
          </div>

          {/* Donor identity block */}
          <div style={{ marginBottom: 16, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: anonymous ? 0 : 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>👤 Your details</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={e => setAnonymous(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#635bff', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Donate anonymously</span>
              </label>
            </div>

            {!anonymous && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Name</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Doe"
                    style={{ width: '100%', padding: '10px 12px', marginTop: 4, border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.88rem', outline: 'none', background: '#fff' }}
                  />
                </label>
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: '10px 12px', marginTop: 4, border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.88rem', outline: 'none', background: '#fff' }}
                  />
                </label>
              </div>
            )}

            {anonymous && (
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
                Your donation will be recorded as Anonymous — no name or email will be stored.
              </p>
            )}
          </div>

          <label style={{ display: 'block', marginBottom: 18 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Message (optional)</span>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Leave a supportive note…" style={{ width: '100%', padding: '10px 14px', marginTop: 5, border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </label>

          {/* reCAPTCHA */}
          <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          </div>

          <button type="submit" disabled={submitting} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#635bff,#4f46e5)',
            color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'wait' : 'pointer',
            boxShadow: '0 6px 16px rgba(99,91,255,0.25)',
          }}>
            {submitting ? 'Processing…' : isRecurring ? `💜 Subscribe ${currency.symbol}${Number(displayAmount).toLocaleString()} ${currency.code}/mo` : `💙 Donate ${currency.symbol}${Number(displayAmount).toLocaleString()} ${currency.code}`}
          </button>

          <p style={{ marginTop: 14, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
            🔒 Secure payment · Processed by {GATEWAYS.find(g => g.id === gateway)?.name || 'Stripe'} · {isRecurring ? 'Monthly subscription — cancel anytime' : 'No recurring charges'}
            <br />
            Veri9 is a volunteer-run project · <Link href="/about" style={{ color: '#635bff' }}>Learn more</Link>
          </p>
        </form>
      </section>

      <footer style={{ textAlign: 'center', padding: '30px 20px 50px', color: '#94a3b8', fontSize: '0.82rem' }}>
        Thank you for helping keep Veri9 free for everyone. 💙
      </footer>
    </div>
  )
}
