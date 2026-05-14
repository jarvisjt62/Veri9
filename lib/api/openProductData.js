/**
 * Open Product Data / Buycott-style community DB
 * Uses the Open Product Data API (theodi.org based)
 */

async function lookupByBarcode(barcode) {
  try {
    // Folksonomy Engine - community-contributed product attributes
    const url = `https://api.folksonomy.openfoodfacts.org/product/${barcode}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Veri9/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return { found: false, source: 'Open Product Folksonomy', barcode };
    const data = await response.json();
    if (data && Array.isArray(data) && data.length > 0) {
      const props = {};
      data.forEach(item => { props[item.k] = item.v; });
      return {
        found: true,
        source: 'Open Product Folksonomy',
        barcode,
        name: props['product_name'] || props['name'] || 'Community Product',
        brand: props['brand'] || props['brands'] || 'Unknown',
        category: props['category'] || props['categories'] || null,
        attributes: Object.keys(props).length,
      };
    }
    return { found: false, source: 'Open Product Folksonomy', barcode };
  } catch {
    return { found: false, source: 'Open Product Folksonomy', barcode };
  }
}

module.exports = { lookupByBarcode };
