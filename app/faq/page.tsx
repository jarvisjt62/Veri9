import { Metadata } from 'next'
import { faqMetadata } from '@/lib/seo'
import { faqJsonLd } from '@/lib/jsonld'
import FaqClient from './FaqClient'

export const metadata: Metadata = faqMetadata

export default function FaqPage() {
  return (
    <>
      {/* JSON-LD structured data — FAQPage schema for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqClient />
    </>
  )
}