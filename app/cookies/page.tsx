import { Metadata } from 'next'
import { cookiesMetadata } from '@/lib/seo'
import CookiesClient from './CookiesClient'

export const metadata: Metadata = cookiesMetadata

export default function CookiesPage() {
  return <CookiesClient />
}