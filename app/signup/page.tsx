import { Metadata } from 'next'
import { noindexMetadata } from '@/lib/seo'
import SignupClient from './SignupClient'

export const metadata: Metadata = noindexMetadata

export default function SignupPage() {
  return <SignupClient />
}