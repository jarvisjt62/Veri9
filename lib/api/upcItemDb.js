/**
 * UPCitemdb API Integration
 * Free tier: 100 lookups/day, no API key required for trial
 * Covers 150M+ products with full product details
 */

const { safeFetchJson } = require('./safeFetch');

const BASE_URL = 'https://api.upcitemdb.com/prod/trial';

/**
 * Lookup product by UPC/EAN barcode
 * @param {string} barcode
 * @returns {object} Product data or not-found object
 */
async function lookupByBarcode(barcode) {
  const url = `${BASE_URL}/lookup?upc=${encodeURIComponent(barcode)}`;
  const data = await safeFetchJson(url, { timeoutMs: 7000, retries: 1 });

  if (!data) return { found: false, source: 'UPCitemdb', barcode };

  if (data.code === 'OK' && data.items && data.items.length > 0) {
    const item = data.items[0];
    return {
      found: true,
      source: 'UPCitemdb',
      barcode,
      name: item.title || 'Unknown',
      brand: item.brand || 'Unknown',
      manufacturer: item.manufacturer || item.brand || 'Unknown',
      category: item.category ? [item.category] : [],
      description: item.description || null,
      color: item.color || null,
      size: item.size || null,
      weight: item.weight || null,
      dimension: item.dimension || null,
      image: (item.images && item.images.length > 0) ? item.images[0] : null,
      lowestPrice: item.lowest_recorded_price || null,
      highestPrice: item.highest_recorded_price || null,
      currency: 'USD',
      upc: item.upc || barcode,
      ean: item.ean || null,
      asin: item.asin || null,
      elid: item.elid || null,
      offers: item.offers ? item.offers.slice(0, 3).map(o => ({
        merchant: o.merchant,
        price: o.price,
        link: o.link,
      })) : [],
    };
  }

  return { found: false, source: 'UPCitemdb', barcode };
}

/**
 * Search products by keyword
 * @param {string} query
 * @returns {array} Array of products
 */
async function searchByName(query) {
  const url = `${BASE_URL}/search?s=${encodeURIComponent(query)}`;
  const data = await safeFetchJson(url, { timeoutMs: 7000, retries: 1 });
  if (!data || data.code !== 'OK' || !Array.isArray(data.items)) return [];

  return data.items.map(item => ({
    name: item.title || 'Unknown',
    brand: item.brand || 'Unknown',
    barcode: item.upc || null,
    image: (item.images && item.images.length > 0) ? item.images[0] : null,
    category: item.category || null,
  }));
}

module.exports = { lookupByBarcode, searchByName };
