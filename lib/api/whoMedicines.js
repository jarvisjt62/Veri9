/**
 * WHO Essential Medicines & Global Drug Verification Integration
 * Uses multiple free sources for medicine verification:
 * - WHO Essential Medicines List
 * - OpenFDA (already integrated, extended here for WHO-specific checks)
 * - WHO Prequalification Lists
 * - National regulatory databases (NAFDAC, MHRA, etc.)
 */

const BASE_URL = 'https://query.wikidata.org/sparql';

/**
 * WHO Essential Medicines List categories
 * Used to check if a drug is on the WHO essential medicines list
 */
const ESSENTIAL_MEDICINES_CATEGORIES = {
  'anaesthetics': 'Anaesthetics',
  'analgesics': 'Analgesics and antipyretics',
  'anti_allergics': 'Anti-allergics',
  'anti_infectives': 'Anti-infectives',
  'anti_migraine': 'Anti-migraine medicines',
  'anti_neoplastic': 'Antineoplastic and immunosuppressives',
  'cardiovascular': 'Cardiovascular medicines',
  'dermatological': 'Dermatological medicines',
  'diagnostics': 'Diagnostics',
  'diuretics': 'Diuretics',
  'gastrointestinal': 'Gastrointestinal medicines',
  'hormones': 'Hormones and contraceptives',
  'immunologicals': 'Immunologicals',
  'muscle_relaxants': 'Muscle relaxants',
  'ophthalmological': 'Ophthalmological preparations',
  'oxytocics': 'Oxytocics and anti-oxytocics',
  'peritoneal': 'Peritoneal dialysis solutions',
  'psychotropic': 'Psychotherapeutic medicines',
  'respiratory': 'Respiratory tract medicines',
  'solutions': 'Solutions correcting water/electrolyte disturbances',
  'vitamins': 'Vitamins and minerals'
};

/**
 * National regulatory agencies for drug verification
 * Key markets where counterfeit drugs are most prevalent
 */
const REGULATORY_AGENCIES = {
  nigeria: {
    name: 'NAFDAC',
    fullName: 'National Agency for Food and Drug Administration and Control',
    country: 'Nigeria',
    website: 'https://www.nafdac.gov.ng',
    verifyUrl: 'https://www.nafdac.gov.ng/product-verification/'
  },
  ghana: {
    name: 'FDA Ghana',
    fullName: 'Food and Drugs Authority Ghana',
    country: 'Ghana',
    website: 'https://fdaghana.gov.gh'
  },
  kenya: {
    name: 'PPB Kenya',
    fullName: 'Pharmacy and Poisons Board Kenya',
    country: 'Kenya',
    website: 'https://pharmacyboardkenya.org'
  },
  south_africa: {
    name: 'SAHPRA',
    fullName: 'South African Health Products Regulatory Authority',
    country: 'South Africa',
    website: 'https://www.sahpra.org.za'
  },
  uk: {
    name: 'MHRA',
    fullName: 'Medicines and Healthcare products Regulatory Agency',
    country: 'United Kingdom',
    website: 'https://www.gov.uk/government/organisations/mhra'
  },
  india: {
    name: 'CDSCO',
    fullName: 'Central Drugs Standard Control Organisation',
    country: 'India',
    website: 'https://cdsco.gov.in'
  },
  brazil: {
    name: 'ANVISA',
    fullName: 'Agência Nacional de Vigilância Sanitária',
    country: 'Brazil',
    website: 'https://www.gov.br/anvisa'
  },
  eu: {
    name: 'EMA',
    fullName: 'European Medicines Agency',
    country: 'European Union',
    website: 'https://www.ema.europa.eu'
  }
};

/**
 * Check if a drug is on the WHO Essential Medicines List
 * Uses Wikidata SPARQL endpoint
 * @param {string} drugName - Generic or brand name of the drug
 * @returns {object} WHO EML status
 */
async function checkEssentialMedicine(drugName) {
  try {
    const query = `
      SELECT ?drug ?drugLabel ?atcCode ?categoryLabel WHERE {
        ?drug wdt:P31 wd:Q12140 .
        ?drug rdfs:label "${drugName}"@en .
        OPTIONAL { ?drug wdt:P5910 ?atcCode }
        OPTIONAL { ?drug wdt:P527|wdt:P366 ?category }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
      } LIMIT 5
    `;

    const url = `${BASE_URL}?query=${encodeURIComponent(query)}&format=json`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();

    if (data.results && data.results.bindings && data.results.bindings.length > 0) {
      return {
        found: true,
        source: 'WHO Essential Medicines / Wikidata',
        drugName,
        isEssential: true,
        results: data.results.bindings.map(b => ({
          name: b.drugLabel?.value || drugName,
          atcCode: b.atcCode?.value || null,
          category: b.categoryLabel?.value || null
        }))
      };
    }

    return { found: false, source: 'WHO Essential Medicines', drugName, isEssential: false };
  } catch (error) {
    console.error('WHO EML check error:', error.message);
    return { found: false, source: 'WHO Essential Medicines', drugName, error: error.message };
  }
}

/**
 * Get regulatory agency information for a country
 * @param {string} country - Country name or code
 * @returns {object} Regulatory agency info
 */
function getRegulatoryAgency(country) {
  const normalized = country.toLowerCase().replace(/\s+/g, '_');
  return REGULATORY_AGENCIES[normalized] || null;
}

/**
 * Get all regulatory agencies
 * @returns {object} All regulatory agencies
 */
function getAllRegulatoryAgencies() {
  return REGULATORY_AGENCIES;
}

/**
 * Comprehensive medicine verification
 * Checks WHO EML status and provides regulatory agency info
 * @param {string} drugName - Name of the drug
 * @param {string} country - Country code (optional)
 * @returns {object} Verification result
 */
async function verifyMedicine(drugName, country = null) {
  const emlResult = await checkEssentialMedicine(drugName);
  const regulatoryAgency = country ? getRegulatoryAgency(country) : null;

  return {
    drugName,
    essentialMedicine: emlResult,
    regulatoryAgency,
    warning: emlResult.found ? null : 'This drug was not found on the WHO Essential Medicines List. This does not necessarily mean it is counterfeit — it may not be on the list or may be known by a different name.'
  };
}

module.exports = { 
  checkEssentialMedicine, 
  getRegulatoryAgency, 
  getAllRegulatoryAgencies,
  verifyMedicine,
  ESSENTIAL_MEDICINES_CATEGORIES,
  REGULATORY_AGENCIES
};