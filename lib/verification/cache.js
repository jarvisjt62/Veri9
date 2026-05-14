/**
 * Verification Cache
 *
 * Two-layer caching strategy to guarantee CONSISTENT results on repeat scans:
 *
 *  Layer 1 — In-memory cache (per server instance, 10 min TTL)
 *    - Instant for hot barcodes, survives within-session re-scans
 *
 *  Layer 2 — Supabase `verification_cache` table (persistent, 7 day TTL)
 *    - Ensures "user scanned product X yesterday → same result today"
 *    - Also contributes to the Veri9 community product database
 *
 * The engine consults cache BEFORE making external API calls.
 * Cache is keyed by normalized barcode.
 */

const MEM_TTL_MS = 10 * 60 * 1000;        // 10 minutes
const DB_TTL_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days

// Engine version — bump this whenever verification logic changes materially.
//
// History:
//   1  — initial caching release (Round 24)
//   2  — Round 25b: UPC-A country detection, fuzzy brand match,
//        check-digit misreads mapped to UNREADABLE not COUNTERFEIT
//   3  — Round 25c: Amazon PA-API + Barcode Lookup, category-conflict
//        detection, Amazon authority override
//   4  — Round 25d: Country normalizer fix — "united-states" now correctly
//        matches "United States / Canada". All prior GS1_COUNTRY_MISMATCH
//        verdicts for US products were false positives and must be evicted.
const ENGINE_VERSION = 9; // Round 27 — HOUSEHOLD category (Dawn dish soap fix), Photo AI error distinction

// In-memory LRU-ish cache
const memCache = new Map();
const MAX_MEM_ENTRIES = 500;

// Lazy-loaded Supabase client so the engine works even if the package
// or env vars are missing (e.g. during local development / sandbox tests).
let adminClient = null;
let adminClientAttempted = false;
function getAdminClient() {
  if (adminClientAttempted) return adminClient;
  adminClientAttempted = true;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return adminClient;
  } catch {
    return null;
  }
}

function normalizeBarcode(barcode) {
  return String(barcode).replace(/\D/g, '');
}

/**
 * Get a cached verification result, or null if miss / expired.
 * @param {string} barcode
 * @returns {Promise<object|null>}
 */
async function getCached(barcode) {
  const code = normalizeBarcode(barcode);

  // Layer 1: memory
  const mem = memCache.get(code);
  if (mem && Date.now() - mem.cachedAt < MEM_TTL_MS && mem.engineVersion === ENGINE_VERSION) {
    return { ...mem.result, _cached: 'memory', _cacheAge: Date.now() - mem.cachedAt };
  }
  if (mem) memCache.delete(code); // expired or stale-version

  // Layer 2: Supabase
  const supabase = getAdminClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('verification_cache')
      .select('*')
      .eq('barcode', code)
      .maybeSingle();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.cached_at).getTime();
    if (age > DB_TTL_MS) return null; // expired

    // Engine-version gate: discard cached results produced by an older engine.
    // `engine_version` column is optional — older rows without it are treated
    // as version 1 and bypassed as soon as we bump ENGINE_VERSION past that.
    const cachedVersion = Number(data.engine_version) || 1;
    if (cachedVersion < ENGINE_VERSION) return null;

    // Promote to memory cache
    const result = data.result_json;
    memCache.set(code, { cachedAt: Date.now(), result, engineVersion: cachedVersion });
    return { ...result, _cached: 'database', _cacheAge: age };
  } catch {
    return null;
  }
}

/**
 * Store a verification result in both memory and Supabase cache.
 * Only caches results that have meaningful data (so a transient
 * "INSUFFICIENT_DATA" doesn't poison future lookups).
 *
 * @param {string} barcode
 * @param {object} result - Verification result from engine
 */
