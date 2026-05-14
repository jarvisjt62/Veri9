/**
 * Veri9 API Audit Script
 * Tests all API modules for structural integrity and reports their status
 * Run with: node scripts/audit_apis.js
 *
 * NOTE: Premium key-based APIs (Amazon, Barcode Spider, EAN-DB) will show
 * as SKIPPED here because env vars aren't set in local dev — they work
 * in production (Vercel) where the env vars are configured.
 */

const path = require('path');

// Test barcode — Apothic wine (should be BEVERAGE)
const TEST_BARCODE = '0085000093103';

const APIs = [
  // Core free APIs
  { name: 'Open Food Facts',     module: '../lib/api/openFoodFacts',          method: 'lookupByBarcode', requiresKey: false },
  { name: 'OpenFDA',             module: '../lib/api/openFDA',                method: 'lookupDrug',      requiresKey: false, args: [TEST_BARCODE, 'ndc'] },
  { name: 'Open Beauty Facts',   module: '../lib/api/openBeautyFacts',        method: 'lookupByBarcode', requiresKey: false },
  { name: 'UPCitemdb',           module: '../lib/api/upcItemDb',              method: 'lookupByBarcode', requiresKey: false },
  { name: 'Open Library',        module: '../lib/api/openLibrary',            method: 'lookupByBarcode', requiresKey: false },
  { name: 'Datakick',            module: '../lib/api/datakick',               method: 'lookupByBarcode', requiresKey: false },
  { name: 'GS1 Company DB',      module: '../lib/api/gs1CompanyDb',           method: 'lookupByBarcode', requiresKey: false },
  { name: 'EAN Search',          module: '../lib/api/eanSearch',              method: 'lookupByBarcode', requiresKey: 'EAN_SEARCH_TOKEN' },
  { name: 'USDA FoodData',       module: '../lib/api/usdaFoodData',           method: 'lookupByBarcode', requiresKey: false },
  { name: 'Go-UPC',              module: '../lib/api/goUpc',                  method: 'lookupByBarcode', requiresKey: false },
  { name: 'Open Prices',         module: '../lib/api/openPrices',             method: 'lookupByBarcode', requiresKey: false },
  { name: 'Open Product Data',   module: '../lib/api/openProductData',        method: 'lookupByBarcode', requiresKey: false },
  { name: 'NIH RxNav',           module: '../lib/api/nihRxNav',               method: 'lookupByBarcode', requiresKey: false },
  { name: 'CPSC Recalls',        module: '../lib/api/cpscRecalls',            method: 'lookupByBarcode', requiresKey: false },
  { name: 'Barcode Monster',     module: '../lib/api/barcodeMonster',         method: 'lookupByBarcode', requiresKey: false },
  { name: 'Google Books',        module: '../lib/api/googleBooks',            method: 'lookupByBarcode', requiresKey: false },
  // Regional registries
  { name: 'Africa Registry',     module: '../lib/api/africaProductRegistry',  method: 'lookupByBarcode', requiresKey: false },
  { name: 'Europe Registry',     module: '../lib/api/europeProductRegistry',  method: 'lookupByBarcode', requiresKey: false },
  { name: 'Asia Registry',       module: '../lib/api/asiaProductRegistry',    method: 'lookupByBarcode', requiresKey: false },
  { name: 'Oceania Registry',    module: '../lib/api/oceaniaProductRegistry', method: 'lookupByBarcode', requiresKey: false },
  { name: 'Americas Registry',   module: '../lib/api/americasProductRegistry',method: 'lookupByBarcode', requiresKey: false },
  // Specialized category DBs
  { name: 'Electronics Cert',    module: '../lib/api/electronicsCertDb',      method: 'lookupByBarcode', requiresKey: false },
  { name: 'Toy Safety',          module: '../lib/api/toySafetyDb',            method: 'lookupByBarcode', requiresKey: false },
  { name: 'Automotive Parts',    module: '../lib/api/automotivePartsDb',      method: 'lookupByBarcode', requiresKey: false },
  { name: 'Wine & Spirits',      module: '../lib/api/wineSpiritsDb',          method: 'lookupByBarcode', requiresKey: false },
  { name: 'Textile',             module: '../lib/api/textileDb',              method: 'lookupByBarcode', requiresKey: false },
  { name: 'Open Prices Live',    module: '../lib/api/openPricesLive',         method: 'lookupByBarcode', requiresKey: false },
  // Premium key-based APIs (will SKIP if no env var — normal in local dev)
  { name: 'Amazon PA-API',       module: '../lib/api/amazonPaApi',            method: 'lookupAmazon',    requiresKey: 'AMAZON_PA_ACCESS_KEY' },
  { name: 'Barcode Spider',      module: '../lib/api/barcodeSpider',          method: 'lookupByBarcode', requiresKey: 'BARCODE_SPIDER_TOKEN' },
  { name: 'EAN-DB',              module: '../lib/api/eanDb',                  method: 'lookupByBarcode', requiresKey: 'EAN_DB_JWT' },
];

