/**
 * UPCitemdb API Integration
 * Free tier: 100 lookups/day, no API key required for trial
 * Covers 150M+ products with full product details
 */

const BASE_URL = 'https://api.upcitemdb.com/prod/trial';

/**
 * Lookup product by UPC/EAN barcode
 * @param {string} barcode
 * @returns {object} Product data or not-found object
 */
async function lookupByBarcode(barcode) {
  try {
    const url = `${BASE_URL}/lookup?upc=${encodeURIComponent(barcode)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Veri9/1.0 (product-verification)'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[UPCitemdb] Rate limit hit');
        return { found: false, source: 'UPCitemdb', barcode, rateLimited: true };
      }
      return { found: false, source: 'UPCitemdb', barcode };
    }

    const data = await response.json();

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
          link: o.link
        })) : []
      };
    }

    return { found: false, source: 'UPCitemdb', barcode };
  } catch (error) {
    console.error('[UPCitemdb] Lookup error:', error.message);
    return { found: false, source: 'UPCitemdb', barcode, error: error.message };
  }
}

/**
 * Search products by keyword
 * @param {string} query
 * @returns {array} Array of products
 */
async function searchByName(query) {
  try {
    const url = `${BASE_URL}/search?s=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Veri9/1.0 (product-verification)'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (data.code === 'OK' && data.items && data.items.length > 0) {
      return data.items.map(item => ({
        name: item.title || 'Unknown',
        brand: item.brand || 'Unknown',
        barcode: item.upc || null,
        image: (item.images && item.images.length > 0) ? item.images[0] : null,
        category: item.category || null
      }));
    }

    return [];
  } catch (error) {
    console.error('[UPCitemdb] Search error:', error.message);
    return [];
  }
}

module.exports = { lookupByBarcode, searchByName };