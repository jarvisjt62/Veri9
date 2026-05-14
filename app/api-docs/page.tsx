import { Metadata } from 'next'
import { noindexMetadata } from '@/lib/seo'
import ApiDocsClient from './ApiDocsClient'

export const metadata: Metadata = noindexMetadata

export default function ApiDocsPage() {
  return <ApiDocsClient />
}