import { Metadata } from 'next'
import { communityMetadata } from '@/lib/seo'
import CommunityClient from './CommunityClient'

export const metadata: Metadata = communityMetadata

export default function CommunityPage() {
  return <CommunityClient />
}
