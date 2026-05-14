/**
 * JSON-LD structured data schemas for Veri9.
 *
 * These are injected via <script type="application/ld+json"> tags in the
 * root layout and individual pages so that Google, Bing, and other search
 * engines can understand the site's content and display rich results
 * (knowledge panels, sitelinks, FAQ snippets, etc.).
 */

export type JsonLdType = 'Organization' | 'WebSite' | 'FAQPage' | 'BreadcrumbList' | 'WebPage' | 'Article' | 'HowTo'

const BASE = 'https://veri9.com'

// ─── Organization — appears on every page via root layout ────────────────────
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Veri9',
  url: BASE,
  logo: `${BASE}/icon-512.png`,
  description: 'Verify any product, anywhere in the world. Scan barcodes to check authenticity instantly.',
  foundingDate: '2024',
  sameAs: [
    'https://twitter.com/veri9app',
    'https://github.com/veri9app',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@veri9.com',
    url: `${BASE}/contact`,
    availableLanguage: ['English'],
  },
}

// ─── WebSite — enables sitelinks search box in Google ────────────────────────
export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Veri9',
  url: BASE,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE}/scanner?barcode={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

// ─── FAQPage — for the FAQ page ─────────────────────────────────────────────
export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Veri9?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Veri9 is a free product verification platform that lets you scan any barcode to instantly check whether a product is authentic or counterfeit. It cross-references 9+ global intelligence sources to verify product authenticity.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does barcode verification work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When you scan a barcode, Veri9 looks it up against multiple global intelligence sources including trade registries (which track over 300 million products), regulatory records, and product intelligence networks. It checks that the barcode is legitimately registered to the brand on the packaging and flags mismatches.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Veri9 free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Veri9 is completely free for consumers. You can scan unlimited barcodes, check product authenticity, and view verification reports without signing up or paying anything.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of products can I verify?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can verify any product with a barcode — electronics, food, beverages, cosmetics, pharmaceuticals, household goods, and more. Veri9 covers all barcode-registered product categories across 100+ countries.',
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate is Veri9?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Veri9 cross-references multiple authoritative sources to provide a trust score from 0-100. A score of 80+ means the product is likely authentic. A score below 50 is a strong warning sign that the product may be counterfeit.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use Veri9 without downloading an app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Veri9 works directly in your mobile or desktop browser. Simply visit veri9.com/scanner to start scanning barcodes with your camera or typing them in manually. No app download required.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does a low trust score mean?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A low trust score (below 50) means Veri9 could not confirm the product\'s authenticity through its verification engine. This could indicate a counterfeit product, a recycled barcode, or simply a product not yet in our system. We recommend contacting the brand directly for confirmation.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Veri9 work internationally?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Veri9 works globally. It accesses international trade registries which covers products from over 100 countries. You can verify products from any country that uses standard barcodes.',
      },
    },
  ],
}

// ─── BreadcrumbList helpers ─────────────────────────────────────────────────
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── Article — for blog posts ───────────────────────────────────────────────
export function articleJsonLd(opts: {
  title: string
  description: string
  url: string
  datePublished: string
  author: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    author: {
      '@type': 'Person',
      name: opts.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Veri9',
      logo: { '@type': 'ImageObject', url: `${BASE}/icon-512.png` },
    },
    mainEntityOfPage: opts.url,
  }
}

// ─── HowTo — for the scanner/how-it-works page ──────────────────────────────
export const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Verify a Product with Veri9',
  description: 'Step-by-step guide to verifying product authenticity using Veri9 barcode scanner.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Open the Scanner',
      text: 'Visit veri9.com/scanner on any device. No app download required — it works in your browser.',
      url: `${BASE}/scanner`,
    },
    {
      '@type': 'HowToStep',
      name: 'Scan the Barcode',
      text: 'Point your camera at the product barcode, or type the barcode number manually. Veri9 supports UPC, EAN, and QR codes.',
      url: `${BASE}/scanner`,
    },
    {
      '@type': 'HowToStep',
      name: 'Review the Results',
      text: 'Veri9 analyzes the barcode using advanced verification intelligence and shows you a trust score, brand verification, product details, and any recall alerts.',
      url: `${BASE}/scanner`,
    },
    {
      '@type': 'HowToStep',
      name: 'Take Action',
      text: 'If the product scores above 80, it is likely authentic. Below 50? Report it and contact the brand. Your report helps protect other consumers.',
      url: `${BASE}/scanner`,
    },
  ],
}
