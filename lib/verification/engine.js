/**
 * Veri9 Verification Engine
 * Cross-references multiple data sources and calculates a trust score
 *
 * Trust Score Logic:
 * - Found in 1 source: 40-60% (depends on data quality)
 * - Found in 2 sources: 60-75% (cross-verified)
 * - Found in 3+ sources: 75-95% (highly verified)
 * - Mismatches between sources: reduces score
 * - FDA/regulatory match: bonus points
 * - Recall history: major red flag
 */

const openFoodFacts = require('../api/openFoodFacts');
const openFoodFactsMirrors = require('../api/openFoodFactsMirrors');
const openFDA = require('../api/openFDA');
const barcodeLookup = require('../api/barcodeLookup');
const openBeautyFacts = require('../api/openBeautyFacts');
const nhtsa = require('../api/nhtsa');
const whoMedicines = require('../api/whoMedicines');
const upcItemDb = require('../api/upcItemDbV2');       // Round 30: v2 endpoint with EAN-13 support + rate-limit awareness
const openLibrary = require('../api/openLibrary');
const datakick = require('../api/datakick');
const gs1CompanyDb = require('../api/gs1CompanyDb');
const eanSearch = require('../api/eanSearch');
const usdaFoodData = require('../api/usdaFoodData');
const regulatoryAgencies = require('../api/regulatoryAgencies');
// New global databases
const goUpc = require('../api/goUpc');
const openPrices = require('../api/openPrices');
const openProductData = require('../api/openProductData');
const nihRxNav = require('../api/nihRxNav');
const cpscRecalls = require('../api/cpscRecalls');
const barcodeMonster = require('../api/barcodeMonster');  // Round 30: service is dead, kept for compat
const googleBooks = require('../api/googleBooks');
// Round 30 — replacement sources for dead APIs
const productWorld = require('../api/productWorld');        // Replaces GoUPC + BarcodeMonster
const offSearchFallback = require('../api/offSearchFallback'); // Name-based search fallback

// Round 25c — first-class premium sources for higher-accuracy lookups.
// These gracefully degrade to { found: false, skipped: 'no_api_key' } if
// their respective env vars aren't configured, so the engine keeps working
// without them.
const amazonPaApi = require('../api/amazonPaApi');
// Regional aggregators (Round 19 expansion)
const africaRegistry   = require('../api/africaProductRegistry');
const europeRegistry   = require('../api/europeProductRegistry');
const asiaRegistry     = require('../api/asiaProductRegistry');
const oceaniaRegistry  = require('../api/oceaniaProductRegistry');
const americasRegistry = require('../api/americasProductRegistry');
// Specialized category databases (Round 20 expansion)
const electronicsCertDb   = require('../api/electronicsCertDb');
const toySafetyDb         = require('../api/toySafetyDb');
const automotivePartsDb   = require('../api/automotivePartsDb');
const wineSpiritsDb       = require('../api/wineSpiritsDb');
const textileDb           = require('../api/textileDb');
const openPricesLive      = require('../api/openPricesLive');
const barcodeSpider       = require('../api/barcodeSpider');       // Round 25e — token auth (100/day free)
const eanDb               = require('../api/eanDb');               // Round 25e — JWT Bearer (250 free credits)
// Round 28b — Tier 1 free sources expansion
const openProductsFacts   = require('../api/openProductsFacts');   // OFF sister project for non-food consumer goods
const openPetFoodFacts    = require('../api/openPetFoodFacts');    // OFF sister project for pet food/treats
const wikidata            = require('../api/wikidata');            // SPARQL GTIN lookup, ~10M items
const healthCanadaRecalls = require('../api/healthCanadaRecalls'); // Canadian recalls (no key)
// Round 29c — Tier 2 regional free sources (Africa, Asia, Latin America)
const koreanMfds            = require('../api/koreanMfds');            // Korean MFDS food import DB
const openBeautyFactsRegional = require('../api/openBeautyFactsRegional'); // OBF country mirrors (NG, IN, BR, ZA…)
const openFoodFactsRegional = require('../api/openFoodFactsRegional'); // OFF deep regional mirrors
// Verification cache (Round 24 — consistent results for repeat scans)
const cache = require('./cache');
// Round 29b — single source-of-truth registry + admin toggle enforcement
const sourceRegistry = require('./sourceRegistry');

/**
 * Wrap any source-lookup promise so that, if the admin has disabled the source
 * (via the Verification Databases toggle), we short-circuit to a benign
 * "not found" stub without ever hitting the network.
 *
 * Returns a Promise compatible with Promise.allSettled inputs.
 *
 * @param {string} sourceId  Registry id (e.g. 'openFDA')
 * @param {object|null} cfg  Engine config (admin toggles, env, etc.)
 * @param {() => Promise<any>} fn  Thunk that performs the actual lookup
 * @param {object} [stub]    Custom stub to return when disabled
 */
