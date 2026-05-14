/**
 * Open Prices API (Tagalog) - Prices and product catalog
 * Free, open dataset from Open Food Facts team
 * https://prices.openfoodfacts.org
 */

const BASE_URL = 'https://prices.openfoodfacts.org/api/v1';

async function lookupByBarcode(barcode) {
  try {
    const url = `${BASE_URL}/products?code=${barcode}&page_size=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Veri9/1.0 Product Verification', Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { found: false, source: 'Open Prices DB', barcode };
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        found: true,
        source: 'Open Prices DB',
        barcode,
        name: item.product_name || 'Unknown',
        brand: item.product_brand || 'Unknown',
        country: item.product_country || null,
        priceCount: item.unique_scans_n || 0,
      };
    }
    return { found: false, source: 'Open Prices DB', barcode };
  } catch {
    return { found: false, source: 'Open Prices DB', barcode };
  }
}

module.exports = { lookupByBarcode };
