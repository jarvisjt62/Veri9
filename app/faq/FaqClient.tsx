'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function FaqClient() {
  const faqs = [
    {
      q: 'What is Veri9?',
      a: 'Veri9 is a free product verification platform that lets you scan any barcode to instantly check whether a product is authentic or counterfeit. It cross-references 9+ global intelligence sources to verify product authenticity.',
    },
    {
      q: 'How does barcode verification work?',
      a: 'When you scan a barcode, Veri9 looks it up against multiple global intelligence sources including trade registries (which track over 300 million products), regulatory records, and product intelligence networks. It checks that the barcode is legitimately registered to the brand on the packaging and flags mismatches.',
    },
    {
      q: 'Is Veri9 free to use?',
      a: 'Yes, Veri9 is completely free for consumers. You can scan unlimited barcodes, check product authenticity, and view verification reports without signing up or paying anything.',
    },
    {
      q: 'What types of products can I verify?',
      a: 'You can verify any product with a barcode — electronics, food, beverages, cosmetics, pharmaceuticals, household goods, and more. Veri9 covers all barcode-registered product categories across 100+ countries.',
    },
    {
      q: 'How accurate is Veri9?',
      a: 'Veri9 cross-references multiple authoritative sources to provide a trust score from 0-100. A score of 80+ means the product is likely authentic. A score below 50 is a strong warning sign that the product may be counterfeit.',
    },
    {
      q: 'Can I use Veri9 without downloading an app?',
      a: 'Yes, Veri9 works directly in your mobile or desktop browser. Simply visit veri9.com/scanner to start scanning barcodes with your camera or typing them in manually. No app download required.',
    },
    {
      q: 'What does a low trust score mean?',
      a: 'A low trust score (below 50) means Veri9 could not confirm the product\'s authenticity through its verification engine. This could indicate a counterfeit product, a recycled barcode, or simply a product not yet in our system. We recommend contacting the brand directly for confirmation.',
    },
    {
      q: 'Does Veri9 work internationally?',
      a: 'Yes, Veri9 works globally. It accesses international trade registries which covers products from over 100 countries. You can verify products from any country that uses standard barcodes.',
    },
    {
      q: 'What sources does Veri9 check?',
      a: 'Veri9 checks global trade registries (300M+ products), regulatory records, food and cosmetics intelligence networks, and several other product intelligence sources. We also integrate with manufacturer APIs where available.',
    },
    {
      q: 'Can I report a counterfeit product?',
      a: 'Yes, after scanning a product, you can report it as suspicious. Your report is logged and helps improve our system and protect other consumers. We also provide guidance on how to report counterfeits to brands and authorities.',
    },
    {
      q: 'How do I create an account?',
      a: 'Creating an account is optional but recommended if you want to save your scan history, track verified products, and receive recall alerts. Click "Sign Up" in the top-right corner and follow the prompts.',
    },
    {
      q: 'Is my data private?',
      a: 'Yes, Veri9 respects your privacy. We do not sell your personal data. Scan history is stored securely and only accessible to you. Read our full privacy policy at veri9.com/privacy.',
    },
  ]

  return (
    <>
      <Navbar />
      <main style={{ background: '#fff', minHeight: '80vh' }}>
        <section style={{
          padding: 'clamp(60px, 8vw, 100px) 24px',
          maxWidth: 900,
          margin: '0 auto',
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: 16,
            letterSpacing: '-0.03em',
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#64748b',
            lineHeight: 1.7,
            marginBottom: 48,
          }}>
            Get answers to common questions about Veri9 product verification.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {faqs.map((faq, i) => (
              <details
                key={i}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <summary
                  style={{
                    padding: '18px 20px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    listStyle: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '0.9rem', color: '#635bff' }}>+</span>
                </summary>
                <div style={{
                  padding: '0 20px 20px',
                  fontSize: '0.95rem',
                  color: '#475569',
                  lineHeight: 1.7,
                }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div style={{
            marginTop: 56,
            padding: 24,
            background: '#eef2ff',
            borderRadius: 12,
            border: '1px solid #c7d2fe',
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#4338ca',
              marginBottom: 12,
            }}>
              Still have questions?
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: '#4338ca',
              marginBottom: 16,
              lineHeight: 1.6,
            }}>
              Our support team is here to help. Contact us and we'll respond within 24 hours.
            </p>
            <a
              href="/contact"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#4f46e5',
                color: '#fff',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Contact Support
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}