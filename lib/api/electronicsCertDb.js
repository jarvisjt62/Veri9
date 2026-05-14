// Electronics Certification Database
// Maps GS1 prefix → electronics certification authorities and marks for that jurisdiction.
// Used to attest that a scanned electronic product ships from a region whose regulator
// requires pre-market conformity (FCC, CE, PSE, KC, CCC, etc.).

const ELECTRONICS_CERTS = {
  // North America
  '000': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC / Consumer Product Safety Commission', url: 'https://www.fcc.gov/oet/ea' },
  '001': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '002': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '003': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '004': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '005': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '006': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '007': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '008': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '009': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '010': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '011': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '012': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '013': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '014': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '015': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '016': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '017': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '018': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },
  '019': { country: 'United States', marks: ['FCC', 'UL', 'ETL'], regulator: 'FCC',                                      url: 'https://www.fcc.gov/oet/ea' },

  // Canada
  '754': { country: 'Canada', marks: ['ISED', 'CSA', 'cUL'], regulator: 'Innovation, Science and Economic Development Canada', url: 'https://ised-isde.canada.ca/' },
  '755': { country: 'Canada', marks: ['ISED', 'CSA', 'cUL'], regulator: 'ISED Canada', url: 'https://ised-isde.canada.ca/' },

  // EU & UK
  '400': { country: 'Germany',       marks: ['CE', 'RoHS', 'TÜV', 'VDE'],  regulator: 'Bundesnetzagentur', url: 'https://www.bundesnetzagentur.de/' },
  '440': { country: 'Germany',       marks: ['CE', 'RoHS', 'TÜV', 'VDE'],  regulator: 'Bundesnetzagentur', url: 'https://www.bundesnetzagentur.de/' },
  '500': { country: 'United Kingdom', marks: ['UKCA', 'CE (pre-2023)'],    regulator: 'Office for Product Safety and Standards', url: 'https://www.gov.uk/government/organisations/office-for-product-safety-and-standards' },
  '300': { country: 'France',        marks: ['CE', 'RoHS'],                regulator: 'DGCCRF',           url: 'https://www.economie.gouv.fr/dgccrf' },
  '380': { country: 'Bulgaria',      marks: ['CE', 'RoHS'],                regulator: 'CPC',              url: 'https://kzp.bg/' },
  '383': { country: 'Slovenia',      marks: ['CE', 'RoHS'],                regulator: 'Market Inspectorate RS', url: 'https://www.gov.si/en/state-authorities/bodies-within-ministries/market-inspectorate-of-the-republic-of-slovenia/' },
  '385': { country: 'Croatia',       marks: ['CE', 'RoHS'],                regulator: 'State Inspectorate', url: 'https://dirh.gov.hr/' },
  '387': { country: 'Bosnia and Herzegovina', marks: ['CE', 'RoHS'],       regulator: 'BAS',              url: 'https://www.bas.gov.ba/' },
  '540': { country: 'Belgium',       marks: ['CE', 'RoHS'],                regulator: 'FPS Economy',      url: 'https://economie.fgov.be/' },
  '560': { country: 'Portugal',      marks: ['CE', 'RoHS'],                regulator: 'ANACOM',           url: 'https://www.anacom.pt/' },
  '569': { country: 'Iceland',       marks: ['CE', 'RoHS'],                regulator: 'Electrical Safety Iceland', url: 'https://hms.is/' },
  '570': { country: 'Denmark',       marks: ['CE', 'RoHS'],                regulator: 'Danish Safety Technology Authority', url: 'https://www.sik.dk/' },
  '590': { country: 'Poland',        marks: ['CE', 'RoHS'],                regulator: 'UOKiK',            url: 'https://www.uokik.gov.pl/' },
  '594': { country: 'Romania',       marks: ['CE', 'RoHS'],                regulator: 'ANCOM',            url: 'https://www.ancom.ro/' },
  '599': { country: 'Hungary',       marks: ['CE', 'RoHS'],                regulator: 'NMHH',             url: 'https://nmhh.hu/' },
  '640': { country: 'Finland',       marks: ['CE', 'RoHS'],                regulator: 'Tukes',            url: 'https://tukes.fi/' },
  '700': { country: 'Norway',        marks: ['CE (EEA)', 'RoHS'],          regulator: 'Elsäkerhetsverket / DSB', url: 'https://www.dsb.no/' },
  '729': { country: 'Israel',        marks: ['SII'],                       regulator: 'Standards Institution of Israel', url: 'https://www.sii.org.il/' },
  '800': { country: 'Italy',         marks: ['CE', 'RoHS', 'IMQ'],         regulator: 'Ministero dello Sviluppo Economico', url: 'https://www.mise.gov.it/' },
  '840': { country: 'Spain',         marks: ['CE', 'RoHS'],                regulator: 'Ministerio de Industria', url: 'https://www.mincotur.gob.es/' },
  '870': { country: 'Netherlands',   marks: ['CE', 'RoHS'],                regulator: 'Agentschap Telecom / RDI', url: 'https://www.rdi.nl/' },
  '880': { country: 'South Korea',   marks: ['KC'],                        regulator: 'Radio Research Agency (RRA)', url: 'https://rra.go.kr/en/' },

  // Asia
  '450': { country: 'Japan',        marks: ['PSE', 'TELEC', 'VCCI'],       regulator: 'METI / MIC',       url: 'https://www.meti.go.jp/english/' },
  '490': { country: 'Japan',        marks: ['PSE', 'TELEC', 'VCCI'],       regulator: 'METI / MIC',       url: 'https://www.meti.go.jp/english/' },
  '690': { country: 'China',        marks: ['CCC', 'SRRC'],                regulator: 'CNCA / SAMR',      url: 'https://www.samr.gov.cn/' },
  '691': { country: 'China',        marks: ['CCC', 'SRRC'],                regulator: 'CNCA / SAMR',      url: 'https://www.samr.gov.cn/' },
  '692': { country: 'China',        marks: ['CCC', 'SRRC'],                regulator: 'CNCA / SAMR',      url: 'https://www.samr.gov.cn/' },
  '693': { country: 'China',        marks: ['CCC', 'SRRC'],                regulator: 'CNCA / SAMR',      url: 'https://www.samr.gov.cn/' },
  '694': { country: 'China',        marks: ['CCC', 'SRRC'],                regulator: 'CNCA / SAMR',      url: 'https://www.samr.gov.cn/' },
  '695': { country: 'China',        marks: ['CCC', 'SRRC'],                regulator: 'CNCA / SAMR',      url: 'https://www.samr.gov.cn/' },
  '471': { country: 'Taiwan',       marks: ['BSMI', 'NCC'],                regulator: 'BSMI / NCC',       url: 'https://www.bsmi.gov.tw/' },
  '489': { country: 'Hong Kong',    marks: ['OFCA'],                       regulator: 'Office of the Communications Authority', url: 'https://www.ofca.gov.hk/' },
  '890': { country: 'India',        marks: ['BIS', 'WPC', 'TEC'],          regulator: 'Bureau of Indian Standards', url: 'https://www.bis.gov.in/' },
  '955': { country: 'Malaysia',     marks: ['SIRIM', 'MCMC'],              regulator: 'SIRIM QAS / MCMC', url: 'https://www.sirim.my/' },
  '888': { country: 'Singapore',    marks: ['IMDA', 'Safety Mark'],        regulator: 'IMDA',             url: 'https://www.imda.gov.sg/' },
  '885': { country: 'Thailand',     marks: ['TISI', 'NBTC'],               regulator: 'NBTC',             url: 'https://www.nbtc.go.th/' },
  '899': { country: 'Indonesia',    marks: ['Postel', 'SNI'],              regulator: 'Kominfo / SDPPI',  url: 'https://sdppi.kominfo.go.id/' },
  '893': { country: 'Vietnam',      marks: ['MIC', 'QCVN'],                regulator: 'Ministry of Information and Communications', url: 'https://www.mic.gov.vn/' },

  // Oceania
  '930': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '931': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '932': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '933': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '934': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '935': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '936': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '937': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '938': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '939': { country: 'Australia',    marks: ['RCM', 'C-Tick'],              regulator: 'ACMA',             url: 'https://www.acma.gov.au/' },
  '940': { country: 'New Zealand',  marks: ['R-NZ', 'RCM'],                regulator: 'Radio Spectrum Management', url: 'https://www.rsm.govt.nz/' },
  '941': { country: 'New Zealand',  marks: ['R-NZ', 'RCM'],                regulator: 'Radio Spectrum Management', url: 'https://www.rsm.govt.nz/' },
  '942': { country: 'New Zealand',  marks: ['R-NZ', 'RCM'],                regulator: 'Radio Spectrum Management', url: 'https://www.rsm.govt.nz/' },

  // LatAm / Africa
  '750': { country: 'Mexico',       marks: ['NOM', 'IFETEL'],              regulator: 'IFT / CENAM',       url: 'https://www.ift.org.mx/' },
  '789': { country: 'Brazil',       marks: ['INMETRO', 'Anatel'],          regulator: 'Anatel',            url: 'https://www.gov.br/anatel/' },
  '790': { country: 'Brazil',       marks: ['INMETRO', 'Anatel'],          regulator: 'Anatel',            url: 'https://www.gov.br/anatel/' },
  '779': { country: 'Argentina',    marks: ['Resolución SC', 'ENACOM'],    regulator: 'ENACOM',            url: 'https://www.enacom.gob.ar/' },
  '615': { country: 'Nigeria',      marks: ['SONCAP', 'NCC Type Approval'], regulator: 'Standards Organisation of Nigeria / NCC', url: 'https://www.son.gov.ng/' },
  '600': { country: 'South Africa', marks: ['NRCS LOA', 'ICASA'],          regulator: 'NRCS / ICASA',      url: 'https://www.nrcs.org.za/' },
};

