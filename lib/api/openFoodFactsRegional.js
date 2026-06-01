/**
 * Open Food Facts — Africa / Asia / Americas extended country mirrors.
 *
 * Companion to the existing `openFoodFactsMirrors.js`. While the original
 * focuses on the major OFF mirrors (us, fr, de, gb, es, it, jp), this module
 * targets the regional gap: Africa, Asia, Latin America.
 *
 * Each OFF country mirror serves the same underlying DB but with country-
 * filtered indexing; some products only appear when queried via the right
 * mirror because of how user contributions were tagged.
 *
 * Region: Africa / Asia / Latin America
 * Cost: free, no key
 */

const { safeFetchJson } = require('./safeFetch');

const REGIONAL_MIRRORS = [
  // Africa
  { code: 'ng', name: 'Nigeria',          region: 'africa' },
  { code: 'za', name: 'South Africa',     region: 'africa' },
  { code: 'ke', name: 'Kenya',            region: 'africa' },
  { code: 'eg', name: 'Egypt',            region: 'africa' },
  { code: 'ma', name: 'Morocco',          region: 'africa' },
  { code: 'gh', name: 'Ghana',            region: 'africa' },
  { code: 'ci', name: 'Ivory Coast',      region: 'africa' },
  { code: 'sn', name: 'Senegal',          region: 'africa' },
  { code: 'tn', name: 'Tunisia',          region: 'africa' },
  // Asia
  { code: 'in', name: 'India',            region: 'asia' },
  { code: 'id', name: 'Indonesia',        region: 'asia' },
  { code: 'th', name: 'Thailand',         region: 'asia' },
  { code: 'ph', name: 'Philippines',      region: 'asia' },
  { code: 'vn', name: 'Vietnam',          region: 'asia' },
  { code: 'my', name: 'Malaysia',         region: 'asia' },
  { code: 'sg', name: 'Singapore',        region: 'asia' },
  { code: 'kr', name: 'South Korea',      region: 'asia' },
  { code: 'tw', name: 'Taiwan',           region: 'asia' },
  // Americas (LatAm)
  { code: 'br', name: 'Brazil',           region: 'americas' },
  { code: 'mx', name: 'Mexico',           region: 'americas' },
  { code: 'ar', name: 'Argentina',        region: 'americas' },
  { code: 'co', name: 'Colombia',         region: 'americas' },
  { code: 'cl', name: 'Chile',            region: 'americas' },
  { code: 'pe', name: 'Peru',             region: 'americas' },
];

/**
 * Look up a product across regional OFF mirrors.
 * @param {string} barcode
 */
async function lookupByBarcode(barcode) {
  if (!barcode) return { found: false, source: 'OFF Regional Mirrors', barcode };

  // Try high-coverage mirrors in parallel (top 6 by user-contribution density)
  const priority = REGIONAL_MIRRORS.filter(m => ['ng','in','br','mx','id','za'].includes(m.code));

  const tasks = priority.map(async (mirror) => {
    const url = `https://${mirror.code}.openfoodfacts.org/api/v2/product/${barcode}.json`;
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
      if (!name && !brand) continue;
      return {
        found: true,
        source: 'OFF Regional Mirrors',
        barcode,
        name,
        brand,
        country: product.countries || mirror.name,
        countryCode: mirror.code.toUpperCase(),
        region: mirror.region,
        category: product.categories || null,
        imageUrl: product.image_url || product.image_front_url || null,
        ingredients: product.ingredients_text || null,
        nutritionGrade: product.nutrition_grades || null,
        matchedMirror: `${mirror.code}.openfoodfacts.org`,
      };
    }
  }

  return { found: false, source: 'OFF Regional Mirrors', barcode };
}

module.exports = { lookupByBarcode, REGIONAL_MIRRORS };
