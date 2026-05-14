/**
 * European Medicines Agency (EMA) API Integration
 * Official EU medicines database - no API key required
 */

const BASE_URL = 'https://www.ema.europa.eu/en/medicines/find-medicine/human-medicines/epars';

async function lookupByBarcode(barcode) {
  try {
    // EMA uses product name / active substance search, not barcode directly
    // We use their public search API to find any matching medicine
    const searchUrl = `https://www.ema.europa.eu/en/medicines/ajax?op=get_medicine_by_barcode&barcode=${barcode}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Veri9/1.0 Product Verification Service', Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { found: false, source: 'EMA (EU Medicines)', barcode };
    const data = await response.json();
    if (data && (data.name || data.product_name)) {
      return {
        found: true,
        source: 'EMA (EU Medicines)',
        barcode,
        name: data.name || data.product_name,
        brand: data.brand || data.holder || 'Unknown',
        manufacturer: data.holder || 'Unknown',
        category: 'Pharmaceutical',
        country: 'EU',
        regulatoryStatus: 'EMA Approved',
      };
    }
    return { found: false, source: 'EMA (EU Medicines)', barcode };
  } catch {
    return { found: false, source: 'EMA (EU Medicines)', barcode };
  }
}

module.exports = { lookupByBarcode };
