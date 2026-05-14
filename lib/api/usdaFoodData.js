/**
 * USDA FoodData Central API
 * Free API for nutritional and food product data
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 * Free API key: https://fdc.nal.usda.gov/api-key-signup.html
 */

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
// Uses demo key (limited) — replace NEXT_PUBLIC_USDA_API_KEY in .env.local for higher rate limits
const API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';

async function lookupByBarcode(barcode) {
  try {
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(barcode)}&api_key=${API_KEY}&pageSize=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { found: false, source: 'USDA FoodData Central', barcode };
    const data = await res.json();
    if (!data.foods || data.foods.length === 0) {
      return { found: false, source: 'USDA FoodData Central', barcode };
    }
    // Look for exact GTIN/UPC match first
    const exact = data.foods.find(f => f.gtinUpc === barcode || f.ndbNumber === barcode);
    const food = exact || data.foods[0];
    return {
      found: true,
      source: 'USDA FoodData Central',
      barcode,
      name: food.description,
      brand: food.brandOwner || food.brandName || 'Unknown',
      manufacturer: food.brandOwner || 'Unknown',
      category: food.foodCategory || 'Food',
      fdcId: food.fdcId,
      dataType: food.dataType,
      nutrients: food.foodNutrients ? food.foodNutrients.slice(0, 8).map(n => ({
        name: n.nutrientName,
        amount: n.value,
        unit: n.unitName,
      })) : [],
    };
  } catch {
    return { found: false, source: 'USDA FoodData Central', barcode };
  }
}

module.exports = { lookupByBarcode };
