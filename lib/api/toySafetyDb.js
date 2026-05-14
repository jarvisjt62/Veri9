// Toy Safety Database
// Maps GS1 prefix → applicable toy-safety regime (CPSC, EN 71, ST mark, GB 6675, IS 9873, AS/NZS ISO 8124).
// Used to confirm that a scanned toy/children's product ships from a jurisdiction
// with an enforceable pre-market safety standard.

const TOY_STANDARDS = {
  // USA
  '000': { country: 'United States', standards: ['CPSIA', 'ASTM F963', '16 CFR 1303'], regulator: 'CPSC', url: 'https://www.cpsc.gov/Business--Manufacturing/Business-Education/Toy-Safety' },
  '001': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '019': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '030': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '031': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '032': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '033': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '034': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '035': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '036': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '037': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '038': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '039': { country: 'United States', standards: ['CPSIA', 'ASTM F963'],                 regulator: 'CPSC', url: 'https://www.cpsc.gov/' },
  '754': { country: 'Canada',        standards: ['Toys Regulations SOR/2011-17'],        regulator: 'Health Canada', url: 'https://www.canada.ca/en/health-canada/services/consumer-product-safety.html' },
  '755': { country: 'Canada',        standards: ['Toys Regulations SOR/2011-17'],        regulator: 'Health Canada', url: 'https://www.canada.ca/en/health-canada/services/consumer-product-safety.html' },

  // EU — Toy Safety Directive 2009/48/EC + EN 71 series
  '300': { country: 'France',      standards: ['EN 71-1/2/3', '2009/48/EC'], regulator: 'DGCCRF',          url: 'https://www.economie.gouv.fr/dgccrf' },
  '400': { country: 'Germany',     standards: ['EN 71', 'GS mark'],          regulator: 'BAuA',            url: 'https://www.baua.de/' },
  '500': { country: 'United Kingdom', standards: ['Toys (Safety) Regs 2011', 'UKCA'], regulator: 'OPSS',   url: 'https://www.gov.uk/government/organisations/office-for-product-safety-and-standards' },
  '540': { country: 'Belgium',     standards: ['EN 71', '2009/48/EC'],        regulator: 'FPS Economy',     url: 'https://economie.fgov.be/' },
  '560': { country: 'Portugal',    standards: ['EN 71', '2009/48/EC'],        regulator: 'ASAE',            url: 'https://www.asae.gov.pt/' },
  '570': { country: 'Denmark',     standards: ['EN 71', '2009/48/EC'],        regulator: 'Sikkerhedsstyrelsen', url: 'https://www.sik.dk/' },
  '590': { country: 'Poland',      standards: ['EN 71', '2009/48/EC'],        regulator: 'UOKiK',           url: 'https://www.uokik.gov.pl/' },
  '800': { country: 'Italy',       standards: ['EN 71', '2009/48/EC'],        regulator: 'MISE',            url: 'https://www.mise.gov.it/' },
  '840': { country: 'Spain',       standards: ['EN 71', '2009/48/EC'],        regulator: 'AECOSAN',         url: 'https://www.aesan.gob.es/' },
  '870': { country: 'Netherlands', standards: ['EN 71', '2009/48/EC'],        regulator: 'NVWA',            url: 'https://www.nvwa.nl/' },

  // Asia
  '450': { country: 'Japan',      standards: ['ST mark (JTA)'],                regulator: 'Japan Toy Association', url: 'https://www.toys.or.jp/' },
  '490': { country: 'Japan',      standards: ['ST mark (JTA)'],                regulator: 'Japan Toy Association', url: 'https://www.toys.or.jp/' },
  '690': { country: 'China',      standards: ['GB 6675', 'CCC for toys'],      regulator: 'CNCA / SAMR',     url: 'https://www.samr.gov.cn/' },
  '691': { country: 'China',      standards: ['GB 6675', 'CCC for toys'],      regulator: 'CNCA / SAMR',     url: 'https://www.samr.gov.cn/' },
  '692': { country: 'China',      standards: ['GB 6675', 'CCC for toys'],      regulator: 'CNCA / SAMR',     url: 'https://www.samr.gov.cn/' },
  '693': { country: 'China',      standards: ['GB 6675', 'CCC for toys'],      regulator: 'CNCA / SAMR',     url: 'https://www.samr.gov.cn/' },
  '880': { country: 'South Korea', standards: ['KPS (Children\'s Product Safety Special Act)'], regulator: 'KATS', url: 'https://www.kats.go.kr/' },
  '890': { country: 'India',      standards: ['IS 9873', 'Toys (Quality Control) Order'], regulator: 'BIS',  url: 'https://www.bis.gov.in/' },

  // Oceania
  '930': { country: 'Australia',   standards: ['AS/NZS ISO 8124', 'Consumer Goods (Toys) Safety Standard'], regulator: 'ACCC', url: 'https://www.productsafety.gov.au/' },
  '931': { country: 'Australia',   standards: ['AS/NZS ISO 8124'],            regulator: 'ACCC',            url: 'https://www.productsafety.gov.au/' },
  '932': { country: 'Australia',   standards: ['AS/NZS ISO 8124'],            regulator: 'ACCC',            url: 'https://www.productsafety.gov.au/' },
  '940': { country: 'New Zealand', standards: ['AS/NZS ISO 8124'],            regulator: 'Consumer Protection NZ', url: 'https://www.consumerprotection.govt.nz/' },

  // LatAm
  '750': { country: 'Mexico',      standards: ['NOM-015-SCFI', 'NOM-252-SSA1'], regulator: 'PROFECO / COFEPRIS', url: 'https://www.gob.mx/profeco' },
  '789': { country: 'Brazil',      standards: ['Portaria INMETRO 563/2016'],  regulator: 'INMETRO',          url: 'https://www.gov.br/inmetro/' },
  '790': { country: 'Brazil',      standards: ['Portaria INMETRO 563/2016'],  regulator: 'INMETRO',          url: 'https://www.gov.br/inmetro/' },
  '779': { country: 'Argentina',   standards: ['Resolución SIC 851/1998'],     regulator: 'Secretaría de Comercio', url: 'https://www.argentina.gob.ar/produccion/comercio' },

  // Africa
  '615': { country: 'Nigeria',     standards: ['SON NIS toy safety', 'SONCAP'], regulator: 'SON',            url: 'https://www.son.gov.ng/' },
  '600': { country: 'South Africa', standards: ['NRCS VC 8054', 'SANS 7 series'], regulator: 'NRCS',         url: 'https://www.nrcs.org.za/' },
  '619': { country: 'Tunisia',     standards: ['NT toy standards'],            regulator: 'INNORPI',         url: 'https://www.innorpi.tn/' },
  '622': { country: 'Egypt',       standards: ['ES 1358 toy safety'],          regulator: 'EOS',             url: 'https://www.eos.org.eg/' },
};

