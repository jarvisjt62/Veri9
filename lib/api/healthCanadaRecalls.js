/**
 * Health Canada Recalls & Safety Alerts API
 *
 * Free, no key, government source. Covers food, drugs, medical devices,
 * consumer products, vehicles, cosmetics for Canada.
 *
 * We use TWO endpoints:
 *
 *   1) /recent/en   — fast (15 latest items, lightweight, refreshed every minute)
 *   2) HCRSAMOpenData.json — complete dump (~15 MB, refreshed daily)
 *
 * Strategy: try the recent feed first (covers ~98% of "active recall right
 * now" cases). If we have a brand and the recent feed returned nothing,
 * fall back to the full dump (cached in memory for 24h).
 *
 * Each entry from the full dump has these fields (sample):
 *   NID, Title, URL, Organization, Product, Issue, "What you should do",
 *   Category, "Recall class", "Last updated", Archived
 */

const { safeFetchJson } = require('./safeFetch');

const RECENT_URL = 'https://healthycanadians.gc.ca/recall-alert-rappel-avis/api/recent/en';
const FULL_DUMP_URL = 'https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json';

let _recentCache = { fetchedAt: 0, items: [] };
let _fullCache    = { fetchedAt: 0, items: [], inflight: null };

const RECENT_TTL_MS = 5 * 60 * 1000;       // 5 min
const FULL_TTL_MS   = 24 * 60 * 60 * 1000; // 24 h

const STOPWORDS = new Set([
  'the','a','an','of','and','or','for','with','in','on','to','from','by',
  'oz','ml','fl','floz','lb','kg','mg','pack','count','size','case',
  'bottle','can','box','bag','jar','tube','packet',
  'unknown','product','flavor','flavour','original','classic','new','old',
  'recalled','recall','due','contains','contain','undeclared','present','brand',
]);

async function fetchRecent() {
  const now = Date.now();
  if (_recentCache.items.length > 0 && now - _recentCache.fetchedAt < RECENT_TTL_MS) {
    return _recentCache.items;
  }
  const data = await safeFetchJson(RECENT_URL, { timeoutMs: 8000, retries: 1 });
  if (!data || !data.results) return _recentCache.items;

  const items = (data.results.ALL || []).map(r => normalizeRecent(r));
  _recentCache = { fetchedAt: now, items };
  return items;
}

async function fetchFull() {
  const now = Date.now();
  if (_fullCache.items.length > 0 && now - _fullCache.fetchedAt < FULL_TTL_MS) {
    return _fullCache.items;
  }
  // De-dupe concurrent fetches — verification calls run in parallel.
  if (_fullCache.inflight) return _fullCache.inflight;

  _fullCache.inflight = (async () => {
    try {
      const data = await safeFetchJson(FULL_DUMP_URL, { timeoutMs: 15000, retries: 1 });
      if (!Array.isArray(data)) return _fullCache.items;
      const items = data
        .filter(r => String(r.Archived || '0') === '0')
        .map(r => normalizeFull(r));
      _fullCache = { fetchedAt: Date.now(), items, inflight: null };
      return items;
    } catch (e) {
      _fullCache.inflight = null;
      return _fullCache.items;
    }
  })();
  return _fullCache.inflight;
}

function normalizeRecent(r) {
  const title = r.title || '';
  return {
    source: 'Health Canada',
    recallId: r.recallId,
    title,
    productDescription: title,
    description: title,
    reason: title,
    category: mapCategoryNum(r.category),
    datePublished: r.date_published ? new Date(r.date_published * 1000).toISOString() : null,
    url: r.url ? `https://healthycanadians.gc.ca/recall-alert-rappel-avis${r.url}` : null,
    recallingFirm: extractFirm(title),
    status: 'Active',
  };
}

function normalizeFull(r) {
  const title = r.Title || '';
  return {
    source: 'Health Canada',
    recallId: r.NID,
    title,
    productDescription: r.Product || title,
    description: title,
    reason: r.Issue || title,
    category: r.Category || mapOrg(r.Organization),
    datePublished: r['Last updated'] || null,
    url: r.URL || null,
    recallingFirm: extractFirm(title),
    recallClass: r['Recall class'] || null,
    status: 'Active',
  };
}

/**
 * Lookup recalls for a brand+product.
 * Returns ACTIVE recalls whose title or product description contains the
 * brand AND a distinguishing token from the product name.
 */
async function lookupByBrand(brand, productName) {
  if (!brand || brand === 'Unknown') return [];

  const recent = await fetchRecent();
  let matches = filterRecalls(recent, brand, productName);

  // If recent didn't catch anything, try the full historical dump.
  if (matches.length === 0) {
    const full = await fetchFull();
    if (full.length > 0) {
      matches = filterRecalls(full, brand, productName).slice(0, 5);
    }
  }
  return matches;
}

function filterRecalls(items, brand, productName) {
  const brandLc = String(brand).toLowerCase();
  const brandTokens = brandLc
    .split(/[\s,.\-_/()]+/)
    .filter(t => t.length >= 4 && !STOPWORDS.has(t));
  const productLc = String(productName || '').toLowerCase();
  const productTokens = productLc
    .split(/[\s,.\-_/()]+/)
    .filter(t => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

  return items.filter(r => {
    const haystack = ((r.title || '') + ' ' + (r.productDescription || '')).toLowerCase();
    if (!haystack) return false;

    let brandHit = haystack.includes(brandLc);
    if (!brandHit && brandTokens.length > 0) {
      brandHit = brandTokens.some(bt => haystack.includes(bt));
    }
    if (!brandHit) return false;

    // Without a product name we can't safely disambiguate — bail.
    if (productTokens.length === 0) return false;
    return productTokens.some(pt => haystack.includes(pt));
  });
}

async function searchRecalls(text, opts = {}) {
  const { limit = 10 } = opts;
  if (!text) return [];
  const recent = await fetchRecent();
  const tLc = String(text).toLowerCase();
  let hits = recent.filter(r => String(r.title || '').toLowerCase().includes(tLc));
  if (hits.length === 0) {
    const full = await fetchFull();
    hits = full
      .filter(r => ((r.title || '') + ' ' + (r.productDescription || '')).toLowerCase().includes(tLc))
      .slice(0, limit);
  }
  return hits.slice(0, limit);
}

function mapCategoryNum(catArr) {
  if (!catArr || !catArr.length) return 'Unknown';
  const map = {
    '1': 'Food', '2': 'Drug (human)', '3': 'Medical device',
    '4': 'Natural health product', '5': 'Consumer product',
    '6': 'Vehicle', '7': 'Cosmetic',
  };
  return catArr.map(c => map[c] || c).join(', ');
}

function mapOrg(org) {
  if (!org) return 'Unknown';
  return String(org);
}

function extractFirm(title) {
  if (!title) return null;
  const m = String(title).match(/^(.+?)\s+(?:recalled|recall|advisory|alert)\b/i);
  return m ? m[1].trim() : null;
}

module.exports = { searchRecalls, lookupByBrand, fetchRecent, fetchFull };
