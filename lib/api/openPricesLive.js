// Open Prices Live (prices.openfoodfacts.org)
// Fetches the most recent real-world price observations for a barcode across
// a supplementary endpoint, separate from lib/api/openPrices.js. This helps
// corroborate whether the scanned product is actively moving through retail —
// a useful signal of authenticity (counterfeits rarely have public price trails).

const BASE_URL = 'https://prices.openfoodfacts.org/api/v1';

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Veri9 ProductAuthenticityPlatform/1.0 (+https://veri9.app)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

async function lookupByBarcode(barcode) {
  const source = 'Open Prices Live';
  try {
    if (!barcode || typeof barcode !== 'string') {
      return { found: false, source, barcode, error: 'Invalid barcode' };
    }
    const digits = barcode.replace(/\D/g, '');
    if (digits.length < 8) {
      return { found: false, source, barcode, reason: 'Barcode too short' };
    }

    const url = `${BASE_URL}/prices?product_code=${encodeURIComponent(digits)}&order_by=-date&size=10`;
    const data = await fetchWithTimeout(url, 5000);
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      return { found: false, source, barcode, reason: 'No recent price observations' };
    }

    const items = data.items;
    const prices = items
      .map((it) => Number(it.price))
      .filter((v) => Number.isFinite(v) && v > 0);

    const currencies = Array.from(new Set(items.map((it) => it.currency).filter(Boolean)));
    const countries  = Array.from(new Set(items.map((it) => it.location?.osm_country_code || it.location_osm_country_code).filter(Boolean))).map((c) => String(c).toUpperCase());
    const stores     = Array.from(new Set(items.map((it) => it.location?.osm_name || it.location_osm_name).filter(Boolean))).slice(0, 6);
    const mostRecent = items[0];

    const avg = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length) : null;
    const min = prices.length ? Math.min(...prices) : null;
    const max = prices.length ? Math.max(...prices) : null;

    return {
      found: true,
      source,
      barcode,
      observationCount: items.length,
      currencies,
      countries,
      sampleStores: stores,
      mostRecentPrice: mostRecent ? {
        price: mostRecent.price,
        currency: mostRecent.currency,
        date: mostRecent.date,
        store: mostRecent.location?.osm_name || null,
      } : null,
      priceStats: {
        averagePrice: avg !== null ? Number(avg.toFixed(2)) : null,
        minPrice: min,
        maxPrice: max,
      },
      note: items.length >= 3
        ? `${items.length} recent crowd-sourced price observations across ${countries.length || 'multiple'} countries — strong retail-presence signal`
        : `${items.length} price observation(s) — limited but real retail trail`,
      verificationLevel: items.length >= 3 ? 'corroborating-retail-data' : 'weak-corroborating-data',
    };
  } catch (error) {
    return { found: false, source, barcode, error: error && error.message ? error.message : String(error) };
  }
}

module.exports = { lookupByBarcode };
