/**
 * Buycott / Go-UPC (World Product DB) Integration
 * Global barcode / product lookup — no auth required
 */

const BASE_URL = 'https://go-upc.com/api/v1/code';

async function lookupByBarcode(barcode) {
  try {
    const url = `${BASE_URL}/${barcode}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Veri9/1.0 Product Verification Service',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { found: false, source: 'Go-UPC Global DB', barcode };

    const data = await response.json();

    if (data && data.product) {
      const p = data.product;
      return {
        found: true,
        source: 'Go-UPC Global DB',
        barcode,
        name: p.name || 'Unknown',
        brand: p.brand || 'Unknown',
        category: p.category || 'Product',
        image: p.imageUrl || null,
        country: p.region || null,
        description: p.description || null,
      };
    }
    return { found: false, source: 'Go-UPC Global DB', barcode };
  } catch {
    return { found: false, source: 'Go-UPC Global DB', barcode };
  }
}

module.exports = { lookupByBarcode };