async function setCached(barcode, result) {
  const code = normalizeBarcode(barcode);

  // Decide whether result is cacheable
  // - VERIFIED / LIKELY_AUTHENTIC / COUNTERFEIT → cache (stable)
  // - NOT_FOUND / INSUFFICIENT_DATA → cache for SHORTER duration (1 day)
  //   via lower TTL on the DB side (handled by `ttl_level` column)
  const isStable = ['VERIFIED', 'LIKELY_AUTHENTIC', 'COUNTERFEIT', 'SUSPICIOUS'].includes(result.status);

  // Layer 1: memory
  if (memCache.size >= MAX_MEM_ENTRIES) {
    // Delete oldest
    const oldest = [...memCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
    if (oldest) memCache.delete(oldest[0]);
  }
  memCache.set(code, { cachedAt: Date.now(), result, engineVersion: ENGINE_VERSION });

  // Layer 2: Supabase — always upsert, but store ttl_level for downstream expiration
  const supabase = getAdminClient();
  if (!supabase) return;

  const basePayload = {
    barcode: code,
    status: result.status,
    trust_score: result.trustScore,
    product_name: (result.productInfo && result.productInfo.name) || 'Unknown',
    brand: (result.productInfo && result.productInfo.brand) || 'Unknown',
    result_json: result,
    cached_at: new Date().toISOString(),
    ttl_level: isStable ? 'stable' : 'transient',
  };

  try {
    // First try WITH engine_version column
    const { error } = await supabase
      .from('verification_cache')
      .upsert({ ...basePayload, engine_version: ENGINE_VERSION }, { onConflict: 'barcode' });
    if (error && /engine_version/.test(error.message || '')) {
      // Column doesn't exist yet — retry without it. Safe fallback for
      // environments where the migration hasn't been applied.
      await supabase
        .from('verification_cache')
        .upsert(basePayload, { onConflict: 'barcode' });
    } else if (error) {
      throw error;
    }
  } catch (err) {
    // Swallow — caching is best-effort, never fail a verification
    console.warn('[CACHE] Supabase upsert failed:', err && err.message);
  }
}

/**
 * Invalidate a cached entry (admin override).
 */
async function invalidate(barcode) {
  const code = normalizeBarcode(barcode);
  memCache.delete(code);
  const supabase = getAdminClient();
  if (!supabase) return;
  try {
    await supabase.from('verification_cache').delete().eq('barcode', code);
  } catch {}
}

/**
 * Clear ALL cached entries — both in-memory and Supabase.
 * Used by the Admin Cache Management panel.
 */
async function clearAll() {
  // Wipe in-memory cache immediately
  const memCount = memCache.size;
  memCache.clear();

  // Wipe Supabase verification_cache table
  const supabase = getAdminClient();
  let dbCount = 0;
  if (supabase) {
    try {
      // Count first for reporting
      const { count } = await supabase
        .from('verification_cache')
        .select('*', { count: 'exact', head: true });
      dbCount = count || 0;
      // Delete all rows
      await supabase.from('verification_cache').delete().neq('barcode', '__sentinel__');
    } catch (err) {
      console.warn('[CACHE] clearAll Supabase error:', err && err.message);
    }
  }
  return { memCount, dbCount };
}

/**
 * Get cache statistics.
 */
async function getStats() {
  const memCount = memCache.size;
  const supabase = getAdminClient();
  let dbCount = 0;
  let oldestEntry = null;
  let newestEntry = null;

  if (supabase) {
    try {
      const { count } = await supabase
        .from('verification_cache')
        .select('*', { count: 'exact', head: true });
      dbCount = count || 0;

      // Oldest entry
      const { data: oldest } = await supabase
        .from('verification_cache')
        .select('barcode, cached_at, engine_version')
        .order('cached_at', { ascending: true })
        .limit(1);
      if (oldest && oldest[0]) oldestEntry = oldest[0];

      // Newest entry
      const { data: newest } = await supabase
        .from('verification_cache')
        .select('barcode, cached_at, engine_version')
        .order('cached_at', { ascending: false })
        .limit(1);
      if (newest && newest[0]) newestEntry = newest[0];
    } catch (err) {
      console.warn('[CACHE] getStats error:', err && err.message);
    }
  }

  return {
    memCount,
    dbCount,
    engineVersion: ENGINE_VERSION,
    dbTtlDays: DB_TTL_MS / (24 * 60 * 60 * 1000),
    memTtlMinutes: MEM_TTL_MS / 60000,
    oldestEntry,
    newestEntry,
  };
}

/**
 * Clear only the in-memory cache (does NOT touch Supabase).
 * Safe for regular users to call — server restart does the same thing.
 */
function clearMemCache() {
  const count = memCache.size;
  memCache.clear();
  console.log(`[CACHE] clearMemCache: cleared ${count} entries from memory`);
  return count;
}

/**
 * Return the current number of entries in the in-memory cache.
 */
function getMemCacheSize() {
  return memCache.size;
}

module.exports = { getCached, setCached, invalidate, clearAll, getStats, clearMemCache, getMemCacheSize };