function gated(sourceId, cfg, fn, stub) {
  if (!sourceRegistry.isEnabled(sourceId, cfg)) {
    return Promise.resolve(stub || { found: false, source: sourceId, barcode: null, disabled: true });
  }
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Main verification function
 * @param {string} barcode - The barcode to verify
 * @param {object} [cfg]   - Optional config: { databases?: Record<string, boolean>, disabledSources?: string[] }
 *                            Admin toggle state from system_config flows in here so we can skip disabled sources.
 * @returns {object} Complete verification result with trust score
 */
async function verifyProduct(barcode, cfg) {
  try {
    // 🧠 Cache check FIRST — guarantees the same barcode returns the same
    // result across user sessions and over time. Huge consistency win:
    // "I scanned this yesterday and got VERIFIED — today I get the same."
    const cached = await cache.getCached(barcode);
    if (cached) {
      if (cached._debugFoundSources) delete cached._debugFoundSources;
      return cached;
    }

    const result = await _verifyProductInner(barcode, cfg);

    // Fire-and-forget cache write — but NEVER cache a bad scan (UNREADABLE)
    // because the same physical product might rescan cleanly next time, and
    // we don't want to poison future lookups with a misread verdict.
    // Also skip caching COUNTERFEIT on very thin evidence (< 2 found sources)
    // to avoid locking in a false positive from a flaky API response.
    const shouldCache =
      result.status !== 'UNREADABLE' &&
      !(result.status === 'COUNTERFEIT' && (result.foundSources || []).length < 2);
    // Strip internal debug fields before caching and returning
    if (result._debugFoundSources) delete result._debugFoundSources;
    if (shouldCache) {
      cache.setCached(barcode, result).catch(() => {});
    }

    return result;
  } catch (err) {
    // Never throw — return a graceful INSUFFICIENT_DATA result so the user
    // always sees *something* instead of a hard "Verification failed" toast.
    console.error('[ENGINE] verifyProduct unexpected failure:', err && err.stack ? err.stack : err);
    return {
      barcode,
      status: 'INSUFFICIENT_DATA',
      trustScore: 20,
      productType: 'unknown',
      productInfo: {
        name: 'Unknown Product',
        brand: 'Unknown',
        category: 'Unknown',
        country: 'Unknown',
      },
      sources: {},
      foundSourceCount: 0,
      gs1Info: null,
      recalls: [],
      crossReference: { issues: [], score: 0 },
      counterfeitSignals: { isCounterfeit: false, confidence: 0, signalCount: 0, signals: [] },
      whoEssentialMedicine: null,
      verificationTime: 0,
      engineError: err && err.message ? err.message : 'Internal engine error',
    };
  }
}

async function _verifyProductInner(barcode, cfg) {
  const startTime = Date.now();

  // ─── Known generic / test / placeholder barcodes ──────────────────────────
  // These are intentionally not real products (used by manuals, scanner test
  // sheets, "012345..." sequence, or all-same-digit codes). If we don't
  // short-circuit them, polluted entries in crowd-sourced DBs (e.g. a French
  // contributor uploading "Sphère plaisir" against UPC 012345678905) will
  // make these score 50+ and look authentic to the user.
  const KNOWN_TEST_BARCODES = new Set([
    '012345678905', '0012345678905', '00012345678905',
    '123456789012', '1234567890128',
    '987654321098', '9876543210987',
    '000000000000', '0000000000000',
    '111111111111', '1111111111111',
    '999999999999', '9999999999999',
  ]);
  // Detect ascending/descending digit sequences (e.g. 0123456789012) and
  // all-same-digit codes regardless of length.
  const digitsOnly = String(barcode).replace(/\D/g, '');
  const isAscendingSeq = /^0?1234567890?(12|123)?$/.test(digitsOnly) || /^0?12345678901?2?8?$/.test(digitsOnly);
  const isAllSameDigit = digitsOnly.length >= 8 && /^(\d)\1+$/.test(digitsOnly);
  if (KNOWN_TEST_BARCODES.has(digitsOnly) || isAscendingSeq || isAllSameDigit) {
    return {
      barcode,
      status: 'NOT_FOUND',
      trustScore: 0,
      productType: 'unknown',
      productInfo: {
        name: 'Test / Placeholder Barcode',
        brand: 'N/A',
        category: 'N/A',
        country: 'N/A',
        details: { note: 'This barcode is a generic test/placeholder code, not a real product.' }
      },
      sources: {},
      counterfeitSignals: { isCounterfeit: false, hasRecall: false, badScan: false, confidence: 0, signalCount: 0, signals: [] },
      foundSources: [],
      recalls: null,
      gs1Info: null,
      verificationTime: `${Date.now() - startTime}ms`,
      verifiedAt: new Date().toISOString(),
      message: 'This is a known generic / test / placeholder barcode (not a real consumer product).',
    };
  }

  // Run all API lookups in parallel for maximum speed
  const [
    offResult, offMirrorResult, fdaResult, barcodeResult, obfResult,
    upcResult, libResult, datakickResult, gs1Result, eanResult,
    usdaResult, goUpcResult, openPricesResult, openProductResult,
    nihRxResult, cpscResult, barcodeMonsterResult, googleBooksResult,
    africaResult, europeResult, asiaResult, oceaniaResult, americasResult,
    electronicsResult, toyResult, autoPartsResult, wineResult, textileResult, openPricesLiveResult,
    amazonResult, barcodeSpiderResult, eanDbResult,
    // Round 28b — Tier 1 free sources
    opfResult, opetfResult, wikidataResult,
    // Round 29c — Tier 2 regional free sources
    mfdsResult, obfRegionalResult, offRegionalResult,
    // Round 30 — replacement source for dead APIs
    productWorldResult,
  ] = await Promise.allSettled([
    gated('openFoodFacts',         cfg, () => openFoodFacts.lookupByBarcode(barcode)),
    gated('openFoodFactsMirrors',  cfg, () => openFoodFactsMirrors.lookupByBarcode(barcode)),
    gated('openFDA',               cfg, () => openFDA.lookupDrug(barcode, 'ndc')),
    gated('barcodeLookup',         cfg, () => barcodeLookup.multiSourceLookup(barcode), { sources: [], gs1: {} }),
    gated('openBeautyFacts',       cfg, () => openBeautyFacts.lookupByBarcode(barcode)),
    gated('upcItemDb',             cfg, () => upcItemDb.lookupByBarcode(barcode)),
    gated('openLibrary',           cfg, () => openLibrary.lookupByBarcode(barcode)),
    gated('datakick',              cfg, () => datakick.lookupByBarcode(barcode)),
    gated('gs1CompanyDb',          cfg, () => gs1CompanyDb.lookupByBarcode(barcode)),
    gated('eanSearch',             cfg, () => eanSearch.lookupByBarcode(barcode)),
    gated('usdaFoodData',          cfg, () => usdaFoodData.lookupByBarcode(barcode)),
    gated('goUpc',                 cfg, () => goUpc.lookupByBarcode(barcode)),
    gated('openPrices',            cfg, () => openPrices.lookupByBarcode(barcode)),
    gated('openProductData',       cfg, () => openProductData.lookupByBarcode(barcode)),
    gated('nihRxNav',              cfg, () => nihRxNav.lookupByBarcode(barcode)),
    gated('cpscRecalls',           cfg, () => cpscRecalls.lookupByBarcode(barcode), { found: false, source: 'CPSC Recalls (US)', barcode, recall: false }),
    gated('barcodeMonster',        cfg, () => barcodeMonster.lookupByBarcode(barcode)),
    gated('googleBooks',           cfg, () => googleBooks.lookupByBarcode(barcode)),
    gated('africaProductRegistry', cfg, () => africaRegistry.lookupByBarcode(barcode)),
    gated('europeProductRegistry', cfg, () => europeRegistry.lookupByBarcode(barcode)),
    gated('asiaProductRegistry',   cfg, () => asiaRegistry.lookupByBarcode(barcode)),
    gated('oceaniaProductRegistry',cfg, () => oceaniaRegistry.lookupByBarcode(barcode)),
    gated('americasProductRegistry',cfg,() => americasRegistry.lookupByBarcode(barcode)),
    gated('electronicsCertDb',     cfg, () => electronicsCertDb.lookupByBarcode(barcode)),
    gated('toySafetyDb',           cfg, () => toySafetyDb.lookupByBarcode(barcode)),
    gated('automotivePartsDb',     cfg, () => automotivePartsDb.lookupByBarcode(barcode)),
    gated('wineSpiritsDb',         cfg, () => wineSpiritsDb.lookupByBarcode(barcode)),
    gated('textileDb',             cfg, () => textileDb.lookupByBarcode(barcode)),
    gated('openPricesLive',        cfg, () => openPricesLive.lookupByBarcode(barcode)),
    gated('amazonPaApi',           cfg, () => amazonPaApi.lookupAmazon(barcode), { found: false, source: 'Amazon', barcode }),
    gated('barcodeSpider',         cfg, () => barcodeSpider.lookupByBarcode(barcode)),    // Round 25e — token auth
    gated('eanDb',                 cfg, () => eanDb.lookupByBarcode(barcode)),            // Round 25e — JWT Bearer
    // Round 28b — Tier 1 free sources
    gated('openProductsFacts',     cfg, () => openProductsFacts.lookupByBarcode(barcode)),
    gated('openPetFoodFacts',      cfg, () => openPetFoodFacts.lookupByBarcode(barcode)),
    gated('wikidata',              cfg, () => wikidata.lookupByBarcode(barcode)),
    // Round 29c — Tier 2 regional free sources
    gated('koreanMfds',            cfg, () => koreanMfds.lookupByBarcode(barcode)),
    gated('openBeautyFactsRegional', cfg, () => openBeautyFactsRegional.lookupByBarcode(barcode)),
    gated('openFoodFactsRegional', cfg, () => openFoodFactsRegional.lookupByBarcode(barcode)),
    // Round 30 — replacement source for dead APIs
    gated('productWorld',          cfg, () => productWorld.lookupByBarcode(barcode)),
  ]);

  // Extract results
  const offData      = offResult.status      === 'fulfilled' ? offResult.value      : { found: false, source: 'Open Food Facts', barcode };
  const offMirrorData = offMirrorResult.status === 'fulfilled' ? offMirrorResult.value : { found: false, source: 'Open Food Facts Mirrors', barcode };
  // Promote mirror hit into offData if the primary lookup missed
  const effectiveOffData = offData.found ? offData : (offMirrorData.found ? offMirrorData : offData);
  const fdaData      = fdaResult.status      === 'fulfilled' ? fdaResult.value      : { found: false, source: 'OpenFDA', barcode };
  // Extract remaining results (non-OFF)
  const barcodeData  = barcodeResult.status  === 'fulfilled' ? barcodeResult.value  : { sources: [], gs1: {} };
  const obfData      = obfResult.status      === 'fulfilled' ? obfResult.value      : { found: false, source: 'Open Beauty Facts', barcode };
  const upcData      = upcResult.status      === 'fulfilled' ? upcResult.value      : { found: false, source: 'UPCitemdb', barcode };
  const libData      = libResult.status      === 'fulfilled' ? libResult.value      : { found: false, source: 'Open Library', barcode };
  const datakickData = datakickResult.status === 'fulfilled' ? datakickResult.value : { found: false, source: 'Datakick', barcode };
  const gs1Data      = gs1Result.status      === 'fulfilled' ? gs1Result.value      : { found: false, source: 'GS1/USDA', barcode };
  const eanData      = eanResult.status      === 'fulfilled' ? eanResult.value      : { found: false, source: 'EAN Search', barcode };
  const usdaData     = usdaResult.status     === 'fulfilled' ? usdaResult.value     : { found: false, source: 'USDA FoodData Central', barcode };
  // New databases
  const goUpcData       = goUpcResult.status       === 'fulfilled' ? goUpcResult.value       : { found: false, source: 'Go-UPC Global DB', barcode };
  const openPricesData  = openPricesResult.status  === 'fulfilled' ? openPricesResult.value  : { found: false, source: 'Open Prices DB', barcode };
  const openProductDb   = openProductResult.status === 'fulfilled' ? openProductResult.value : { found: false, source: 'Open Product Folksonomy', barcode };
  const nihRxData       = nihRxResult.status       === 'fulfilled' ? nihRxResult.value       : { found: false, source: 'NIH RxNav (Drug DB)', barcode };
  const cpscData        = cpscResult.status        === 'fulfilled' ? cpscResult.value        : { found: false, source: 'CPSC Recalls (US)', barcode, recall: false };
  const barcodeMonsterData = barcodeMonsterResult.status === 'fulfilled' ? barcodeMonsterResult.value : { found: false, source: 'Barcode Monster', barcode };
  const googleBooksData    = googleBooksResult.status    === 'fulfilled' ? googleBooksResult.value    : { found: false, source: 'Google Books', barcode };
  // Regional registries (Round 19)
  const africaData   = africaResult.status   === 'fulfilled' ? africaResult.value   : { found: false, source: 'Africa Product Registry', barcode };
  const europeData   = europeResult.status   === 'fulfilled' ? europeResult.value   : { found: false, source: 'Europe Product Registry', barcode };
  const asiaData     = asiaResult.status     === 'fulfilled' ? asiaResult.value     : { found: false, source: 'Asia Product Registry', barcode };
  const oceaniaData  = oceaniaResult.status  === 'fulfilled' ? oceaniaResult.value  : { found: false, source: 'Oceania Product Registry', barcode };
  const americasData = americasResult.status === 'fulfilled' ? americasResult.value : { found: false, source: 'Americas Product Registry', barcode };
  // Specialized category DBs (Round 20)
  const electronicsData = electronicsResult.status === 'fulfilled' ? electronicsResult.value : { found: false, source: 'Electronics Certification Registry', barcode };
  const toyData         = toyResult.status         === 'fulfilled' ? toyResult.value         : { found: false, source: 'Toy Safety Standards Registry', barcode };
  const autoPartsData   = autoPartsResult.status   === 'fulfilled' ? autoPartsResult.value   : { found: false, source: 'Automotive Parts Standards Registry', barcode };
  const wineData        = wineResult.status        === 'fulfilled' ? wineResult.value        : { found: false, source: 'Wine & Spirits Regulatory Registry', barcode };
  const textileData     = textileResult.status     === 'fulfilled' ? textileResult.value     : { found: false, source: 'Textile & Apparel Labelling Registry', barcode };
  const openPricesLiveData = openPricesLiveResult.status === 'fulfilled' ? openPricesLiveResult.value : { found: false, source: 'Open Prices Live', barcode };
  // Round 25c — Amazon PA-API (highest-authority consumer catalog)
  const amazonData = amazonResult && amazonResult.status === 'fulfilled' ? amazonResult.value : { found: false, source: 'Amazon', barcode };
  // Round 25e — Barcode Spider (real product catalog, token auth)
  const barcodeSpiderData = barcodeSpiderResult && barcodeSpiderResult.status === 'fulfilled' ? barcodeSpiderResult.value : { found: false, source: 'Barcode Spider', barcode };
  // Round 25e — EAN-DB (JWT Bearer, 250 free credits, no charge on 404)
  const eanDbData = eanDbResult && eanDbResult.status === 'fulfilled' ? eanDbResult.value : { found: false, source: 'EAN-DB', barcode };
  // Round 28b — Tier 1 free sources expansion
  const opfData      = opfResult      && opfResult.status      === 'fulfilled' ? opfResult.value      : { found: false, source: 'Open Products Facts', barcode };
  const opetfData    = opetfResult    && opetfResult.status    === 'fulfilled' ? opetfResult.value    : { found: false, source: 'Open Pet Food Facts', barcode };
  // Round 29c — Tier 2 regional free sources
  const mfdsData         = mfdsResult         && mfdsResult.status         === 'fulfilled' ? mfdsResult.value         : { found: false, source: 'Korean MFDS', barcode };
  const obfRegionalData  = obfRegionalResult  && obfRegionalResult.status  === 'fulfilled' ? obfRegionalResult.value  : { found: false, source: 'Open Beauty Facts (Regional)', barcode };
  const offRegionalData  = offRegionalResult  && offRegionalResult.status  === 'fulfilled' ? offRegionalResult.value  : { found: false, source: 'OFF Regional Mirrors', barcode };
  const wikidataData = wikidataResult && wikidataResult.status === 'fulfilled' ? wikidataResult.value : { found: false, source: 'Wikidata', barcode };
  // Round 30 — replacement source
  const productWorldData = productWorldResult && productWorldResult.status === 'fulfilled' ? productWorldResult.value : { found: false, source: 'Product World DB', barcode };

  // Regulatory agencies (GS1 prefix-based — fast, no network)
  const regulatoryData = regulatoryAgencies.getRegulatorForBarcode(barcode);

  // Determine product type EARLY so category DB filtering and trust score can use it.
  // Must be declared before foundSources collection (which references productTypeEarly).
  const productTypeEarly = determineProductType(effectiveOffData, fdaData, barcodeData, obfData, libData, upcData, datakickData, barcodeSpiderData, eanDbData);
  const productType = productTypeEarly;

  // Round 30c: Compute GS1 info EARLY so the UPC-A check is available before
  // the regional-registry foundSources pushes below. UPC-A barcodes (12-digit,
  // or 13-digit EAN with a leading zero pad) use a US-assigned "number system
  // character" as their leading digit, NOT a GS1 country prefix. Regional
  // registries do naive 3-digit EAN prefix lookups and don't know this — a
  // UPC-A starting with 850 (e.g. Youtheory 850502007775) would otherwise be
  // misidentified as Cuban and trigger a false GS1_COUNTRY_MISMATCH ->
  // COUNTERFEIT verdict. Skip regional-registry matches entirely for UPC-A.
  const gs1InfoEarly = gs1CompanyDb.getGS1Info(barcode);
  const isUpcAEarly = !!gs1InfoEarly.isUpcA;

  // Collect all found sources
  const foundSources = [];
  if (effectiveOffData.found) foundSources.push(effectiveOffData);
  if (fdaData.found)       foundSources.push(fdaData);
  if (obfData.found)       foundSources.push(obfData);
  if (upcData.found)       foundSources.push(upcData);
  if (libData.found)       foundSources.push(libData);
  if (datakickData.found)  foundSources.push(datakickData);
  if (gs1Data.found)       foundSources.push(gs1Data);
  if (usdaData.found)      foundSources.push(usdaData);
  if (eanData.found)       foundSources.push(eanData);
  if (goUpcData.found)     foundSources.push(goUpcData);
  if (openPricesData.found) foundSources.push(openPricesData);
  if (openProductDb.found)  foundSources.push(openProductDb);
  if (nihRxData.found)     foundSources.push(nihRxData);
  if (barcodeMonsterData.found) foundSources.push(barcodeMonsterData);
  if (googleBooksData.found)    foundSources.push(googleBooksData);
  // Regional registries — only add when the GS1 prefix actually falls in-region
  // AND the barcode is not UPC-A (whose leading digit isn't a real country
  // prefix — see isUpcAEarly comment above). For UPC-A barcodes, annotate the
  // raw result as suppressed so it displays correctly in the admin sources
  // view instead of showing a misleading foreign country.
  if (isUpcAEarly) {
    const suppressNote = 'Suppressed: barcode is UPC-A (US-native numbering), not a true EAN-13 country prefix.';
    if (africaData.found)   { africaData.found = false;   africaData.suppressedReason = suppressNote; }
    if (europeData.found)   { europeData.found = false;   europeData.suppressedReason = suppressNote; }
    if (asiaData.found)     { asiaData.found = false;     asiaData.suppressedReason = suppressNote; }
    if (oceaniaData.found)  { oceaniaData.found = false;  oceaniaData.suppressedReason = suppressNote; }
    if (americasData.found) { americasData.found = false; americasData.suppressedReason = suppressNote; }
  } else {
    if (africaData.found)    foundSources.push(africaData);
    if (europeData.found)    foundSources.push(europeData);
    if (asiaData.found)      foundSources.push(asiaData);
    if (oceaniaData.found)   foundSources.push(oceaniaData);
    if (americasData.found)  foundSources.push(americasData);
  }
  // Round 30c: Category DBs are GS1 prefix lookups — they match ANY barcode from
  // a country that has that regulation, regardless of product type. A Twix bar from
  // the UK (prefix 500) matches electronics, toys, automotive, wine, AND textile DBs.
  // These should ONLY count toward foundSources when the productType actually matches.
  // The old `name !== 'Unknown'` fallback was wrong because these prefix DBs always
  // return descriptive names (e.g. "Electronics certification: UK") which are never 'Unknown'.
  if (electronicsData.found && productTypeEarly === 'ELECTRONICS') foundSources.push(electronicsData);
  if (toyData.found && (productTypeEarly === 'TOYS' || productTypeEarly === 'PET_SUPPLIES')) foundSources.push(toyData);
  if (autoPartsData.found && productTypeEarly === 'AUTOMOTIVE') foundSources.push(autoPartsData);
  if (wineData.found && productTypeEarly === 'BEVERAGE') foundSources.push(wineData);
  if (textileData.found && (productTypeEarly === 'APPAREL' || productTypeEarly === 'TEXTILE')) foundSources.push(textileData);
  if (openPricesLiveData.found)  foundSources.push(openPricesLiveData);
  if (amazonData.found)          foundSources.push(amazonData);
  if (barcodeSpiderData.found)   foundSources.push(barcodeSpiderData);
  if (eanDbData.found)           foundSources.push(eanDbData);
  // Round 28b — Tier 1 free sources
  if (opfData.found)             foundSources.push(opfData);
  if (opetfData.found)           foundSources.push(opetfData);
  // Round 29c — Tier 2 regional sources
  if (mfdsData.found)            foundSources.push(mfdsData);
  if (obfRegionalData.found)     foundSources.push(obfRegionalData);
  // Round 30e: openFoodFactsRegional queries the SAME underlying Open Food
  // Facts database as effectiveOffData/offMirrorData — just through
  // different country-code mirror endpoints (world/us/fr/etc vs
  // ng/za/in/br/etc). It is NOT an independent corroborating source. Counting
  // it separately inflated richSourcesCount whenever both the primary OFF
  // lookup and a regional mirror happened to respond within the timeout
  // window, which non-deterministically pushed GS1_COUNTRY_MISMATCH from
  // MEDIUM to HIGH severity and crossed the COUNTERFEIT threshold — same
  // barcode, same product, different verdict depending on network timing
  // (e.g. Optimum Nutrition Whey Gold Standard 748927028690). Only add it to
  // foundSources when the primary OFF lookup came up empty, so it can still
  // rescue genuinely under-indexed regional products without double-counting
  // an already-found one.
  if (offRegionalData.found && !effectiveOffData.found) foundSources.push(offRegionalData);
  if (wikidataData.found)        foundSources.push(wikidataData);
  // Round 30 — replacement source
  if (productWorldData.found)    foundSources.push(productWorldData);
  // Round 30c: Filter barcodeData.sources to avoid duplicate UPCitemdb entries.
  // barcodeLookup.js calls the old UPCitemdb trial endpoint, but we already have
  // the new upcItemDbV2 result in upcData (pushed at line 329). Including both
  // would double-count the same source.
  if (barcodeData.sources && barcodeData.sources.length > 0) {
    const nonDuplicateSources = barcodeData.sources.filter(s => s.source !== 'UPCitemdb');
    foundSources.push(...nonDuplicateSources);
  }

  // Get GS1 info (always available)
  const gs1Info = gs1CompanyDb.getGS1Info(barcode);

  // WHO Essential Medicines check (for pharmaceutical products) — defensive
  let whoResult = null;
  if (fdaData.found && fdaData.genericName) {
    try {
      whoResult = await whoMedicines.checkEssentialMedicine(fdaData.genericName);
    } catch (e) {
      console.warn('[ENGINE] WHO Essential Medicines lookup failed:', e && e.message);
      whoResult = null;
    }
  }

  // Build unified product info BEFORE search fallback so the fallback can update it.
  // (Round 30 fix: productInfo must be defined before search fallback references it,
  // otherwise the minified production build throws "Cannot access before initialization".)
  // productTypeEarly and productType were already computed above (before foundSources).
  const productInfo = buildProductInfo(effectiveOffData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info, productType, amazonData, barcodeSpiderData, eanDbData, eanData, opfData, opetfData, wikidataData, mfdsData, obfRegionalData, offRegionalData);

  // Apply regional-registry data as authoritative country-of-origin when GS1 prefix matches
  //
  // Round 30c fix: UPC-A barcodes (12-digit, or 13-digit EAN with a leading
  // zero pad) do NOT follow the standard EAN-13 3-digit country-prefix
  // scheme — the leading digit is a US-assigned "number system character",
  // not a GS1 country code. gs1CompanyDb.js already special-cases this
  // (see its own comment re: "Mrs Dash 850062253469 -> Cuba"), but the
  // regional registries (Africa/Europe/Asia/Oceania/Americas) do a naive
  // 3-digit EAN prefix lookup and don't know about this exception. That
  // caused UPC-A codes starting with 850 (e.g. Youtheory 850502007775) to
  // be misreported as originating in Cuba even though gs1Info correctly
  // says "United States / Canada" — triggering a false GS1_COUNTRY_MISMATCH
  // -> COUNTERFEIT verdict. When the barcode is UPC-A, gs1Info.country is
  // already authoritative, so skip the regional-registry override entirely.
  const regionalHit = isUpcAEarly ? null : (
    africaData.found ? africaData
    : europeData.found ? europeData
    : asiaData.found ? asiaData
    : oceaniaData.found ? oceaniaData
    : americasData.found ? americasData
    : null
  );
  if (regionalHit) {
    productInfo.country = regionalHit.countryOfOrigin || productInfo.country;
    productInfo.countryOfOrigin = regionalHit.countryOfOrigin;
    productInfo.regulatoryAgency = regionalHit.agency;
    productInfo.regulatoryAgencyUrl = regionalHit.agencyUrl;
  }

  // Round 30 — Search fallback: when no barcode source found the product name,
  // try a name-based search across the OFF ecosystem as a last resort.
  // This helps products from underrepresented regions (Africa, India, Middle East)
  // that exist in crowd-sourced databases but weren't found by exact barcode lookup.
  let searchFallbackData = null;
  const richSourcesBeforeFallback = foundSources.filter(s => s && s.name && s.name !== 'Unknown' && String(s.name).trim().length > 0 && !s.isSearchResult);
  if (richSourcesBeforeFallback.length === 0) {
    // No source returned a product name — try keyword search using GS1 region hints
    const gs1InfoForSearch = gs1CompanyDb.getGS1Info(barcode);
    let searchQuery = null;
    // If a regional registry gave us an agency/country, use it as a search hint
    const jurisdictionHit = foundSources.find(s => s.verificationLevel === 'jurisdiction-confirmed' && s.agency);
    if (jurisdictionHit && jurisdictionHit.countryOfOrigin) {
      // We know the country but not the product — skip search, no useful keywords
    }
    // If we have brand info from any source, search by brand
    const anyBrand = foundSources.find(s => s.brand && s.brand !== 'Unknown');
    if (anyBrand) {
      searchQuery = anyBrand.brand;
    }
    // Round 30b: REMOVED barcode-as-query fallback. Searching for a raw barcode
    // number in OFF returns completely unrelated products (e.g. searching "5449000010155"
    // returns NYX makeup). Only search when we have an actual brand or product keyword.
    // If no brand found, skip search — the result would be worse than no result.
    if (searchQuery) {
      try {
        searchFallbackData = await offSearchFallback.searchAllDatabases(searchQuery, barcode);
      } catch (e) {
        console.warn('[ENGINE] Search fallback failed:', e && e.message);
      }
      // If search found something, add it to foundSources
      if (searchFallbackData && searchFallbackData.found) {
        foundSources.push(searchFallbackData);
        // Also update productInfo if we had nothing before
        if (!productInfo.name || productInfo.name === 'Unknown' || productInfo.name === 'Unknown Product') {
          productInfo.name = searchFallbackData.name;
          if (searchFallbackData.brand && searchFallbackData.brand !== 'Unknown') {
            productInfo.brand = searchFallbackData.brand;
          }
        }
      }
    }
  }

  // Calculate trust score
  const trustScore = calculateTrustScore(effectiveOffData, fdaData, barcodeData, obfData, foundSources, upcData, libData, datakickData, gs1Info, productTypeEarly, amazonData, barcodeSpiderData, eanDbData, eanData, productWorldData, wikidataData, searchFallbackData);


  // Check for recalls (CPSC + FDA) — defensive + product-specific matching
  let recalls = [];
  if (cpscData.found && cpscData.recall) {
    recalls.push({ source: 'CPSC', description: cpscData.recallReason, date: cpscData.recallDate, number: cpscData.recallNumber });
  }
  const brandForRecall = effectiveOffData.brand || upcData.brand || datakickData.brand || (wikidataData && wikidataData.brand) || (opfData && opfData.brand) || (offRegionalData && offRegionalData.brand) || (obfRegionalData && obfRegionalData.brand);
  // Round 28b — also resolve product name early so recall matchers can use it
  const productNameForRecall = effectiveOffData.name || upcData.name || datakickData.name || (opfData && opfData.name) || (opetfData && opetfData.name) || (wikidataData && wikidataData.name) || (mfdsData && mfdsData.name) || (offRegionalData && offRegionalData.name) || (obfRegionalData && obfRegionalData.name) || '';
  if (brandForRecall && brandForRecall !== 'Unknown') {
    const [foodRecallsRes, drugRecallsRes, hcRecallsRes] = await Promise.allSettled([
      gated('openFDA',             cfg, () => openFDA.lookupFoodEnforcement(brandForRecall), []),
      gated('openFDA',             cfg, () => openFDA.lookupDrugEnforcement(brandForRecall), []),
      // Round 28b — Health Canada (Canadian recalls — covers food, drugs,
      // medical devices, consumer products, vehicles, cosmetics)
      gated('healthCanadaRecalls', cfg, () => healthCanadaRecalls.lookupByBrand(brandForRecall, productNameForRecall), []),
    ]);
    const rawFoodRecalls = foodRecallsRes.status === 'fulfilled' && Array.isArray(foodRecallsRes.value) ? foodRecallsRes.value : [];
    const rawDrugRecalls = drugRecallsRes.status === 'fulfilled' && Array.isArray(drugRecallsRes.value) ? drugRecallsRes.value : [];
    const rawHcRecalls   = hcRecallsRes.status   === 'fulfilled' && Array.isArray(hcRecallsRes.value)   ? hcRecallsRes.value   : [];
    if (foodRecallsRes.status === 'rejected') console.warn('[ENGINE] FDA food recall lookup failed:', foodRecallsRes.reason && foodRecallsRes.reason.message);
    if (drugRecallsRes.status === 'rejected') console.warn('[ENGINE] FDA drug recall lookup failed:', drugRecallsRes.reason && drugRecallsRes.reason.message);

    // Product-specific match: a recall only counts against THIS product if:
    //   (a) the barcode itself appears in the recall description, OR
    //   (b) the recalling FIRM matches this product's brand AND the recall
    //       description clearly references the SAME product (not a different
    //       product made by the same parent company).
    // This prevents false positives like:
    //   - "Cafe Intermezzo Hazelnut Cheesecake containing Nutella was recalled"
    //     flagging every Nutella jar.
    //   - "Heartland Coca-Cola Bottling Company recalled Grape Fanta" flagging
    //     every Coca-Cola can (different product, same parent company).
    const brandLc = String(brandForRecall).toLowerCase();
    const barcodeStr = String(barcode);
    const barcodeNoPad = barcodeStr.replace(/^0+/, '');

    // Build a set of distinguishing keywords from the scanned product's name.
    // These are short non-stopword tokens that, if present in the recall
    // description, indicate the recall is for THIS specific product variant.
    const STOPWORDS = new Set([
      'the','a','an','of','and','or','for','with','in','on','to','from','by',
      'oz','ml','fl','floz','lb','kg','g','mg','ct','pack','count','size',
      'bottle','can','box','bag','jar','tube','pack','packet','case',
      'unknown','product','flavor','flavour','original','classic','new','old',
    ]);
    // Variant keywords — if the RECALL description contains any of these
    // and the SCANNED product name does NOT, we treat it as a different
    // product variant and exclude the recall (e.g. "Diet Coke" recall
    // shouldn't flag "Coca-Cola Original").
    const VARIANT_KEYWORDS = [
      'diet','zero','light','lite','cherry','vanilla','lemon','lime','orange',
      'grape','strawberry','raspberry','peach','mango','pineapple','coconut',
      'caffeine-free','caffeine free','decaf','decaffeinated','sugar-free','sugar free',
      'gluten-free','gluten free','low-fat','low fat','fat-free','fat free',
      'organic','sparkling','flavored','flavoured','mini','jumbo','xl','xxl'
    ];
    const productNameRaw = String(
      effectiveOffData.name || upcData.name || datakickData.name || ''
    ).toLowerCase();
    const productKeywords = productNameRaw
      .split(/[\s,.\-_/()]+/)
      .filter(t => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

    const matchesThisProduct = (recall) => {
      const haystack = [recall.productDescription, recall.description, recall.reason, recall.product_description]
        .filter(Boolean).join(' ').toLowerCase();
      const firm = String(recall.recallingFirm || recall.recalling_firm || '').toLowerCase();
      const recallStatus = String(recall.status || recall.recall_status || '').toLowerCase();
      if (!haystack && !firm) return false;

      // Skip terminated/closed recalls — they're historical, not active risks.
      // Keep "ongoing", "open", "pending", or empty status.
      if (recallStatus === 'terminated' || recallStatus === 'closed' || recallStatus === 'completed') {
        return false;
      }

      // (a) barcode match — highest specificity, accept immediately
      if (haystack && (haystack.includes(barcodeStr) || (barcodeNoPad && haystack.includes(barcodeNoPad)))) return true;

      // (b) firm name contains brand name AND the recall description shares
      //     a distinguishing keyword from this product's name. This stops
      //     "Heartland Coca-Cola Bottling Co recalled Grape Fanta" from
      //     flagging an authentic Coke can — "Grape" / "Fanta" don't appear
      //     in "Coca-Cola Original Taste".
      if (firm && brandLc && (firm.includes(brandLc) || brandLc.includes(firm.split(/[\s,]+/)[0]))) {
        if (productKeywords.length === 0) {
          // We have no product-name keywords to disambiguate — be conservative
          // and DO NOT auto-flag. Brand-firm match alone is too noisy.
          return false;
        }
        // Variant exclusion: if the recall mentions a variant our product
        // doesn't have (e.g. "Diet" / "Zero" / "Cherry"), it's a different SKU.
        const recallHasVariant = VARIANT_KEYWORDS.find(v => haystack.includes(v) && !productNameRaw.includes(v));
        if (recallHasVariant) {
          return false;
        }
        // Require at least one product keyword to appear in the recall description
        return productKeywords.some(kw => haystack.includes(kw));
      }
      return false;
    };

    const foodRecalls = rawFoodRecalls.filter(matchesThisProduct);
    const drugRecalls = rawDrugRecalls.filter(matchesThisProduct);
    // Round 28b — Health Canada recalls already filtered by brand+product token
    // in the lookupByBrand call, but run them through matchesThisProduct too
    // for the variant-keyword exclusion (e.g. don't match Diet Coke recall to Coke).
    const hcRecalls   = rawHcRecalls.filter(matchesThisProduct);
    recalls = [...recalls, ...foodRecalls, ...drugRecalls, ...hcRecalls].slice(0, 5);
  }

  // Determine product type (name-aware — perfume/fragrance heuristic runs first)
  // NOTE: productType and productInfo were computed earlier (before search fallback)
  // so that the fallback can update productInfo.name/brand when it finds a match.

  // Regional-registry country-of-origin was already applied before search fallback.

  // Cross-reference check
  const crossRef = crossReferenceCheck(effectiveOffData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info, amazonData, barcodeSpiderData, eanDbData, eanData);

  // Counterfeit signal detection
  const counterfeitSignals = detectCounterfeitSignals({
    barcode, trustScore, foundSources, recalls, gs1Info, productInfo,
    effectiveOffData, fdaData, barcodeData, obfData, upcData, datakickData, crossRef,
    amazonData, productWorldData,
  });

  const verificationTime = Date.now() - startTime;

  // Determine verification status
  let status;
  if (counterfeitSignals.badScan) {
    // Barcode failed its check digit — almost certainly a camera misread.
    // Do NOT confuse users with a COUNTERFEIT verdict for a bad scan.
    status = 'UNREADABLE';
  } else if (counterfeitSignals.hasRecall && !counterfeitSignals.isCounterfeit) {
    // The product is real but has been recalled by the FDA or CPSC.
    // A recall is VERY different from a counterfeit — it means the genuine
    // product has a safety issue. Show RECALLED so users take the right action
    // (stop using, check recall notice) rather than thinking it's a fake.
    status = 'RECALLED';
  } else if (counterfeitSignals.isCounterfeit) {
    status = 'COUNTERFEIT';
  } else if (counterfeitSignals.hasRecall) {
    // hasRecall + isCounterfeit both true → still show RECALLED, not COUNTERFEIT
    // (recall evidence dominates; counterfeit signals may be recall-data side-effects)
    status = 'RECALLED';
  } else if (trustScore >= 75) {
    status = 'VERIFIED';
  } else if (trustScore >= 50) {
    status = 'LIKELY_AUTHENTIC';
  } else if (foundSources.length === 0) {
    // No sources at all → NOT_FOUND beats INSUFFICIENT_DATA. The user needs
    // to know we have zero matching records, not that we "found something
    // but it's incomplete".
    status = 'NOT_FOUND';
  } else if (trustScore >= 25) {
    status = 'INSUFFICIENT_DATA';
  } else {
    status = 'SUSPICIOUS';
  }

  // For UNREADABLE results, force trustScore to 0 — showing a 66 score next
  // to "Could not read barcode" is confusing.
  let finalTrustScore = trustScore;
  if (status === 'UNREADABLE') finalTrustScore = 0;

  return {
    barcode,
    status,
    trustScore: finalTrustScore,
    productType,
    productInfo,
    sources: {
      openFoodFacts:  effectiveOffData,
      openFoodFactsMirror: offMirrorData,
      openFDA:        fdaData,
      openBeautyFacts: obfData,
      barcodeLookup:  barcodeData,
      upcItemDb:      upcData,
      openLibrary:    libData,
      datakick:       datakickData,
      gs1CompanyDb:   gs1Data,
      eanSearch:      eanData,
      usdaFoodData:   usdaData,
      regulatoryAgency: regulatoryData,
      // New global databases
      goUpc:          goUpcData,
      openPrices:     openPricesData,
      openProductData: openProductDb,
      nihRxNav:       nihRxData,
      cpscRecalls:    cpscData,
      // Regional registries (Round 19)
      africaRegistry:   africaData,
      europeRegistry:   europeData,
      asiaRegistry:     asiaData,
      oceaniaRegistry:  oceaniaData,
      americasRegistry: americasData,
      // Specialized category DBs (Round 20)
      electronicsCertDb:   electronicsData,
      toySafetyDb:         toyData,
      automotivePartsDb:   autoPartsData,
      wineSpiritsDb:       wineData,
      textileDb:           textileData,
      openPricesLive:      openPricesLiveData,
      // Round 25c — premium sources
      amazonPaApi:         amazonData,
      // Round 25e — Barcode Spider
      barcodeSpider:       barcodeSpiderData,
      // Round 25e — EAN-DB
      eanDb:               eanDbData,
      // Round 28b — Tier 1 free sources expansion
      openProductsFacts:   opfData,
      openPetFoodFacts:    opetfData,
      wikidata:            wikidataData,
      // Round 29c — Tier 2 regional free sources (Africa, Asia, Latin America)
      koreanMfds:          mfdsData,
      openBeautyFactsRegional: obfRegionalData,
      openFoodFactsRegional:   offRegionalData,
      // Round 30 — Replacement free sources + search fallback
      productWorld:          productWorldData,
      searchFallback:        searchFallbackData,
    },
    whoEssentialMedicine: whoResult,
    regulatoryAgencies: whoMedicines.getAllRegulatoryAgencies(),
    crossReference: crossRef,
    counterfeitSignals,
    recalls: recalls.length > 0 ? recalls : null,
    gs1Info,
    verificationTime: `${verificationTime}ms`,
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Calculate trust score based on multiple factors
 */
function calculateTrustScore(offData, fdaData, barcodeData, obfData, foundSources, upcData, libData, datakickData, gs1Info, productType, amazonData, barcodeSpiderData, eanDbData, eanSearchData, productWorldData, wikidataData, searchFallbackData) {
  let score = 0;
  let maxScore = 0;

  // Helpers — count "rich" sources (those that returned an actual product
  // name, not just a hit) so that an Amazon / Barcode Spider / EAN-DB hit
  // with a real product name counts as a stronger signal than an empty
  // GS1-only registry hit.
  // Round 30: Also separate jurisdiction-only sources (regional registries
  // that confirm the barcode's GS1 prefix but have no product name) from
  // actual product sources. Jurisdiction-only sources provide useful
  // authenticity context but should not inflate the "found" count.
  const richSources = (foundSources || []).filter(s => s && s.name && s.name !== 'Unknown' && String(s.name).trim().length > 0 && !s.isSearchResult);
  const richCount = richSources.length;
  const totalCount = (foundSources || []).filter(s => !s.verificationLevel).length;  // Exclude jurisdiction-only
  const jurisdictionSources = (foundSources || []).filter(s => s.verificationLevel === 'jurisdiction-confirmed');
  const jurisdictionCount = jurisdictionSources.length;

  // Factor 1: Number of sources that found the product (0-40 points)
  // Round 28: We now reward "rich" hits (sources that returned a real name)
  // more than empty hits, because regional registries that just confirm a
  // barcode prefix without a name shouldn't count as full source matches.
  // CRITICAL: If richCount === 0 we cap Factor 1 at a low value — a hit with
  // no name is essentially a "phantom record" and should NOT contribute the
  // same as a source that returned an actual product name.
  // Round 30: Jurisdiction-confirmed sources (regional registries) get partial
  // credit because they DO confirm the barcode is registered to a real GS1
  // member in that country. Search fallback results get reduced credit.
  maxScore += 40;
  if (richCount >= 5) score += 40;
  else if (richCount === 4) score += 38;
  else if (richCount === 3) score += 34;
  else if (richCount === 2) score += 28;
  else if (richCount === 1) score += 22;
  else if (totalCount >= 2) score += 8; // multiple empty hits → low partial credit
  else if (totalCount === 1) score += 4; // single phantom hit → very low credit
  // Round 30: jurisdiction-confirmed sources give partial credit even without a name
  // This means South African / Indian / Nigerian barcodes with GS1 confirmation
  // get at least SOME points instead of 0.
  if (richCount === 0 && jurisdictionCount > 0) {
    score += Math.min(12, jurisdictionCount * 6);  // +6 per jurisdiction source, cap 12
  }
  // Round 30: search fallback results give partial credit (the name was found
  // by keyword search, not by exact barcode — weaker signal but still useful)
  if (richCount === 0 && searchFallbackData && searchFallbackData.found) {
    score += 8;  // Name found by search — partial credit toward INSUFFICIENT_DATA/LIKELY_AUTHENTIC
  }
  else score += 0;

  // Factor 2: Data consistency between sources (0-25 points)
  maxScore += 25;
  const consistency = checkDataConsistency(offData, fdaData, barcodeData, upcData, datakickData);
  score += Math.round(25 * consistency);

  // Factor 3: Regulatory verification (0-20 points)
  // ROUND 28 FIX: Only count this factor in maxScore for product types where
  // FDA registration is *expected* (drugs, food, supplements, cosmetics).
  // For electronics, apparel, toys, books, automotive, etc. an FDA hit is
  // not expected — penalising them for that drove huge numbers of legit
  // products into the INSUFFICIENT_DATA bucket.
  const fdaApplicable = ['drug', 'medication', 'pharmaceutical', 'supplement', 'food', 'beverage', 'cosmetic', 'beauty', 'personal_care', 'health'].includes(String(productType || '').toLowerCase());
  if (fdaApplicable) {
    maxScore += 20;
    if (fdaData.found) {
      score += 20;
      if (fdaData.status === 'Prescription' || fdaData.status === 'Over-the-counter') {
        score += 5;
        maxScore += 5;
      }
    }
  } else if (fdaData.found) {
    // Bonus only — don't expand maxScore
    score += 10;
  }

  // Factor 4: GS1 prefix validity (0-15 points)
  // Round 30: Boosted — a valid GS1 country prefix is a strong signal that
  // the barcode was legitimately issued. Combined with jurisdiction confirmation
  // (Factor 4b), this helps products from Africa/Asia/Middle East score higher.
  maxScore += 15;
  if (gs1Info && gs1Info.country && gs1Info.country !== 'Unknown') {
    score += 15;
  } else if (barcodeData.gs1 && barcodeData.gs1.region !== 'Unknown') {
    score += 15;
  }

  // Factor 4b (Round 30): GS1 jurisdiction match bonus (0-15 points)
  // When a regional registry confirms the barcode's GS1 prefix belongs to
  // its jurisdiction (e.g., SABS for South African prefix 600-601), this is
  // a meaningful authenticity signal that the barcode was properly allocated.
  // This is separate from Factor 4 because a product can have a valid GS1
  // prefix but not be jurisdiction-confirmed (e.g., prefix 749 for Colombia
  // but product sold globally).
  maxScore += 15;
  if (jurisdictionCount > 0) {
    score += 10;  // 1 jurisdiction source → +10
    if (jurisdictionCount >= 2) score += 5;  // 2+ jurisdiction sources → +5 more
  }

  // Factor 5: Commercial database hit (UPCitemdb or Datakick) — bonus reliability
  maxScore += 10;
  if (upcData.found || datakickData.found) score += 10;

  // Factor 5b (NEW): High-quality commercial enrichment hits
  // Amazon PA-API exact match, Barcode Spider, EAN-DB, Open Products Facts,
  // Wikidata — these are real catalogs with images and rich metadata; an
  // exact hit is a strong authenticity signal even if Open Food Facts /
  // FDA missed the product.
  // Round 30: Added Product World DB and search fallback enrichment.
  maxScore += 12;
  let enrichmentScore = 0;
  if (amazonData && amazonData.found && amazonData.isExactMatch) enrichmentScore += 6;
  else if (amazonData && amazonData.found) enrichmentScore += 3;
  if (barcodeSpiderData && barcodeSpiderData.found) enrichmentScore += 4;
  if (eanDbData && eanDbData.found) enrichmentScore += 3;
  if (eanSearchData && eanSearchData.found) enrichmentScore += 2;
  // Round 28b — extra signals from new free sources
  if (foundSources && foundSources.some(s => s && s.source === 'Wikidata' && s.name)) enrichmentScore += 5;
  if (foundSources && foundSources.some(s => s && s.source === 'Open Products Facts' && s.name)) enrichmentScore += 3;
  if (foundSources && foundSources.some(s => s && s.source === 'Open Pet Food Facts' && s.name)) enrichmentScore += 3;
  // Round 30 — Product World DB (replacement for dead GoUPC/BarcodeMonster)
  if (productWorldData && productWorldData.found && productWorldData.name) enrichmentScore += 4;
  // Round 30 — Search fallback enrichment (weaker signal than barcode match)
  if (searchFallbackData && searchFallbackData.found && searchFallbackData.name) enrichmentScore += 2;
  score += Math.min(12, enrichmentScore);

  // Factor 6: Book ISBN verification via Open Library
  if (libData.found) {
    maxScore += 10;
    score += 10;
  }

  // Penalties: Mismatched brand names between sources
  if (consistency < 0.5 && foundSources.length > 1) {
    score -= 10;
  }

  // Round 28 — Confidence floor for "low data but consistent + valid GS1"
  // If we have at least one rich source AND a valid GS1 country AND no
  // brand inconsistency, the product is almost certainly real. Floor at 50
  // so it lands in LIKELY_AUTHENTIC instead of INSUFFICIENT_DATA.
  const gs1Valid = (gs1Info && gs1Info.country && gs1Info.country !== 'Unknown') ||
                   (barcodeData.gs1 && barcodeData.gs1.region !== 'Unknown');
  let baseScore = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
  if (richCount >= 1 && gs1Valid && consistency >= 0.6 && baseScore < 50) {
    baseScore = 50;
  }
  // Stronger floor: 2 rich sources + GS1 valid + good consistency → at least 65 (LIKELY_AUTHENTIC near top)
  if (richCount >= 2 && gs1Valid && consistency >= 0.6 && baseScore < 65) {
    baseScore = 65;
  }
  // Round 30 — Jurisdiction confidence floor: if GS1 prefix is valid AND
  // at least one regional registry confirms jurisdiction, the barcode is
  // genuinely issued by a GS1 member organization. This should at minimum
  // be INSUFFICIENT_DATA (not NOT_FOUND), and if we also found the product
  // name via search, push to LIKELY_AUTHENTIC.
  if (richCount === 0 && gs1Valid && jurisdictionCount > 0 && baseScore < 30) {
    baseScore = 30;  // At least INSUFFICIENT_DATA, not NOT_FOUND
  }
  // Round 30 — If we have GS1 + jurisdiction + search-found name → LIKELY_AUTHENTIC
  if (richCount === 0 && gs1Valid && jurisdictionCount > 0 && searchFallbackData && searchFallbackData.found && baseScore < 50) {
    baseScore = 50;  // At least LIKELY_AUTHENTIC
  }

  return baseScore;
}

/**
 * Check consistency of data between sources
 */
function checkDataConsistency(offData, fdaData, barcodeData, upcData, datakickData) {
  const brands = [];
  const names = [];

  if (offData.found) {
    if (offData.brand && offData.brand !== 'Unknown') brands.push(offData.brand.toLowerCase());
    if (offData.name && offData.name !== 'Unknown') names.push(offData.name.toLowerCase());
  }
  if (fdaData.found) {
    if (fdaData.brandName && fdaData.brandName !== 'Unknown') brands.push(fdaData.brandName.toLowerCase());
    if (fdaData.genericName && fdaData.genericName !== 'Unknown') names.push(fdaData.genericName.toLowerCase());
  }
  if (upcData.found) {
    if (upcData.brand && upcData.brand !== 'Unknown') brands.push(upcData.brand.toLowerCase());
    if (upcData.name && upcData.name !== 'Unknown') names.push(upcData.name.toLowerCase());
  }
  if (datakickData.found) {
    if (datakickData.brand && datakickData.brand !== 'Unknown') brands.push(datakickData.brand.toLowerCase());
    if (datakickData.name && datakickData.name !== 'Unknown') names.push(datakickData.name.toLowerCase());
  }
  if (barcodeData.sources) {
    barcodeData.sources.forEach(s => {
      if (s.brand && s.brand !== 'Unknown') brands.push(s.brand.toLowerCase());
      if (s.name && s.name !== 'Unknown') names.push(s.name.toLowerCase());
    });
  }

  if (brands.length <= 1 && names.length <= 1) return 0.7;

  let consistency = 1;
  if (brands.length > 1) {
    const firstBrand = brands[0];
    const allMatch = brands.every(b => b.includes(firstBrand) || firstBrand.includes(b));
    if (!allMatch) consistency -= 0.4;
  }

  return Math.max(0, consistency);
}

/**
 * Determine the type of product based on available data.
 *
 * Priority order matters:
 *  1. Open Library (if it's in OpenLibrary it's definitely a book)
 *  2. OpenFDA (pharmaceutical)
 *  3. Name/brand heuristics (perfume, cologne, lipstick, etc.) — runs BEFORE
 *     falling back to generic "FOOD" for OFF hits, because OFF sometimes
 *     catalogs cosmetics as food by mistake.
 *  4. Open Beauty Facts / OFF / Datakick / UPCitemdb / barcodeLookup categories
 */
function determineProductType(offData, fdaData, barcodeData, obfData, libData, upcData, datakickData, barcodeSpiderData, eanDbData) {
  if (libData.found) return 'BOOK';
  if (fdaData.found) return 'PHARMACEUTICAL';

  // Gather every textual clue we have about what this product is
  const textBlobs = [
    offData.name, offData.brand, (offData.category || []).join(' '),
    obfData.name, obfData.brand, (obfData.category || []).join(' '),
    upcData.name, upcData.brand, (upcData.category || []).join(' '),
    datakickData.name, datakickData.brand,
    ((barcodeData.sources || [])[0] || {}).name,
    ((barcodeData.sources || [])[0] || {}).brand,
    // Round 25e — Barcode Spider & EAN-DB
    barcodeSpiderData && barcodeSpiderData.name,
    barcodeSpiderData && barcodeSpiderData.brand,
    barcodeSpiderData && barcodeSpiderData.category,
    barcodeSpiderData && barcodeSpiderData.subCategory,
    eanDbData && eanDbData.name,
    eanDbData && eanDbData.brand,
    eanDbData && (eanDbData.categories || []).join(' '),
  ].filter(Boolean).map(String).map(s => s.toLowerCase());
  const allText = textBlobs.join(' | ');

  // ── Keyword lists ─────────────────────────────────────────────────────────
  const hasAny = (kws) => kws.some(k => allText.includes(k));

  const FRAGRANCE_KWS     = ['perfume', 'fragrance', 'cologne', 'eau de toilette', 'eau de parfum', 'edp ', 'edt ', 'body mist', 'body spray'];
  const MAKEUP_KWS        = ['lipstick', 'mascara', 'eyeliner', 'foundation makeup', 'concealer', 'blush', 'eyeshadow', 'nail polish', 'lip gloss', 'lip balm'];
  const SKINCARE_KWS      = ['moisturiz', 'serum', 'face cream', 'face wash', 'cleanser', 'toner', 'sunscreen', 'spf', 'face mask', 'body lotion', 'body butter', 'face oil'];
  const HAIRCARE_KWS      = ['shampoo', 'conditioner', 'hair oil', 'hair mask', 'hair cream', 'relaxer', 'hair dye', 'hair spray', 'hair gel'];
  const PERSONAL_CARE_KWS = ['deodorant', 'antiperspirant', 'soap bar', 'body wash', 'shower gel', 'toothpaste', 'mouthwash', 'shaving cream', 'aftershave'];
  const ELECTRONICS_KWS   = ['battery', 'charger', 'cable', 'headphone', 'earphone', 'speaker', 'keyboard', 'mouse', 'laptop', 'tablet', 'phone case', 'screen protector', 'usb', 'hdmi', 'gaming', 'controller', 'console'];
  const AUTO_KWS          = ['motor oil', 'engine oil', 'brake', 'coolant', 'transmission fluid', 'car wax', 'windshield', 'tire', 'spark plug', 'air filter'];
  const PET_KWS           = ['dog food', 'cat food', 'pet food', 'dog treat', 'cat treat', 'pet treat', 'puppy', 'kitten', 'bird seed', 'fish food'];
  const SUPPLEMENT_KWS    = ['vitamin', 'supplement', 'probiotic', 'omega', 'protein powder', 'capsule', 'softgel', 'multivitamin', 'herbal supplement'];
  const BOOK_KWS          = ['isbn', 'paperback', 'hardcover', 'novel', 'author', 'publisher', 'edition'];

  // Household cleaning / dish / laundry products (fix Dawn ultra → BEVERAGE bug)
  const HOUSEHOLD_KWS     = [
    'dish soap', 'dishwashing', 'dish detergent', 'dishwasher', 'laundry detergent',
    'laundry soap', 'fabric softener', 'bleach', 'all-purpose cleaner', 'all purpose cleaner',
    'glass cleaner', 'window cleaner', 'bathroom cleaner', 'toilet cleaner', 'floor cleaner',
    'disinfectant', 'degreaser', 'stain remover', 'air freshener', 'surface cleaner',
    'dawn ', 'fairy liquid', 'cascade', 'tide ', 'persil', 'downy', 'lysol', 'clorox',
    'windex', 'mr. clean', 'mr clean', 'ajax', 'comet cleanser', 'swiffer', 'pine-sol',
    'febreze', 'scrubbing bubbles', 'palmolive dish', 'joy dish', 'method cleaner',
    'paper towel', 'toilet paper', 'trash bag', 'sponge', 'scouring pad',
  ];

  // Beverages — comprehensive list covering ALL alcohol types
  const BEVERAGE_KWS = [
    // ── Wine ──
    'wine', 'red wine', 'white wine', 'rosé', 'rose wine', 'sparkling wine',
    'champagne', 'prosecco', 'cava', 'port wine', 'dessert wine',
    // ── Beer ──
    'beer', 'lager', 'ale', 'stout', 'ipa', 'craft beer', 'pale ale', 'pilsner', 'sour beer',
    // ── Spirits ──
    'whiskey', 'whisky', 'bourbon', 'scotch', 'vodka', 'rum', 'tequila', 'gin',
    'brandy', 'cognac', 'spirit', 'liqueur', 'mead', 'hard cider', 'hard seltzer',
    'mezcal', 'sake', 'schnapps',
    // ── Soft drinks / juice ──
    'juice', 'soda', 'cola', 'energy drink', 'sports drink', 'lemonade', 'cider',
    // ── Water ──
    'water', 'sparkling water', 'mineral water', 'drinking water',
    // ── Dairy-based drinks ──
    'milk', 'oat milk', 'almond milk', 'soy milk', 'rice milk',
    // ── Other drinks ──
    'smoothie', 'kombucha', 'kefir drink', 'cold brew', 'coffee drink',
    'coffee', 'espresso', 'latte',
    'hot chocolate', 'cocoa drink',
  ];

  // Foods that should NOT be classified as BEVERAGE even if OFF puts them under beverages
  const SPICE_KWS  = ['spice', 'seasoning', 'herb', 'pepper', 'salt', 'cinnamon', 'cumin', 'turmeric',
    'oregano', 'basil', 'thyme', 'rosemary', 'paprika', 'chili', 'garlic powder', 'onion powder', 'curry', 'blend'];
  const SAUCE_KWS  = ['sauce', 'ketchup', 'mustard', 'mayo', 'dressing', 'paste', 'relish', 'marinade',
    'hot sauce', 'bbq sauce', 'sriracha', 'vinegar'];
  const TEA_KWS    = ['herbal tea', 'green tea', 'black tea', 'chamomile', 'peppermint tea',
    'rooibos', 'hibiscus tea', 'lemon tea', 'ginger tea', 'oolong', 'matcha', 'tea bag', 'tea leaves'];
  // Solid foods frequently mis-categorised as 'beverages' by upstream DBs
  // because they share dairy/drink aisles (eggs next to milk, etc.)
  const SOLID_FOOD_KWS = ['egg', 'eggs', 'cheese', 'yogurt', 'butter', 'bread', 'cracker',
    'biscuit', 'cookie', 'cereal', 'pasta', 'rice', 'flour', 'meat', 'chicken', 'beef', 'pork',
    'bacon', 'fish', 'fruit', 'vegetable', 'salad', 'snack', 'chip', 'nut', 'granola', 'bar',
    'jam', 'jelly', 'honey', 'chocolate bar', 'candy', 'gum', 'ice cream'];

  // ── Name-based detection (highest priority — overrides category labels) ───
  if (hasAny(FRAGRANCE_KWS))     return 'FRAGRANCE';
  if (hasAny(MAKEUP_KWS))        return 'MAKEUP';
  if (hasAny(SKINCARE_KWS))      return 'SKINCARE';
  if (hasAny(HAIRCARE_KWS))      return 'HAIR_CARE';
  if (hasAny(HOUSEHOLD_KWS))     return 'HOUSEHOLD';       // Before beverage → Dawn dish soap, Tide, etc.
  if (hasAny(PERSONAL_CARE_KWS)) return 'COSMETIC';
  if (hasAny(ELECTRONICS_KWS))   return 'ELECTRONICS';
  if (hasAny(AUTO_KWS))          return 'AUTOMOTIVE';
  if (hasAny(PET_KWS))           return 'PET_SUPPLIES';
  if (hasAny(SUPPLEMENT_KWS))    return 'SUPPLEMENT';
  if (hasAny(BOOK_KWS) && libData.found) return 'BOOK';

  // Beverages: name-keyword match AND not a solid food (spice/tea/sauce/solid-food/household)
  const nameSuggestsBeverage = hasAny(BEVERAGE_KWS);
  const nameSuggestsFood     = hasAny([...SPICE_KWS, ...SAUCE_KWS, ...SOLID_FOOD_KWS]);
  const nameSuggestsTea      = hasAny(TEA_KWS);
  const nameSuggestsHousehold = hasAny(HOUSEHOLD_KWS);

  // Solid foods take priority over any ambiguous beverage cue
  if (hasAny(SOLID_FOOD_KWS) && !nameSuggestsBeverage) return 'FOOD';

  if (nameSuggestsBeverage && !nameSuggestsFood && !nameSuggestsTea && !nameSuggestsHousehold) return 'BEVERAGE';

  // ── Beauty database (OBF) ────────────────────────────────────────────────
  if (obfData.found) {
    const cats = obfData.category || [];
    const catStr = cats.join(' ').toLowerCase();
    if (catStr.includes('perfume') || catStr.includes('fragrance')) return 'FRAGRANCE';
    if (catStr.includes('make-up') || catStr.includes('makeup'))    return 'MAKEUP';
    if (catStr.includes('hair'))                                     return 'HAIR_CARE';
    if (catStr.includes('skin') || catStr.includes('body'))         return 'SKINCARE';
    return 'COSMETIC';
  }

  // ── Open Food Facts category ─────────────────────────────────────────────
  if (offData.found) {
    const cats = offData.category || [];
    const catStr = cats.join(' ').toLowerCase();

    if (catStr.includes('cosmetic') || catStr.includes('beauty') || catStr.includes('personal-care')) return 'COSMETIC';
    if (catStr.includes('fragrance') || catStr.includes('perfume')) return 'FRAGRANCE';
    if (catStr.includes('supplement') || catStr.includes('vitamin')) return 'SUPPLEMENT';
    if (catStr.includes('household') || catStr.includes('cleaning') || catStr.includes('detergent') || catStr.includes('laundry') || catStr.includes('dish')) return 'HOUSEHOLD';

    // OFF's "Beverages" category is unreliable (tags teas, spices, etc.)
    // Only trust it when the name also confirms it's a drink
    if (catStr.includes('beverage') || catStr.includes('drink') || catStr.includes('wine') || catStr.includes('beer') || catStr.includes('spirit')) {
      if (nameSuggestsBeverage && !nameSuggestsFood && !nameSuggestsTea && !nameSuggestsHousehold) return 'BEVERAGE';
    }

    return 'FOOD';
  }

  // ── Barcode Spider category ──────────────────────────────────────────────
  if (barcodeSpiderData && barcodeSpiderData.found) {
    const cat = ((barcodeSpiderData.category || '') + ' ' + (barcodeSpiderData.subCategory || '')).toLowerCase();
    if (cat.includes('household') || cat.includes('cleaning') || cat.includes('detergent') || cat.includes('laundry') || cat.includes('dish soap') || cat.includes('dishwash')) return 'HOUSEHOLD';
    if (cat.includes('wine') || cat.includes('beer') || cat.includes('spirit') || cat.includes('liquor') || cat.includes('beverage') || cat.includes('drink')) return 'BEVERAGE';
    if (cat.includes('grocery') || cat.includes('food') || cat.includes('spice') || cat.includes('condiment')) return 'FOOD';
    if (cat.includes('beauty') || cat.includes('personal care') || cat.includes('cosmetic')) return 'COSMETIC';
    if (cat.includes('health') || cat.includes('supplement') || cat.includes('vitamin')) return 'SUPPLEMENT';
    if (cat.includes('electronic') || cat.includes('computer') || cat.includes('phone') || cat.includes('gaming')) return 'ELECTRONICS';
    if (cat.includes('pet')) return 'PET_SUPPLIES';
    if (cat.includes('auto') || cat.includes('vehicle')) return 'AUTOMOTIVE';
  }

  // ── EAN-DB categories (Google taxonomy) ─────────────────────────────────
  if (eanDbData && eanDbData.found) {
    const cats = (eanDbData.categories || []).join(' ').toLowerCase();
    if (cats.includes('wine') || cats.includes('beer') || cats.includes('spirit') || cats.includes('beverage') || cats.includes('drink')) return 'BEVERAGE';
    if (cats.includes('food') || cats.includes('grocery')) return 'FOOD';
    if (cats.includes('beauty') || cats.includes('cosmetic') || cats.includes('personal care')) return 'COSMETIC';
    if (cats.includes('supplement') || cats.includes('vitamin') || cats.includes('health')) return 'SUPPLEMENT';
    if (cats.includes('electronic') || cats.includes('software') || cats.includes('gaming')) return 'ELECTRONICS';
    if (cats.includes('book') || cats.includes('print')) return 'BOOK';
    if (cats.includes('pet')) return 'PET_SUPPLIES';
  }

  // ── UPCitemdb fallback ───────────────────────────────────────────────────
  if (datakickData.found) return 'FOOD';
  if (upcData.found) {
    const cat = (upcData.category && upcData.category[0]) ? upcData.category[0].toLowerCase() : '';
    if (cat.includes('electron'))                                         return 'ELECTRONICS';
    if (cat.includes('auto'))                                             return 'AUTOMOTIVE';
    if (cat.includes('fragrance') || cat.includes('perfume'))             return 'FRAGRANCE';
    if (cat.includes('health') || cat.includes('beauty') || cat.includes('cosmetic')) return 'COSMETIC';
    if (cat.includes('food') || cat.includes('grocery'))                  return 'FOOD';
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('wine') || cat.includes('beer')) return 'BEVERAGE';
    if (cat.includes('book'))                                             return 'BOOK';
    if (cat.includes('pet'))                                              return 'PET_SUPPLIES';
    return 'CONSUMER_GOOD';
  }
  if (barcodeData.sources && barcodeData.sources.length > 0) {
    const cat = barcodeData.sources[0].category;
    if (cat) {
      const catLower = (typeof cat === 'string' ? cat : cat[0] || '').toLowerCase();
      if (catLower.includes('electron'))                               return 'ELECTRONICS';
      if (catLower.includes('auto'))                                   return 'AUTOMOTIVE';
      if (catLower.includes('fragrance') || catLower.includes('perfume')) return 'FRAGRANCE';
      if (catLower.includes('health') || catLower.includes('beauty') || catLower.includes('cosmetic')) return 'COSMETIC';
      if (catLower.includes('wine') || catLower.includes('beer') || catLower.includes('spirit') || catLower.includes('beverage')) return 'BEVERAGE';
    }
    return 'CONSUMER_GOOD';
  }
  return 'UNKNOWN';
}


/**
 * Build unified product info from all sources
 */
function buildProductInfo(offData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info, productType, amazonData, barcodeSpiderDataRef, eanDbDataRef, eanSearchData, opfData, opetfData, wikidataData, mfdsData, obfRegionalData, offRegionalData) {
  const info = {
    name: null,
    brand: null,
    manufacturer: null,
    country: null,
    image: null,
    description: null,
    details: {}
  };

  // Round 25c — HIGH-AUTHORITY OVERRIDE: when Amazon's PA-API returned an
  // *exact* barcode match (same EAN/UPC digits), its data is strictly more
  // reliable than crowd-sourced databases (OFF / UPCitemdb / Datakick) which
  // are known to have duplicate-barcode pollution (e.g. the same UPC filed
  // under both a seasoning AND a video game). Put Amazon's exact match
  // FIRST so downstream fallbacks can't overwrite its values.
  if (amazonData && amazonData.found && amazonData.isExactMatch) {
    info.name         = amazonData.name;
    info.brand        = amazonData.brand;
    info.manufacturer = amazonData.manufacturer;
    info.image        = amazonData.image;
    info.description  = amazonData.features && amazonData.features.join(' • ');
    info.details.amazonCategory = amazonData.category;
    info.details.asin           = amazonData.asin;
    info.details.amazonPrice    = amazonData.price;
    info.details.amazonUrl      = amazonData.detailPageURL;
  }

  // Priority: Open Food Facts > FDA > UPCitemdb > Datakick > Barcode sources > Open Library
  if (offData.found) {
    info.name = offData.name;
    info.brand = offData.brand;
    info.manufacturer = offData.manufacturer;
    info.country = offData.country ? offData.country[0] : null;
    info.image = offData.image;
    info.details.ingredients = offData.ingredients;
    info.details.nutritionGrade = offData.nutritionGrade;
    info.details.packaging = offData.packaging;
    info.details.labels = offData.labels;
    info.details.quantity = offData.quantity;
  }

  if (fdaData.found) {
    info.name = info.name || fdaData.brandName;
    info.brand = info.brand || fdaData.brandName;
    info.manufacturer = info.manufacturer || fdaData.manufacturer;
    info.details.activeIngredients = fdaData.activeIngredients;
    info.details.dosageForm = fdaData.dosageForm;
    info.details.route = fdaData.route;
    info.details.marketingCategory = fdaData.marketingCategory;
    info.details.ndc = fdaData.ndc;
  }

  if (upcData.found) {
    info.name = info.name || upcData.name;
    info.brand = info.brand || upcData.brand;
    info.manufacturer = info.manufacturer || upcData.manufacturer;
    info.image = info.image || upcData.image;
    info.description = info.description || upcData.description;
    info.details.size = upcData.size;
    info.details.color = upcData.color;
    info.details.weight = upcData.weight;
    info.details.upcOffers = upcData.offers;
  }

  if (datakickData.found) {
    info.name = info.name || datakickData.name;
    info.brand = info.brand || datakickData.brand;
    info.manufacturer = info.manufacturer || datakickData.manufacturer;
    info.image = info.image || datakickData.image;
    info.details.servingSize = datakickData.servingSize;
    info.details.ingredients = info.details.ingredients || datakickData.ingredients;
    if (datakickData.nutrition) info.details.nutrition = datakickData.nutrition;
  }

  if (barcodeData.sources && barcodeData.sources.length > 0) {
    const bs = barcodeData.sources[0];
    info.name = info.name || bs.name;
    info.brand = info.brand || bs.brand;
    info.manufacturer = info.manufacturer || bs.manufacturer;
    info.image = info.image || (bs.images && bs.images[0]) || bs.image;
    info.description = info.description || bs.description;
    info.details.barcodeSources = barcodeData.sources.map(s => s.source);
  }

  if (obfData.found) {
    info.name = info.name || obfData.name;
    info.brand = info.brand || obfData.brand;
    info.manufacturer = info.manufacturer || obfData.manufacturer;
    info.country = info.country || (obfData.country ? obfData.country[0] : null);
    info.image = info.image || obfData.image;
    info.details.ingredients = info.details.ingredients || obfData.ingredients;
    info.details.packaging = info.details.packaging || obfData.packaging;
    info.details.labels = info.details.labels || obfData.labels;
  }

  if (libData.found) {
    info.name = info.name || libData.name;
    info.brand = info.brand || (libData.authors ? libData.authors[0] : null);
    info.manufacturer = info.manufacturer || (libData.publishers ? libData.publishers[0] : null);
    info.image = info.image || libData.image;
    info.description = info.description || libData.description;
    info.details.authors = libData.authors;
    info.details.publishers = libData.publishers;
    info.details.publishYear = libData.publishYear;
    info.details.isbn = libData.isbn13 || libData.isbn10;
    info.details.pages = libData.pages;
    info.details.subjects = libData.subjects;
  }

  // Round 25c — Amazon fallback (non-exact match still valuable for enrichment)
  if (amazonData && amazonData.found && !amazonData.isExactMatch) {
    info.name         = info.name         || amazonData.name;
    info.brand        = info.brand        || amazonData.brand;
    info.manufacturer = info.manufacturer || amazonData.manufacturer;
    info.image        = info.image        || amazonData.image;
    info.description  = info.description  || (amazonData.features && amazonData.features.join(' • '));
  }

  // Round 25e — Barcode Spider fallback (fills gaps when all other sources miss)
  // It's a real product catalog with images, so it's great for items not in
  // Open Food Facts / UPCitemdb / Amazon (e.g. regional / private-label products)
  if (info.name === null || info.name === 'Unknown') {
    if (barcodeSpiderDataRef && barcodeSpiderDataRef.found) {
      info.name         = info.name  && info.name  !== 'Unknown' ? info.name  : barcodeSpiderDataRef.name;
      info.brand        = info.brand && info.brand !== 'Unknown' ? info.brand : barcodeSpiderDataRef.brand;
      info.manufacturer = info.manufacturer && info.manufacturer !== 'Unknown' ? info.manufacturer : barcodeSpiderDataRef.manufacturer;
      info.image        = info.image        || barcodeSpiderDataRef.image;
      info.description  = info.description  || barcodeSpiderDataRef.description;
      info.details.barcodeSpiderCategory = barcodeSpiderDataRef.category;
      info.details.barcodeSpiderStores   = barcodeSpiderDataRef.stores;
    }
  } else if (barcodeSpiderDataRef && barcodeSpiderDataRef.found) {
    // Even when we have a name, fill in missing fields from Barcode Spider
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : barcodeSpiderDataRef.brand;
    info.manufacturer = info.manufacturer && info.manufacturer !== 'Unknown' ? info.manufacturer : barcodeSpiderDataRef.manufacturer;
    info.image        = info.image        || barcodeSpiderDataRef.image;
    info.description  = info.description  || barcodeSpiderDataRef.description;
    info.details.barcodeSpiderCategory = info.details.barcodeSpiderCategory || barcodeSpiderDataRef.category;
    info.details.barcodeSpiderStores   = info.details.barcodeSpiderStores   || barcodeSpiderDataRef.stores;
  }

  // EAN-Search.org: fill gaps not covered by above sources
  // Has broad international coverage including fashion/apparel items
  if (eanSearchData && eanSearchData.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : eanSearchData.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : eanSearchData.brand;
    info.details.eanSearchCategory   = eanSearchData.category ? eanSearchData.category[0] : null;
    info.details.eanSearchCountry    = eanSearchData.issuing_country || null;
  }

  // Round 25e — EAN-DB: final-resort fill (last in chain, catches products
  // that even Barcode Spider doesn't carry — multilingual catalog, global coverage)
  if (eanDbDataRef && eanDbDataRef.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : eanDbDataRef.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : eanDbDataRef.brand;
    info.manufacturer = info.manufacturer && info.manufacturer !== 'Unknown' ? info.manufacturer : eanDbDataRef.manufacturer;
    info.image        = info.image        || eanDbDataRef.image;
    info.description  = info.description  || null; // EAN-DB doesn't provide descriptions
    info.country      = info.country      || eanDbDataRef.country;
    info.details.eanDbCategories    = eanDbDataRef.categories;
    info.details.eanDbBarcodeType   = eanDbDataRef.barcodeType;
    info.details.eanDbRelatedBrands = eanDbDataRef.relatedBrands;
  }

  // Round 28b — Open Products Facts (non-food consumer goods)
  // Same data quality as Open Food Facts, just for hardware/stationery/etc.
  // Closes the gap for Tide / iPhone Cases / Listerine etc.
  if (opfData && opfData.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : opfData.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : opfData.brand;
    info.manufacturer = info.manufacturer && info.manufacturer !== 'Unknown' ? info.manufacturer : opfData.manufacturer;
    info.image        = info.image        || opfData.image;
    info.country      = info.country      || (Array.isArray(opfData.country) ? opfData.country[0] : opfData.country);
    info.details.openProductsFactsCategory = opfData.category && opfData.category[0];
  }

  // Round 28b — Open Pet Food Facts (pet food / treats / supplies)
  if (opetfData && opetfData.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : opetfData.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : opetfData.brand;
    info.manufacturer = info.manufacturer && info.manufacturer !== 'Unknown' ? info.manufacturer : opetfData.manufacturer;
    info.image        = info.image        || opetfData.image;
    info.country      = info.country      || (Array.isArray(opetfData.country) ? opetfData.country[0] : opetfData.country);
    info.details.openPetFoodFactsPetType  = opetfData.petType;
    info.details.openPetFoodFactsCategory = opetfData.category && opetfData.category[0];
  }

  // Round 28b — Wikidata (authoritative cross-reference: brand → manufacturer
  // → parent company, country of origin, official label)
  // Wikidata is HIGHEST authority for brand/manufacturer/country fields, so
  // we *override* a missing or "Unknown" value but never overwrite a confirmed one.
  if (wikidataData && wikidataData.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : wikidataData.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : wikidataData.brand;
    info.manufacturer = info.manufacturer && info.manufacturer !== 'Unknown' ? info.manufacturer : wikidataData.manufacturer;
    // Wikidata's country-of-origin is authoritative — prefer it over OFF-tagged country
    if (wikidataData.country && wikidataData.country !== 'Unknown') {
      info.country = wikidataData.country;
    } else if (!info.country) {
      info.country = wikidataData.country;
    }
    info.description  = info.description  || wikidataData.description;
    info.details.wikidataId          = wikidataData.wikidataId;
    info.details.wikidataUrl         = wikidataData.wikidataUrl;
    info.details.wikidataParent      = wikidataData.parentCompany;
    info.details.wikidataInception   = wikidataData.inceptionDate;
  }

  // Round 29c — Korean MFDS (food import database for KR market)
  if (mfdsData && mfdsData.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : mfdsData.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : mfdsData.manufacturer;
    info.manufacturer = info.manufacturer && info.manufacturer !== 'Unknown' ? info.manufacturer : mfdsData.manufacturer;
    info.image        = info.image        || mfdsData.imageUrl;
    info.country      = info.country      || mfdsData.country;
    info.details.mfdsRegistrationDate = mfdsData.registrationDate;
    info.details.mfdsValidUntil       = mfdsData.validUntil;
  }

  // Round 29c — Open Beauty Facts regional mirror (cosmetics in NG, IN, BR, ZA, …)
  if (obfRegionalData && obfRegionalData.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : obfRegionalData.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : obfRegionalData.brand;
    info.image        = info.image        || obfRegionalData.imageUrl;
    info.country      = info.country      || obfRegionalData.country;
    info.category     = info.category     || obfRegionalData.category;
    info.details.obfRegionalMatchedMirror = obfRegionalData.matchedMirror;
    info.details.obfRegionalCountryCode   = obfRegionalData.countryCode;
  }

  // Round 29c — Open Food Facts deep regional mirror (Africa / Asia / LatAm)
  if (offRegionalData && offRegionalData.found) {
    info.name         = info.name         && info.name         !== 'Unknown' ? info.name         : offRegionalData.name;
    info.brand        = info.brand        && info.brand        !== 'Unknown' ? info.brand        : offRegionalData.brand;
    info.image        = info.image        || offRegionalData.imageUrl;
    info.country      = info.country      || offRegionalData.country;
    info.category     = info.category     || offRegionalData.category;
    info.details.offRegionalMatchedMirror = offRegionalData.matchedMirror;
    info.details.offRegionalCountryCode   = offRegionalData.countryCode;
  }

  info.gs1Region = gs1Info ? gs1Info.country : (barcodeData.gs1 ? barcodeData.gs1.region : null);
  info.barcodeType = gs1Info ? gs1Info.barcodeType : (barcodeData.gs1 ? barcodeData.gs1.barcodeType : null);

  // ─── Country-of-origin override ─────────────────────────────────────────
  // Open Food Facts is a French-based database where contributors often tag
  // the country where THEY bought the product (e.g. "France") rather than
  // the actual country of origin. This produces wrong results like
  // "Bragg Apple Cider Vinegar (USA product, GS1 prefix 0) → origin: France".
  //
  // Fix: if GS1 returned a valid country AND either the current country is
  // empty OR the current country obviously disagrees with GS1 (different
  // region), prefer the GS1 country.  We keep OFF's country only when the
  // GS1 prefix is unknown or when countries already match.
  const gs1Country = info.gs1Region && info.gs1Region !== 'Unknown' ? info.gs1Region : null;
  if (gs1Country) {
    const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');
    const currentN = normalize(info.country);
    const gs1N = normalize(gs1Country);
    // Match "United States / Canada" containing "united states" etc.
    const currentMatchesGs1 = currentN && (currentN.includes(gs1N) || gs1N.includes(currentN));
    if (!info.country || !currentMatchesGs1) {
      // Replace the distributed-in country with the GS1 country-of-origin.
      // We keep the old value in details so it's still visible if the user cares.
      if (info.country) info.details.distributedInCountry = info.country;
      info.country = gs1Country;
    }
  }

  return info;
}

/**
 * Cross-reference check between all sources
 */
function crossReferenceCheck(offData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info, amazonData, barcodeSpiderData, eanDbData, eanSearchData) {
  const checks = [];

  checks.push({
    check: 'Barcode registered in Open Food Facts',
    passed: offData.found,
    details: offData.found ? `Found: ${offData.name} by ${offData.brand}` : 'Not found'
  });

  checks.push({
    check: 'Barcode registered in FDA database',
    passed: fdaData.found,
    details: fdaData.found ? `Found: ${fdaData.brandName} (${fdaData.ndc})` : 'Not found (may not be a drug)'
  });

  const barcodeFound = barcodeData.sources && barcodeData.sources.length > 0;
  checks.push({
    check: 'Barcode found in commercial databases',
    passed: barcodeFound,
    details: barcodeFound ? `Found in ${barcodeData.sources.length} source(s)` : 'Not found'
  });

  checks.push({
    check: 'Barcode registered in Open Beauty Facts',
    passed: obfData.found,
    details: obfData.found ? `Found: ${obfData.name} by ${obfData.brand}` : 'Not found (may not be a cosmetic product)'
  });

  checks.push({
    check: 'Barcode found in UPCitemdb',
    passed: upcData.found,
    details: upcData.found ? `Found: ${upcData.name} by ${upcData.brand}` : 'Not found'
  });

  checks.push({
    check: 'Barcode found in Datakick grocery database',
    passed: datakickData.found,
    details: datakickData.found ? `Found: ${datakickData.name} by ${datakickData.brand}` : 'Not found'
  });

  checks.push({
    check: 'ISBN found in Open Library (books only)',
    passed: libData.found,
    details: libData.found ? `Found: "${libData.name}" ${libData.authors ? 'by ' + libData.authors[0] : ''}` : 'Not found (may not be a book)'
  });

  const gs1Valid = gs1Info && gs1Info.country && gs1Info.country !== 'Unknown';
  checks.push({
    check: 'GS1 country prefix is valid',
    passed: gs1Valid,
    details: gs1Valid ? `Country: ${gs1Info.country} (prefix: ${gs1Info.prefix})` : 'Could not determine country from prefix'
  });

  const brands = [];
  if (offData.found && offData.brand !== 'Unknown') brands.push(offData.brand);
  if (fdaData.found && fdaData.brandName !== 'Unknown') brands.push(fdaData.brandName);
  if (upcData.found && upcData.brand !== 'Unknown') brands.push(upcData.brand);
  if (datakickData.found && datakickData.brand !== 'Unknown') brands.push(datakickData.brand);
  if (amazonData && amazonData.found && amazonData.brand && amazonData.brand !== 'Unknown') brands.push(amazonData.brand);
  if (barcodeSpiderData && barcodeSpiderData.found && barcodeSpiderData.brand && barcodeSpiderData.brand !== 'Unknown') brands.push(barcodeSpiderData.brand);
  if (eanDbData && eanDbData.found && eanDbData.brand && eanDbData.brand !== 'Unknown') brands.push(eanDbData.brand);
  if (eanSearchData && eanSearchData.found && eanSearchData.brand && eanSearchData.brand !== 'Unknown') brands.push(eanSearchData.brand);
  if (barcodeData.sources) barcodeData.sources.forEach(s => { if (s.brand && s.brand !== 'Unknown') brands.push(s.brand); });

  // Fuzzy brand matching: treat "Mrs Dash" / "Ms Dash" / "Dash" as the same,
  // "Coca-Cola" / "Coca Cola" / "Cocacola" as the same, etc. A real brand
  // inconsistency looks like "Nestle" vs "Kellogg's" — totally unrelated words.
  const normalizeBrand = (b) => String(b || '')
    .toLowerCase()
    .replace(/[®™©]/g, '')
    // strip common honorifics/prefixes/suffixes
    .replace(/\b(mrs?|ms|mr|dr|sir|the|a|an|co|inc|ltd|llc|plc|corp|corporation|company|brand|sa|gmbh|srl|spa)\.?\b/g, '')
    // strip punctuation and collapse whitespace
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const brandsSimilar = (a, b) => {
    const na = normalizeBrand(a);
    const nb = normalizeBrand(b);
    if (!na || !nb) return true;
    if (na === nb) return true;
    // One contains the other (e.g., "dash" in "mrs dash")
    if (na.includes(nb) || nb.includes(na)) return true;
    // Share a significant token (>= 4 chars) — e.g., "coca cola" and "cocacola"
    const tokensA = na.split(/\s+/).filter(t => t.length >= 4);
    const tokensB = nb.split(/\s+/).filter(t => t.length >= 4);
    if (tokensA.some(t => tokensB.includes(t))) return true;
    // Smashed vs spaced: remove all whitespace and compare
    if (na.replace(/\s+/g, '') === nb.replace(/\s+/g, '')) return true;
    return false;
  };

  // All brands must be pairwise-similar for "consistent" to pass
  let brandConsistent = true;
  if (brands.length > 1) {
    outer: for (let i = 0; i < brands.length; i++) {
      for (let j = i + 1; j < brands.length; j++) {
        if (!brandsSimilar(brands[i], brands[j])) { brandConsistent = false; break outer; }
      }
    }
  }

  checks.push({
    check: 'Brand name consistent across sources',
    passed: brands.length > 0 ? brandConsistent : null,
    details: brands.length > 0 ? `Brands found: ${[...new Set(brands)].join(', ')}` : 'No brand data to compare'
  });

  // Round 25c — Category consistency
  // Catches the "same barcode filed under two wildly different products"
  // failure mode of crowd-sourced DBs (e.g. OFF says BEVERAGE, Amazon says
  // VIDEO_GAME for the exact same UPC — classic duplicate-barcode pollution).
  // Groups similar categories together (food / beverage / grocery are all "food").
  const categoryGroup = (raw) => {
    const c = String(raw || '').toLowerCase();
    if (!c) return null;
    if (/food|grocer|beverage|drink|snack|seasoning|spice|condiment|breakfast|cereal|dairy|meat|produce|candy|chocolate|coffee|tea|wine|spirit|beer|alcohol/.test(c)) return 'food_beverage';
    if (/beauty|cosmetic|skincare|hair|makeup|fragrance|personal[_ ]?care/.test(c)) return 'beauty';
    if (/drug|medication|pharma|medicine|supplement|vitamin|otc/.test(c)) return 'health';
    if (/electronic|computer|phone|tablet|tv|audio|camera|video[_ ]?game|console|gaming|software|dvd|blu[- ]?ray/.test(c)) return 'electronics';
    if (/toy|game|puzzle|doll|lego/.test(c) && !/video[_ ]?game/.test(c)) return 'toys';
    if (/apparel|cloth|shoe|footwear|textile|fashion/.test(c)) return 'apparel';
    if (/book|literature|magazine/.test(c)) return 'books';
    if (/auto|vehicle|motor|car[_ ]?part/.test(c)) return 'automotive';
    if (/home|kitchen|furniture|garden|tool|hardware/.test(c)) return 'home_goods';
    return 'other';
  };

  const categoryGroups = [];
  const categoryRaw = [];
  const pushCat = (raw) => {
    if (!raw) return;
    const g = categoryGroup(raw);
    if (g && g !== 'other') {
      categoryGroups.push(g);
      categoryRaw.push(String(raw));
    }
  };
  if (offData.found)              pushCat(offData.category || offData.categories);
  if (upcData.found)              pushCat(upcData.category);
  if (datakickData.found)         pushCat(datakickData.category);
  if (amazonData && amazonData.found) {
    pushCat(amazonData.category);
    pushCat(amazonData.binding);
  }
  if (obfData.found)              pushCat(obfData.category || 'beauty');
  if (barcodeSpiderData && barcodeSpiderData.found) {
    pushCat(barcodeSpiderData.category);
    pushCat(barcodeSpiderData.subCategory);
  }
  if (eanDbData && eanDbData.found) {
    (eanDbData.categories || []).forEach(c => pushCat(c));
  }

  const uniqueGroups = [...new Set(categoryGroups)];
  checks.push({
    check: 'Product category consistent across sources',
    passed: categoryGroups.length > 0 ? uniqueGroups.length <= 1 : null,
    details: categoryGroups.length > 0
      ? (uniqueGroups.length <= 1
          ? `All sources agree: ${uniqueGroups[0]}`
          : `CATEGORY CONFLICT — sources disagree: ${[...new Set(categoryRaw)].slice(0, 4).join(' vs ')}`)
      : 'No category data to compare',
  });

  const passedChecks = checks.filter(c => c.passed === true).length;
  const totalChecks = checks.filter(c => c.passed !== null).length;

  return {
    checks,
    passed: passedChecks,
    total: totalChecks,
    percentage: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0
  };
}

/**
 * Detect counterfeit / fake product signals.
 * Returns { isCounterfeit, confidence, signals[] }
 */
function detectCounterfeitSignals({
  barcode, trustScore, foundSources, recalls, gs1Info,
  productInfo, effectiveOffData, fdaData, barcodeData,
  obfData, upcData, datakickData, crossRef,
  amazonData, productWorldData,
}) {
  const signals = [];
  let signalScore = 0;

  // Round 25c — Authority override.
  // When Amazon (a multi-billion-dollar catalog with verified seller data)
  // returns an EXACT barcode match, it's the highest-quality single source
  // we have. Use its presence to suppress false-positive signals generated
  // by lower-quality crowd-sourced records that contradict it.
  const amazonAuthoritative = Boolean(amazonData && amazonData.found && amazonData.isExactMatch);

  // Round 30: Compute rich sources count — sources with actual product names
  // (not just empty hits or jurisdiction-only confirmations). This is used to
  // calibrate counterfeit signal severity when evidence is thin.
  const richSourcesCount = (foundSources || []).filter(s => s && s.name && s.name !== 'Unknown' && String(s.name).trim().length > 0 && !s.isSearchResult).length;

  // Signal 1: Active recall (CPSC / FDA)
  // Only trigger on REAL recalls with a meaningful description/reason — many
  // FDA enforcement lookups return rows that happen to contain the brand name
  // as part of a totally-unrelated product. A real recall has a description,
  // reason, or recall number.
  if (recalls && recalls.length > 0) {
    const realRecall = recalls.find(r => (r && (r.description || r.reason || r.productDescription || r.recall_number || r.recallNumber)));
    if (realRecall) {
      const desc = realRecall.description || realRecall.reason || realRecall.productDescription || 'Active product recall';
      signals.push({ type: 'ACTIVE_RECALL', severity: 'HIGH', description: `Product under active recall: ${desc}`, source: realRecall.source || 'FDA/CPSC' });
      signalScore += 40;
    }
  }

  // Signal 2: GS1 prefix country conflicts with claimed product origin
  // Trigger ONLY when NONE of the claimed countries match the GS1 country.
  if (gs1Info && gs1Info.country && gs1Info.country !== 'Unknown') {

    // Normalize a country string for fuzzy comparison:
    //   "United States / Canada"  → "united states  canada"
    //   "united-states"           → "united states"
    //   "US"                      → "united states"  (via alias map)
    //   "USA"                     → "united states"
    //   "Great Britain"           → "united kingdom"
    const normalizeCountry = (raw) => {
      let s = String(raw || '').toLowerCase()
        .replace(/[/_|]+/g, ' ')   // slashes, underscores, pipes → space
        .replace(/-/g, ' ')         // hyphens → space (united-states → united states)
        .replace(/[®™©,;()]/g, '')  // strip misc punctuation
        .replace(/\s+/g, ' ')       // collapse whitespace
        .trim();
      // Common alias normalisations
      const aliases = {
        'us': 'united states', 'usa': 'united states',
        'u.s.': 'united states', 'u.s.a.': 'united states',
        'uk': 'united kingdom', 'gb': 'united kingdom',
        'great britain': 'united kingdom',
        'england': 'united kingdom',
        'prc': 'china', "people's republic of china": 'china',
        'republic of korea': 'korea', 'south korea': 'korea',
        'north korea': 'korea',
        'russian federation': 'russia',
        'deutschland': 'germany',
        'france metropolitan': 'france',
        'the netherlands': 'netherlands', 'holland': 'netherlands',
        'czech republic': 'czechia',
        // French-language names (OpenFoodFacts)
        'allemagne': 'germany', 'belgique': 'belgium', 'espagne': 'spain',
        'inde': 'india', 'maroc': 'morocco', 'pays-bas': 'netherlands',
        'pologne': 'poland', 'roumanie': 'romania', 'royaume-uni': 'united kingdom',
        'suisse': 'switzerland', 'turquie': 'turkey', 'etats-unis': 'united states',
        'italie': 'italy', 'grece': 'greece', 'japon': 'japan', 'coree': 'korea',
        'bresil': 'brazil', 'russie': 'russia', 'chine': 'china',
      };
      return aliases[s] || s;
    };

    // "United States / Canada" expands to ["united states", "canada"]
    // IMPORTANT: split on the RAW string BEFORE normalizeCountry() runs,
    // because normalizeCountry converts "/" → space which destroys the delimiter.
    const expandGs1 = (raw) => {
      // Split on "/" or " or " or " and " in the original string first
      const parts = String(raw || '').split(/\s*[/|]\s*|\s+(?:or|and)\s+/i).filter(Boolean);
      // Then normalise each part individually
      return parts.map(p => normalizeCountry(p.trim())).filter(Boolean);
    };

    const gs1Variants = expandGs1(gs1Info.country);  // e.g. ["united states", "canada"]

    // Round 30f: Track WHICH sources actually contributed a country claim,
    // not just how many sources exist overall. This matters because
    // richSourcesCount (below) counts ANY source with a product name —
    // including UPCitemdb, which never returns country data at all. Using
    // that generic count to decide MEDIUM vs HIGH severity meant the exact
    // same country-mismatch evidence could flip severity purely based on
    // whether a non-authoritative, country-blind source (UPCitemdb) happened
    // to respond before its network timeout on a given call (observed live:
    // Optimum Nutrition Whey Gold Standard 748927028690 flipped between
    // COUNTERFEIT 65% and LIKELY_AUTHENTIC 50% run-to-run with identical
    // country data, solely because UPCitemdb timed out or not). Severity must
    // instead be based on how many INDEPENDENT sources actually supplied a
    // country claim that disagrees with the GS1 prefix.
    const countryEvidenceSources = [];
    if (effectiveOffData.country) countryEvidenceSources.push('Open Food Facts');
    if (upcData.country) countryEvidenceSources.push('UPCitemdb');
    if (datakickData.country) countryEvidenceSources.push('Datakick');
    if (productInfo && productInfo.countryOfOrigin) countryEvidenceSources.push('ProductInfo');
    const countryEvidenceCount = countryEvidenceSources.length;

    const rawClaimed = [effectiveOffData.country, upcData.country, datakickData.country, productInfo && productInfo.countryOfOrigin].filter(Boolean);
    const claimedCountries = rawClaimed.flatMap(c => {
      if (Array.isArray(c)) return c.filter(Boolean).map(x => normalizeCountry(String(x)));
      return [normalizeCountry(String(c))];
    });

    // A match is: any claimed country token overlaps with any GS1 variant
    // (substring in either direction handles "united states" ↔ "united states  canada")
    const anyMatch = claimedCountries.some(claimed =>
      gs1Variants.some(gs1v =>
        claimed && gs1v && (claimed.includes(gs1v) || gs1v.includes(claimed))
      )
    );

    // Exclude noise values
    const noiseValues = ['unknown', 'n/a', 'various', 'global', 'eu', 'european union', 'world', ''];
    const nonNoiseClaimed = claimedCountries.filter(c => c && !noiseValues.includes(c));

    if (!anyMatch && nonNoiseClaimed.length > 0) {
      // If Amazon has an exact barcode match, its data is more reliable
      // than a foreign-country claim from a crowd-sourced DB. Downgrade.
      if (amazonAuthoritative) {
        signals.push({
          type: 'COUNTRY_DATA_NOTE',
          severity: 'LOW',
          description: `Minor country-data discrepancy between barcode prefix (${gs1Info.country}) and a secondary source (${[...new Set(nonNoiseClaimed)].slice(0, 2).join(', ')}) — Amazon's exact-match record is being trusted.`,
        });
        // No signalScore contribution
      } else if (countryEvidenceCount <= 1) {
        // Round 30f: Severity is now gated on countryEvidenceCount (how many
        // sources actually supplied a country claim), NOT richSourcesCount
        // (how many sources returned ANY product data, including
        // country-blind ones like UPCitemdb). With only 0-1 sources actually
        // claiming a country, a mismatch is almost always a data quality
        // artifact (one crowd-sourced DB says "France" while the GS1 prefix
        // says "United States" because the brand registered/sells there too —
        // completely normal for multinational brands). Downgrade from HIGH to
        // MEDIUM and reduce score — this should NOT trigger COUNTERFEIT on
        // its own when the country evidence is thin, and this determination
        // is now stable regardless of whether unrelated APIs (UPCitemdb) time
        // out or not.
        signals.push({
          type: 'GS1_COUNTRY_MISMATCH',
          severity: 'MEDIUM',
          description: `Barcode prefix indicates ${gs1Info.country} but a source lists: ${[...new Set(nonNoiseClaimed)].slice(0, 3).join(', ')} — may be a global brand registered in multiple regions`,
          gs1Country: gs1Info.country,
          claimedCountry: [...new Set(nonNoiseClaimed)].join(', '),
        });
        signalScore += 10;  // Reduced from 20 — thin evidence, likely data quality issue
      } else {
        signals.push({
          type: 'GS1_COUNTRY_MISMATCH',
          severity: 'HIGH',
          description: `Barcode prefix indicates ${gs1Info.country} but product origin listed as: ${[...new Set(nonNoiseClaimed)].slice(0, 3).join(', ')}`,
          gs1Country: gs1Info.country,
          claimedCountry: [...new Set(nonNoiseClaimed)].join(', '),
        });
        // Round 25e: reduced from +35 to +20 so that a single country mismatch
        // (common for US-branded imported goods, e.g. Simply Organic Thyme where
        // the thyme is sourced from France but the brand is US-registered) does
        // NOT cross the COUNTERFEIT threshold on its own. It needs to combine
        // with other signals (brand mismatch, phantom record, etc.) to reach FAKE.
        // Genuine counterfeits almost always have MULTIPLE signals, not just this one.
        signalScore += 20;
      }
    }
  }

  // Signal 3: Brand name inconsistency
  if (crossRef && crossRef.checks) {
    const brandCheck = crossRef.checks.find(c => c.check === 'Brand name consistent across sources');
    if (brandCheck && brandCheck.passed === false && foundSources.length >= 2) {
      signals.push({ type: 'BRAND_INCONSISTENCY', severity: 'MEDIUM', description: `Brand name conflicts between data sources: ${brandCheck.details}` });
      signalScore += 25;
    }

    // Round 25c — Product category conflict (polluted barcode in crowd-sourced DB)
    const catCheck = crossRef.checks.find(c => c.check === 'Product category consistent across sources');
    if (catCheck && catCheck.passed === false && foundSources.length >= 2) {
      signals.push({
        type: 'CATEGORY_CONFLICT',
        severity: 'MEDIUM',
        description: `Different product categories reported by different databases — ${catCheck.details}. This is usually crowd-sourced data pollution, not a counterfeit, but treat with caution.`,
      });
      // Lower weight — this is usually data quality, not fakery
      signalScore += 15;
    }
  }

  // Signal 4: Low trust despite many sources (contradictory data)
  if (foundSources.length >= 3 && trustScore < 30) {
    signals.push({ type: 'CONFLICTING_DATA_LOW_TRUST', severity: 'MEDIUM', description: `${foundSources.length} databases returned data but trust score is critically low (${trustScore}%) — information is contradictory` });
    signalScore += 20;
  }

  // Signal 5: Barcode format anomaly
  const digits = barcode.replace(/\D/g, '');
  const validLengths = [8, 12, 13, 14];
  if (!validLengths.includes(digits.length)) {
    signals.push({ type: 'INVALID_BARCODE_LENGTH', severity: 'MEDIUM', description: `Barcode has ${digits.length} digits — not a standard EAN-8, UPC-A, EAN-13, or GTIN-14 format` });
    signalScore += 15;
  }

  // Signal 6: Invalid EAN-13 / UPC-A check digit
  // IMPORTANT: An invalid check digit is *overwhelmingly* a camera-misread scan,
  // NOT a fabricated counterfeit barcode. We surface it as a HIGH-severity
  // advisory but with low scoring weight, and we flag `badScan:true` so the
  // caller can short-circuit to an UNREADABLE verdict instead of COUNTERFEIT.
  let badScanDetected = false;
  if (digits.length === 13 || digits.length === 12) {
    const d = digits.split('').map(Number);
    const len = d.length;
    let sum = 0;
    for (let i = 0; i < len - 1; i++) {
      sum += d[i] * (i % 2 === 0 ? (len === 13 ? 1 : 3) : (len === 13 ? 3 : 1));
    }
    const expectedCheck = (10 - (sum % 10)) % 10;
    if (d[len - 1] !== expectedCheck) {
      badScanDetected = true;
      signals.push({
        type: 'INVALID_CHECK_DIGIT',
        severity: 'HIGH',
        description: `Barcode check digit is invalid (expected ${expectedCheck}, got ${d[len - 1]}) — likely a misread. Please rescan with better lighting.`,
      });
      // Low weight: this should drive an UNREADABLE verdict, not a COUNTERFEIT one
      signalScore += 5;
    }
  }

  // Signal 7: Unregistered GS1 prefix
  // Only trigger when no other sources verified the product. If multiple
  // sources (UPCitemdb, Datakick, etc.) confirmed this product, the prefix
  // may just be one we haven't catalogued yet — not a counterfeit indicator.
  if (gs1Info && (!gs1Info.country || gs1Info.country === 'Unknown') && digits.length >= 12 && foundSources.length <= 1) {
    signals.push({ type: 'UNREGISTERED_GS1_PREFIX', severity: 'MEDIUM', description: 'GS1 prefix is not registered to any known country or company and product has little cross-verification' });
    signalScore += 15;
  }

  // Signal 8: "Unknown Product" but sources claim to have found it (phantom record)
  if (foundSources.length >= 1 && foundSources.length <= 2 &&
      productInfo && (productInfo.name === 'Unknown' || productInfo.name === 'Unknown Product' || !productInfo.name) &&
      (!productInfo.brand || productInfo.brand === 'Unknown')) {
    signals.push({ type: 'PHANTOM_RECORD', severity: 'MEDIUM', description: 'Source reported a match but provided no product name or brand — possible fabricated listing' });
    signalScore += 20;
  }

  // Signal 9: Recent creation + low source count (fresh counterfeit pattern)
  if (effectiveOffData && effectiveOffData.rawData && effectiveOffData.rawData.createdDate) {
    const createdAt = new Date(effectiveOffData.rawData.createdDate).getTime();
    const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    if (ageDays < 30 && foundSources.length <= 1) {
      signals.push({ type: 'FRESH_UNVERIFIED_RECORD', severity: 'MEDIUM', description: `Product record was created ${Math.round(ageDays)} days ago and has no cross-verification — common counterfeit pattern` });
      signalScore += 15;
    }
  }

  // Signal 10: GS1 prefix is one of the known "counterfeit-heavy" ranges
  // (Books/ISBN, magazine-code, and internal-use prefixes shouldn't appear on physical retail products)
  if (digits.length === 13) {
    const prefix3 = digits.slice(0, 3);
    const prefixNum = parseInt(prefix3, 10);
    // 020-029, 040-049, 200-299 = in-store / internal use, NOT retail
    // 977-979 = ISSN/ISBN/ISMN, should never be on retail non-publication products
    const isInternalPrefix = (prefixNum >= 20 && prefixNum <= 29) || (prefixNum >= 40 && prefixNum <= 49) || (prefixNum >= 200 && prefixNum <= 299);
    if (isInternalPrefix) {
      signals.push({ type: 'INTERNAL_USE_PREFIX', severity: 'HIGH', description: `GS1 prefix ${prefix3} is reserved for in-store / internal use — not a valid manufacturer code` });
      signalScore += 30;
    }
  }

  // ── Recall flag ─────────────────────────────────────────────────────────────
  // ACTIVE_RECALL means the product exists and is real but has been recalled by
  // the FDA/CPSC. This should NEVER be confused with a counterfeit verdict.
  // We set hasRecall=true and EXCLUDE it from counterfeit scoring entirely.
  const hasRecall = signals.some(s => s.type === 'ACTIVE_RECALL');

  // For counterfeit determination, ignore ACTIVE_RECALL and INVALID_CHECK_DIGIT
  const counterfeitSignalsOnly = signals.filter(
    s => s.type !== 'ACTIVE_RECALL' && s.type !== 'INVALID_CHECK_DIGIT'
  );
  const recallScore = signals.filter(s => s.type === 'ACTIVE_RECALL').reduce((acc) => acc + 40, 0);
  const adjustedScore = signalScore - recallScore;

  const hasHighSeverity = counterfeitSignalsOnly.some(s => s.severity === 'HIGH');
  const mediumCount = counterfeitSignalsOnly.filter(s => s.severity === 'MEDIUM').length;

  // More aggressive threshold (Round 24):
  //   - Any HIGH severity signal alone → counterfeit (score ≥ 30)
  //   - OR score ≥ 40 with at least one HIGH or two MEDIUM signals
  //   - OR score ≥ 55 with any combination (original R22 threshold kept as floor)
  // IMPORTANT (Round 25): if the barcode failed its check digit (badScan), DO NOT
  // flag as counterfeit — the scan itself is unreliable. Downstream code will
  // surface an UNREADABLE verdict instead.
  // IMPORTANT (Round 25d): ACTIVE_RECALL is excluded from counterfeit scoring —
  // a recalled product is real, not fake. Use adjustedScore (recall removed).
  let isCounterfeit = (hasHighSeverity && adjustedScore >= 30) ||
                      (adjustedScore >= 40 && (hasHighSeverity || mediumCount >= 2)) ||
                      adjustedScore >= 55;
  if (badScanDetected) isCounterfeit = false;
  if (hasRecall && !hasHighSeverity && adjustedScore < 30) isCounterfeit = false;

  return {
    isCounterfeit,
    hasRecall,
    badScan: badScanDetected,
    confidence: Math.min(signalScore, 100),
    signalCount: signals.length,
    signals,
  };
}

module.exports = { verifyProduct };