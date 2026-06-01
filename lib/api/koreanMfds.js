/**
 * Korean MFDS (Ministry of Food and Drug Safety) open API.
 *
 * Free, no-key sample mode (key-free demo on small ranges per service).
 * For production volume, swap `sample` for a registered key.
 *
 * Coverage:
 *   - I2715: Self-reported imported food products with barcode (BARCD_CTN field)
 *   - I0490: Korean food product recalls (helpful for recall cross-check)
 *
 * Docs: https://www.foodsafetykorea.go.kr/api/openApiInfo.do
 *
 * Region: Asia / Korea
 * Cost: free
 */

const { safeFetchJson } = require('./safeFetch');

const KEY = process.env.MFDS_KEY || 'sample'; // 'sample' = key-free demo mode
const BASE = `https://openapi.foodsafetykorea.go.kr/api/${KEY}`;

// Cache the product index once per process to avoid hammering the API on every scan
let _productIndex = null;
let _productIndexAt = 0;
const INDEX_TTL_MS = 6 * 60 * 60 * 1000; // 6h

async function _fetchProductPage(start, end) {
  // I2715 — imported food self-declaration list (has BARCD_CTN barcode field)
  const url = `${BASE}/I2715/json/${start}/${end}/`;
  const json = await safeFetchJson(url, {
    timeoutMs: 8000,
    headers: { 'User-Agent': 'Veri9/1.0 (verification-engine)' },
  });
  if (json && json.I2715 && Array.isArray(json.I2715.row)) return json.I2715.row;
  return [];
}

async function _buildProductIndex() {
  // Sample mode caps at small ranges, but we can pull a couple of pages
  // and build an in-memory map of barcode -> product. For full coverage,
  // production should fetch in larger chunks with a registered key.
  const rows = [
    ...(await _fetchProductPage(1, 1000)),
    ...(await _fetchProductPage(1001, 2000)),
    ...(await _fetchProductPage(2001, 3000)),
  ];
  const map = new Map();
  for (const r of rows) {
    const bc = (r.BARCD_CTN || '').toString().trim();
    if (!bc) continue;
    if (!map.has(bc)) map.set(bc, r);
  }
  return map;
}

async function _getProductIndex() {
  const now = Date.now();
  if (_productIndex && now - _productIndexAt < INDEX_TTL_MS) return _productIndex;
  try {
    _productIndex = await _buildProductIndex();
    _productIndexAt = now;
    return _productIndex;
  } catch (e) {
    return new Map();
  }
}

/**
 * Look up a product in the Korean MFDS food import database by barcode.
 * @param {string} barcode
 * @returns {Promise<object>}
 */
async function lookupByBarcode(barcode) {
  if (!barcode) return { found: false, source: 'Korean MFDS', barcode };
  try {
    const index = await _getProductIndex();
    const row = index.get(String(barcode).trim());
    if (!row) return { found: false, source: 'Korean MFDS', barcode };
    return {
      found: true,
      source: 'Korean MFDS',
      barcode,
      name: row.PRDT_NM || null,
      manufacturer: row.MUFC_NM || null,
      country: row.MUFC_CNTRY_NM && row.MUFC_CNTRY_NM !== '없음' ? row.MUFC_CNTRY_NM : null,
      ingredients: row.INGR_NM_LST || null,
      registrationDate: row.STT_YMD || null,
      validUntil: row.END_YMD || null,
      imageUrl: row.IMAGE_URL || null,
      regulatoryRegion: 'KR',
      raw: row,
    };
  } catch (e) {
    return { found: false, source: 'Korean MFDS', barcode, error: e.message };
  }
}

module.exports = { lookupByBarcode };
