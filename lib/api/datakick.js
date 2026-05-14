/**
 * Datakick API Integration
 * Free, open product database for grocery and retail products
 * No API key required - community maintained
 * https://www.datakick.org/api
 */

const BASE_URL = 'https://www.datakick.org/api';

/**
 * Lookup product by GTIN/UPC/EAN barcode
 * @param {string} barcode
 * @returns {object} Product data or not-found object
 */
async function lookupByBarcode(barcode) {
  try {
    // Datakick uses 14-digit GTIN; pad with leading zeros if needed
    const gtin = barcode.padStart(14, '0');
    const url = `${BASE_URL}/items/${gtin}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Veri9/1.0 (product-verification)'
      }
    });

    if (response.status === 404) {
      return { found: false, source: 'Datakick', barcode };
    }

    if (!response.ok) {
      return { found: false, source: 'Datakick', barcode };
    }

    const item = await response.json();

    if (item && item.name) {
      const ingredients = item.ingredients || null;
      const allergens = item.allergens || null;

      return {
        found: true,
        source: 'Datakick',
        barcode,
        name: item.name || 'Unknown',
        brand: item.brand_name || 'Unknown',
        manufacturer: item.manufacturer || item.brand_name || 'Unknown',
        category: item.serving_size_unit ? ['food'] : ['retail'],
        description: item.description || null,
        size: item.size || null,
        servingSize: item.serving_size ? `${item.serving_size} ${item.serving_size_unit || ''}`.trim() : null,
        servingsPerContainer: item.servings_per_container || null,
        ingredients,
        allergens,
        image: item.images && item.images.length > 0
          ? `https://www.datakick.org${item.images[0].url}`
          : null,
        gtin: item.gtins ? item.gtins[0] : gtin,
        nutrition: item.nutrients ? {
          calories: item.nutrients.calories || null,
          fat: item.nutrients.fat_calories || null,
          sodium: item.nutrients.sodium || null,
          carbohydrates: item.nutrients.total_carbohydrate || null,
          protein: item.nutrients.protein || null
        } : null
      };
    }

    return { found: false, source: 'Datakick', barcode };
  } catch (error) {
    console.error('[Datakick] Lookup error:', error.message);
    return { found: false, source: 'Datakick', barcode, error: error.message };
  }
}

/**
 * Search products by name
 * @param {string} query
 * @returns {array} Array of products
 */
async function searchByName(query) {
  try {
    const url = `${BASE_URL}/items?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Veri9/1.0 (product-verification)'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.slice(0, 10).map(item => ({
        name: item.name || 'Unknown',
        brand: item.brand_name || 'Unknown',
        barcode: item.gtins ? item.gtins[0] : null,
        image: item.images && item.images.length > 0
          ? `https://www.datakick.org${item.images[0].url}`
          : null,
        category: 'retail'
      }));
    }

    return [];
  } catch (error) {
    console.error('[Datakick] Search error:', error.message);
    return [];
  }
}

module.exports = { lookupByBarcode, searchByName };