function firstMatchingPrefix(code) {
  for (let len = 3; len >= 2; len--) {
    const p = code.slice(0, len);
    if (ELECTRONICS_CERTS[p]) return { prefix: p, ...ELECTRONICS_CERTS[p] };
  }
  return null;
}

async function lookupByBarcode(barcode) {
  const source = 'Electronics Certification Registry';
  try {
    if (!barcode || typeof barcode !== 'string') {
      return { found: false, source, barcode, error: 'Invalid barcode' };
    }
    const digits = barcode.replace(/\D/g, '');
    if (digits.length < 8) {
      return { found: false, source, barcode, reason: 'Barcode too short for electronics prefix lookup' };
    }

    const match = firstMatchingPrefix(digits);
    if (!match) {
      return { found: false, source, barcode, reason: 'No electronics certification authority mapped for this GS1 prefix' };
    }

    return {
      found: true,
      source,
      barcode,
      prefix: match.prefix,
      country: match.country,
      countryOfOrigin: match.country,
      requiredMarks: match.marks,
      regulator: match.regulator,
      regulatorUrl: match.url,
      note: `Electronic/electrical products sold in ${match.country} must typically carry: ${match.marks.join(', ')}`,
      verificationLevel: 'jurisdiction-inferred',
    };
  } catch (error) {
    return { found: false, source, barcode, error: error && error.message ? error.message : String(error) };
  }
}

module.exports = { lookupByBarcode };
