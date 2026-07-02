/**
 * Asia Product Registry (Veri9 aggregator)
 *
 * Covers Asian regional GS1 prefixes and maps them to the
 * relevant national regulator.
 *
 * Round 30c: Changed from individual prefix lookup to range-based matching
 * to ensure complete coverage of all valid GS1 prefixes.
 */

const ASIA_PREFIX_RANGES = [
  // Japan (450-459, 490-499)
  { min: 450, max: 459, country: 'Japan', agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  { min: 490, max: 499, country: 'Japan', agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  // Russia (460-469) — technically spans Europe/Asia
  { min: 460, max: 469, country: 'Russia', agency: 'Rosakkreditatsiya', url: 'https://rosakkreditatsiya.ru/' },
  // Kyrgyzstan
  { min: 470, max: 470, country: 'Kyrgyzstan', agency: 'Kyrgyzstandard', url: 'https://standard.kg/' },
  // Taiwan
  { min: 471, max: 471, country: 'Taiwan', agency: 'TFDA', url: 'https://www.fda.gov.tw/' },
  // Estonia
  { min: 474, max: 474, country: 'Estonia', agency: 'TAI', url: 'https://www.tai.ee/' },
  // Latvia
  { min: 475, max: 475, country: 'Latvia', agency: 'VEA', url: 'https://www.pvc.gov.lv/' },
  // Azerbaijan
  { min: 476, max: 476, country: 'Azerbaijan', agency: 'Azstandard', url: 'https://azstandard.gov.az/' },
  // Lithuania
  { min: 477, max: 477, country: 'Lithuania', agency: 'VMPI', url: 'https://vmvt.lt/' },
  // Uzbekistan
  { min: 478, max: 478, country: 'Uzbekistan', agency: 'Uzstandard', url: 'https://uzstandard.uz/' },
  // Sri Lanka
  { min: 479, max: 479, country: 'Sri Lanka', agency: 'SLSI', url: 'https://www.slsi.lk/' },
  // Philippines
  { min: 480, max: 480, country: 'Philippines', agency: 'FDA Philippines', url: 'https://www.fda.gov.ph/' },
  // Belarus
  { min: 481, max: 481, country: 'Belarus', agency: 'Gosstandart', url: 'https://www.gosstandart.gov.by/' },
  // Ukraine
  { min: 482, max: 482, country: 'Ukraine', agency: 'DP Ukrmetrteststandart', url: 'https://ukrmetrtest.com.ua/' },
  // Moldova
  { min: 484, max: 484, country: 'Moldova', agency: 'MOLDST', url: 'https://www.moldova.md/' },
  // Armenia
  { min: 485, max: 485, country: 'Armenia', agency: 'SARM', url: 'https://www.sarm.am/' },
  // Georgia
  { min: 486, max: 486, country: 'Georgia', agency: 'GEOSTM', url: 'https://www.geostm.ge/' },
  // Kazakhstan
  { min: 487, max: 487, country: 'Kazakhstan', agency: 'KazStandard', url: 'https://kazstandard.kz/' },
  // Hong Kong
  { min: 489, max: 489, country: 'Hong Kong', agency: 'CHPD', url: 'https://www.cphd.hk/' },
  // China (690-699)
  { min: 690, max: 699, country: 'China', agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  // Israel
  { min: 729, max: 729, country: 'Israel', agency: 'MOH Israel', url: 'https://www.health.gov.il/' },
  // South Korea (880)
  { min: 880, max: 880, country: 'South Korea', agency: 'MFDS / KATS', url: 'https://www.mfds.go.kr/' },
  // Cambodia
  { min: 884, max: 884, country: 'Cambodia', agency: 'CDC / CAMControl', url: 'https://www.cdc.gov.kh/' },
  // Thailand
  { min: 885, max: 885, country: 'Thailand', agency: 'FDA Thailand', url: 'https://www.fda.moph.go.th/' },
  // Singapore
  { min: 888, max: 888, country: 'Singapore', agency: 'HSA / SFA', url: 'https://www.hsa.gov.sg/' },
  // India (890-899)
  { min: 890, max: 899, country: 'India', agency: 'FSSAI / CDSCO', url: 'https://www.fssai.gov.in/' },
  // Vietnam
  { min: 893, max: 893, country: 'Vietnam', agency: 'DVV', url: 'https://www.dvv.com.vn/' },
  // Pakistan
  { min: 896, max: 896, country: 'Pakistan', agency: 'PSQCA', url: 'https://www.psqca.com.pk/' },
  // Indonesia
  { min: 899, max: 899, country: 'Indonesia', agency: 'BPOM / BSN', url: 'https://www.bpom.go.id/' },
  // Turkey (868-869)
  { min: 868, max: 869, country: 'Turkey', agency: 'TİTCK', url: 'https://www.titck.gov.tr/' },
  // Malaysia
  { min: 955, max: 955, country: 'Malaysia', agency: 'MOH Malaysia', url: 'https://www.moh.gov.my/' },
  // Macau
  { min: 958, max: 958, country: 'Macau', agency: 'IAM', url: 'https://www.iam.gov.mo/' },
  // Middle East
  { min: 620, max: 620, country: 'Tanzania', agency: 'TMDA', url: 'https://www.tmda.go.tz/' },
  { min: 621, max: 621, country: 'Syria', agency: 'SASMO', url: 'https://www.sasmo.org/' },
  { min: 622, max: 622, country: 'Egypt', agency: 'MOHAP / EOS', url: 'https://www.moh.gov.eg/' },
  { min: 624, max: 624, country: 'Libya', agency: 'LNCSM', url: 'https://lncsm.gov.ly/' },
  { min: 625, max: 625, country: 'Jordan', agency: 'JISM', url: 'https://www.jism.gov.jo/' },
  { min: 626, max: 626, country: 'Iran', agency: 'ISIRI', url: 'https://www.isiri.gov.ir/' },
  { min: 627, max: 627, country: 'Kuwait', agency: 'KUCAS / MOH Kuwait', url: 'https://www.moh.gov.kw/' },
  { min: 628, max: 628, country: 'Saudi Arabia', agency: 'SFDA', url: 'https://www.sfda.gov.sa/' },
  { min: 629, max: 629, country: 'UAE', agency: 'MoHAP / DOH', url: 'https://mohap.gov.ae/' },
  { min: 630, max: 630, country: 'Qatar', agency: 'MOPH Qatar', url: 'https://www.moph.gov.qa/' },
  { min: 631, max: 631, country: 'Namibia', agency: 'NBS', url: 'https://www.nbs.com.na/' },
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
  const match = firstMatchingRange(barcode, ASIA_PREFIX_RANGES);
  if (!match) return { found: false, source: 'Asia Product Registry', barcode };
  return {
    found: true,
    source: `Asia Product Registry (${match.agency})`,
    barcode,
    country: [match.country],
    countryOfOrigin: match.country,
    agency: match.agency,
    agencyUrl: match.url,
    note: `GS1 prefix ${match.prefix} is registered in ${match.country}. Regulator: ${match.agency}.`,
    verificationLevel: 'jurisdiction-confirmed',
  };
}

module.exports = { lookupByBarcode, ASIA_PREFIX_RANGES }
