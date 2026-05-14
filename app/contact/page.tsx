import { Metadata } from 'next'
import { contactMetadata } from '@/lib/seo'
import ContactClient from './ContactClient'

export const metadata: Metadata = contactMetadata

export default function ContactPage() {
  return <ContactClient />
}
