import { Metadata } from 'next'
import { privacyMetadata } from '@/lib/seo'
import PrivacyClient from './PrivacyClient'

export const metadata: Metadata = privacyMetadata

export default function PrivacyPage() {
  return <PrivacyClient />
}