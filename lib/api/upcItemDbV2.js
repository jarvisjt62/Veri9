/**
 * UPCitemdb Replacement — UpcItemDb v2 + Fallback
 *
 * The original UPCitemdb "trial" endpoint (api.upcitemdb.com/prod/trial)
 * has become unreliable — returns TOO_FAST on most requests and 400 on EAN-13.
 *
 * This module tries the v2 endpoint first, then falls back to the original.
 * Both are free, no API key.
 */

const { safeFetchJson } = require('./safeFetch');

const V2_URL = 'https://api.upcitemdb.com/prod/v2/lookup';
const TRIAL_URL = 'https://api.upcitemdb.com/prod/trial/lookup';

/**
 * Lookup a product by UPC/EAN barcode.
 * Tries v2 endpoint first (better EAN-13 support), then trial endpoint.
 *
 * @param {string} barcode
 * @returns {Promise<object>}
 */
async function lookupByBarcode(barcode) {
  // Try v2 first — handles EAN-13 natively
  const v2Result = await tryLookup(V2_URL, barcode);
  if (v2Result.found) return v2Result;

  // Fall back to trial — may work for UPC-A (12-digit) barcodes
  const trialResult = await tryLookup(TRIAL_URL, barcode);
  if (trialResult.found) return trialResult;

  // If v2 returned TOO_FAST but trial returned TOO_FAST too,
  // return a clear "rate limited" result so the engine knows it's not "not found"
  if (v2Result.rateLimited || trialResult.rateLimited) {
    return { found: false, source: 'UPCitemdb', barcode, rateLimited: true };
  }

  return { found: false, source: 'UPCitemdb', barcode };
}

async function tryLookup(baseUrl, barcode) {
  const url = `${baseUrl}?upc=${encodeURIComponent(barcode)}`;
  const data = await safeFetchJson(url, { timeoutMs: 7000, retries: 1 });

  if (!data) return { found: false, source: 'UPCitemdb', barcode, rateLimited: false };

  // TOO_FAST = rate limited, not "not found"
  if (data.code === 'TOO_FAST') {
    return { found: false, source: 'UPCitemdb', barcode, rateLimited: true };
  }

  if (data.code === 'OK' && data.items && data.items.length > 0) {
    const item = data.items[0];
    return {
      found: true,
      source: 'UPCitemdb',
      barcode,
      name: item.title || 'Unknown',
      brand: item.brand || 'Unknown',
      manufacturer: item.manufacturer || item.brand || 'Unknown',
      category: item.category ? [item.category] : [],
      description: item.description || null,
      color: item.color || null,
      size: item.size || null,
      weight: item.weight || null,
      dimension: item.dimension || null,
      image: (item.images && item.images.length > 0) ? item.images[0] : null,
      lowestPrice: item.lowest_recorded_price || null,
      highestPrice: item.highest_recorded_price || null,
      currency: 'USD',
      upc: item.upc || barcode,
      ean: item.ean || null,
      asin: item.asin || null,
      offers: item.offers ? item.offers.slice(0, 3).map(o => ({
        merchant: o.merchant,
        price: o.price,
        link: o.link,
      })) : [],
    };
  }

  return { found: false, source: 'UPCitemdb', barcode, rateLimited: false };
}

/**
 * Search products by keyword (uses v2 search).
 * @param {string} query
 * @returns {array}
 */
async function searchByName(query) {
  const url = `${V2_URL}?s=${encodeURIComponent(query)}&type=product`;
  const data = await safeFetchJson(url, { timeoutMs: 7000, retries: 1 });
  if (!data || data.code !== 'OK' || !Array.isArray(data.items)) return [];

  return data.items.map(item => ({
    name: item.title || 'Unknown',
    brand: item.brand || 'Unknown',
    barcode: item.upc || null,
    image: (item.images && item.images.length > 0) ? item.images[0] : null,
    category: item.category || null,
  }));
}

module.exports = { lookupByBarcode, searchByName };
