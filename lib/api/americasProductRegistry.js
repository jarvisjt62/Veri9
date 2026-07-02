/**
 * Americas Product Registry (Veri9 aggregator)
 *
 * Covers North, Central, and South American GS1 prefixes and maps them
 * to the relevant national regulator/standards body.
 *
 * Round 30c: Changed from individual prefix lookup to range-based matching
 * to ensure complete coverage of all valid GS1 prefixes.
 */

const AMERICAS_PREFIX_RANGES = [
  // USA (000-019, 020-029 restricted, 030-039 drugs, 040-049 restricted, 060-099, 100-139)
  { min: 0, max: 19, country: 'USA', agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  { min: 60, max: 99, country: 'USA', agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  { min: 100, max: 139, country: 'USA', agency: 'FDA / USDA', url: 'https://www.fda.gov/' },
  // Canada (754-755)
  { min: 754, max: 755, country: 'Canada', agency: 'Health Canada / CFIA', url: 'https://www.canada.ca/en/health-canada.html' },
  // Mexico (750)
  { min: 750, max: 750, country: 'Mexico', agency: 'COFEPRIS', url: 'https://www.gob.mx/cofepris' },
  // Guatemala
  { min: 740, max: 740, country: 'Guatemala', agency: 'DRCPSA', url: 'https://medicamentos.mspas.gob.gt/' },
  // El Salvador
  { min: 741, max: 741, country: 'El Salvador', agency: 'DNM', url: 'https://www.medicamentos.gob.sv/' },
  // Honduras
  { min: 742, max: 742, country: 'Honduras', agency: 'ARSA', url: 'https://arsa.gob.hn/' },
  // Nicaragua
  { min: 743, max: 743, country: 'Nicaragua', agency: 'Ministerio de Salud', url: 'https://www.minsa.gob.ni/' },
  // Costa Rica
  { min: 744, max: 744, country: 'Costa Rica', agency: 'Ministerio de Salud', url: 'https://www.ministeriodesalud.go.cr/' },
  // Panama
  { min: 745, max: 745, country: 'Panama', agency: 'MINSA', url: 'https://www.minsa.gob.pa/' },
  // Dominican Republic
  { min: 746, max: 746, country: 'Dominican Republic', agency: 'DIGEMAPS', url: 'https://www.msp.gob.do/' },
  // Venezuela
  { min: 759, max: 759, country: 'Venezuela', agency: 'SACS', url: 'https://www.sacs.gob.ve/' },
  // Colombia (770-771)
  { min: 770, max: 771, country: 'Colombia', agency: 'INVIMA', url: 'https://www.invima.gov.co/' },
  // Uruguay
  { min: 773, max: 773, country: 'Uruguay', agency: 'MSP', url: 'https://www.gub.uy/ministerio-salud-publica' },
  // Peru
  { min: 775, max: 775, country: 'Peru', agency: 'DIGEMID', url: 'https://www.digemid.minsa.gob.pe/' },
  // Bolivia
  { min: 777, max: 777, country: 'Bolivia', agency: 'AGEMED', url: 'https://www.minsalud.gob.bo/' },
  // Argentina (778-779)
  { min: 778, max: 779, country: 'Argentina', agency: 'ANMAT', url: 'https://www.argentina.gob.ar/anmat' },
  // Chile
  { min: 780, max: 780, country: 'Chile', agency: 'ISP Chile', url: 'https://www.ispch.gob.cl/' },
  // Paraguay
  { min: 784, max: 784, country: 'Paraguay', agency: 'DINAVISA', url: 'https://www.mspbs.gov.py/dinavisa/' },
  // Ecuador
  { min: 786, max: 786, country: 'Ecuador', agency: 'ARCSA', url: 'https://www.controlsanitario.gob.ec/' },
  // Brazil (789-790)
  { min: 789, max: 790, country: 'Brazil', agency: 'ANVISA', url: 'https://www.gov.br/anvisa/pt-br' },
  // Cuba
  { min: 850, max: 850, country: 'Cuba', agency: 'CECMED', url: 'https://www.cecmed.cu/' },
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
  const match = firstMatchingRange(barcode, AMERICAS_PREFIX_RANGES);
  if (!match) return { found: false, source: 'Americas Product Registry', barcode };
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
  };
}

module.exports = { lookupByBarcode, AMERICAS_PREFIX_RANGES }
