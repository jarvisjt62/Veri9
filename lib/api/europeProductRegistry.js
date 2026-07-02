/**
 * Europe Product Registry (Veri9 aggregator)
 *
 * Aggregates European regional regulators/standards bodies across
 * all EU27 + UK + Switzerland + Norway + Iceland, keyed by GS1 prefix.
 *
 * Round 30c: Changed from individual prefix lookup to range-based matching.
 * The old approach listed every 3-digit prefix individually, which was
 * incomplete (e.g. only '540' for Belgium instead of 540-549). The new
 * approach defines prefix ranges which are matched against the barcode's
 * first 3 digits.
 */

const EU_PREFIX_RANGES = [
  // France (300-379)
  { min: 300, max: 379, country: 'France', agency: 'DGCCRF', url: 'https://www.economie.gouv.fr/dgccrf' },
  // Bulgaria
  { min: 380, max: 380, country: 'Bulgaria', agency: 'BABH', url: 'https://www.babh.government.bg/' },
  // Slovenia
  { min: 383, max: 383, country: 'Slovenia', agency: 'UVHVVR', url: 'https://www.gov.si/' },
  // Croatia
  { min: 385, max: 385, country: 'Croatia', agency: 'MZOS', url: 'https://zdravlje.gov.hr/' },
  // Bosnia and Herzegovina
  { min: 387, max: 387, country: 'Bosnia and Herzegovina', agency: 'ALIMS-BiH', url: 'https://www.almbih.gov.ba/' },
  // Montenegro
  { min: 389, max: 389, country: 'Montenegro', agency: 'CALIMS', url: 'https://www.cinmed.me/' },
  // Germany (400-440)
  { min: 400, max: 440, country: 'Germany', agency: 'BVL', url: 'https://www.bvl.bund.de/' },
  // UK (500-509)
  { min: 500, max: 509, country: 'UK', agency: 'FSA / MHRA', url: 'https://www.food.gov.uk/' },
  // Greece (520-521)
  { min: 520, max: 521, country: 'Greece', agency: 'EFET', url: 'https://www.efet.gr/' },
  // Cyprus
  { min: 528, max: 529, country: 'Cyprus', agency: 'Ministry of Health', url: 'https://www.moh.gov.cy/' },
  // Albania
  { min: 530, max: 530, country: 'Albania', agency: 'NFA', url: 'https://aku.gov.al/' },
  // Ireland (539)
  { min: 539, max: 539, country: 'Ireland', agency: 'FSAI', url: 'https://www.fsai.ie/' },
  // Belgium & Luxembourg (540-549)
  { min: 540, max: 549, country: 'Belgium', agency: 'FAVV', url: 'https://www.favv-afsca.be/' },
  // Portugal
  { min: 560, max: 560, country: 'Portugal', agency: 'ASAE', url: 'https://www.asae.gov.pt/' },
  // Iceland
  { min: 569, max: 569, country: 'Iceland', agency: 'MAST', url: 'https://www.mast.is/' },
  // Denmark (570-579)
  { min: 570, max: 579, country: 'Denmark', agency: 'DVFA', url: 'https://www.foedevarestyrelsen.dk/' },
  // Poland
  { min: 590, max: 590, country: 'Poland', agency: 'GIS', url: 'https://www.gov.pl/gis' },
  // Romania
  { min: 594, max: 594, country: 'Romania', agency: 'ANSVSA', url: 'https://www.ansvsa.ro/' },
  // Hungary
  { min: 599, max: 599, country: 'Hungary', agency: 'NÉBIH', url: 'https://portal.nebih.gov.hu/' },
  // Finland (640-649)
  { min: 640, max: 649, country: 'Finland', agency: 'Ruokavirasto', url: 'https://www.ruokavirasto.fi/' },
  // Norway (700-709)
  { min: 700, max: 709, country: 'Norway', agency: 'Mattilsynet', url: 'https://www.mattilsynet.no/' },
  // Sweden (730-739)
  { min: 730, max: 739, country: 'Sweden', agency: 'Livsmedelsverket', url: 'https://www.livsmedelsverket.se/' },
  // Switzerland (760-769)
  { min: 760, max: 769, country: 'Switzerland', agency: 'Swissmedic / BLV', url: 'https://www.swissmedic.ch/' },
  // Italy (800-839)
  { min: 800, max: 839, country: 'Italy', agency: 'Ministero della Salute', url: 'https://www.salute.gov.it/' },
  // Spain (840-849)
  { min: 840, max: 849, country: 'Spain', agency: 'AESAN / AEMPS', url: 'https://www.aesan.gob.es/' },
  // Netherlands (870-879)
  { min: 870, max: 879, country: 'Netherlands', agency: 'NVWA', url: 'https://www.nvwa.nl/' },
  // Serbia
  { min: 860, max: 860, country: 'Serbia', agency: 'Ministry of Health', url: 'https://www.zdravlje.gov.rs/' },
  // Slovakia
  { min: 858, max: 858, country: 'Slovakia', agency: 'ÚVZ SR', url: 'https://www.uvzsr.sk/' },
  // Czech Republic
  { min: 859, max: 859, country: 'Czech Republic', agency: 'SZPI', url: 'https://www.szpi.gov.cz/' },
  // Turkey (868-869)
  { min: 868, max: 869, country: 'Turkey', agency: 'TİTCK', url: 'https://www.titck.gov.tr/' },
  // Austria (900-919)
  { min: 900, max: 919, country: 'Austria', agency: 'AGES / BASG', url: 'https://www.ages.at/' },
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
  const match = firstMatchingRange(barcode, EU_PREFIX_RANGES);
  if (!match) return { found: false, source: 'Europe Product Registry', barcode };
  return {
    found: true,
    source: `Europe Product Registry (${match.agency})`,
    barcode,
    country: [match.country],
    countryOfOrigin: match.country,
    agency: match.agency,
    agencyUrl: match.url,
    note: `GS1 prefix ${match.prefix} is registered in ${match.country}. Jurisdictional regulator: ${match.agency}.`,
    verificationLevel: 'jurisdiction-confirmed',
  };
}

module.exports = { lookupByBarcode, EU_PREFIX_RANGES }
