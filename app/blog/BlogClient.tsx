'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const POSTS = [
  {
    id: 1,
    slug: 'how-to-spot-counterfeit-electronics',
    title: 'How to Spot Counterfeit Electronics: A Complete Guide',
    excerpt: 'Counterfeit electronics are flooding online marketplaces. Learn the telltale signs of fake products and how to verify authenticity before you buy.',
    category: 'Consumer Safety',
    author: 'Dr. Sarah Chen',
    date: 'Jan 15, 2025',
    readTime: '8 min read',
    featured: true,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  },
  {
    id: 2,
    slug: 'fda-recall-alert-january-2025',
    title: 'FDA Recall Alert: What You Need to Know This January',
    excerpt: 'Several popular over-the-counter medications have been recalled. Here\'s how to check if your products are affected using Veri9.',
    category: 'Recall Alerts',
    author: 'Michael Torres',
    date: 'Jan 12, 2025',
    readTime: '5 min read',
    featured: true,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  },
  {
    id: 3,
    slug: 'the-economics-of-counterfeiting',
    title: 'The $4.5 Trillion Counterfeiting Economy and How Technology Is Fighting Back',
    excerpt: 'Counterfeiting costs the global economy trillions annually. We explore how AI and open data are turning the tide against fake products.',
    category: 'Industry',
    author: 'Emma Williams',
    date: 'Jan 8, 2025',
    readTime: '12 min read',
    featured: false,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80',
  },
  {
    id: 4,
    slug: 'barcode-verification-explained',
    title: 'Barcode Verification Explained: How Your Phone Can Detect Fakes',
    excerpt: 'Every product barcode tells a story. Discover how Veri9 cross-references global intelligence sources to verify product authenticity in seconds.',
    category: 'Technology',
    author: 'Dr. Sarah Chen',
    date: 'Jan 5, 2025',
    readTime: '6 min read',
    featured: false,
    image: 'https://images.unsplash.com/photo-1599658880436-c61792e70672?w=600&q=80',
  },
  {
    id: 5,
    slug: 'protecting-your-family-from-fake-baby-products',
    title: 'Protecting Your Family from Counterfeit Baby Products',
    excerpt: 'Fake baby formula, diapers, and toys pose serious health risks. Learn how parents are using Veri9 to keep their families safe.',
    category: 'Consumer Safety',
    author: 'Lisa Park',
    date: 'Dec 28, 2024',
    readTime: '7 min read',
    featured: false,
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80',
  },
  {
    id: 6,
    slug: 'open-data-movement-product-authenticity',
    title: 'The Open Data Movement and Product Authenticity',
    excerpt: 'How open data and public registries are making product verification accessible to everyone.',
    category: 'Industry',
    author: 'James Rivera',
    date: 'Dec 22, 2024',
    readTime: '9 min read',
    featured: false,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
]

const CATEGORIES = ['All', 'Consumer Safety', 'Recall Alerts', 'Industry', 'Technology']

function BlogPageInner() {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = POSTS.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory
    const matchesSearch = !searchQuery || post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredPosts = filteredPosts.filter(p => p.featured)
  const regularPosts = filteredPosts.filter(p => !p.featured)

  return (
    <>
      {!isEmbed && <Navbar />}
      <style>{`
        .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 24px; }
        .blog-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
        .blog-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .featured-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr)); gap: 24px; }
        @media (max-width: 600px) { .featured-grid { grid-template-columns: 1fr; } .blog-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 40%, #635bff 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 20 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            The Veri9 Blog
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Insights on Product<br />Safety & Verification
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
            Stay informed about counterfeiting trends, recall alerts, and how technology is making the marketplace safer for everyone.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 600, border: '1.5px solid', borderColor: activeCategory === cat ? '#635bff' : '#e5e7eb', background: activeCategory === cat ? '#635bff' : '#fff', color: activeCategory === cat ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search articles..."
              style={{ padding: '9px 14px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.88rem', fontFamily: 'Inter, sans-serif', outline: 'none', width: 240, background: '#fff' }} />
          </div>
        </div>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px 40px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#635bff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Featured
          </h2>
          <div className="featured-grid">
            {featuredPosts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                <div className="blog-card" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ height: 200, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #635bff, #7c3aed)' }}>
                    {(post as {image?: string}).image ? (
                      <img src={(post as {image?: string}).image} alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : null}
                    <div style={{ position: 'absolute', top: 16, left: 16, padding: '4px 12px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(8px)' }}>{post.category}</div>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.01em', lineHeight: 1.35 }}>{post.title}</h3>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#635bff' }}>{post.author.split(' ').map(n => n[0]).join('')}</div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{post.author}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: '#94a3b8' }}>
                        <span>{post.date}</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Regular Posts */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px 60px' }}>
        {featuredPosts.length > 0 && <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Latest Articles</h2>}
        <div className="blog-grid">
          {regularPosts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div className="blog-card" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {(post as {image?: string}).image && (
                  <div style={{ height: 160, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={(post as {image?: string}).image} alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                    />
                  </div>
                )}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: '#f0f0ff', color: '#635bff' }}>{post.category}</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{post.readTime}</span>
                </div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', marginBottom: 10, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{post.title}</h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.7, flex: 1 }}>{post.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#635bff' }}>{post.author.split(' ').map(n => n[0]).join('')}</div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{post.author}</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 'auto' }}>{post.date}</span>
                </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <p style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>No articles found matching your search.</p>
          </div>
        )}
      </div>

      {/* Newsletter CTA */}
      <div style={{ background: 'linear-gradient(135deg, #0a0e1a, #1e1b4b)', padding: 'clamp(48px,8vw,72px) 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>Stay ahead of counterfeit threats</h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 28 }}>Get weekly alerts about product recalls, counterfeiting trends, and safety tips delivered to your inbox.</p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto' }}>
            <input type="email" placeholder="Enter your email"
              style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
            <button style={{ padding: '12px 24px', borderRadius: 10, background: '#635bff', color: '#fff', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe</button>
          </div>
        </div>
      </div>

      {!isEmbed && <Footer />}
    </>
  )
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}>
      <BlogPageInner />
    </Suspense>
  )
}
