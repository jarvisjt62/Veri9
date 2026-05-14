import type { Metadata } from 'next'

/**
 * Centralised SEO metadata for every public page on veri9.com.
 *
 * Next.js App Router allows metadata to be exported only from Server Components.
 * Since most of our pages are 'use client', we create a thin server-component
 * wrapper for each page that exports the metadata from here and renders the
 * client component as its child.
 */

const BASE = 'https://veri9.com'

export const siteConfig = {
  name: 'Veri9',
  url: BASE,
  ogImage: `${BASE}/icon-512.png`,
  twitterHandle: '@veri9app',
}

// ─── Home (/) ────────────────────────────────────────────────────────────────
export const homeMetadata: Metadata = {
  title: 'Veri9 — Verify Any Product, Anywhere in the World',
  description:
    'Scan any barcode to instantly verify product authenticity. Veri9 cross-references 9+ global intelligence sources to detect counterfeits in seconds.',
  alternates: { canonical: BASE },
  openGraph: {
    title: 'Veri9 — Verify Any Product, Anywhere in the World',
    description:
      'Scan any barcode to instantly verify product authenticity. Cross-reference global intelligence sources to detect counterfeits in seconds.',
    url: BASE,
    siteName: 'Veri9',
    images: [{ url: `${BASE}/icon-512.png`, width: 512, height: 512, alt: 'Veri9 Product Verification' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veri9 — Verify Any Product, Anywhere',
    description: 'Scan any barcode to instantly verify product authenticity.',
    images: [`${BASE}/icon-512.png`],
  },
}

// ─── Scanner (/scanner) ─────────────────────────────────────────────────────
export const scannerMetadata: Metadata = {
  title: 'Barcode Scanner — Verify Products Instantly',
  description:
    'Free online barcode scanner. Scan or type any barcode to instantly check product authenticity against 9+ global intelligence sources. No app download required.',
  alternates: { canonical: `${BASE}/scanner` },
  openGraph: {
    title: 'Free Barcode Scanner — Verify Products Instantly | Veri9',
    description:
      'Scan any barcode to instantly verify product authenticity. Free, no sign-up required.',
    url: `${BASE}/scanner`,
    siteName: 'Veri9',
    images: [{ url: `${BASE}/icon-512.png`, width: 512, height: 512, alt: 'Veri9 Scanner' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Barcode Scanner — Verify Products Instantly',
    description: 'Scan any barcode to check authenticity. Free, no sign-up required.',
  },
}

// ─── About (/about) ─────────────────────────────────────────────────────────
export const aboutMetadata: Metadata = {
  title: 'About Veri9 — Our Mission to Stop Counterfeits',
  description:
    'Veri9 is on a mission to protect consumers from counterfeit products worldwide. Learn how our barcode verification technology cross-references global intelligence sources to keep you safe.',
  alternates: { canonical: `${BASE}/about` },
  openGraph: {
    title: 'About Veri9 — Our Mission to Stop Counterfeits',
    description: 'Learn how Veri9 protects consumers from counterfeit products worldwide.',
    url: `${BASE}/about`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Contact (/contact) ─────────────────────────────────────────────────────
export const contactMetadata: Metadata = {
  title: 'Contact Us — Get Help with Product Verification',
  description:
    'Have questions about product verification or need help spotting a counterfeit? Contact the Veri9 team — we respond within 24 hours.',
  alternates: { canonical: `${BASE}/contact` },
  openGraph: {
    title: 'Contact Veri9 — Get Help with Product Verification',
    description: 'Have questions about product verification? Contact the Veri9 team.',
    url: `${BASE}/contact`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Donate (/donate) ───────────────────────────────────────────────────────
export const donateMetadata: Metadata = {
  title: 'Support Veri9 — Donate to Fight Counterfeits',
  description:
    'Help Veri9 keep product verification free for everyone. Donate via Stripe, PayPal, Paystack, or Razorpay to support the fight against counterfeit goods.',
  alternates: { canonical: `${BASE}/donate` },
  openGraph: {
    title: 'Support Veri9 — Donate to Fight Counterfeits',
    description: 'Help keep product verification free. Donate to Veri9 today.',
    url: `${BASE}/donate`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Brands (/brands) ───────────────────────────────────────────────────────
export const brandsMetadata: Metadata = {
  title: 'Verified Brands — Browse Authentic Products',
  description:
    'Browse verified brands and authentic products on Veri9. Check if a brand is legitimate before you buy and protect yourself from counterfeit goods.',
  alternates: { canonical: `${BASE}/brands` },
  openGraph: {
    title: 'Verified Brands — Browse Authentic Products | Veri9',
    description: 'Browse verified brands and check if a brand is legitimate before you buy.',
    url: `${BASE}/brands`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Community (/community) ─────────────────────────────────────────────────
export const communityMetadata: Metadata = {
  title: 'Community — Join the Fight Against Counterfeits',
  description:
    'Join the Veri9 community of consumers fighting counterfeit products. Share verification reports, report fakes, and help protect others from scams.',
  alternates: { canonical: `${BASE}/community` },
  openGraph: {
    title: 'Veri9 Community — Join the Fight Against Counterfeits',
    description: 'Join the Veri9 community. Share reports, report fakes, and help protect others.',
    url: `${BASE}/community`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Blog (/blog) ───────────────────────────────────────────────────────────
export const blogMetadata: Metadata = {
  title: 'Blog — Counterfeit News, Tips & Verification Guides',
  description:
    'Read the Veri9 blog for the latest news on counterfeit products, verification tips, consumer safety guides, and updates on the fight against fake goods.',
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    title: 'Veri9 Blog — Counterfeit News & Verification Guides',
    description: 'Latest news on counterfeit products, verification tips, and consumer safety guides.',
    url: `${BASE}/blog`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Careers (/careers) ─────────────────────────────────────────────────────
export const careersMetadata: Metadata = {
  title: 'Careers — Join Veri9 and Fight Counterfeits',
  description:
    'Join Veri9 and help build the future of product verification. We are hiring engineers, designers, and product people passionate about consumer safety.',
  alternates: { canonical: `${BASE}/careers` },
  openGraph: {
    title: 'Careers at Veri9 — Join the Fight Against Counterfeits',
    description: 'Join Veri9 and help build the future of product verification.',
    url: `${BASE}/careers`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Security (/security) ───────────────────────────────────────────────────
export const securityMetadata: Metadata = {
  title: 'Security — How Veri9 Protects Your Data',
  description:
    'Learn about Veri9 security practices. We use industry-standard encryption, secure authentication, and responsible data handling to protect your privacy.',
  alternates: { canonical: `${BASE}/security` },
  openGraph: {
    title: 'Veri9 Security — How We Protect Your Data',
    description: 'Learn about Veri9 security practices and data protection.',
    url: `${BASE}/security`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Privacy (/privacy) ─────────────────────────────────────────────────────
export const privacyMetadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the Veri9 privacy policy. Learn how we collect, use, and protect your personal information when you use our product verification service.',
  alternates: { canonical: `${BASE}/privacy` },
}

// ─── Terms (/terms) ─────────────────────────────────────────────────────────
export const termsMetadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the Veri9 terms of service. Understand the terms and conditions for using our product verification platform.',
  alternates: { canonical: `${BASE}/terms` },
}

// ─── Cookies (/cookies) ─────────────────────────────────────────────────────
export const cookiesMetadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn how Veri9 uses cookies and tracking technologies to improve your experience.',
  alternates: { canonical: `${BASE}/cookies` },
}

// ─── FAQ (/faq) ─────────────────────────────────────────────────────────────
export const faqMetadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions About Product Verification',
  description:
    'Get answers to common questions about Veri9 product verification. How barcode scanning works, what sources we check, and how to spot counterfeit products.',
  alternates: { canonical: `${BASE}/faq` },
  openGraph: {
    title: 'Veri9 FAQ — Frequently Asked Questions',
    description: 'Get answers to common questions about Veri9 product verification.',
    url: `${BASE}/faq`,
    siteName: 'Veri9',
    type: 'website',
  },
}

// ─── Blog Post — per-slug metadata ──────────────────────────────────────────
export const blogPostMetadata: Record<string, Metadata> = {
  'how-to-spot-counterfeit-electronics': {
    title: 'How to Spot Counterfeit Electronics: A Complete Guide',
    description:
      'Learn how to identify fake electronics before you buy. Check barcodes, verify serial numbers, inspect build quality, and use Veri9 to instantly authenticate any product.',
    alternates: { canonical: `${BASE}/blog/how-to-spot-counterfeit-electronics` },
    openGraph: {
      title: 'How to Spot Counterfeit Electronics: A Complete Guide',
      description: 'Learn how to identify fake electronics. Check barcodes, verify serial numbers, and use Veri9.',
      url: `${BASE}/blog/how-to-spot-counterfeit-electronics`,
      siteName: 'Veri9',
      type: 'article',
      publishedTime: '2025-01-15T00:00:00.000Z',
      authors: ['Dr. Sarah Chen'],
    },
  },
  'fda-recall-alert-january-2025': {
    title: 'FDA Recall Alert: What You Need to Know This January',
    description:
      'Several popular over-the-counter medications have been recalled. Here is how to check if your products are affected using Veri9.',
    alternates: { canonical: `${BASE}/blog/fda-recall-alert-january-2025` },
    openGraph: {
      title: 'FDA Recall Alert: What You Need to Know This January',
      description: 'Several popular over-the-counter medications have been recalled. Check if your products are affected.',
      url: `${BASE}/blog/fda-recall-alert-january-2025`,
      siteName: 'Veri9',
      type: 'article',
      publishedTime: '2025-01-12T00:00:00.000Z',
      authors: ['Michael Torres'],
    },
  },
  'the-economics-of-counterfeiting': {
    title: 'The $4.5 Trillion Counterfeiting Economy and How Technology Is Fighting Back',
    description:
      'Counterfeiting costs the global economy trillions annually. We explore how AI and open data are turning the tide against fake products.',
    alternates: { canonical: `${BASE}/blog/the-economics-of-counterfeiting` },
    openGraph: {
      title: 'The $4.5 Trillion Counterfeiting Economy and How Technology Is Fighting Back',
      description: 'Counterfeiting costs the global economy trillions. AI and open data are turning the tide.',
      url: `${BASE}/blog/the-economics-of-counterfeiting`,
      siteName: 'Veri9',
      type: 'article',
      publishedTime: '2025-01-08T00:00:00.000Z',
      authors: ['Emma Williams'],
    },
  },
  'barcode-verification-explained': {
    title: 'Barcode Verification Explained: How Your Phone Can Detect Fakes',
    description:
      'Every product barcode tells a story. Discover how Veri9 cross-references global intelligence sources to verify product authenticity in seconds.',
    alternates: { canonical: `${BASE}/blog/barcode-verification-explained` },
    openGraph: {
      title: 'Barcode Verification Explained: How Your Phone Can Detect Fakes',
      description: 'Discover how Veri9 cross-references global intelligence sources to verify product authenticity.',
      url: `${BASE}/blog/barcode-verification-explained`,
      siteName: 'Veri9',
      type: 'article',
      publishedTime: '2025-01-05T00:00:00.000Z',
      authors: ['Dr. Sarah Chen'],
    },
  },
  'protecting-your-family-from-fake-baby-products': {
    title: 'Protecting Your Family from Counterfeit Baby Products',
    description:
      'Fake baby formula, diapers, and toys pose serious health risks. Learn how parents are using Veri9 to keep their families safe.',
    alternates: { canonical: `${BASE}/blog/protecting-your-family-from-fake-baby-products` },
    openGraph: {
      title: 'Protecting Your Family from Counterfeit Baby Products',
      description: 'Fake baby formula, diapers, and toys pose serious health risks. Learn how to keep your family safe.',
      url: `${BASE}/blog/protecting-your-family-from-fake-baby-products`,
      siteName: 'Veri9',
      type: 'article',
      publishedTime: '2025-12-28T00:00:00.000Z',
      authors: ['Lisa Park'],
    },
  },
  'open-data-movement-product-authenticity': {
    title: 'The Open Data Movement and Product Authenticity',
    description:
      'How open data and public registries are making product verification accessible to everyone.',
    alternates: { canonical: `${BASE}/blog/open-data-movement-product-authenticity` },
    openGraph: {
      title: 'The Open Data Movement and Product Authenticity',
      description: 'How open data and public registries are making product verification accessible to everyone.',
      url: `${BASE}/blog/open-data-movement-product-authenticity`,
      siteName: 'Veri9',
      type: 'article',
      publishedTime: '2024-12-22T00:00:00.000Z',
      authors: ['James Rivera'],
    },
  },
}

// ─── Auth / private pages — NOINDEX ─────────────────────────────────────────
export const noindexMetadata: Metadata = {
  robots: { index: false, follow: false },
}
