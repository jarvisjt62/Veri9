/**
 * Barcode Spider API Integration
 * https://www.barcodespider.com/api/docs
 *
 * Auth: "token" header  (NOT Bearer)
 * Free tier: 100 lookups / day
 *
 * Endpoint: GET https://api.barcodespider.com/v1/lookup?upc=<BARCODE>
 *
 * Set BARCODE_SPIDER_TOKEN in your environment (.env.local / Vercel).
 * If the env var is missing, the module returns { found: false } immediately
 * so it never blocks verification.
 */

const BASE_URL = 'https://api.barcodespider.com/v1/lookup';
const SOURCE   = 'Barcode Spider';
const TIMEOUT  = 6000; // ms — slightly generous to avoid false misses

/**
 * Look up a UPC/EAN barcode via Barcode Spider.
 *
 * @param {string} barcode
 * @returns {Promise<object>}  Normalised product record or { found: false }
 */
async function lookupByBarcode(barcode) {
  const token = process.env.BARCODE_SPIDER_TOKEN;

  // Skip silently if no key is configured (dev / CI environments)
  if (!token) {
    return { found: false, source: SOURCE, barcode, skipped: true };
  }

  try {
    const url      = `${BASE_URL}?upc=${encodeURIComponent(barcode)}`;
    const response = await fetch(url, {
      headers: {
        'token'      : token,
        'User-Agent' : 'Veri9/1.0 Product Verification Service',
        'Accept'     : 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT),
    });

    // 401 / 403 → bad token, 404 → not found — all treated as "not found"
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('[BarcodeSpider] Auth failed – check BARCODE_SPIDER_TOKEN');
      }
      return { found: false, source: SOURCE, barcode };
    }

    const raw = await response.json();

    /*
     * Barcode Spider response shape (as of v1):
     * {
     *   "item_response": {
     *     "code"   : "200",
     *     "status" : "The request was successful.",
     *     "message": "Item Found"
     *   },
     *   "item_attributes": {
     *     "title"       : "Product Name",
     *     "upc"         : "012345678901",
     *     "ean"         : "0012345678901",
     *     "parent_category": "Grocery & Gourmet Food",
     *     "category"    : "Condiments",
     *     "brand"       : "Heinz",
     *     "manufacturer": "H.J. Heinz Company",
     *     "model"       : "",
     *     "mpn"         : "",
     *     "description" : "...",
     *     "color"       : "",
     *     "size"        : "",
     *     "weight"      : "",
     *     "image"       : "https://...",
     *     "is_adult"    : "0"
     *   },
     *   "Stores": [{ "store_name": "...", "store_price": "...", ... }]
     * }
     */

    const status = raw?.item_response?.code;
    const attr   = raw?.item_attributes;

    // code "200" = found; "404" or missing = not found
    if (!attr || status !== '200') {
      return { found: false, source: SOURCE, barcode };
    }

    /* Build normalised record */
    const stores = Array.isArray(raw.Stores)
      ? raw.Stores.slice(0, 5).map(s => ({
          merchant : s.store_name  || '',
          price    : s.store_price || '',
          link     : s.store_url   || '',
        }))
      : [];

    return {
      found        : true,
      source       : SOURCE,
      barcode,
      name         : attr.title        || 'Unknown',
      brand        : attr.brand        || 'Unknown',
      manufacturer : attr.manufacturer || attr.brand || 'Unknown',
      category     : attr.parent_category || attr.category || null,
      subCategory  : attr.category     || null,
      description  : attr.description  || null,
      image        : attr.image        || null,
      upc          : attr.upc          || barcode,
      ean          : attr.ean          || null,
      model        : attr.model        || null,
      size         : attr.size         || null,
      weight       : attr.weight       || null,
      color        : attr.color        || null,
      isAdult      : attr.is_adult === '1',
      stores,
    };
  } catch (err) {
    // Network / timeout errors — treat as not found, never crash the engine
    if (err?.name !== 'TimeoutError') {
      console.warn('[BarcodeSpider] Lookup error:', err?.message);
    }
    return { found: false, source: SOURCE, barcode };
  }
}

module.exports = { lookupByBarcode };
