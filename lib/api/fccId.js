/**
 * FCC ID Database — fccid.io open catalog of FCC-certified devices
 * Useful for electronics verification via FCC ID on the product label.
 */
const BASE_URL = 'https://fccid.io'

async function lookupByFccId(fccId) {
  if (!fccId) return { found: false, source: 'FCC ID' }
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(fccId)}`, {
      headers: { 'User-Agent': 'Veri9-verification/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { found: false, source: 'FCC ID' }
    // fccid.io returns HTML; a 200 response on a detail page implies the FCC ID exists.
    return { found: true, source: 'FCC ID', fccId, url: `${BASE_URL}/${fccId}` }
  } catch {
    return { found: false, source: 'FCC ID', error: 'network' }
  }
}

// When passed a plain barcode we cannot resolve an FCC ID, so return a no-op.
async function lookupByBarcode(_barcode) {
  return { found: false, source: 'FCC ID', note: 'FCC ID lookup requires an FCC ID string, not a UPC/EAN' }
}

module.exports = { lookupByBarcode, lookupByFccId }
