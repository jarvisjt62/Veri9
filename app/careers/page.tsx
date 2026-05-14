import { Metadata } from 'next'
import { careersMetadata } from '@/lib/seo'
import CareersClient from './CareersClient'

export const metadata: Metadata = careersMetadata

export default function CareersPage() {
  return <CareersClient />
}