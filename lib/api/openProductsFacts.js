/**
 * Open Products Facts API Integration
 *
 * Sister project to Open Food Facts, dedicated to NON-FOOD consumer goods
 * (stationery, household, electronics accessories, hardware, garden, etc.)
 *
 * Free, open-source, no API key.
 * Same JSON schema as Open Food Facts.
 *
 * Closes a major coverage gap: products like Tide, Listerine, iPhone Cases
 * which today return INSUFFICIENT_DATA because they're not food/beauty.
 *
 * Docs: https://world.openproductsfacts.org/data
 * Endpoint: https://world.openproductsfacts.org/api/v2/product/{barcode}.json
 */

const { safeFetchJson } = require('./safeFetch');

const BASE_URL = 'https://world.openproductsfacts.org/api/v2';

async function lookupByBarcode(barcode) {
  const url = `${BASE_URL}/product/${barcode}.json`;
  const data = await safeFetchJson(url, { timeoutMs: 8000, retries: 1 });

  if (!data) return { found: false, source: 'Open Products Facts', barcode };

  if (data.status === 1 && data.product) {
    const product = data.product;
    const name = product.product_name || product.product_name_en || product.generic_name || 'Unknown';
    const brand = product.brands || 'Unknown';

    // Defensive: skip placeholder / single-character entries that pollute the DB
    if (!name || name === 'Unknown' || String(name).trim().length < 2) {
      // We still report 'found' if there's at least a brand or category — the
      // engine's "rich source" check will fall back gracefully.
      if (!brand || brand === 'Unknown') {
        return { found: false, source: 'Open Products Facts', barcode };
      }
    }

    return {
      found: true,
      source: 'Open Products Facts',
      barcode,
      name,
      brand,
      manufacturer: product.manufacturing_places || product.owner || 'Unknown',
      country: product.countries_tags ? product.countries_tags.map(c => c.replace('en:', '')) : [],
      category: product.categories_tags ? product.categories_tags.map(c => c.replace('en:', '')) : [],
      image: product.image_front_url || product.image_url || null,
      quantity: product.quantity || null,
      packaging: product.packaging || null,
      labels: product.labels_tags ? product.labels_tags.map(l => l.replace('en:', '')) : [],
      lastModified: product.last_modified_t ? new Date(product.last_modified_t * 1000).toISOString() : null,
      rawData: {
        id: product._id,
        code: product.code,
        creator: product.creator,
      },
    };
  }

  return { found: false, source: 'Open Products Facts', barcode };
}

module.exports = { lookupByBarcode };
