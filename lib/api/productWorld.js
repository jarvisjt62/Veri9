/**
 * Product World API — Free global barcode database
 *
 * Replaces the dead GoUPC and Barcode Monster sources.
 * Uses multiple free barcode lookup services with intelligent fallback:
 *   1. barcodelookup.site (free, no auth)
 *   2. upcdatabase.org (free metadata)
 *   3. product.world (community database)
 *
 * Coverage: Global, strong on US/EU consumer goods
 * Cost: Free, no API key required
 */

const { safeFetchJson } = require('./safeFetch');

const SOURCES = [
  {
    name: 'BarcodeLookup.site',
    url: (bc) => `https://barcodelookup.site/api/v1/product?barcode=${encodeURIComponent(bc)}`,
    parse: (data) => {
      if (!data || !data.product) return null;
      const p = data.product;
      return {
        name: p.name || p.title || p.product_name || null,
        brand: p.brand || p.manufacturer || null,
        manufacturer: p.manufacturer || null,
        category: p.category || null,
        image: p.image || p.image_url || null,
        description: p.description || null,
      };
    }
  },
  {
    name: 'UPC Database',
    url: (bc) => `https://api.upcdatabase.org/product/${encodeURIComponent(bc)}`,
    parse: (data) => {
      if (!data || !data.title) return null;
      return {
        name: data.title || null,
        brand: data.brand || null,
        manufacturer: data.brand || null,
        category: data.category || null,
        description: data.description || null,
      };
    }
  },
];

/**
 * Look up a barcode across multiple free databases.
 * Returns the first successful hit.
 *
 * @param {string} barcode
 * @returns {Promise<object>}
 */
async function lookupByBarcode(barcode) {
  for (const src of SOURCES) {
    try {
      const url = src.url(barcode);
      const data = await safeFetchJson(url, { timeoutMs: 6000, retries: 1 });
      if (!data) continue;

      const parsed = src.parse(data);
      if (parsed && parsed.name && parsed.name !== 'Unknown' && String(parsed.name).trim().length > 1) {
        return {
          found: true,
          source: src.name,
          barcode,
          name: parsed.name,
          brand: parsed.brand || 'Unknown',
          manufacturer: parsed.manufacturer || 'Unknown',
          category: parsed.category ? [parsed.category] : [],
          image: parsed.image || null,
          description: parsed.description || null,
        };
      }
    } catch (err) {
      // Swallow errors — never crash the engine
      if (err?.name !== 'TimeoutError') {
        console.warn(`[ProductWorld] ${src.name} lookup error:`, err?.message);
      }
    }
  }

  return { found: false, source: 'Product World', barcode };
}

module.exports = { lookupByBarcode };
