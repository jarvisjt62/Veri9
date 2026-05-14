/**
 * NIH RxNav API Integration
 * National Library of Medicine drug database - no API key required
 * https://rxnav.nlm.nih.gov/RxNormAPIs.html
 */

const BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

async function lookupByBarcode(barcode) {
  try {
    // Step 1: Search by NDC code (barcode → NDC for drugs)
    const ndcUrl = `${BASE_URL}/ndcstatus.json?ndc=${barcode}`;
    const ndcResponse = await fetch(ndcUrl, {
      headers: { 'User-Agent': 'Veri9/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (ndcResponse.ok) {
      const ndcData = await ndcResponse.json();
      if (ndcData?.ndcStatus?.rxcui) {
        const rxcui = ndcData.ndcStatus.rxcui;
        // Step 2: Get drug name from RXCUI
        const nameUrl = `${BASE_URL}/rxcui/${rxcui}/property.json?propName=RxNorm%20Name`;
        const nameResponse = await fetch(nameUrl, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        });
        let drugName = 'Unknown Drug';
        if (nameResponse.ok) {
          const nameData = await nameResponse.json();
          drugName = nameData?.propConceptGroup?.propConcept?.[0]?.propValue || drugName;
        }
        return {
          found: true,
          source: 'NIH RxNav (Drug DB)',
          barcode,
          name: drugName,
          brand: 'Pharmaceutical',
          category: 'Drug / Medication',
          rxcui,
          regulatoryStatus: 'FDA Registered (NDC)',
          country: 'United States',
        };
      }
    }

    // Step 3: Try drug name search by barcode as approximate code
    const searchUrl = `${BASE_URL}/drugs.json?name=${barcode}`;
    const searchResponse = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const drug = searchData?.drugGroup?.conceptGroup?.[0]?.conceptProperties?.[0];
      if (drug) {
        return {
          found: true,
          source: 'NIH RxNav (Drug DB)',
          barcode,
          name: drug.name || 'Unknown',
          brand: drug.synonym || 'Pharmaceutical',
          category: 'Drug / Medication',
          rxcui: drug.rxcui,
          regulatoryStatus: 'FDA Registered',
        };
      }
    }

    return { found: false, source: 'NIH RxNav (Drug DB)', barcode };
  } catch {
    return { found: false, source: 'NIH RxNav (Drug DB)', barcode };
  }
}

module.exports = { lookupByBarcode };
