import { Metadata } from 'next'
import { blogMetadata } from '@/lib/seo'
import BlogClient from './BlogClient'

export const metadata: Metadata = blogMetadata

export default function BlogPage() {
  return <BlogClient />
}