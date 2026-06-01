/**
 * Open Beauty Facts — by-barcode lookup (already covered by openBeautyFacts.js)
 * PLUS country-mirror search for cosmetics in Nigeria, India, Brazil, etc.
 *
 * The base openBeautyFacts.js queries world.openbeautyfacts.org. This module
 * adds explicit country-coded queries for regional product coverage that
 * doesn't always surface on the global mirror.
 *
 * Region: Multi (Africa / Asia / Americas)
 * Cost: free, no key
 */

const { safeFetchJson } = require('./safeFetch');

// Country mirrors with active beauty product data (verified Nov 2025)
const COUNTRY_MIRRORS = [
  { code: 'ng', name: 'Nigeria',     region: 'africa' },
  { code: 'za', name: 'South Africa', region: 'africa' },
  { code: 'ke', name: 'Kenya',       region: 'africa' },
  { code: 'eg', name: 'Egypt',       region: 'africa' },
  { code: 'ma', name: 'Morocco',     region: 'africa' },
  { code: 'in', name: 'India',       region: 'asia' },
  { code: 'id', name: 'Indonesia',   region: 'asia' },
  { code: 'th', name: 'Thailand',    region: 'asia' },
  { code: 'ph', name: 'Philippines', region: 'asia' },
  { code: 'vn', name: 'Vietnam',     region: 'asia' },
  { code: 'br', name: 'Brazil',      region: 'americas' },
  { code: 'mx', name: 'Mexico',      region: 'americas' },
  { code: 'ar', name: 'Argentina',   region: 'americas' },
  { code: 'co', name: 'Colombia',    region: 'americas' },
];

/**
 * Look up a beauty product across regional Open Beauty Facts mirrors.
 * Returns the first hit, with the country mirror that matched recorded.
 *
 * @param {string} barcode
 * @returns {Promise<object>}
 */
async function lookupByBarcode(barcode) {
  if (!barcode) return { found: false, source: 'Open Beauty Facts (Regional)', barcode };

  // Try a small set in parallel — 4 highest-coverage mirrors
  const priority = COUNTRY_MIRRORS.filter(m => ['ng','in','br','za'].includes(m.code));

  const tasks = priority.map(async (mirror) => {
    const url = `https://${mirror.code}.openbeautyfacts.org/api/v2/product/${barcode}.json`;
    const json = await safeFetchJson(url, { timeoutMs: 6000 });
    if (json && json.status === 1 && json.product) {
      return { mirror, product: json.product };
    }
    return null;
  });

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      const { mirror, product } = r.value;
      const name = product.product_name || product.product_name_en || null;
      const brand = (product.brands || '').split(',')[0].trim() || null;
      if (!name && !brand) continue; // skip empty stubs
      return {
        found: true,
        source: 'Open Beauty Facts (Regional)',
        barcode,
        name,
        brand,
        country: product.countries || mirror.name,
        countryCode: mirror.code.toUpperCase(),
        region: mirror.region,
        category: product.categories || null,
        imageUrl: product.image_url || product.image_front_url || null,
        ingredients: product.ingredients_text || null,
        matchedMirror: `${mirror.code}.openbeautyfacts.org`,
      };
    }
  }

  return { found: false, source: 'Open Beauty Facts (Regional)', barcode };
}

module.exports = { lookupByBarcode, COUNTRY_MIRRORS };
