import { Metadata } from 'next'
import { scannerMetadata } from '@/lib/seo'
import { howToJsonLd } from '@/lib/jsonld'
import ScannerClient from './ScannerClient'

export const metadata: Metadata = scannerMetadata

export default function ScannerPage() {
  return (
    <>
      {/* JSON-LD structured data — HowTo schema for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <ScannerClient />
    </>
  )
}