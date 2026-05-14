import { Metadata } from 'next'
import { blogPostMetadata } from '@/lib/seo'
import BlogPostClient from './BlogPostClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return blogPostMetadata[slug] || {
    title: 'Blog — Veri9',
    description: 'Read the latest from Veri9.',
  }
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // We need to unwrap the params promise in a client-compatible way
  return <BlogPostClientWrapper params={params} />
}

// Small async wrapper to unwrap the params promise for the client component
import { use } from 'react'

function BlogPostClientWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <BlogPostClient slug={slug} />
}