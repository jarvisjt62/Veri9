/**
 * Digit-Eyes World Product DB
 * International barcode lookup - free tier available
 */

const BASE_URL = 'https://www.digit-eyes.com/gtin/aHR0cHM6Ly93d3cuZGlnaXQtZXllcy5jb20vY2dpLWJpbi9zZWFyY2gudXBj';

async function lookupByBarcode(barcode) {
  try {
    // Digit-Eyes GTIN lookup endpoint
    const url = `https://digit-eyes.com/gtin/${barcode}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Veri9/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { found: false, source: 'Digit-Eyes World DB', barcode };
    const data = await response.json();
    if (data && data.return_code === '000' && data.description) {
      return {
        found: true,
        source: 'Digit-Eyes World DB',
        barcode,
        name: data.description || 'Unknown',
        brand: data.upcData?.brand || 'Unknown',
        category: data.upcData?.category || 'Product',
        country: data.upcData?.country || null,
        image: data.image || null,
      };
    }
    return { found: false, source: 'Digit-Eyes World DB', barcode };
  } catch {
    return { found: false, source: 'Digit-Eyes World DB', barcode };
  }
}

module.exports = { lookupByBarcode };
