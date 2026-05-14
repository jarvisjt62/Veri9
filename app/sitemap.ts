import { MetadataRoute } from 'next'

const BASE = 'https://veri9.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/scanner`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/donate`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/brands`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/community`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Blog post slugs — keep in sync with app/blog/BlogClient.tsx and app/blog/[slug]/BlogPostClient.tsx
  const blogSlugs = [
    'how-to-spot-counterfeit-electronics',
    'fda-recall-alert-january-2025',
    'the-economics-of-counterfeiting',
    'barcode-verification-explained',
    'protecting-your-family-from-fake-baby-products',
    'open-data-movement-product-authenticity',
  ]
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map(slug => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages]
}
