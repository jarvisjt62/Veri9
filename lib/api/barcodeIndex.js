/**
 * Buyk / BarcodeIndex.com Lookup
 * Public barcode database — no auth required
 */

async function lookupByBarcode(barcode) {
  try {
    // Using barcodeindex public API
    const url = `https://www.barcodeindex.com/api/product/${barcode}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Veri9/1.0 Product Verification',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { found: false, source: 'Barcode Index', barcode };
    const data = await response.json();

    if (data && data.product && data.product.name) {
      return {
        found: true,
        source: 'Barcode Index',
        barcode,
        name: data.product.name,
        brand: data.product.brand || 'Unknown',
        category: data.product.category || 'Product',
        image: data.product.image_url || null,
        country: data.product.country || null,
      };
    }
    return { found: false, source: 'Barcode Index', barcode };
  } catch {
    return { found: false, source: 'Barcode Index', barcode };
  }
}

module.exports = { lookupByBarcode };
