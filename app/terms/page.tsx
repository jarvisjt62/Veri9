import { Metadata } from 'next'
import { termsMetadata } from '@/lib/seo'
import TermsClient from './TermsClient'

export const metadata: Metadata = termsMetadata

export default function TermsPage() {
  return <TermsClient />
}