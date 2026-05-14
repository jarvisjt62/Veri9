import { Metadata } from 'next'
import { donateMetadata } from '@/lib/seo'
import DonateClient from './DonateClient'

export const metadata: Metadata = donateMetadata

export default function DonatePage() {
  return <DonateClient />
}
