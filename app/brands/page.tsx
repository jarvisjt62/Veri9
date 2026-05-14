import { Metadata } from 'next'
import { brandsMetadata } from '@/lib/seo'
import BrandsClient from './BrandsClient'

export const metadata: Metadata = brandsMetadata

export default function BrandsPage() {
  return <BrandsClient />
}
