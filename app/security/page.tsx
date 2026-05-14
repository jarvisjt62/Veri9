import { Metadata } from 'next'
import { securityMetadata } from '@/lib/seo'
import SecurityClient from './SecurityClient'

export const metadata: Metadata = securityMetadata

export default function SecurityPage() {
  return <SecurityClient />
}