async function auditApi(apiDef) {
  const result = {
    name: apiDef.name,
    status: 'UNKNOWN',
    hasKey: apiDef.requiresKey ? !!process.env[apiDef.requiresKey] : 'N/A',
    found: false,
    error: null,
    details: null,
    responseTime: 0,
  };

  try {
    const mod = require(path.join(__dirname, apiDef.module));
    if (!mod[apiDef.method]) {
      result.status = 'ERROR';
      result.error = `Method '${apiDef.method}' not found in module`;
      return result;
    }

    const start = Date.now();
    const args = apiDef.args || [TEST_BARCODE];
    const data = await mod[apiDef.method](...args);
    result.responseTime = Date.now() - start;

    if (data && data.skipped) {
      result.status = 'SKIPPED_NO_KEY';
      return result;
    }

    if (data && data.found) {
      result.status = 'OK_FOUND';
      result.found = true;
      result.details = { name: data.name, brand: data.brand, source: data.source };
    } else if (data && data.found === false) {
      result.status = 'OK_NOT_FOUND';
    } else if (data) {
      result.status = 'OK_RESPONSE';
    } else {
      result.status = 'NULL_RESPONSE';
    }
  } catch (err) {
    result.status = 'EXCEPTION';
    result.error = err.message;
  }

  return result;
}

async function runAudit() {
  console.log('='.repeat(70));
  console.log('VERI9 API AUDIT REPORT');
  console.log(`Test barcode: ${TEST_BARCODE} (Apothic Red Wine)`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  let passed = 0, skipped = 0, failed = 0;

  for (const api of APIs) {
    process.stdout.write(`  ${api.name.padEnd(24)} ... `);
    const result = await auditApi(api);

    if (result.status === 'EXCEPTION') {
      console.log(`❌ EXCEPTION: ${result.error}`);
      failed++;
    } else if (result.status === 'SKIPPED_NO_KEY') {
      console.log(`⏭️  SKIPPED (no ${api.requiresKey})`);
      skipped++;
    } else if (result.status === 'OK_FOUND') {
      console.log(`✅ FOUND (${result.responseTime}ms) → ${result.details.name || 'unnamed'}`);
      passed++;
    } else if (result.status === 'OK_NOT_FOUND') {
      console.log(`✅ OK - not in DB (${result.responseTime}ms)`);
      passed++;
    } else if (result.status === 'NULL_RESPONSE') {
      console.log(`⚠️  NULL response (${result.responseTime}ms)`);
      failed++;
    } else {
      console.log(`✅ ${result.status} (${result.responseTime}ms)`);
      passed++;
    }
  }

  console.log('');
  console.log(`RESULT: ${passed} passed ✅  ${skipped} skipped ⏭️  ${failed} failed ❌`);
  console.log('='.repeat(70));
}

runAudit().catch(console.error);
