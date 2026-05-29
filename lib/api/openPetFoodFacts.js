/**
 * Open Pet Food Facts API Integration
 *
 * Sister project to Open Food Facts, dedicated to PET food, treats, and
 * supplies. Free, open-source, no API key.
 *
 * Same JSON schema as Open Food Facts.
 *
 * Docs: https://world.openpetfoodfacts.org/data
 * Endpoint: https://world.openpetfoodfacts.org/api/v2/product/{barcode}.json
 */

const { safeFetchJson } = require('./safeFetch');

const BASE_URL = 'https://world.openpetfoodfacts.org/api/v2';

async function lookupByBarcode(barcode) {
  const url = `${BASE_URL}/product/${barcode}.json`;
  const data = await safeFetchJson(url, { timeoutMs: 8000, retries: 1 });

  if (!data) return { found: false, source: 'Open Pet Food Facts', barcode };

  if (data.status === 1 && data.product) {
    const product = data.product;
    const name = product.product_name || product.product_name_en || product.generic_name || 'Unknown';
    const brand = product.brands || 'Unknown';

    if ((!name || name === 'Unknown') && (!brand || brand === 'Unknown')) {
      return { found: false, source: 'Open Pet Food Facts', barcode };
    }

    return {
      found: true,
      source: 'Open Pet Food Facts',
      barcode,
      name,
      brand,
      manufacturer: product.manufacturing_places || product.owner || 'Unknown',
      country: product.countries_tags ? product.countries_tags.map(c => c.replace('en:', '')) : [],
      category: product.categories_tags ? product.categories_tags.map(c => c.replace('en:', '')) : [],
      image: product.image_front_url || product.image_url || null,
      ingredients: product.ingredients_text || null,
      quantity: product.quantity || null,
      petType: (() => {
        // Detect pet type from categories/labels
        const tags = [
          ...(product.categories_tags || []),
          ...(product.labels_tags || []),
        ].join(' ').toLowerCase();
        if (/dog|canine|chien/.test(tags)) return 'dog';
        if (/cat|feline|chat/.test(tags)) return 'cat';
        if (/bird|oiseau|parrot/.test(tags)) return 'bird';
        if (/fish|aquarium|poisson/.test(tags)) return 'fish';
        if (/rabbit|lapin/.test(tags)) return 'rabbit';
        return null;
      })(),
      labels: product.labels_tags ? product.labels_tags.map(l => l.replace('en:', '')) : [],
      lastModified: product.last_modified_t ? new Date(product.last_modified_t * 1000).toISOString() : null,
      rawData: {
        id: product._id,
        code: product.code,
        creator: product.creator,
      },
    };
  }

  return { found: false, source: 'Open Pet Food Facts', barcode };
}

module.exports = { lookupByBarcode };
