/**
 * Asia Product Registry (Veri9 aggregator)
 *
 * Covers the Asian regional GS1 prefixes and maps them to the
 * relevant national regulator.
 */

const ASIA_PREFIX_TO_AGENCY = {
  // China 690-699
  '690': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '691': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '692': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '693': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '694': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '695': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '696': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '697': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '698': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  '699': { country: 'China',    agency: 'NMPA / GAC', url: 'https://english.nmpa.gov.cn/' },
  // Japan 450-459, 490-499
  '450': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '451': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '452': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '453': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '454': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '455': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '456': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '457': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '458': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '459': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '490': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '491': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '492': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '493': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '494': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '495': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '496': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '497': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '498': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  '499': { country: 'Japan',    agency: 'CAA / PMDA', url: 'https://www.caa.go.jp/en/' },
  // India
  '890': { country: 'India',    agency: 'FSSAI / CDSCO', url: 'https://fssai.gov.in/' },
  // Pakistan, Bangladesh, Sri Lanka
  '869': { country: 'Turkey',      agency: 'TITCK', url: 'https://www.titck.gov.tr/' },
  '899': { country: 'Indonesia',   agency: 'BPOM',  url: 'https://www.pom.go.id/' },
  '893': { country: 'Vietnam',     agency: 'DAV / VFA', url: 'https://dav.gov.vn/' },
  '885': { country: 'Thailand',    agency: 'FDA Thailand', url: 'https://www.fda.moph.go.th/' },
  '880': { country: 'South Korea', agency: 'MFDS', url: 'https://www.mfds.go.kr/' },
  '888': { country: 'Singapore',   agency: 'SFA / HSA', url: 'https://www.sfa.gov.sg/' },
  '896': { country: 'Pakistan',    agency: 'DRAP', url: 'https://www.dra.gov.pk/' },
  '955': { country: 'Malaysia',    agency: 'NPRA / MoH', url: 'https://www.npra.gov.my/' },
  '471': { country: 'Taiwan',      agency: 'TFDA', url: 'https://www.fda.gov.tw/' },
  '489': { country: 'Hong Kong',   agency: 'CFS / DH',  url: 'https://www.cfs.gov.hk/' },
  '479': { country: 'Sri Lanka',   agency: 'NMRA Sri Lanka', url: 'https://nmra.gov.lk/' },
  '480': { country: 'Philippines', agency: 'FDA Philippines', url: 'https://www.fda.gov.ph/' },
  '626': { country: 'Iran',        agency: 'IFDA', url: 'https://www.fda.gov.ir/' },
  '628': { country: 'Saudi Arabia',agency: 'SFDA', url: 'https://www.sfda.gov.sa/' },
  '629': { country: 'UAE',         agency: 'MoHAP / DOH', url: 'https://mohap.gov.ae/' },
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
  const match = firstMatchingPrefix(barcode, ASIA_PREFIX_TO_AGENCY)
  if (!match) return { found: false, source: 'Asia Product Registry', barcode }
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
  }
}

module.exports = { lookupByBarcode, ASIA_PREFIX_TO_AGENCY }
