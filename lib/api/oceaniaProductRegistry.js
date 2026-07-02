/**
 * Oceania Product Registry (Veri9 aggregator)
 * Australia + New Zealand + Pacific Islands
 *
 * Round 30c: Changed from individual prefix lookup to range-based matching.
 */

const OCEANIA_PREFIX_RANGES = [
  // Australia (930-939)
  { min: 930, max: 939, country: 'Australia', agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  // New Zealand (940-949)
  { min: 940, max: 949, country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
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
  const match = firstMatchingRange(barcode, OCEANIA_PREFIX_RANGES);
  if (!match) return { found: false, source: 'Oceania Product Registry', barcode };
  return {
    found: true,
    source: `Oceania Product Registry (${match.agency})`,
    barcode,
    country: [match.country],
    countryOfOrigin: match.country,
    agency: match.agency,
    agencyUrl: match.url,
    note: `GS1 prefix ${match.prefix} is registered in ${match.country}. Regulator: ${match.agency}.`,
    verificationLevel: 'jurisdiction-confirmed',
  };
}

module.exports = { lookupByBarcode, OCEANIA_PREFIX_RANGES }
