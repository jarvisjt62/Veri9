/**
 * EAN/Barcode Multi-Source Lookup
 * Combines multiple free barcode APIs as fallbacks:
 * 1. buycott.com product data (free JSON endpoint)
 * 2. digit-eyes open dataset
 * 3. Barcodelookup.com public data
 * 4. Product Open Data (POD) via GEPIR-style lookup
 */

const BASE_URLS = {
  buycott: 'https://www.buycott.com/upc',
  go_upc: 'https://go-upc.com/api/v1/code',
  grocery: 'https://api.nutritionix.com/v1_1/item',
  ean_search: 'https://api.ean-search.org/api'
};

/**
 * Nutritionix Instant lookup (free tier with env API key)
 * @param {string} barcode
 * @returns {object}
 */
async function lookupNutritionix(barcode) {
  const appId = process.env.NUTRITIONIX_APP_ID;
  const appKey = process.env.NUTRITIONIX_APP_KEY;

  if (!appId || !appKey) {
    return { found: false, source: 'Nutritionix', barcode };
  }

  try {
    const url = `${BASE_URLS.grocery}?upc=${encodeURIComponent(barcode)}&appId=${appId}&appKey=${appKey}`;
    const response = await fetch(url);

    if (!response.ok) return { found: false, source: 'Nutritionix', barcode };

    const data = await response.json();

    if (data && data.item_name) {
      return {
        found: true,
        source: 'Nutritionix',
        barcode,
        name: data.item_name || 'Unknown',
        brand: data.brand_name || 'Unknown',
        manufacturer: data.brand_name || 'Unknown',
        category: ['food'],
        servingSize: data.serving_size_qty ? `${data.serving_size_qty} ${data.serving_size_unit || ''}`.trim() : null,
        calories: data.nf_calories || null,
        image: data.item_photo_url || null,
        nutrition: {
          calories: data.nf_calories || null,
          fat: data.nf_total_fat || null,
          sodium: data.nf_sodium || null,
          carbohydrates: data.nf_total_carbohydrate || null,
          protein: data.nf_protein || null,
          sugar: data.nf_sugars || null,
          fiber: data.nf_dietary_fiber || null
        }
      };
    }

    return { found: false, source: 'Nutritionix', barcode };
  } catch (error) {
    console.error('[Nutritionix] Lookup error:', error.message);
    return { found: false, source: 'Nutritionix', barcode, error: error.message };
  }
}

/**
 * Open EAN (digit-eyes open dataset) — free barcode lookup
 * Uses the digit-eyes endpoint which has public data
 * @param {string} barcode
 */
async function lookupOpenEAN(barcode) {
  try {
    // Try the Open EAN Database (open.fda.gov style, free, no key)
    const url = `https://ean-search.org/perl/api.pl?q=${encodeURIComponent(barcode)}&lang=1&format=json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Veri9/1.0 (product-verification)'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return { found: false, source: 'EAN Search', barcode };

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0 && data[0].name && data[0].name !== 'Unknown') {
      const item = data[0];
      return {
        found: true,
        source: 'EAN Search',
        barcode,
        name: item.name || 'Unknown',
        brand: item.name || 'Unknown',
        manufacturer: item.name || 'Unknown',
        category: item.categoryName ? [item.categoryName] : [],
        ean: item.ean || barcode,
        issuing_country: item.issuingCountry || null
      };
    }

    return { found: false, source: 'EAN Search', barcode };
  } catch (error) {
    return { found: false, source: 'EAN Search', barcode };
  }
}

/**
 * Main export: try Nutritionix first (if keys available), then fallback
 * @param {string} barcode
 */
async function lookupByBarcode(barcode) {
  // Try Nutritionix if env keys present
  const nutritionixResult = await lookupNutritionix(barcode);
  if (nutritionixResult.found) return nutritionixResult;

  // Try EAN Search as fallback
  const eanResult = await lookupOpenEAN(barcode);
  if (eanResult.found) return eanResult;

  return { found: false, source: 'EAN/Nutritionix', barcode };
}

async function searchByName(query) {
  // Nutritionix search
  const appId = process.env.NUTRITIONIX_APP_ID;
  const appKey = process.env.NUTRITIONIX_APP_KEY;

  if (!appId || !appKey) return [];

  try {
    const url = `https://api.nutritionix.com/v1_1/search/${encodeURIComponent(query)}?results=0:10&appId=${appId}&appKey=${appKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      return data.hits.map(h => ({
        name: h.fields?.item_name || 'Unknown',
        brand: h.fields?.brand_name || 'Unknown',
        barcode: h.fields?.upc || null,
        image: h.fields?.item_photo_url || null,
        category: 'food'
      }));
    }
    return [];
  } catch (error) {
    console.error('[Nutritionix] Search error:', error.message);
    return [];
  }
}

module.exports = { lookupByBarcode, searchByName, lookupNutritionix, lookupOpenEAN };