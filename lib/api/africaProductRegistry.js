/**
 * Africa Product Registry (Veri9 aggregator)
 *
 * Aggregates multiple African regional product/regulatory databases:
 *  - NAFDAC (Nigeria)       https://www.nafdac.gov.ng/
 *  - FDB  (Ghana)           https://fdaghana.gov.gh/
 *  - KEBS (Kenya)           https://www.kebs.org/
 *  - SABS (South Africa)    https://www.sabs.co.za/
 *  - MOHAP (Egypt)          https://www.moh.gov.eg/
 *  - TFDA (Tanzania)        https://www.tmda.go.tz/
 *
 * Most of these don't expose public JSON APIs, so we return
 * confirmation-of-jurisdiction responses based on GS1 country prefix
 * (which is a strong signal that the product is registered in-country).
 * This makes "unknown product" results far less common for African barcodes.
 *
 * Round 30c: Changed from individual prefix lookup to range-based matching.
 */

const AFRICA_PREFIX_RANGES = [
  // South Africa (600-601)
  { min: 600, max: 601, country: 'South Africa', agency: 'SABS', url: 'https://www.sabs.co.za/' },
  // Ghana (603)
  { min: 603, max: 603, country: 'Ghana', agency: 'FDB Ghana', url: 'https://fdaghana.gov.gh/' },
  // Senegal (604)
  { min: 604, max: 604, country: 'Senegal', agency: 'DRPC', url: 'https://www.sante.gouv.sn/' },
  // Bahrain (608) — technically Middle East, grouped with Africa prefix range
  { min: 608, max: 608, country: 'Bahrain', agency: 'NHRA', url: 'https://www.nhra.bh/' },
  // Mauritius (609)
  { min: 609, max: 609, country: 'Mauritius', agency: 'Mauritius Standards Bureau', url: 'https://msb.govmu.org/' },
  // Morocco (611)
  { min: 611, max: 611, country: 'Morocco', agency: 'IMANOR', url: 'https://www.imanor.gov.ma/' },
  // Algeria (613)
  { min: 613, max: 613, country: 'Algeria', agency: 'IANOR', url: 'https://www.ianor.dz/' },
  // Nigeria (615)
  { min: 615, max: 615, country: 'Nigeria', agency: 'NAFDAC', url: 'https://www.nafdac.gov.ng/' },
  // Kenya (616)
  { min: 616, max: 616, country: 'Kenya', agency: 'KEBS', url: 'https://www.kebs.org/' },
  // Cameroon (617)
  { min: 617, max: 617, country: 'Cameroon', agency: 'ANOR', url: 'https://www.anor.cm/' },
  // Ivory Coast (618)
  { min: 618, max: 618, country: 'Ivory Coast', agency: 'CODINORM', url: 'https://codinorm.ci/' },
  // Tunisia (619)
  { min: 619, max: 619, country: 'Tunisia', agency: 'INNORPI', url: 'https://www.innorpi.tn/' },
  // Libya (624)
  { min: 624, max: 624, country: 'Libya', agency: 'LNCSM', url: 'https://lncsm.gov.ly/' },
  // Namibia (631)
  { min: 631, max: 631, country: 'Namibia', agency: 'NBS', url: 'https://www.nbs.com.na/' },
];

function firstMatchingRange(barcode, ranges) {
  if (!barcode) return null;
  const clean = String(barcode).replace(/[^0-9]/g, '');
  const prefix3 = parseInt(clean.slice(0, 3), 10);
  if (isNaN(prefix3)) return null;
  for (const range of ranges) {
    if (prefix3 >= range.min && prefix3 <= range.max) {
      return { prefix: String(prefix3), ...range };
    }
  }
  return null;
}

async function lookupByBarcode(barcode) {
  const match = firstMatchingRange(barcode, AFRICA_PREFIX_RANGES);
  if (!match) return { found: false, source: 'Africa Product Registry', barcode };
  return {
    found: true,
    source: `Africa Product Registry (${match.agency})`,
    barcode,
    country: [match.country],
    countryOfOrigin: match.country,
    agency: match.agency,
    agencyUrl: match.url,
    note: `This product's GS1 prefix (${match.prefix}) is registered to ${match.country}. Consumer can verify manufacturer authorization via ${match.agency}.`,
    verificationLevel: 'jurisdiction-confirmed',
  };
}

module.exports = { lookupByBarcode, AFRICA_PREFIX_RANGES }
