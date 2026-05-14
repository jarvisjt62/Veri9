import { Metadata } from 'next'
import { noindexMetadata } from '@/lib/seo'
import LoginClient from './LoginClient'

export const metadata: Metadata = noindexMetadata

export default function LoginPage() {
  return <LoginClient />
}