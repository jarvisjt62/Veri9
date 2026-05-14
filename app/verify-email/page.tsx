import { Metadata } from 'next'
import { noindexMetadata } from '@/lib/seo'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = noindexMetadata

export default function VerifyEmailPage() {
  return <VerifyEmailClient />
}