import { Metadata } from 'next'
import { noindexMetadata } from '@/lib/seo'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = noindexMetadata

export default function DashboardPage() {
  return <DashboardClient />
}