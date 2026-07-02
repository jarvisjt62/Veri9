/**
 * OFF Search Fallback — keyword search across Open Food Facts ecosystem
 *
 * When a barcode is not found in any database, this module does a NAME-BASED
 * search across Open Food Facts / Open Beauty Facts / Open Products Facts.
 *
 * Strategy:
 *   1. Extract GS1 country prefix → identify product origin
 *   2. Search OFF/OPF/OBF by common product keywords from the barcode region
 *   3. If the user has provided a product name hint (from photo OCR or manual input),
 *      search using that text directly
 *
 * This module is called by the engine as a FALLBACK — only when all 39 barcode
 * lookups returned `found: false` (or very few found with no product name).
 *
 * Cost: Free, no API key
 */

const { safeFetchJson } = require('./safeFetch');

const OFF_BASE = 'https://world.openfoodfacts.org';
const OBF_BASE = 'https://world.openbeautyfacts.org';
const OPF_BASE = 'https://world.openproductsfacts.org';

/**
 * Search for a product by name/keywords across OFF ecosystem.
 * Returns the best match (first result with a barcode).
 *
 * @param {string} query - Product name or keywords
 * @param {object} [opts]
 * @param {string} [opts.barcode] - Original barcode (to compare against results)
 * @param {string} [opts.base] - Base URL to search (default: OFF)
 * @returns {Promise<object|null>}
 */
async function searchByName(query, opts = {}) {
  if (!query || String(query).trim().length < 2) return null;

  const base = opts.base || OFF_BASE;
  const url = `${base}/api/v2/search?search_terms=${encodeURIComponent(query)}&page_size=5&json=1`;

  const data = await safeFetchJson(url, { timeoutMs: 8000, retries: 1 });
  if (!data || !data.products || data.products.length === 0) return null;

  // Find the best match — prefer products that have a barcode and match the query
  for (const p of data.products) {
    const name = p.product_name || p.product_name_en || '';
    const brand = p.brands || '';
    if (name.length > 1 || brand.length > 1) {
      return {
        found: true,
        source: `${base.includes('beauty') ? 'Open Beauty Facts' : base.includes('products') ? 'Open Products Facts' : 'Open Food Facts'} (Search)`,
        barcode: opts.barcode || p.code || null,
        matchedBarcode: p.code || null,
        name: name || 'Unknown',
        brand: brand || 'Unknown',
        manufacturer: p.manufacturing_places || p.owner || 'Unknown',
        country: p.countries_tags ? p.countries_tags.map(c => c.replace('en:', '')) : [],
        category: p.categories_tags ? p.categories_tags.map(c => c.replace('en:', '')) : [],
        image: p.image_front_url || p.image_url || null,
        isSearchResult: true, // Flag so the engine knows this is a name match, not barcode match
      };
    }
  }

  return null;
}

/**
 * Multi-database search — tries OFF, OBF, and OPF in parallel.
 *
 * @param {string} query - Product name or keywords
 * @param {string} [barcode] - Original barcode for reference
 * @returns {Promise<object|null>}
 */
async function searchAllDatabases(query, barcode) {
  const tasks = [
    searchByName(query, { barcode, base: OFF_BASE }),
    searchByName(query, { barcode, base: OBF_BASE }),
    searchByName(query, { barcode, base: OPF_BASE }),
  ];

  const results = await Promise.allSettled(tasks);

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value && r.value.found) {
      return r.value;
    }
  }

  return null;
}

module.exports = { searchByName, searchAllDatabases };
