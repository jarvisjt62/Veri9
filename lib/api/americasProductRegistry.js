/**
 * Americas Product Registry (Veri9 aggregator)
 *
 * Covers North, Central, and South American GS1 prefixes and maps them
 * to the relevant national regulator/standards body.
 * (USA/Canada 000-019 are mostly handled by OpenFDA/USDA/UPCitemdb already,
 * but we include them for cross-verification.)
 */

const AMERICAS_PREFIX_TO_AGENCY = {
  // USA / Canada 000-019
  '000': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '001': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '002': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '003': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '004': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '005': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '006': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '007': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '008': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '009': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '010': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '011': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '012': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '013': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '014': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '015': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '016': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '017': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '018': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  '019': { country: 'USA',         agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  // Central America
  '740': { country: 'Guatemala',   agency: 'DRCPSA',    url: 'https://medicamentos.mspas.gob.gt/' },
  '741': { country: 'El Salvador', agency: 'DNM',       url: 'https://www.medicamentos.gob.sv/' },
  '742': { country: 'Honduras',    agency: 'ARSA',      url: 'https://arsa.gob.hn/' },
  '743': { country: 'Nicaragua',   agency: 'Ministerio de Salud', url: 'https://www.minsa.gob.ni/' },
  '744': { country: 'Costa Rica',  agency: 'Ministerio de Salud', url: 'https://www.ministeriodesalud.go.cr/' },
  '745': { country: 'Panama',      agency: 'MINSA',     url: 'https://www.minsa.gob.pa/' },
  '746': { country: 'Dominican Republic', agency: 'DIGEMAPS', url: 'https://www.msp.gob.do/' },
  // Mexico
  '750': { country: 'Mexico',      agency: 'COFEPRIS',  url: 'https://www.gob.mx/cofepris' },
  // Canada (duplicate, as 754-755 are also Canada in GS1)
  '754': { country: 'Canada',      agency: 'Health Canada / CFIA', url: 'https://www.canada.ca/en/health-canada.html' },
  '755': { country: 'Canada',      agency: 'Health Canada / CFIA', url: 'https://www.canada.ca/en/health-canada.html' },
  // South America
  '759': { country: 'Venezuela',   agency: 'SACS',      url: 'https://www.sacs.gob.ve/' },
  '770': { country: 'Colombia',    agency: 'INVIMA',    url: 'https://www.invima.gov.co/' },
  '773': { country: 'Uruguay',     agency: 'MSP',       url: 'https://www.gub.uy/ministerio-salud-publica' },
  '775': { country: 'Peru',        agency: 'DIGEMID',   url: 'https://www.digemid.minsa.gob.pe/' },
  '777': { country: 'Bolivia',     agency: 'AGEMED',    url: 'https://www.minsalud.gob.bo/' },
  '778': { country: 'Argentina',   agency: 'ANMAT',     url: 'https://www.argentina.gob.ar/anmat' },
  '779': { country: 'Argentina',   agency: 'ANMAT',     url: 'https://www.argentina.gob.ar/anmat' },
  '780': { country: 'Chile',       agency: 'ISP Chile', url: 'https://www.ispch.gob.cl/' },
  '784': { country: 'Paraguay',    agency: 'DINAVISA',  url: 'https://www.mspbs.gov.py/dinavisa/' },
  '786': { country: 'Ecuador',     agency: 'ARCSA',     url: 'https://www.controlsanitario.gob.ec/' },
  '789': { country: 'Brazil',      agency: 'ANVISA',    url: 'https://www.gov.br/anvisa/pt-br' },
  '790': { country: 'Brazil',      agency: 'ANVISA',    url: 'https://www.gov.br/anvisa/pt-br' },
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
  const match = firstMatchingPrefix(barcode, AMERICAS_PREFIX_TO_AGENCY)
  if (!match) return { found: false, source: 'Americas Product Registry', barcode }
  return {
    found: true,
    source: `Americas Product Registry (${match.agency})`,
    barcode,
    country: [match.country],
    countryOfOrigin: match.country,
    agency: match.agency,
    agencyUrl: match.url,
    note: `GS1 prefix ${match.prefix} is registered in ${match.country}. Regulator: ${match.agency}.`,
    verificationLevel: 'jurisdiction-confirmed',
  }
}

module.exports = { lookupByBarcode, AMERICAS_PREFIX_TO_AGENCY }