function firstMatchingPrefix(code) {
  for (let len = 3; len >= 2; len--) {
    const p = code.slice(0, len);
    if (TOY_STANDARDS[p]) return { prefix: p, ...TOY_STANDARDS[p] };
  }
  return null;
}

async function lookupByBarcode(barcode) {
  const source = 'Toy Safety Standards Registry';
  try {
    if (!barcode || typeof barcode !== 'string') {
      return { found: false, source, barcode, error: 'Invalid barcode' };
    }
    const digits = barcode.replace(/\D/g, '');
    if (digits.length < 8) {
      return { found: false, source, barcode, reason: 'Barcode too short' };
    }
    const match = firstMatchingPrefix(digits);
    if (!match) {
      return { found: false, source, barcode, reason: 'No toy-safety regime mapped for this GS1 prefix' };
    }
    return {
      found: true,
      source,
      barcode,
      prefix: match.prefix,
      country: match.country,
      countryOfOrigin: match.country,
      applicableStandards: match.standards,
      regulator: match.regulator,
      regulatorUrl: match.url,
      note: `Children's products sold in ${match.country} must comply with: ${match.standards.join(', ')}`,
      verificationLevel: 'jurisdiction-inferred',
    };
  } catch (error) {
    return { found: false, source, barcode, error: error && error.message ? error.message : String(error) };
  }
}

module.exports = { lookupByBarcode };
