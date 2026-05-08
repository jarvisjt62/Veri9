/**
 * OpenFDA API Integration
 * Free US government database for drugs, food, medical devices
 * No API key required (rate limited: 240 requests/minute without key)
 */

const BASE_URL = 'https://api.fda.gov';

/**
 * Look up a drug by NDC (National Drug Code) or brand name
 * @param {string} identifier - NDC code or brand name
 * @param {string} type - 'ndc' or 'name'
 * @returns {object} Drug data or null
 */
async function lookupDrug(identifier, type = 'ndc') {
  try {
    let url;
    if (type === 'ndc') {
      // Search by NDC code (product_ndc field)
      url = `${BASE_URL}/drug/ndc.json?search=product_ndc:"${identifier}"&limit=5`;
    } else {
      // Search by brand name
      url = `${BASE_URL}/drug/ndc.json?search=brand_name:"${identifier}"&limit=5`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const drug = data.results[0];
      return {
        found: true,
        source: 'OpenFDA',
        identifier,
        searchType: type,
        brandName: drug.brand_name || 'Unknown',
        genericName: drug.generic_name || 'Unknown',
        manufacturer: drug.manufacturer_name || 'Unknown',
        ndc: drug.product_ndc || null,
        productType: drug.product_type || null,
        route: drug.route ? drug.route.join(', ') : null,
        dosageForm: drug.dosage_form || null,
        activeIngredients: drug.active_ingredients ? drug.active_ingredients.map(ai => ({
          name: ai.name,
          strength: ai.strength
        })) : [],
        marketingCategory: drug.marketing_category || null,
        applicationNumber: drug.application_number || null,
        labelerName: drug.labeler_name || null,
        status: drug.marketing_status || null,
        totalResults: data.meta?.results?.total || 0,
        allResults: data.results.slice(0, 5).map(r => ({
          brandName: r.brand_name,
          ndc: r.product_ndc,
          manufacturer: r.manufacturer_name,
          status: r.marketing_status
        }))
      };
    }

    return { found: false, source: 'OpenFDA', identifier, searchType: type };
  } catch (error) {
    console.error('OpenFDA drug lookup error:', error.message);
    return { found: false, source: 'OpenFDA', identifier, error: error.message };
  }
}

/**
 * Look up a drug by NDC code specifically
 * @param {string} ndc - NDC code (e.g., "1234-5678")
 * @returns {object} Drug data or null
 */
async function lookupByNDC(ndc) {
  return lookupDrug(ndc, 'ndc');
}

/**
 * Search for drugs by brand name
 * @param {string} name - Brand name of the drug
 * @returns {object} Drug data or null
 */
async function searchByName(name) {
  return lookupDrug(name, 'name');
}

/**
 * Look up food enforcement reports (recalls, safety alerts)
 * @param {string} query - Search term
 * @returns {array} Enforcement reports
 */
async function lookupFoodEnforcement(query) {
  try {
    const url = `${BASE_URL}/food/enforcement.json?search="${encodeURIComponent(query)}"&limit=5`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results.map(r => ({
        recallNumber: r.recall_number,
        productDescription: r.product_description,
        reason: r.reason_for_recall,
        status: r.status,
        classification: r.classification,
        recallingFirm: r.recalling_firm,
        recallDate: r.recall_initiation_date,
        state: r.state
      }));
    }

    return [];
  } catch (error) {
    console.error('OpenFDA enforcement lookup error:', error.message);
    return [];
  }
}

/**
 * Look up drug enforcement reports (recalls)
 * @param {string} query - Search term
 * @returns {array} Enforcement reports
 */
async function lookupDrugEnforcement(query) {
  try {
    const url = `${BASE_URL}/drug/enforcement.json?search="${encodeURIComponent(query)}"&limit=5`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results.map(r => ({
        recallNumber: r.recall_number,
        productDescription: r.product_description,
        reason: r.reason_for_recall,
        status: r.status,
        classification: r.classification,
        recallingFirm: r.recalling_firm,
        recallDate: r.recall_initiation_date,
        state: r.state
      }));
    }

    return [];
  } catch (error) {
    console.error('OpenFDA drug enforcement lookup error:', error.message);
    return [];
  }
}

module.exports = { lookupDrug, lookupByNDC, searchByName, lookupFoodEnforcement, lookupDrugEnforcement };