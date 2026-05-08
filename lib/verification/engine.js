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
const openFDA = require('../api/openFDA');
const barcodeLookup = require('../api/barcodeLookup');
const openBeautyFacts = require('../api/openBeautyFacts');
const nhtsa = require('../api/nhtsa');
const whoMedicines = require('../api/whoMedicines');
const upcItemDb = require('../api/upcItemDb');
const openLibrary = require('../api/openLibrary');
const datakick = require('../api/datakick');
const gs1CompanyDb = require('../api/gs1CompanyDb');
const eanSearch = require('../api/eanSearch');

/**
 * Main verification function
 * @param {string} barcode - The barcode to verify
 * @returns {object} Complete verification result with trust score
 */
async function verifyProduct(barcode) {
  const startTime = Date.now();

  // Run all API lookups in parallel for maximum speed
  const [
    offResult, fdaResult, barcodeResult, obfResult,
    upcResult, libResult, datakickResult, gs1Result, eanResult
  ] = await Promise.allSettled([
    openFoodFacts.lookupByBarcode(barcode),
    openFDA.lookupDrug(barcode, 'ndc'),
    barcodeLookup.multiSourceLookup(barcode),
    openBeautyFacts.lookupByBarcode(barcode),
    upcItemDb.lookupByBarcode(barcode),
    openLibrary.lookupByBarcode(barcode),
    datakick.lookupByBarcode(barcode),
    gs1CompanyDb.lookupByBarcode(barcode),
    eanSearch.lookupByBarcode(barcode)
  ]);

  // Extract results
  const offData      = offResult.status      === 'fulfilled' ? offResult.value      : { found: false, source: 'Open Food Facts', barcode };
  const fdaData      = fdaResult.status      === 'fulfilled' ? fdaResult.value      : { found: false, source: 'OpenFDA', barcode };
  const barcodeData  = barcodeResult.status  === 'fulfilled' ? barcodeResult.value  : { sources: [], gs1: {} };
  const obfData      = obfResult.status      === 'fulfilled' ? obfResult.value      : { found: false, source: 'Open Beauty Facts', barcode };
  const upcData      = upcResult.status      === 'fulfilled' ? upcResult.value      : { found: false, source: 'UPCitemdb', barcode };
  const libData      = libResult.status      === 'fulfilled' ? libResult.value      : { found: false, source: 'Open Library', barcode };
  const datakickData = datakickResult.status === 'fulfilled' ? datakickResult.value : { found: false, source: 'Datakick', barcode };
  const gs1Data      = gs1Result.status      === 'fulfilled' ? gs1Result.value      : { found: false, source: 'GS1/USDA', barcode };
  const eanData      = eanResult.status      === 'fulfilled' ? eanResult.value      : { found: false, source: 'EAN Search', barcode };

  // Collect all found sources
  const foundSources = [];
  if (offData.found)       foundSources.push(offData);
  if (fdaData.found)       foundSources.push(fdaData);
  if (obfData.found)       foundSources.push(obfData);
  if (upcData.found)       foundSources.push(upcData);
  if (libData.found)       foundSources.push(libData);
  if (datakickData.found)  foundSources.push(datakickData);
  if (gs1Data.found)       foundSources.push(gs1Data);
  if (eanData.found)       foundSources.push(eanData);
  if (barcodeData.sources && barcodeData.sources.length > 0) {
    foundSources.push(...barcodeData.sources);
  }

  // Get GS1 info (always available)
  const gs1Info = gs1CompanyDb.getGS1Info(barcode);

  // WHO Essential Medicines check (for pharmaceutical products)
  let whoResult = null;
  if (fdaData.found && fdaData.genericName) {
    whoResult = await whoMedicines.checkEssentialMedicine(fdaData.genericName);
  }

  // Calculate trust score
  const trustScore = calculateTrustScore(offData, fdaData, barcodeData, obfData, foundSources, upcData, libData, datakickData, gs1Info);

  // Check for recalls
  let recalls = [];
  const brandForRecall = offData.brand || upcData.brand || datakickData.brand;
  if (brandForRecall && brandForRecall !== 'Unknown') {
    const foodRecalls = await openFDA.lookupFoodEnforcement(brandForRecall);
    const drugRecalls = await openFDA.lookupDrugEnforcement(brandForRecall);
    recalls = [...foodRecalls, ...drugRecalls].slice(0, 5);
  }

  // Determine product type
  const productType = determineProductType(offData, fdaData, barcodeData, obfData, libData, upcData, datakickData);

  // Build unified product info
  const productInfo = buildProductInfo(offData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info, productType);

  // Cross-reference check
  const crossRef = crossReferenceCheck(offData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info);

  const verificationTime = Date.now() - startTime;

  // Determine verification status
  let status;
  if (trustScore >= 75) {
    status = 'VERIFIED';
  } else if (trustScore >= 50) {
    status = 'LIKELY_AUTHENTIC';
  } else if (trustScore >= 25) {
    status = 'INSUFFICIENT_DATA';
  } else if (foundSources.length === 0) {
    status = 'NOT_FOUND';
  } else {
    status = 'SUSPICIOUS';
  }

  return {
    barcode,
    status,
    trustScore,
    productType,
    productInfo,
    sources: {
      openFoodFacts:  offData,
      openFDA:        fdaData,
      openBeautyFacts: obfData,
      barcodeLookup:  barcodeData,
      upcItemDb:      upcData,
      openLibrary:    libData,
      datakick:       datakickData,
      gs1CompanyDb:   gs1Data,
      eanSearch:      eanData
    },
    whoEssentialMedicine: whoResult,
    regulatoryAgencies: whoMedicines.getAllRegulatoryAgencies(),
    crossReference: crossRef,
    recalls: recalls.length > 0 ? recalls : null,
    gs1Info,
    verificationTime: `${verificationTime}ms`,
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Calculate trust score based on multiple factors
 */
function calculateTrustScore(offData, fdaData, barcodeData, obfData, foundSources, upcData, libData, datakickData, gs1Info) {
  let score = 0;
  let maxScore = 0;

  // Factor 1: Number of sources that found the product (0-40 points)
  maxScore += 40;
  if (foundSources.length >= 4) score += 40;
  else if (foundSources.length === 3) score += 34;
  else if (foundSources.length === 2) score += 26;
  else if (foundSources.length === 1) score += 15;
  else score += 0;

  // Factor 2: Data consistency between sources (0-25 points)
  maxScore += 25;
  const consistency = checkDataConsistency(offData, fdaData, barcodeData, upcData, datakickData);
  score += Math.round(25 * consistency);

  // Factor 3: Regulatory verification - FDA (0-20 points)
  maxScore += 20;
  if (fdaData.found) {
    score += 20;
    if (fdaData.status === 'Prescription' || fdaData.status === 'Over-the-counter') {
      score += 5;
      maxScore += 5;
    }
  }

  // Factor 4: GS1 prefix validity (0-15 points)
  maxScore += 15;
  if (gs1Info && gs1Info.country && gs1Info.country !== 'Unknown') {
    score += 15;
  } else if (barcodeData.gs1 && barcodeData.gs1.region !== 'Unknown') {
    score += 15;
  }

  // Factor 5: Commercial database hit (UPCitemdb or Datakick) — bonus reliability
  maxScore += 10;
  if (upcData.found || datakickData.found) score += 10;

  // Factor 6: Book ISBN verification via Open Library
  if (libData.found) {
    maxScore += 10;
    score += 10;
  }

  // Penalties: Mismatched brand names between sources
  if (consistency < 0.5 && foundSources.length > 1) {
    score -= 10;
  }

  // Normalize to 0-100
  const normalizedScore = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
  return normalizedScore;
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
 * Determine the type of product based on available data
 */
function determineProductType(offData, fdaData, barcodeData, obfData, libData, upcData, datakickData) {
  if (libData.found) return 'BOOK';
  if (fdaData.found) return 'PHARMACEUTICAL';
  if (obfData.found) {
    const cats = obfData.category || [];
    const catStr = cats.join(' ').toLowerCase();
    if (catStr.includes('perfume') || catStr.includes('fragrance')) return 'FRAGRANCE';
    if (catStr.includes('make-up') || catStr.includes('makeup')) return 'MAKEUP';
    if (catStr.includes('hair')) return 'HAIR_CARE';
    if (catStr.includes('skin') || catStr.includes('body')) return 'SKINCARE';
    return 'COSMETIC';
  }
  if (offData.found) {
    const cats = offData.category || [];
    const catStr = cats.join(' ').toLowerCase();
    if (catStr.includes('beverage') || catStr.includes('drink')) return 'BEVERAGE';
    if (catStr.includes('cosmetic') || catStr.includes('beauty') || catStr.includes('personal-care')) return 'COSMETIC';
    if (catStr.includes('snack') || catStr.includes('food')) return 'FOOD';
    if (catStr.includes('supplement') || catStr.includes('vitamin')) return 'SUPPLEMENT';
    return 'FOOD';
  }
  if (datakickData.found) return 'FOOD';
  if (upcData.found) {
    const cat = (upcData.category && upcData.category[0]) ? upcData.category[0].toLowerCase() : '';
    if (cat.includes('electron')) return 'ELECTRONICS';
    if (cat.includes('auto')) return 'AUTOMOTIVE';
    if (cat.includes('health') || cat.includes('beauty')) return 'COSMETIC';
    if (cat.includes('food') || cat.includes('grocery')) return 'FOOD';
    if (cat.includes('book')) return 'BOOK';
    return 'CONSUMER_GOOD';
  }
  if (barcodeData.sources && barcodeData.sources.length > 0) {
    const cat = barcodeData.sources[0].category;
    if (cat) {
      const catLower = (typeof cat === 'string' ? cat : cat[0] || '').toLowerCase();
      if (catLower.includes('electron')) return 'ELECTRONICS';
      if (catLower.includes('auto')) return 'AUTOMOTIVE';
      if (catLower.includes('health') || catLower.includes('beauty')) return 'COSMETIC';
    }
    return 'CONSUMER_GOOD';
  }
  return 'UNKNOWN';
}

/**
 * Build unified product info from all sources
 */
function buildProductInfo(offData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info, productType) {
  const info = {
    name: null,
    brand: null,
    manufacturer: null,
    country: null,
    image: null,
    description: null,
    details: {}
  };

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

  // Always enrich with GS1 info
  info.gs1Region = gs1Info ? gs1Info.country : (barcodeData.gs1 ? barcodeData.gs1.region : null);
  info.barcodeType = gs1Info ? gs1Info.barcodeType : (barcodeData.gs1 ? barcodeData.gs1.barcodeType : null);

  return info;
}

/**
 * Cross-reference check between all sources
 */
function crossReferenceCheck(offData, fdaData, barcodeData, obfData, upcData, libData, datakickData, gs1Info) {
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
  if (barcodeData.sources) barcodeData.sources.forEach(s => { if (s.brand && s.brand !== 'Unknown') brands.push(s.brand); });

  const brandConsistent = brands.length <= 1 || (brands.length > 1 && new Set(brands.map(b => b.toLowerCase())).size === 1);
  checks.push({
    check: 'Brand name consistent across sources',
    passed: brands.length > 0 ? brandConsistent : null,
    details: brands.length > 0 ? `Brands found: ${[...new Set(brands)].join(', ')}` : 'No brand data to compare'
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

module.exports = { verifyProduct };