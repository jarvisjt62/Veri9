/**
 * Open Food Facts — regional mirrors
 *
 * The standard Open Food Facts query lives on world.openfoodfacts.org.
 * Many regions have better coverage on their country-specific mirrors,
 * which share the same schema. This module tries the world endpoint
 * first and falls back to regional mirrors so that (e.g.) a product
 * registered on the Nigerian mirror is still found when the user scans it.
 */

const MIRRORS = [
  'https://world.openfoodfacts.org/api/v2',
  'https://ng.openfoodfacts.org/api/v2',   // Nigeria
  'https://ke.openfoodfacts.org/api/v2',   // Kenya
  'https://za.openfoodfacts.org/api/v2',   // South Africa
  'https://in.openfoodfacts.org/api/v2',   // India
  'https://br.openfoodfacts.org/api/v2',   // Brazil
  'https://mx.openfoodfacts.org/api/v2',   // Mexico
  'https://cn.openfoodfacts.org/api/v2',   // China
  'https://jp.openfoodfacts.org/api/v2',   // Japan
  'https://au.openfoodfacts.org/api/v2',   // Australia
  'https://ar.openfoodfacts.org/api/v2',   // Argentina
  'https://tr.openfoodfacts.org/api/v2',   // Turkey
]

async function fetchJsonWithTimeout(url, timeoutMs = 4500) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
  finally { clearTimeout(id) }
}

async function lookupByBarcode(barcode) {
  for (const base of MIRRORS) {
    const data = await fetchJsonWithTimeout(`${base}/product/${barcode}.json`)
    if (data && data.status === 1 && data.product) {
      const p = data.product
      return {
        found: true,
        source: `Open Food Facts (${new URL(base).hostname.split('.')[0].toUpperCase()} mirror)`,
        barcode,
        name: p.product_name || p.product_name_en || 'Unknown',
        brand: p.brands || 'Unknown',
        manufacturer: p.manufacturing_places || p.owner || 'Unknown',
        country: p.countries_tags ? p.countries_tags.map(c => c.replace('en:', '')) : [],
        category: p.categories_tags ? p.categories_tags.map(c => c.replace('en:', '')) : [],
        image: p.image_front_url || p.image_url || null,
        ingredients: p.ingredients_text || null,
        quantity: p.quantity || null,
        mirror: base,
      }
    }
  }
  return { found: false, source: 'Open Food Facts (all mirrors)', barcode }
}

module.exports = { lookupByBarcode, MIRRORS }
