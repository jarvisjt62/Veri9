// Textile & Apparel Registry
// Maps GS1 prefix → applicable textile labelling/flammability standard
// (FTC Textile Act, EU 1007/2011, OEKO-TEX, GB, BIS, JIS, AS/NZS 2755, SANS).

const TEXTILE_REGS = {
  '000': { country: 'United States',  standards: ['FTC Textile Fiber Products Identification Act', '16 CFR Part 303', 'CPSIA (children\'s sleepwear)'], regulator: 'FTC / CPSC', url: 'https://www.ftc.gov/business-guidance/resources/threading-your-way-through-labeling-requirements-under-textile-wool-acts' },
  '019': { country: 'United States',  standards: ['FTC Textile Act', '16 CFR Part 303'],                                                                 regulator: 'FTC',        url: 'https://www.ftc.gov/' },
  '754': { country: 'Canada',         standards: ['Textile Labelling Act'],                                                                              regulator: 'Competition Bureau Canada', url: 'https://competition-bureau.canada.ca/' },

  '300': { country: 'France',         standards: ['EU 1007/2011', 'OEKO-TEX Standard 100'],  regulator: 'DGCCRF',          url: 'https://www.economie.gouv.fr/dgccrf' },
  '400': { country: 'Germany',        standards: ['EU 1007/2011', 'OEKO-TEX', 'GOTS'],       regulator: 'Marktüberwachung', url: 'https://www.baua.de/' },
  '500': { country: 'United Kingdom', standards: ['Textile Products (Labelling) Regs 2012'], regulator: 'OPSS',            url: 'https://www.gov.uk/government/organisations/office-for-product-safety-and-standards' },
  '540': { country: 'Belgium',        standards: ['EU 1007/2011'],                           regulator: 'FPS Economy',      url: 'https://economie.fgov.be/' },
  '560': { country: 'Portugal',       standards: ['EU 1007/2011'],                           regulator: 'ASAE',             url: 'https://www.asae.gov.pt/' },
  '590': { country: 'Poland',         standards: ['EU 1007/2011'],                           regulator: 'UOKiK',            url: 'https://www.uokik.gov.pl/' },
  '800': { country: 'Italy',          standards: ['EU 1007/2011', 'Made in Italy GI'],       regulator: 'MISE',             url: 'https://www.mise.gov.it/' },
  '840': { country: 'Spain',          standards: ['EU 1007/2011'],                           regulator: 'AECOSAN',          url: 'https://www.aesan.gob.es/' },
  '870': { country: 'Netherlands',    standards: ['EU 1007/2011'],                           regulator: 'NVWA',             url: 'https://www.nvwa.nl/' },

  '450': { country: 'Japan',         standards: ['JIS L 0217', 'Household Goods Quality Labelling Act'], regulator: 'METI', url: 'https://www.meti.go.jp/english/' },
  '490': { country: 'Japan',         standards: ['JIS L 0217'],                              regulator: 'METI',              url: 'https://www.meti.go.jp/english/' },
  '690': { country: 'China',         standards: ['GB 5296.4', 'GB 18401 textile safety'],    regulator: 'SAMR',              url: 'https://www.samr.gov.cn/' },
  '880': { country: 'South Korea',   standards: ['KATS textile labelling'],                  regulator: 'KATS',              url: 'https://www.kats.go.kr/' },
  '890': { country: 'India',         standards: ['Textiles Committee Act 1963', 'BIS Wool/Silk marks'], regulator: 'Textiles Committee of India', url: 'https://www.textilescommittee.nic.in/' },

  '930': { country: 'Australia',     standards: ['Trade Practices (Consumer Product Information Standards) (Cosmetics) Regulations', 'AS/NZS 1957 care labels'], regulator: 'ACCC', url: 'https://www.productsafety.gov.au/' },
  '940': { country: 'New Zealand',   standards: ['AS/NZS 1957 care labels'],                 regulator: 'Consumer Protection NZ', url: 'https://www.consumerprotection.govt.nz/' },

  '789': { country: 'Brazil',        standards: ['INMETRO textile rules', 'NBR ISO 3758'],   regulator: 'INMETRO',           url: 'https://www.gov.br/inmetro/' },
  '750': { country: 'Mexico',        standards: ['NOM-004-SCFI textile labelling'],          regulator: 'PROFECO',            url: 'https://www.gob.mx/profeco' },
  '779': { country: 'Argentina',     standards: ['Resolución 850/2020 textile'],             regulator: 'Secretaría de Comercio Interior', url: 'https://www.argentina.gob.ar/produccion' },
  '770': { country: 'Colombia',      standards: ['Resolución 1950/2009 textile'],            regulator: 'Superintendencia de Industria y Comercio', url: 'https://www.sic.gov.co/' },

  '615': { country: 'Nigeria',       standards: ['SON textile standards'],                   regulator: 'SON',                url: 'https://www.son.gov.ng/' },
  '600': { country: 'South Africa',  standards: ['SABS textile standards'],                  regulator: 'SABS',               url: 'https://www.sabs.co.za/' },
  '619': { country: 'Tunisia',       standards: ['INNORPI textile NT'],                      regulator: 'INNORPI',            url: 'https://www.innorpi.tn/' },
  '622': { country: 'Egypt',         standards: ['ES textile standards'],                    regulator: 'EOS',                url: 'https://www.eos.org.eg/' },

  '729': { country: 'Israel',       standards: ['SI 1145 textile labelling'],               regulator: 'SII',                url: 'https://www.sii.org.il/' },
};

function firstMatchingPrefix(code) {
  for (let len = 3; len >= 2; len--) {
    const p = code.slice(0, len);
    if (TEXTILE_REGS[p]) return { prefix: p, ...TEXTILE_REGS[p] };
  }
  return null;
}

async function lookupByBarcode(barcode) {
  const source = 'Textile & Apparel Labelling Registry';
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
      return { found: false, source, barcode, reason: 'No textile labelling regime mapped for this GS1 prefix' };
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
      note: `Textiles sold in ${match.country} must follow: ${match.standards.join(', ')}`,
      verificationLevel: 'jurisdiction-inferred',
    };
  } catch (error) {
    return { found: false, source, barcode, error: error && error.message ? error.message : String(error) };
  }
}

module.exports = { lookupByBarcode };
