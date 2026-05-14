// Wine & Spirits Registry
// Maps GS1 prefix → alcohol regulator + labelling/excise regime (TTB, EU PDO/PGI, WSTA,
// DOC/DOCG, INAO, AFAD, etc.). Gives regulatory context for scanned wine/spirits/beer.

const ALCOHOL_REGS = {
  '000': { country: 'United States',  regulator: 'TTB (Alcohol and Tobacco Tax and Trade Bureau)', url: 'https://www.ttb.gov/',       rules: ['COLA label approval', '27 CFR Part 4/5/7'] },
  '001': { country: 'United States',  regulator: 'TTB',                                              url: 'https://www.ttb.gov/',      rules: ['COLA label approval', '27 CFR Part 4/5/7'] },
  '754': { country: 'Canada',         regulator: 'CFIA + Provincial liquor boards',                   url: 'https://inspection.canada.ca/', rules: ['Food and Drugs Act', 'Provincial liquor board listings'] },

  // Europe — PDO/PGI recognition is the authenticity signal
  '300': { country: 'France',         regulator: 'INAO + DGCCRF',                                    url: 'https://www.inao.gouv.fr/', rules: ['AOC/AOP', 'IGP', 'Douanes excise stamp'] },
  '380': { country: 'Bulgaria',       regulator: 'Executive Agency for Vine and Wine',                url: 'https://eavw.com/',          rules: ['EU 1308/2013', 'PDO/PGI'] },
  '383': { country: 'Slovenia',       regulator: 'Ministry of Agriculture',                           url: 'https://www.gov.si/',        rules: ['EU PDO/PGI'] },
  '385': { country: 'Croatia',        regulator: 'Ministry of Agriculture',                           url: 'https://poljoprivreda.gov.hr/', rules: ['EU PDO/PGI'] },
  '400': { country: 'Germany',        regulator: 'Bundesanstalt für Landwirtschaft und Ernährung (BLE)', url: 'https://www.ble.de/',    rules: ['Weingesetz', 'EU PDO/PGI'] },
  '500': { country: 'United Kingdom', regulator: 'HMRC + Food Standards Agency',                      url: 'https://www.gov.uk/government/organisations/hm-revenue-customs', rules: ['UKCA GI', 'Alcohol duty stamp'] },
  '520': { country: 'Greece',         regulator: 'Ministry of Rural Development and Food',            url: 'https://www.minagric.gr/', rules: ['EU PDO/PGI'] },
  '539': { country: 'Ireland',        regulator: 'Revenue Commissioners',                             url: 'https://www.revenue.ie/',    rules: ['Irish Whiskey GI'] },
  '560': { country: 'Portugal',       regulator: 'IVV (Instituto da Vinha e do Vinho)',               url: 'https://www.ivv.gov.pt/',   rules: ['DOC', 'IPR', 'EU PDO/PGI'] },
  '800': { country: 'Italy',          regulator: 'ICQRF (Ispettorato Centrale Repressione Frodi)',    url: 'https://www.politicheagricole.it/', rules: ['DOC', 'DOCG', 'IGT', 'EU PDO/PGI'] },
  '840': { country: 'Spain',          regulator: 'Ministerio de Agricultura, Pesca y Alimentación',   url: 'https://www.mapa.gob.es/',  rules: ['DO', 'DOCa', 'EU PDO/PGI'] },
  '870': { country: 'Netherlands',    regulator: 'NVWA',                                              url: 'https://www.nvwa.nl/',      rules: ['EU labelling'] },

  // Other majors
  '729': { country: 'Israel',         regulator: 'Ministry of Health + IQC',                          url: 'https://www.health.gov.il/english/', rules: ['Kosher wine regulations'] },
  '450': { country: 'Japan',          regulator: 'National Tax Agency',                               url: 'https://www.nta.go.jp/english/', rules: ['Sake/Shochu GI', 'Liquor Tax Act'] },
  '489': { country: 'Hong Kong',      regulator: 'Customs and Excise Department',                    url: 'https://www.customs.gov.hk/',  rules: ['Dutiable Commodities Ordinance'] },
  '690': { country: 'China',          regulator: 'SAMR + GACC',                                       url: 'https://www.samr.gov.cn/',   rules: ['GB 7718 labelling', 'GACC import registry'] },
  '880': { country: 'South Korea',    regulator: 'Korea Customs Service',                             url: 'https://www.customs.go.kr/',  rules: ['Liquor Tax Act'] },
  '890': { country: 'India',          regulator: 'FSSAI + State Excise',                              url: 'https://www.fssai.gov.in/', rules: ['FSSAI liquor regulations', 'State excise labels'] },

  '930': { country: 'Australia',      regulator: 'Wine Australia + FSANZ',                            url: 'https://www.wineaustralia.com/', rules: ['Label Integrity Program', 'GI register'] },
  '931': { country: 'Australia',      regulator: 'Wine Australia',                                    url: 'https://www.wineaustralia.com/', rules: ['LIP', 'GI register'] },
  '940': { country: 'New Zealand',    regulator: 'New Zealand Winegrowers + MPI',                    url: 'https://www.nzwine.com/',    rules: ['Wine Act 2003', 'GI Act 2006'] },

  '789': { country: 'Brazil',         regulator: 'MAPA',                                              url: 'https://www.gov.br/agricultura/', rules: ['Decreto 8.198/2014 (Lei do Vinho)', 'INPI GI'] },
  '779': { country: 'Argentina',      regulator: 'INV (Instituto Nacional de Vitivinicultura)',       url: 'https://www.argentina.gob.ar/inv', rules: ['Ley 25.163 GI', 'INV Seal'] },
  '780': { country: 'Chile',          regulator: 'SAG (Servicio Agrícola y Ganadero)',                url: 'https://www.sag.gob.cl/',    rules: ['DO', 'Wine Law 18.455'] },

  '615': { country: 'Nigeria',        regulator: 'NAFDAC',                                            url: 'https://www.nafdac.gov.ng/', rules: ['NAFDAC alcoholic beverage labelling'] },
  '600': { country: 'South Africa',   regulator: 'SAWIS + Department of Agriculture',                 url: 'https://www.sawis.co.za/',   rules: ['Wine of Origin scheme', 'Liquor Products Act 1989'] },
};

function firstMatchingPrefix(code) {
  for (let len = 3; len >= 2; len--) {
    const p = code.slice(0, len);
    if (ALCOHOL_REGS[p]) return { prefix: p, ...ALCOHOL_REGS[p] };
  }
  return null;
}

async function lookupByBarcode(barcode) {
  const source = 'Wine & Spirits Regulatory Registry';
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
      return { found: false, source, barcode, reason: 'No alcohol regulator mapped for this GS1 prefix' };
    }
    return {
      found: true,
      source,
      barcode,
      prefix: match.prefix,
      country: match.country,
      countryOfOrigin: match.country,
      regulator: match.regulator,
      regulatorUrl: match.url,
      applicableRules: match.rules,
      note: `Alcoholic beverages from ${match.country} are regulated by ${match.regulator}`,
      verificationLevel: 'jurisdiction-inferred',
    };
  } catch (error) {
    return { found: false, source, barcode, error: error && error.message ? error.message : String(error) };
  }
}

module.exports = { lookupByBarcode };
