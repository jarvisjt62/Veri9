import { Metadata } from 'next'
import { noindexMetadata } from '@/lib/seo'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = noindexMetadata

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}