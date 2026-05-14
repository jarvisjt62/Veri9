/**
 * Barcode Monster — free public barcode database
 * https://barcode.monster
 */
const BASE_URL = 'https://barcode.monster'

async function lookupByBarcode(barcode) {
  try {
    const res = await fetch(`${BASE_URL}/api/${encodeURIComponent(barcode)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { found: false, source: 'Barcode Monster' }
    const data = await res.json()
    if (data && data.status === 'active' && data.description) {
      return {
        found: true,
        source: 'Barcode Monster',
        barcode,
        description: data.description,
        company: data.company || null,
      }
    }
    return { found: false, source: 'Barcode Monster' }
  } catch {
    return { found: false, source: 'Barcode Monster', error: 'network' }
  }
}

module.exports = { lookupByBarcode }
