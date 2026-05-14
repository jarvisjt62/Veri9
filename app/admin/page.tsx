import { Metadata } from 'next'
import { noindexMetadata } from '@/lib/seo'
import AdminClient from './AdminClient'

export const metadata: Metadata = noindexMetadata

export default function AdminPage() {
  return <AdminClient />
}