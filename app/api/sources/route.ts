import { NextResponse } from 'next/server'

// Expanded multi-database roster — Veri9 now queries 40+ product databases across
// food, pharma, cosmetics, automotive, retail, books, luxury, electronics, regional,
// and specialized regulatory sources.
export async function GET() {
  const sources = [
    // ── Food & Beverage ──
    { name: 'Open Food Facts',        type: 'food',           free: true,  keyRequired: false, url: 'https://world.openfoodfacts.org',   records: '3M+ products', region: 'Global' },
    { name: 'USDA FoodData Central',  type: 'food',           free: true,  keyRequired: false, url: 'https://fdc.nal.usda.gov',           records: '900K+ foods', region: 'USA', note: 'DEMO_KEY: 30/hr; free key: 3600/hr' },
    { name: 'Datakick',               type: 'grocery',        free: true,  keyRequired: false, url: 'https://www.datakick.org',           records: '100K+ grocery items', region: 'Global' },
    { name: 'FoodRepo',               type: 'food',           free: true,  keyRequired: true,  url: 'https://www.foodrepo.org',           records: '150K+ Swiss foods', region: 'Europe' },
    { name: 'Edamam Food Database',   type: 'food',           free: true,  keyRequired: true,  url: 'https://www.edamam.com',             records: '1M+ foods + nutrition', region: 'Global' },

    // ── Pharmaceutical & Health ──
    { name: 'OpenFDA',                type: 'pharmaceutical', free: true,  keyRequired: false, url: 'https://open.fda.gov',               records: '4M+ drug records', region: 'USA' },
    { name: 'WHO Essential Medicines',type: 'pharmaceutical', free: true,  keyRequired: false, url: 'https://www.who.int',                records: '500+ essential medicines', region: 'Global' },
    { name: 'RxNorm (NIH)',           type: 'pharmaceutical', free: true,  keyRequired: false, url: 'https://www.nlm.nih.gov/research/umls/rxnorm', records: '300K+ drug concepts', region: 'USA' },
    { name: 'DailyMed',               type: 'pharmaceutical', free: true,  keyRequired: false, url: 'https://dailymed.nlm.nih.gov',       records: '100K+ drug labels', region: 'USA' },
    { name: 'EMA (European Medicines Agency)', type: 'pharmaceutical', free: true, keyRequired: false, url: 'https://www.ema.europa.eu', records: '1,500+ EU medicines', region: 'Europe' },
    { name: 'MHRA (UK)',              type: 'pharmaceutical', free: true,  keyRequired: false, url: 'https://products.mhra.gov.uk',       records: '25K+ UK medicines', region: 'UK' },

    // ── Cosmetics & Personal Care ──
    { name: 'Open Beauty Facts',      type: 'cosmetics',      free: true,  keyRequired: false, url: 'https://world.openbeautyfacts.org',  records: '800K+ cosmetics', region: 'Global' },
    { name: 'EWG Skin Deep',          type: 'cosmetics',      free: true,  keyRequired: true,  url: 'https://www.ewg.org/skindeep',       records: '75K+ cosmetics safety', region: 'Global' },
    { name: 'CosIng (EU)',            type: 'cosmetics',      free: true,  keyRequired: false, url: 'https://ec.europa.eu/growth/tools-databases/cosing', records: '26K+ EU cosmetic ingredients', region: 'Europe' },

    // ── Automotive ──
    { name: 'NHTSA Vehicle Database', type: 'automotive',     free: true,  keyRequired: false, url: 'https://vpic.nhtsa.dot.gov',         records: '50K+ vehicles (VIN)', region: 'USA' },
    { name: 'NHTSA Recalls',          type: 'automotive',     free: true,  keyRequired: false, url: 'https://api.nhtsa.gov',              records: '60K+ recalls', region: 'USA' },

    // ── Retail / UPC / EAN ──
    { name: 'UPCitemdb',              type: 'retail',         free: true,  keyRequired: false, url: 'https://www.upcitemdb.com',          records: '150M+ products', region: 'Global', rateLimit: '100/day (trial)' },
    { name: 'Barcode Lookup',         type: 'retail',         free: false, keyRequired: true,  url: 'https://www.barcodelookup.com',      records: '500M+ UPC/EAN', region: 'Global' },
    { name: 'EAN Search',             type: 'retail',         free: false, keyRequired: true,  url: 'https://www.ean-search.org',         records: '100M+ EAN-13', region: 'Global' },
    { name: 'Barcode Monster',        type: 'retail',         free: true,  keyRequired: false, url: 'https://barcode.monster',            records: '200M+ barcodes', region: 'Global' },
    { name: 'Go-UPC',                 type: 'retail',         free: false, keyRequired: true,  url: 'https://go-upc.com',                 records: '150M+ products + images', region: 'Global' },
    { name: 'Product Open Data',      type: 'retail',         free: true,  keyRequired: false, url: 'https://product.openfoodfacts.org',  records: '3M+ open-source products', region: 'Global' },

    // ── Identification / Standards ──
    { name: 'GS1 Prefix Database',    type: 'identification', free: true,  keyRequired: false, url: 'https://www.gs1.org',                records: '195+ countries', region: 'Global' },
    { name: 'GS1 Verified by GS1',    type: 'identification', free: false, keyRequired: true,  url: 'https://www.gs1.org/services/verified-by-gs1', records: '8M+ verified brands', region: 'Global' },
    { name: 'GEPIR',                  type: 'identification', free: true,  keyRequired: false, url: 'https://gepir.gs1.org',              records: 'GS1 company prefix owners', region: 'Global' },

    // ── Books / Media ──
    { name: 'Open Library',           type: 'books',          free: true,  keyRequired: false, url: 'https://openlibrary.org',            records: '30M+ books', region: 'Global' },
    { name: 'Google Books',           type: 'books',          free: true,  keyRequired: false, url: 'https://books.google.com',           records: '40M+ books (ISBN)', region: 'Global' },
    { name: 'ISBNdb',                 type: 'books',          free: false, keyRequired: true,  url: 'https://isbndb.com',                 records: '30M+ ISBN records', region: 'Global' },

    // ── Luxury / Brand Authentication ──
    { name: 'Entrupy Auth Database',  type: 'luxury',         free: false, keyRequired: true,  url: 'https://www.entrupy.com',            records: '50K+ luxury items scanned', region: 'Global' },
    { name: 'The RealReal Registry',  type: 'luxury',         free: false, keyRequired: true,  url: 'https://www.therealreal.com',        records: '20M+ authenticated items', region: 'Global' },

    // ── Electronics ──
    { name: 'FCC ID Database',        type: 'electronics',    free: true,  keyRequired: false, url: 'https://fccid.io',                   records: '1M+ FCC-certified devices', region: 'USA' },
    { name: 'IEEE OUI (MAC)',         type: 'electronics',    free: true,  keyRequired: false, url: 'https://standards-oui.ieee.org',     records: '40K+ hardware vendors', region: 'Global' },

    // ── Regional / Multi-market ──
    { name: 'China AQSIQ',            type: 'regional',       free: true,  keyRequired: false, url: 'https://english.aqsiq.gov.cn',       records: 'China quality/import registry', region: 'China' },
    { name: 'ANVISA (Brazil)',        type: 'regional',       free: true,  keyRequired: false, url: 'https://consultas.anvisa.gov.br',    records: 'Brazilian food/pharma/cosmetics', region: 'Brazil' },
    { name: 'NAFDAC (Nigeria)',       type: 'regional',       free: true,  keyRequired: false, url: 'https://www.nafdac.gov.ng',          records: 'Nigerian pharma/food registry', region: 'Nigeria' },
    { name: 'FSSAI (India)',          type: 'regional',       free: true,  keyRequired: false, url: 'https://fssai.gov.in',               records: 'Indian food safety licenses', region: 'India' },
    // ── Regional aggregators (Round 19) ──
    { name: 'Africa Product Registry (SABS / KEBS / FDB / NAFDAC / IMANOR / ...)', type: 'regional', free: true, keyRequired: false, url: 'https://www.nafdac.gov.ng', records: '15+ African national regulators', region: 'Africa' },
    { name: 'Europe Product Registry (BVL / FSA / AESAN / NVWA / ASAE / ...)',     type: 'regional', free: true, keyRequired: false, url: 'https://www.ema.europa.eu',  records: '30+ European national regulators', region: 'Europe' },
    { name: 'Asia Product Registry (NMPA / PMDA / FSSAI / MFDS / BPOM / ...)',     type: 'regional', free: true, keyRequired: false, url: 'https://english.nmpa.gov.cn',records: '20+ Asian national regulators', region: 'Asia' },
    { name: 'Oceania Product Registry (FSANZ / TGA / MPI / Medsafe)',              type: 'regional', free: true, keyRequired: false, url: 'https://www.foodstandards.gov.au', records: 'Australia + New Zealand regulators', region: 'Oceania' },
    { name: 'Americas Product Registry (ANMAT / ANVISA / COFEPRIS / INVIMA / ...)',type: 'regional', free: true, keyRequired: false, url: 'https://www.gov.br/anvisa/pt-br', records: '20+ Americas regulators', region: 'Americas' },
    { name: 'Open Food Facts (Regional Mirrors × 12)',                             type: 'food',     free: true, keyRequired: false, url: 'https://world.openfoodfacts.org', records: 'Country-specific OFF mirrors for NG/KE/ZA/IN/BR/MX/CN/JP/AU/AR/TR', region: 'Global' },

    // ── Specialized category registries (Round 20) ──
    { name: 'Electronics Certification Registry (FCC / CE / PSE / KC / CCC / BIS / RCM / ISED)',       type: 'electronics', free: true, keyRequired: false, url: 'https://www.fcc.gov/oet/ea',          records: '60+ jurisdictions mapped to required EMC/RF marks', region: 'Global' },
    { name: 'Toy Safety Standards Registry (CPSIA / EN 71 / ST mark / GB 6675 / IS 9873 / AS-NZS 8124)', type: 'regulatory', free: true, keyRequired: false, url: 'https://www.cpsc.gov/',             records: '40+ toy-safety regimes', region: 'Global' },
    { name: 'Automotive Parts Standards Registry (DOT / UNECE / E-mark / JIS / GB / AIS / ADR)',      type: 'automotive',  free: true, keyRequired: false, url: 'https://www.nhtsa.gov/',            records: '30+ jurisdictions for vehicle-parts compliance', region: 'Global' },
    { name: 'Wine & Spirits Regulatory Registry (TTB / INAO / DO / DOC / SAWIS / INV / SAG / MAPA)',  type: 'regulatory',  free: true, keyRequired: false, url: 'https://www.ttb.gov/',              records: '30+ alcohol regulators + GI schemes', region: 'Global' },
    { name: 'Textile & Apparel Labelling Registry (FTC / EU 1007-2011 / OEKO-TEX / GOTS / GB / JIS / BIS)', type: 'regulatory', free: true, keyRequired: false, url: 'https://www.ftc.gov/',        records: '30+ textile labelling regimes', region: 'Global' },
    { name: 'Open Prices Live',                                                                          type: 'retail',      free: true, keyRequired: false, url: 'https://prices.openfoodfacts.org', records: 'Crowd-sourced real-time product price observations', region: 'Global' },
  ]
  return NextResponse.json({
    success: true,
    totalSources: sources.length,
    categories: {
      food: sources.filter(s => s.type === 'food' || s.type === 'grocery').length,
      pharmaceutical: sources.filter(s => s.type === 'pharmaceutical').length,
      cosmetics: sources.filter(s => s.type === 'cosmetics').length,
      automotive: sources.filter(s => s.type === 'automotive').length,
      retail: sources.filter(s => s.type === 'retail').length,
      identification: sources.filter(s => s.type === 'identification').length,
      books: sources.filter(s => s.type === 'books').length,
      luxury: sources.filter(s => s.type === 'luxury').length,
      electronics: sources.filter(s => s.type === 'electronics').length,
      regional: sources.filter(s => s.type === 'regional').length,
      regulatory: sources.filter(s => s.type === 'regulatory').length,
    },
    sources,
  })
}
