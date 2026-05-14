// Automotive Parts Database
// Maps GS1 prefix → automotive/spare-parts regulatory standards (DOT, UNECE, E-mark,
// JIS, GB, AIS, ADR, NRCS, COFEPRIS-style) and the home-country regulator.

const AUTO_REGS = {
  '000': { country: 'United States', standards: ['DOT', 'FMVSS', 'NHTSA'], regulator: 'NHTSA', url: 'https://www.nhtsa.gov/' },
  '009': { country: 'United States', standards: ['DOT', 'FMVSS'],          regulator: 'NHTSA', url: 'https://www.nhtsa.gov/' },
  '019': { country: 'United States', standards: ['DOT', 'FMVSS'],          regulator: 'NHTSA', url: 'https://www.nhtsa.gov/' },
  '754': { country: 'Canada',        standards: ['Transport Canada CMVSS'], regulator: 'Transport Canada', url: 'https://tc.canada.ca/en/road-transportation' },

  '300': { country: 'France',        standards: ['UNECE', 'E-mark'],        regulator: 'UTAC',           url: 'https://www.utac.com/' },
  '400': { country: 'Germany',       standards: ['UNECE', 'E-mark', 'KBA'], regulator: 'Kraftfahrt-Bundesamt', url: 'https://www.kba.de/' },
  '500': { country: 'United Kingdom', standards: ['UNECE', 'UK type approval'], regulator: 'VCA',        url: 'https://www.vehicle-certification-agency.gov.uk/' },
  '800': { country: 'Italy',         standards: ['UNECE', 'E-mark'],        regulator: 'MIT',            url: 'https://www.mit.gov.it/' },
  '840': { country: 'Spain',         standards: ['UNECE', 'E-mark'],        regulator: 'Dirección General de Tráfico', url: 'https://www.dgt.es/' },
  '870': { country: 'Netherlands',   standards: ['UNECE', 'E-mark'],        regulator: 'RDW',            url: 'https://www.rdw.nl/' },

  '450': { country: 'Japan',         standards: ['JIS', 'JASO', 'MLIT type approval'], regulator: 'MLIT', url: 'https://www.mlit.go.jp/en/' },
  '490': { country: 'Japan',         standards: ['JIS', 'JASO'],            regulator: 'MLIT',            url: 'https://www.mlit.go.jp/en/' },
  '690': { country: 'China',         standards: ['GB', 'CCC for vehicle parts'], regulator: 'MIIT / SAMR', url: 'https://www.miit.gov.cn/' },
  '880': { country: 'South Korea',   standards: ['KMVSS'],                  regulator: 'MOLIT',           url: 'https://www.molit.go.kr/' },
  '890': { country: 'India',         standards: ['AIS', 'CMVR'],            regulator: 'ARAI / CIRT',     url: 'https://www.araiindia.com/' },

  '930': { country: 'Australia',     standards: ['ADR (Australian Design Rules)'], regulator: 'Department of Infrastructure', url: 'https://www.infrastructure.gov.au/' },
  '940': { country: 'New Zealand',   standards: ['NZTA rules'],             regulator: 'Waka Kotahi NZTA', url: 'https://www.nzta.govt.nz/' },

  '615': { country: 'Nigeria',       standards: ['SONCAP for automotive'],  regulator: 'SON / FRSC',      url: 'https://www.son.gov.ng/' },
  '600': { country: 'South Africa',  standards: ['NRCS VC 8054 for automotive', 'SABS'], regulator: 'NRCS', url: 'https://www.nrcs.org.za/' },
  '789': { country: 'Brazil',        standards: ['CONTRAN', 'INMETRO automotive'], regulator: 'DENATRAN / INMETRO', url: 'https://www.gov.br/infraestrutura/' },
  '750': { country: 'Mexico',        standards: ['NOM-194-SCFI'],           regulator: 'DGN / SCT',       url: 'https://www.gob.mx/sct' },
  '779': { country: 'Argentina',     standards: ['Ley Nacional de Tránsito'], regulator: 'ANSV',          url: 'https://www.argentina.gob.ar/seguridadvial' },
  '729': { country: 'Israel',        standards: ['Israeli standards for vehicle parts'], regulator: 'Ministry of Transport', url: 'https://www.gov.il/en/departments/ministry_of_transport' },
  '888': { country: 'Singapore',     standards: ['LTA type approval'],      regulator: 'LTA',             url: 'https://www.lta.gov.sg/' },
};

function firstMatchingPrefix(code) {
  for (let len = 3; len >= 2; len--) {
    const p = code.slice(0, len);
    if (AUTO_REGS[p]) return { prefix: p, ...AUTO_REGS[p] };
  }
  return null;
}

async function lookupByBarcode(barcode) {
  const source = 'Automotive Parts Standards Registry';
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
      return { found: false, source, barcode, reason: 'No automotive-parts standard mapped for this GS1 prefix' };
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
      note: `Automotive/spare parts distributed in ${match.country} must comply with: ${match.standards.join(', ')}`,
      verificationLevel: 'jurisdiction-inferred',
    };
  } catch (error) {
    return { found: false, source, barcode, error: error && error.message ? error.message : String(error) };
  }
}

module.exports = { lookupByBarcode };
