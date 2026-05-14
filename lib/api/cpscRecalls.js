/**
 * CPSC (Consumer Product Safety Commission) Recall Database
 * US product recalls - no API key required
 * https://www.cpsc.gov/Recalls
 */

const BASE_URL = 'https://www.saferproducts.gov/RestWebServices/Recall';

async function lookupByBarcode(barcode) {
  try {
    // CPSC uses product name/UPC search
    const url = `${BASE_URL}?format=json&UPC=${barcode}&limit=5`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Veri9/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return { found: false, source: 'CPSC Recalls (US)', barcode, recall: false };

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const recall = data[0];
      return {
        found: true,
        source: 'CPSC Recalls (US)',
        barcode,
        name: recall.ProductName || recall.Name || 'Recalled Product',
        brand: recall.ManufacturerNames?.[0] || recall.Manufacturer || 'Unknown',
        recall: true,
        recallReason: recall.Hazards?.[0]?.Name || recall.Description || 'Safety recall',
        recallDate: recall.RecallDate || null,
        recallNumber: recall.RecallNumber || null,
        category: recall.ProductTypes?.[0]?.Name || 'Consumer Product',
        country: 'United States',
      };
    }

    return { found: false, source: 'CPSC Recalls (US)', barcode, recall: false };
  } catch {
    return { found: false, source: 'CPSC Recalls (US)', barcode, recall: false };
  }
}

module.exports = { lookupByBarcode };
