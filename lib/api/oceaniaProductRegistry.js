/**
 * Oceania Product Registry (Veri9 aggregator)
 * Australia + New Zealand + Pacific Islands
 */

const OCEANIA_PREFIX_TO_AGENCY = {
  // Australia 930-939
  '930': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '931': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '932': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '933': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '934': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '935': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '936': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '937': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '938': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  '939': { country: 'Australia',   agency: 'FSANZ / TGA', url: 'https://www.foodstandards.gov.au/' },
  // New Zealand 940-949
  '940': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '941': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '942': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '943': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '944': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '945': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '946': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '947': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '948': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
  '949': { country: 'New Zealand', agency: 'MPI / Medsafe', url: 'https://www.mpi.govt.nz/' },
}

function firstMatchingPrefix(barcode, table) {
  if (!barcode) return null
  const clean = String(barcode).replace(/[^0-9]/g, '')
  for (let len = 3; len >= 2; len--) {
    const p = clean.slice(0, len)
    if (table[p]) return { prefix: p, ...table[p] }
  }
  return null
}

async function lookupByBarcode(barcode) {
  const match = firstMatchingPrefix(barcode, OCEANIA_PREFIX_TO_AGENCY)
  if (!match) return { found: false, source: 'Oceania Product Registry', barcode }
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
  }
}

module.exports = { lookupByBarcode, OCEANIA_PREFIX_TO_AGENCY }
