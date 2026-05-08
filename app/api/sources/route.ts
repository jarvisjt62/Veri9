import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    totalSources: 11,
    sources: [
      { name: 'Open Food Facts',        type: 'food',           free: true, keyRequired: false, url: 'https://world.openfoodfacts.org',   records: '3M+' },
      { name: 'OpenFDA',                type: 'pharmaceutical', free: true, keyRequired: false, url: 'https://open.fda.gov',               records: '4M+ drug records' },
      { name: 'Open Beauty Facts',      type: 'cosmetics',      free: true, keyRequired: false, url: 'https://world.openbeautyfacts.org',  records: '800K+' },
      { name: 'NHTSA Vehicle Database', type: 'automotive',     free: true, keyRequired: false, url: 'https://vpic.nhtsa.dot.gov',         records: '50K+ vehicles' },
      { name: 'WHO Medicines',          type: 'pharmaceutical', free: true, keyRequired: false, url: 'https://www.who.int',                records: '500+ essential medicines' },
      { name: 'UPCitemdb',              type: 'retail',         free: true, keyRequired: false, url: 'https://www.upcitemdb.com',          records: '150M+ products', rateLimit: '100/day (trial)' },
      { name: 'Open Library',           type: 'books',          free: true, keyRequired: false, url: 'https://openlibrary.org',            records: '30M+ books' },
      { name: 'Datakick',               type: 'grocery',        free: true, keyRequired: false, url: 'https://www.datakick.org',           records: '100K+ grocery items' },
      { name: 'GS1 Prefix Database',    type: 'identification', free: true, keyRequired: false, url: 'https://www.gs1.org',               records: '195+ countries' },
      { name: 'USDA FoodData Central',  type: 'food',           free: true, keyRequired: false, url: 'https://fdc.nal.usda.gov',           records: '900K+ foods', note: 'DEMO_KEY: 30/hr; free key: 3600/hr' },
      { name: 'Barcode Lookup (multi)', type: 'retail',         free: true, keyRequired: false, url: 'Multiple sources',                   records: 'Combined' },
    ]
  })
}