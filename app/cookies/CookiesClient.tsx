'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'


export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#fff' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: 'clamp(48px, 8vw, 80px) 24px clamp(40px, 6vw, 64px)',
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,91,255,0.2)', border: '1px solid rgba(99,91,255,0.4)',
              borderRadius: 9999, padding: '4px 14px', marginBottom: 16,
              fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc',
            }}>
              Legal
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 12 }}>
              Cookie Policy
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
              Last updated: June 10, 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px, 6vw, 64px) 24px' }}>
          <div style={{
            background: '#f8fafc', borderRadius: 16, padding: '20px 24px',
            border: '1px solid #e2e8f0', marginBottom: 40,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.4rem' }}>🍪</span>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Summary</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7 }}>
                We use cookies to make Veri9 work, remember your preferences, and help us improve the experience. 
                We do not sell your data to third parties. You can manage your preferences at any time.
              </p>
            </div>
          </div>

          {[
            {
              title: '1. What Are Cookies?',
              content: `Cookies are small text files stored on your device when you visit a website. They help websites remember information about your visit, which can make it easier for you to revisit and make the site more useful to you.

Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (remain on your device for a set period or until you delete them).`,
            },
            {
              title: '2. How We Use Cookies',
              content: `Veri9 uses cookies for the following purposes:

**Essential Cookies** — These are necessary for the website to function and cannot be turned off. They include authentication tokens, security cookies, and session management. Without these, features like logging in would not work.

**Functional Cookies** — These remember your preferences such as dark/light mode, language settings, and recently scanned products. Disabling these may affect the functionality of the service.

**Analytics Cookies** — We use privacy-friendly analytics to understand how visitors use Veri9. This helps us improve performance and user experience. Data is aggregated and anonymized.

**Security Cookies** — These help protect you and our platform from fraud, abuse, and unauthorized access.`,
            },
            {
              title: '3. Specific Cookies We Use',
              content: `| Cookie Name | Purpose | Duration |
|---|---|---|
| sb-auth-token | Supabase authentication session | Session |
| sb-refresh-token | Refresh your login session | 7 days |
| veri9-theme | Remember light/dark preference | 1 year |
| veri9-scan-history | Local scan history (localStorage) | Persistent |
| _ga | Google Analytics (anonymized) | 2 years |
| rc::a | Google reCAPTCHA verification | Persistent |`,
            },
            {
              title: '4. Third-Party Cookies',
              content: `We use the following third-party services that may set their own cookies:

**Google reCAPTCHA** — Used to protect our forms from spam and abuse. Subject to Google's Privacy Policy.

**Google Analytics** — Used to track anonymized usage statistics to improve our service. We have enabled IP anonymization.

**Supabase** — Our authentication and backend provider may use cookies for session management.

We do not use advertising cookies, tracking cookies, or sell your data to advertisers.`,
            },
            {
              title: '5. Managing Your Cookie Preferences',
              content: `You have several options to manage cookies:

**Browser Settings** — Most browsers allow you to control cookies through settings. You can block all cookies, block third-party cookies, or delete existing cookies. Note that blocking essential cookies will prevent you from using features like login.

**Opt-out Tools** — You can opt out of Google Analytics tracking at: https://tools.google.com/dlpage/gaoptout

**LocalStorage** — Veri9 uses browser localStorage to store your scan history. You can clear this at any time through your browser's developer tools or settings.

Note: If you disable essential cookies, parts of Veri9 may not function correctly.`,
            },
            {
              title: '6. Cookie Consent',
              content: `When you first visit Veri9, we may display a cookie consent banner. By continuing to use our service, you consent to our use of cookies as described in this policy.

You can withdraw consent at any time by clearing cookies in your browser settings and adjusting your cookie preferences when prompted on your next visit.`,
            },
            {
              title: '7. Changes to This Policy',
              content: `We may update this Cookie Policy periodically to reflect changes in our practices or legal requirements. When we make material changes, we will update the "Last Updated" date at the top of this page.

We encourage you to review this page periodically to stay informed about how we use cookies.`,
            },
            {
              title: '8. Contact Us',
              content: `If you have questions about our use of cookies, please contact us at:

**Email:** contact@veri9.com
**Website:** https://veri9.com/contact`,
            },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: 36 }}>
              <h2 style={{
                fontSize: '1.1rem', fontWeight: 800, color: '#0f172a',
                letterSpacing: '-0.02em', marginBottom: 14,
                paddingBottom: 10, borderBottom: '1px solid #f1f5f9',
              }}>
                {section.title}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.8 }}>
                {section.content.split('\n').map((line, j) => (
                  line.trim() === '' ? <br key={j} /> :
                  line.startsWith('**') ? (
                    <p key={j} style={{ marginBottom: 8 }}>
                      <strong style={{ color: '#0f172a' }}>{line.replace(/\*\*/g, '').split(' — ')[0]}</strong>
                      {line.includes(' — ') ? ` — ${line.split(' — ').slice(1).join(' — ')}` : ''}
                    </p>
                  ) : line.startsWith('|') ? (
                    <div key={j} style={{
                      fontFamily: 'monospace', fontSize: '0.82rem',
                      background: '#f8fafc', padding: '8px 12px',
                      borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 4,
                    }}>
                      {line}
                    </div>
                  ) : (
                    <p key={j} style={{ marginBottom: 8 }}>{line}</p>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}