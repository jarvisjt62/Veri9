'use client'

import { useState } from 'react'
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

export default function CommunityPage() {
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
    setSubmitting(false)
    toast.success('Report submitted! Thank you for helping the community.')
    setForm({ productName: '', barcode: '', brand: '', category: '', country: '', description: '', severity: 'medium', reporterName: '', reporterEmail: '' })
    setActiveTab('reports')
  }

  return (
    <>
      <Navbar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4F46E5 100%)', padding: 'clamp(50px, 8vw, 80px) 24px clamp(40px, 6vw, 60px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 20 }}>
            <i className="fas fa-users"></i> Community Reports
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Report Suspicious Products.<br />Protect Your Community.
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
            Spotted a counterfeit? Report it here and help thousands of shoppers stay safe.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#e5e7eb', borderRadius: 10, padding: 4, marginBottom: 28, width: 'fit-content' }}>
          {[
            { id: 'reports', icon: 'fa-list', label: 'Community Reports' },
            { id: 'submit', icon: 'fa-plus', label: 'Submit Report' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as 'reports' | 'submit')}
              style={{ padding: '9px 18px', borderRadius: 8, fontSize: '0.87rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#6b7280', boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              <i className={`fas ${tab.icon}`} style={{ marginRight: 8 }}></i>{tab.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>{reports.length} reports from the community</p>
              <button onClick={() => setActiveTab('submit')} style={{ padding: '8px 18px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 600, color: '#fff', background: '#4F46E5', border: 'none', cursor: 'pointer' }}>
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Submit Report
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reports.map(report => {
                const sev = severityConfig[report.severity]
                return (
                  <div key={report.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{report.product}</h3>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: sev.bg, color: sev.color, border: `1px solid ${sev.color}33` }}>
                            {sev.label} Risk
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: '#64748b' }}>
                          <span><i className="fas fa-tag" style={{ marginRight: 5, color: '#94a3b8' }}></i>{report.brand}</span>
                          <span><i className="fas fa-th-large" style={{ marginRight: 5, color: '#94a3b8' }}></i>{report.category}</span>
                          <span><i className="fas fa-map-marker-alt" style={{ marginRight: 5, color: '#94a3b8' }}></i>{report.country}</span>
                          <span><i className="fas fa-calendar" style={{ marginRight: 5, color: '#94a3b8' }}></i>{report.date}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: '#f8fafc', borderRadius: 10, padding: '8px 14px', border: '1px solid #e5e7eb' }}>
                        <button onClick={() => toast.success('Vote recorded!')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '1rem' }}>
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{report.votes}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>votes</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.87rem', color: '#4b5563', lineHeight: 1.7 }}>{report.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Submit Report Form */}
        {activeTab === 'submit' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 'clamp(24px, 4vw, 36px)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              <i className="fas fa-flag" style={{ color: '#ef4444', marginRight: 10 }}></i>Submit a Report
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 24 }}>
              Help the community by reporting suspicious or counterfeit products.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Product Name *</label>
                  <input value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} placeholder="e.g. Fake iPhone 15 Pro" required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Barcode (optional)</label>
                  <input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="e.g. 0123456789012"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Brand Name</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="e.g. Apple (Counterfeit)"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Country of Origin</label>
                  <select value={form.country} onChange={e => setForm({...form, country: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Severity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Severity Level</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {Object.entries(severityConfig).map(([key, val]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: `2px solid ${form.severity === key ? val.color : '#e5e7eb'}`, background: form.severity === key ? val.bg : '#f9fafb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: form.severity === key ? val.color : '#6b7280' }}>
                      <input type="radio" name="severity" value={key} checked={form.severity === key} onChange={e => setForm({...form, severity: e.target.value})} style={{ display: 'none' }} />
                      {val.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description *</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe what makes this product suspicious. Include details like where you bought it, differences from authentic product, etc." required rows={4}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none', resize: 'vertical' }} />
              </div>

              {/* Reporter info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Name (optional)</label>
                  <input value={form.reporterName} onChange={e => setForm({...form, reporterName: e.target.value})} placeholder="Anonymous"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Email (optional)</label>
                  <input type="email" value={form.reporterEmail} onChange={e => setForm({...form, reporterEmail: e.target.value})} placeholder="for updates on your report"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', background: '#f9fafb', outline: 'none' }} />
                </div>
              </div>

              <button type="submit" disabled={submitting} style={{ padding: '13px 28px', borderRadius: 10, fontSize: '0.97rem', fontWeight: 700, color: '#fff', background: submitting ? '#818cf8' : '#4F46E5', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
                {submitting ? <><i className="fas fa-circle-notch fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Report</>}
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}