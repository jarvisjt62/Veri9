/**
 * Wikidata SPARQL — GTIN/EAN/UPC product lookup
 *
 * Free, no key. ~10M+ items have GTIN (P3962). Returns authoritative
 * brand/manufacturer/country/parent-company cross-references.
 *
 * Endpoint: https://query.wikidata.org/sparql
 *
 * IMPORTANT: Wikidata's SPARQL endpoint requires a User-Agent that
 * identifies the application + a contact (per their UA policy).
 *
 * Schema highlights used:
 *   P3962 = GTIN
 *   P31   = instance of
 *   P176  = manufacturer
 *   P127  = owned by
 *   P749  = parent organization
 *   P17   = country
 *   P495  = country of origin
 *   P1056 = product or material produced
 */

const { safeFetchJson } = require('./safeFetch');

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'Veri9/1.0 (https://veri9.com; support@veri9.com) verification-engine';

/**
 * Lookup a product by GTIN/EAN/UPC. Tries the literal barcode first, then
 * the unpadded variant (Wikidata stores GTINs without leading zeros sometimes).
 *
 * @param {string} barcode
 * @returns {Promise<object>}
 */
async function lookupByBarcode(barcode) {
  if (!barcode) return { found: false, source: 'Wikidata', barcode };

  const candidates = [String(barcode), String(barcode).replace(/^0+/, '')]
    .filter((v, i, a) => v && a.indexOf(v) === i);

  for (const code of candidates) {
    const result = await runQuery(code);
    if (result && result.found) return { ...result, barcode };
  }

  return { found: false, source: 'Wikidata', barcode };
}

async function runQuery(gtin) {
  // Resolve item, English label, brand label, manufacturer label,
  // country-of-origin label, parent-organization label, and a description.
  const sparql = `
    SELECT ?item ?itemLabel ?itemDescription
           ?brandLabel ?manufacturerLabel ?countryLabel
           ?parentLabel ?inceptionDate
    WHERE {
      ?item wdt:P3962 "${gtin.replace(/"/g, '')}".
      OPTIONAL { ?item wdt:P1716 ?brand. }
      OPTIONAL { ?item wdt:P176 ?manufacturer. }
      OPTIONAL { ?item wdt:P495 ?country. }
      OPTIONAL { ?item wdt:P749 ?parent. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 1
  `;

  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(sparql)}`;
  const data = await safeFetchJson(url, {
    timeoutMs: 8000,
    retries: 1,
    headers: {
      'User-Agent': UA,
      'Accept': 'application/sparql-results+json',
    },
  });

  if (!data || !data.results || !data.results.bindings || data.results.bindings.length === 0) {
    return null;
  }

  const b = data.results.bindings[0];
  const itemUri = b.item && b.item.value;
  const itemId = itemUri ? itemUri.split('/').pop() : null;
  const name = b.itemLabel && b.itemLabel.value;

  // If the only thing returned is the Q-id (itemLabel === itemId), the
  // entity has no English label — treat as a low-quality match.
  if (!name || name === itemId) return null;

  return {
    found: true,
    source: 'Wikidata',
    name,
    brand: (b.brandLabel && b.brandLabel.value) || 'Unknown',
    manufacturer: (b.manufacturerLabel && b.manufacturerLabel.value) || 'Unknown',
    country: (b.countryLabel && b.countryLabel.value) || 'Unknown',
    parentCompany: (b.parentLabel && b.parentLabel.value) || null,
    description: (b.itemDescription && b.itemDescription.value) || null,
    inceptionDate: (b.inceptionDate && b.inceptionDate.value) || null,
    wikidataId: itemId,
    wikidataUrl: itemUri,
  };
}

module.exports = { lookupByBarcode };
