'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde",
  "Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros",
  "Congo (Congo-Brazzaville)","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine State","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa",
  "San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore",
  "Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka",
  "Sudan","Suriname","Sweden","Switzerland","Syria","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo",
  "Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
]

const CATEGORIES = ['Food & Beverages','Pharmaceuticals & Medicine','Electronics','Cosmetics & Beauty',
  'Clothing & Fashion','Automotive Parts','Baby Products','Luxury Goods','Supplements & Vitamins','Other']

function CommunityPageInner() {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'
  const [activeTab, setActiveTab] = useState<'reports' | 'submit'>('reports')
  const [form, setForm] = useState({ productName: '', barcode: '', brand: '', category: '', country: '', description: '', severity: 'medium', reporterName: '', reporterEmail: '' })
  const [submitting, setSubmitting] = useState(false)

  // Mock reports data
  const reports = [
    { id: 1, product: 'Fake Louis Vuitton Bag', brand: 'Louis Vuitton (Counterfeit)', category: 'Luxury Goods', country: 'China', severity: 'high', votes: 147, date: '2024-01-15', description: 'Purchased from an online marketplace. Stitching quality poor, serial number not verifiable.' },
    { id: 2, product: 'Counterfeit Paracetamol 500mg', brand: 'Unknown', category: 'Pharmaceuticals & Medicine', country: 'Unknown', severity: 'critical', votes: 89, date: '2024-01-12', description: 'Pills dissolve immediately. Packaging differs from authentic product. Report to local health authorities.' },
    { id: 3, product: 'Fake Nike Air Max Sneakers', brand: 'Nike (Counterfeit)', category: 'Clothing & Fashion', country: 'Vietnam', severity: 'medium', votes: 63, date: '2024-01-10', description: 'Logo is misaligned, sole comes off after 2 days. Sold as authentic online.' },
  ]

  const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low:      { label: 'Low', color: '#6b7280', bg: '#f3f4f6' },
    medium:   { label: 'Medium', color: '#d97706', bg: '#fef3c7' },
    high:     { label: 'High', color: '#ef4444', bg: '#fee2e2' },
    critical: { label: 'Critical', color: '#7c3aed', bg: '#ede9fe' },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productName || !form.description || !form.category) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    // Send admin notification
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'community_report',
          data: {
            'Product Name': form.productName,
            'Barcode': form.barcode || '—',
            'Brand': form.brand || '—',
            'Category': form.category,
            'Country': form.country || '—',
            'Severity': form.severity,
            'Description': form.description,
            'Reporter Name': form.reporterName || 'Anonymous',
            'Reporter Email': form.reporterEmail || '—',
          },
        }),
      })
    } catch {}
    setSubmitting(false)
    toast.success('Report submitted! Thank you for helping the community.')
    setForm({ productName: '', barcode: '', brand: '', category: '', country: '', description: '', severity: 'medium', reporterName: '', reporterEmail: '' })
    setActiveTab('reports')
  }

  return (
    <>
      {!isEmbed && <Navbar />}
      <style>{`
        .report-card { transition: all 0.2s; }
        .report-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.1); transform: translateY(-2px); }
      `}</style>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 40%, #635bff 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            Community Reports
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Report Suspicious Products.<br />Protect Your Community.
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto' }}>
            Spotted a counterfeit? Report it here and help thousands of shoppers stay safe. Your reports help identify dangerous fake products.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ maxWidth: 1120, margin: '-24px auto 32px', position: 'relative', zIndex: 10, padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 4px 30px rgba(0,0,0,0.08), 0 1px 10px rgba(0,0,0,0.04)' }}>
          {[
            { value: '2,457', label: 'Total Reports' },
            { value: '1.2M', label: 'Products Protected' },
            { value: '89%', label: 'Resolved Cases' },
            { value: '154', label: 'Countries' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#635bff', marginBottom: 4, letterSpacing: '-0.02em' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 32, width: 'fit-content' }}>
          {[
            { id: 'reports', icon: 'fa-list', label: 'Community Reports' },
            { id: 'submit', icon: 'fa-plus', label: 'Submit Report' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as 'reports' | 'submit')}
              style={{ padding: '10px 20px', borderRadius: 9, fontSize: '0.87rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#6b7280', boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
              <i className={`fas ${tab.icon}`} style={{ marginRight: 8 }}></i>{tab.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{reports.length}</span> reports from the community
              </p>
              <button onClick={() => setActiveTab('submit')} style={{ padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, color: '#fff', background: '#635bff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,91,255,0.3)' }}>
                <i className="fas fa-plus" style={{ marginRight: 8 }}></i> Submit Report
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reports.map(report => {
                const sev = severityConfig[report.severity]
                return (
                  <div key={report.id} className="report-card" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{report.product}</h3>
                          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: sev.bg, color: sev.color, border: `1px solid ${sev.color}30` }}>
                            {sev.label} Risk
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.83rem', color: '#64748b' }}>
                          <span><i className="fas fa-tag" style={{ marginRight: 5, color: '#94a3b8', width: 14 }}></i>{report.brand}</span>
                          <span><i className="fas fa-th-large" style={{ marginRight: 5, color: '#94a3b8', width: 14 }}></i>{report.category}</span>
                          <span><i className="fas fa-map-marker-alt" style={{ marginRight: 5, color: '#94a3b8', width: 14 }}></i>{report.country}</span>
                          <span><i className="fas fa-calendar" style={{ marginRight: 5, color: '#94a3b8', width: 14 }}></i>{report.date}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: '#f8fafc', borderRadius: 12, padding: '10px 16px', border: '1px solid #e5e7eb' }}>
                        <button onClick={() => toast.success('Vote recorded!')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#635bff', fontSize: '1.1rem', padding: 2 }}>
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{report.votes}</span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>votes</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.75 }}>{report.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Submit Report Form */}
        {activeTab === 'submit' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 'clamp(24px, 4vw, 40px)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>
              <i className="fas fa-flag" style={{ color: '#ef4444', marginRight: 12 }}></i>Submit a Report
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 28 }}>Help the community by reporting suspicious or counterfeit products.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 20 }}>
                {[
                  { label: 'Product Name *', key: 'productName', type: 'text', placeholder: 'e.g. Fake iPhone 15 Pro', required: true },
                  { label: 'Barcode (optional)', key: 'barcode', type: 'text', placeholder: 'e.g. 0123456789012', required: false },
                  { label: 'Brand Name', key: 'brand', type: 'text', placeholder: 'e.g. Apple (Counterfeit)', required: false },
                  { label: 'Category *', key: 'category', type: 'select', options: CATEGORIES, required: true },
                  { label: 'Country of Origin', key: 'country', type: 'select', options: COUNTRIES, required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select value={form[field.key as keyof typeof form]} onChange={e => setForm({...form, [field.key]: e.target.value})}
                        style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
                        <option value="">Select {field.key === 'country' ? 'country' : 'category'}</option>
                        {field.options!.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type={field.type} value={form[field.key as keyof typeof form]} onChange={e => setForm({...form, [field.key]: e.target.value})} placeholder={field.placeholder} required={field.required}
                        style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Severity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>Severity Level</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {Object.entries(severityConfig).map(([key, val]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, border: `2px solid ${form.severity === key ? val.color : '#e5e7eb'}`, background: form.severity === key ? val.bg : '#f9fafb', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: form.severity === key ? val.color : '#6b7280', transition: 'all 0.15s' }}>
                      <input type="radio" name="severity" value={key} checked={form.severity === key} onChange={e => setForm({...form, severity: e.target.value})} style={{ display: 'none' }} />
                      {val.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Description *</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe what makes this product suspicious. Include details like where you bought it, differences from authentic product, packaging, etc." required rows={5}
                  style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none', resize: 'vertical' }} />
              </div>

              {/* Reporter info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Your Name (optional)</label>
                  <input value={form.reporterName} onChange={e => setForm({...form, reporterName: e.target.value})} placeholder="Anonymous"
                    style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Your Email (optional)</label>
                  <input type="email" value={form.reporterEmail} onChange={e => setForm({...form, reporterEmail: e.target.value})} placeholder="for updates on your report"
                    style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
              </div>

              {/* reCAPTCHA Notice */}
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <i className="fas fa-robot" style={{ color: '#d97706', marginTop: 2 }}></i>
                <div>
                  <p style={{ fontSize: '0.82rem', color: '#92400e', margin: 0, fontWeight: 600 }}>Bot Protection</p>
                  <p style={{ fontSize: '0.78rem', color: '#a16207', marginTop: 4, marginBottom: 0 }}>This form is protected by reCAPTCHA to prevent spam and abuse.</p>
                </div>
              </div>

              <button type="submit" disabled={submitting} style={{ padding: '14px 32px', borderRadius: 11, fontSize: '1rem', fontWeight: 800, color: '#fff', background: submitting ? '#8b8cf8' : '#635bff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, width: 'fit-content', boxShadow: submitting ? 'none' : '0 4px 14px rgba(99,91,255,0.3)', transition: 'all 0.2s' }}>
                {submitting ? <><i className="fas fa-circle-notch fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Report</>}
              </button>
            </form>
          </div>
        )}
      </div>

      {!isEmbed && <Footer />}
    </>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}>
      <CommunityPageInner />
    </Suspense>
  )
}
