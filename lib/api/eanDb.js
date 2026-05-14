/**
 * EAN-DB API Integration
 * https://ean-db.com/docs
 *
 * Auth: Bearer JWT in Authorization header
 * Free tier: 250 credits on sign-up (404 responses do NOT consume a credit)
 * Endpoint: GET https://ean-db.com/api/v2/product/{barcode}
 *
 * Set EAN_DB_JWT in your environment (.env.local / Vercel).
 * If the env var is missing the module returns { found: false } immediately.
 *
 * Response shape:
 * {
 *   balance: 100,
 *   product: {
 *     barcode, barcodeDetails, titles, categories, manufacturer,
 *     relatedBrands, images, metadata
 *   }
 * }
 */

const BASE_URL = 'https://ean-db.com/api/v2/product';
const SOURCE   = 'EAN-DB';
const TIMEOUT  = 6000; // ms

/**
 * Look up a UPC / EAN / ISBN barcode via EAN-DB.
 *
 * @param {string} barcode
 * @returns {Promise<object>}  Normalised product record or { found: false }
 */
async function lookupByBarcode(barcode) {
  const jwt = process.env.EAN_DB_JWT;

  // Skip silently if no JWT configured
  if (!jwt) {
    return { found: false, source: SOURCE, barcode, skipped: true };
  }

  try {
    const url      = `${BASE_URL}/${encodeURIComponent(barcode)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization' : `Bearer ${jwt}`,
        'Accept'        : 'application/json',
        'User-Agent'    : 'Veri9/1.0 Product Verification Service',
      },
      signal: AbortSignal.timeout(TIMEOUT),
    });

    // 404 = product not found (doesn't cost a credit — safe to call freely)
    if (response.status === 404) {
      return { found: false, source: SOURCE, barcode };
    }

    // 403 = auth/balance issues
    if (response.status === 403) {
      let msg = 'Access denied';
      try {
        const errBody = await response.json();
        msg = errBody?.error?.description || msg;
      } catch (_) { /* ignore parse error */ }
      console.warn(`[EAN-DB] 403 — ${msg}`);
      return { found: false, source: SOURCE, barcode };
    }

    // 400 = invalid barcode format
    if (response.status === 400) {
      return { found: false, source: SOURCE, barcode };
    }

    if (!response.ok) {
      return { found: false, source: SOURCE, barcode };
    }

    const raw = await response.json();
    const p   = raw?.product;

    if (!p) {
      return { found: false, source: SOURCE, barcode };
    }

    /* ── Normalise fields ────────────────────────────────────────────── */

    // Prefer English title, fallback to first available language
    const title = p.titles?.en
      || (p.titles ? Object.values(p.titles)[0] : null)
      || null;

    // Manufacturer / brand
    const manufacturerName = p.manufacturer?.titles?.en
      || (p.manufacturer?.titles ? Object.values(p.manufacturer.titles)[0] : null)
      || null;

    // Related brands (distributors, collaborations, etc.)
    const relatedBrandNames = (p.relatedBrands || [])
      .map(b => b.titles?.en || (b.titles ? Object.values(b.titles)[0] : null))
      .filter(Boolean);

    // Categories (Google product taxonomy)
    const categories = (p.categories || [])
      .map(c => c.titles?.en || (c.titles ? Object.values(c.titles)[0] : null))
      .filter(Boolean);

    // Images — prefer isCatalog=true (professionally shot), largest first
    const images = (p.images || [])
      .sort((a, b) => {
        if (a.isCatalog && !b.isCatalog) return -1;
        if (!a.isCatalog && b.isCatalog) return 1;
        return (b.width || 0) - (a.width || 0);
      });
    const primaryImage = images[0]?.url || null;

    // GS1 / barcode details
    const barcodeType    = p.barcodeDetails?.type    || null;
    const barcodeCountry = p.barcodeDetails?.country || null;

    // Metadata — food, books, etc.
    const meta = p.metadata || {};

    if (!title) {
      // EAN-DB sometimes returns a product shell with no title — treat as not found
      return { found: false, source: SOURCE, barcode };
    }

    return {
      found        : true,
      source       : SOURCE,
      barcode      : p.barcode || barcode,
      name         : title,
      brand        : manufacturerName || 'Unknown',
      manufacturer : manufacturerName || 'Unknown',
      relatedBrands: relatedBrandNames,
      category     : categories[0]  || null,
      categories,
      image        : primaryImage,
      images       : images.slice(0, 5).map(i => i.url),
      barcodeType,
      country      : barcodeCountry,
      metadata     : meta,
      // Expose raw remaining balance so we can log it when debugging
      _balance     : raw.balance ?? null,
    };
  } catch (err) {
    if (err?.name !== 'TimeoutError') {
      console.warn('[EAN-DB] Lookup error:', err?.message);
    }
    return { found: false, source: SOURCE, barcode };
  }
}

module.exports = { lookupByBarcode };
