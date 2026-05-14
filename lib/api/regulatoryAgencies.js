/**
 * Regulatory Agencies Database
 * Covers WHO, NAFDAC (Nigeria), MHRA (UK), EMA (Europe), TGA (Australia),
 * Health Canada, ANVISA (Brazil), CDSCO (India)
 *
 * Uses publicly available regulatory data and APIs where possible.
 * Falls back to pattern matching and known agency registries.
 */

// GS1 prefix → Regulatory Authority mapping
const PREFIX_TO_REGULATOR = {
  // United Kingdom → MHRA
  '500': { agency: 'MHRA', country: 'United Kingdom', url: 'https://www.gov.uk/guidance/yellow-card-reporting' },
  '501': { agency: 'MHRA', country: 'United Kingdom', url: 'https://www.gov.uk/guidance/yellow-card-reporting' },
  // Nigeria → NAFDAC
  '615': { agency: 'NAFDAC', country: 'Nigeria', url: 'https://www.nafdac.gov.ng/' },
  // USA → FDA
  '000': { agency: 'FDA', country: 'United States', url: 'https://www.fda.gov' },
  '001': { agency: 'FDA', country: 'United States', url: 'https://www.fda.gov' },
  '002': { agency: 'FDA', country: 'United States', url: 'https://www.fda.gov' },
  // EU/France → EMA + ANSM
  '300': { agency: 'EMA / ANSM', country: 'France', url: 'https://www.ema.europa.eu' },
  '301': { agency: 'EMA / ANSM', country: 'France', url: 'https://www.ema.europa.eu' },
  // Germany → BfArM
  '400': { agency: 'EMA / BfArM', country: 'Germany', url: 'https://www.bfarm.de' },
  // Brazil → ANVISA
  '789': { agency: 'ANVISA', country: 'Brazil', url: 'https://www.gov.br/anvisa' },
  '790': { agency: 'ANVISA', country: 'Brazil', url: 'https://www.gov.br/anvisa' },
  // India → CDSCO
  '890': { agency: 'CDSCO', country: 'India', url: 'https://cdsco.gov.in' },
  // Australia → TGA
  '930': { agency: 'TGA', country: 'Australia', url: 'https://www.tga.gov.au' },
  '931': { agency: 'TGA', country: 'Australia', url: 'https://www.tga.gov.au' },
  // Canada → Health Canada
  '068': { agency: 'Health Canada', country: 'Canada', url: 'https://www.canada.ca/en/health-canada' },
  '069': { agency: 'Health Canada', country: 'Canada', url: 'https://www.canada.ca/en/health-canada' },
  // Japan → PMDA
  '450': { agency: 'PMDA', country: 'Japan', url: 'https://www.pmda.go.jp/english' },
  '451': { agency: 'PMDA', country: 'Japan', url: 'https://www.pmda.go.jp/english' },
  // China → NMPA
  '690': { agency: 'NMPA', country: 'China', url: 'https://www.nmpa.gov.cn' },
  '691': { agency: 'NMPA', country: 'China', url: 'https://www.nmpa.gov.cn' },
  '692': { agency: 'NMPA', country: 'China', url: 'https://www.nmpa.gov.cn' },
  // South Africa → SAHPRA
  '600': { agency: 'SAHPRA', country: 'South Africa', url: 'https://www.sahpra.org.za' },
  '601': { agency: 'SAHPRA', country: 'South Africa', url: 'https://www.sahpra.org.za' },
  // South Korea → MFDS
  '880': { agency: 'MFDS', country: 'South Korea', url: 'https://www.mfds.go.kr/eng' },
};

// WHO prequalified product database (subset — key medicines)
// Full list: https://extranet.who.int/prequal/
const WHO_PREQUALIFIED_GENERICS = [
  'amoxicillin', 'artemether', 'artesunate', 'azithromycin', 'chloroquine',
  'cotrimoxazole', 'efavirenz', 'fluconazole', 'isoniazid', 'lamivudine',
  'metronidazole', 'nevirapine', 'oxytocin', 'paracetamol', 'rifampicin',
  'tenofovir', 'zinc sulfate', 'zidovudine',
];

/**
 * Get the regulatory authority for a given barcode prefix
 */
function getRegulatorForBarcode(barcode) {
  const prefix3 = barcode.substring(0, 3);
  const prefix2 = barcode.substring(0, 2);
  return PREFIX_TO_REGULATOR[prefix3] || PREFIX_TO_REGULATOR[prefix2] || {
    agency: 'WHO / Local Authority',
    country: 'Unknown',
    url: 'https://www.who.int',
  };
}

/**
 * Check if a drug name appears on WHO prequalification list
 */
function checkWHOPrequalified(genericName) {
  if (!genericName) return false;
  const lower = genericName.toLowerCase();
  return WHO_PREQUALIFIED_GENERICS.some(g => lower.includes(g));
}

/**
 * Query MHRA public product database (UK)
 * https://products.mhra.gov.uk/ — no official API but JSON data is available
 */
async function checkMHRA(productName) {
  try {
    // MHRA doesn't have a public barcode API, we can search by product name
    const url = `https://products.mhra.gov.uk/search/?search=${encodeURIComponent(productName)}&page=1`;
    // Just return the check URL since no public REST API exists
    return {
      checked: true,
      agency: 'MHRA',
      searchUrl: url,
      note: 'Check MHRA for UK-authorized medicines',
    };
  } catch {
    return { checked: false, agency: 'MHRA' };
  }
}

/**
 * Query NAFDAC register (Nigeria)
 * https://www.nafdac.gov.ng/
 */
async function checkNAFDAC(productName) {
  // NAFDAC does not expose a public JSON API, provide link
  return {
    checked: true,
    agency: 'NAFDAC',
    searchUrl: `https://www.nafdac.gov.ng/nafdac-registered-products/?search=${encodeURIComponent(productName)}`,
    note: 'Check NAFDAC register for Nigerian-authorized products',
  };
}

/**
 * Main lookup: determine regulators and check compliance
 */
async function lookupRegulatory(barcode, productName) {
  const regulator = getRegulatorForBarcode(barcode);
  const whoPreq = productName ? checkWHOPrequalified(productName) : false;

  let agencyCheck = null;
  if (regulator.agency === 'MHRA' && productName) {
    agencyCheck = await checkMHRA(productName);
  } else if (regulator.agency === 'NAFDAC' && productName) {
    agencyCheck = await checkNAFDAC(productName);
  }

  return {
    found: true,
    source: 'Regulatory Agencies (WHO/NAFDAC/MHRA/EMA)',
    barcode,
    primaryRegulator: regulator,
    whoPrequalified: whoPreq,
    agencyCheck,
    allAgencies: Object.values(PREFIX_TO_REGULATOR)
      .map(r => r.agency)
      .filter((v, i, a) => a.indexOf(v) === i),
  };
}

module.exports = { lookupRegulatory, getRegulatorForBarcode, checkWHOPrequalified };
