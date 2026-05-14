/**
 * Open Food Facts API Integration
 * Free, open-source database with 3M+ food/drink/cosmetic products
 * No API key required
 */

const { safeFetchJson } = require('./safeFetch');

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';

/**
 * Search for a product by barcode
 * @param {string} barcode - The product barcode (EAN/UPC)
 * @returns {object} Product data or null
 */
async function lookupByBarcode(barcode) {
  const url = `${BASE_URL}/product/${barcode}.json`;
  const data = await safeFetchJson(url, { timeoutMs: 8000, retries: 1 });

  if (!data) return { found: false, source: 'Open Food Facts', barcode };

  if (data.status === 1 && data.product) {
    const product = data.product;
    return {
      found: true,
      source: 'Open Food Facts',
      barcode: barcode,
      name: product.product_name || product.product_name_en || 'Unknown',
      brand: product.brands || 'Unknown',
      manufacturer: product.manufacturing_places || product.owner || 'Unknown',
      country: product.countries_tags ? product.countries_tags.map(c => c.replace('en:', '')) : [],
      category: product.categories_tags ? product.categories_tags.map(c => c.replace('en:', '')) : [],
      image: product.image_front_url || product.image_url || null,
      ingredients: product.ingredients_text || null,
      nutritionGrade: product.nutrition_grades || null,
      novaGroup: product.nova_group || null,
      quantity: product.quantity || null,
      packaging: product.packaging || null,
      labels: product.labels_tags ? product.labels_tags.map(l => l.replace('en:', '')) : [],
      lastModified: product.last_modified_t ? new Date(product.last_modified_t * 1000).toISOString() : null,
      rawData: {
        id: product._id,
        code: product.code,
        creator: product.creator,
        createdDate: product.created_t ? new Date(product.created_t * 1000).toISOString() : null,
      },
    };
  }

  return { found: false, source: 'Open Food Facts', barcode };
}

/**
 * Search for products by name
 * @param {string} query - Search query
 * @param {number} pageSize - Number of results (default 20)
 * @returns {array} Array of products
 */
async function searchByName(query, pageSize = 20) {
  const url = `${BASE_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=${pageSize}&json=1`;
  const data = await safeFetchJson(url, { timeoutMs: 8000, retries: 1 });
  if (!data || !Array.isArray(data.products)) return [];

  return data.products.map(p => ({
    name: p.product_name || p.product_name_en || 'Unknown',
    brand: p.brands || 'Unknown',
    barcode: p.code || null,
    image: p.image_front_url || p.image_url || null,
    nutritionGrade: p.nutrition_grades || null,
  }));
}

module.exports = { lookupByBarcode, searchByName };
