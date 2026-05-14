import { Metadata } from 'next'
import { aboutMetadata } from '@/lib/seo'
import AboutClient from './AboutClient'

export const metadata: Metadata = aboutMetadata

export default function AboutPage() {
  return <AboutClient />
}
