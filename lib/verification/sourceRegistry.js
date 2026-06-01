/**
 * Veri9 Source Registry — single source of truth.
 *
 * Lists every external data source the verification engine queries.
 * BOTH the engine and the admin "Verification Databases" page import
 * from this file, so they can never drift out of sync.
 *
 * Usage in engine (CommonJS):
 *   const { isEnabled } = require('./sourceRegistry');
 *   if (isEnabled('openFDA', cfg)) await openFDA.lookupByBarcode(...)
 *
 * Usage in admin UI (TS):
 *   import { SOURCE_REGISTRY, REGIONS } from '@/lib/verification/sourceRegistry'
 *
 * Adding a new source:
 *   1. Add an entry below with a unique `id`.
 *   2. In engine.js, wrap the lookup in `isEnabled(id, cfg)` check.
 *   3. (optional) ship a migration to mark it enabled by default in
 *      the system_config Supabase row.
 */

/**
 * @typedef {Object} SourceDef
 * @property {string} id           Stable identifier (camelCase, matches the api/ filename)
 * @property {string} name         Display name
 * @property {string} description  Short description shown in admin UI
 * @property {'product'|'recall'|'pharma'|'safety'|'price'|'cert'|'regulatory'|'reference'} type
 * @property {'global'|'africa'|'asia'|'europe'|'oceania'|'americas'|'us'|'canada'|'eu'} region
 * @property {boolean} defaultEnabled  Whether this source is enabled by default
 * @property {boolean} requiresKey     True if needs an API key/credential
 * @property {string} [icon]       Optional emoji icon
 */

/** @type {SourceDef[]} */
const SOURCE_REGISTRY = [
  // ───── Tier 1: Open / Crowd-sourced (Global) ─────
  { id: 'openFoodFacts',         name: 'Open Food Facts',          description: 'Food & beverage products worldwide (1.5M+ products)',           type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🍎' },
  { id: 'openFoodFactsMirrors',  name: 'OFF Country Mirrors',      description: 'Country-specific Open Food Facts mirrors (ng, in, br, …)',     type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🌐' },
  { id: 'openBeautyFacts',       name: 'Open Beauty Facts',        description: 'Cosmetics & personal-care products',                            type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '💄' },
  { id: 'openProductsFacts',     name: 'Open Products Facts',      description: 'Non-food consumer goods (electronics, household, toys)',       type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '📦' },
  { id: 'openPetFoodFacts',      name: 'Open Pet Food Facts',      description: 'Dog, cat, bird, fish & rabbit food worldwide',                 type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🐾' },
  { id: 'openProductData',       name: 'Open Product Folksonomy',  description: 'Community-contributed product attributes',                     type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🏷️' },
  { id: 'openPrices',            name: 'Open Prices DB',           description: 'Open Food Facts community price data',                         type: 'price',      region: 'global',   defaultEnabled: true, requiresKey: false, icon: '💰' },
  { id: 'openPricesLive',        name: 'Open Prices Live',         description: 'Live retail price feed via OFF',                               type: 'price',      region: 'global',   defaultEnabled: true, requiresKey: false, icon: '📈' },

  // ───── Tier 1: Standards & Reference ─────
  { id: 'gs1CompanyDb',          name: 'GS1 GEPIR / Country Prefix', description: 'Global trade item numbers — country-of-origin prefix',        type: 'reference',  region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🌍' },
  { id: 'wikidata',              name: 'Wikidata SPARQL',          description: 'Structured product data via property P3962 (GTIN)',            type: 'reference',  region: 'global',   defaultEnabled: true, requiresKey: false, icon: '📚' },
  { id: 'openLibrary',           name: 'Open Library / ISBN',      description: 'Books & publications metadata',                                type: 'reference',  region: 'global',   defaultEnabled: true, requiresKey: false, icon: '📖' },
  { id: 'googleBooks',           name: 'Google Books',             description: 'ISBN lookup and book metadata',                                type: 'reference',  region: 'global',   defaultEnabled: true, requiresKey: false, icon: '📕' },

  // ───── Tier 1: Pharma / Medical ─────
  { id: 'openFDA',               name: 'OpenFDA Drug Database',    description: 'FDA pharmaceutical, device & food enforcement data (US)',      type: 'pharma',     region: 'us',       defaultEnabled: true, requiresKey: false, icon: '💊' },
  { id: 'whoMedicines',          name: 'WHO Essential Medicines',  description: 'World Health Organization medicines list',                     type: 'pharma',     region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🌐' },
  { id: 'nihRxNav',              name: 'NIH RxNav Drug DB',        description: 'US National Library of Medicine drug terminology',             type: 'pharma',     region: 'us',       defaultEnabled: true, requiresKey: false, icon: '🇺🇸' },

  // ───── Tier 1: Safety / Recalls ─────
  { id: 'cpscRecalls',           name: 'CPSC Recalls (US)',        description: 'US Consumer Product Safety Commission recalls',                type: 'recall',     region: 'us',       defaultEnabled: true, requiresKey: false, icon: '⚠️' },
  { id: 'healthCanadaRecalls',   name: 'Health Canada Recalls',    description: 'Canadian recall & safety alerts (full historical dump)',       type: 'recall',     region: 'canada',   defaultEnabled: true, requiresKey: false, icon: '🇨🇦' },
  { id: 'nhtsa',                 name: 'NHTSA Vehicle Database',   description: 'US vehicle & automotive recall database',                      type: 'recall',     region: 'us',       defaultEnabled: true, requiresKey: false, icon: '🚗' },

  // ───── Tier 1: Regional Product Registries ─────
  { id: 'africaProductRegistry',   name: 'Africa Product Registry',   description: 'Curated African-market product data',                       type: 'product',    region: 'africa',   defaultEnabled: true, requiresKey: false, icon: '🌍' },
  { id: 'asiaProductRegistry',     name: 'Asia Product Registry',     description: 'Curated Asian-market product data',                         type: 'product',    region: 'asia',     defaultEnabled: true, requiresKey: false, icon: '🌏' },
  { id: 'europeProductRegistry',   name: 'Europe Product Registry',   description: 'Curated European-market product data',                      type: 'product',    region: 'europe',   defaultEnabled: true, requiresKey: false, icon: '🇪🇺' },
  { id: 'oceaniaProductRegistry',  name: 'Oceania Product Registry',  description: 'Curated Oceania-market product data',                       type: 'product',    region: 'oceania',  defaultEnabled: true, requiresKey: false, icon: '🌏' },
  { id: 'americasProductRegistry', name: 'Americas Product Registry', description: 'Curated North & South American product data',               type: 'product',    region: 'americas', defaultEnabled: true, requiresKey: false, icon: '🌎' },

  // ───── Tier 1: Specialized Vertical DBs ─────
  { id: 'electronicsCertDb',     name: 'Electronics Certifications', description: 'FCC, CE, UL & other electronics-cert lookups',                type: 'cert',       region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🔌' },
  { id: 'toySafetyDb',           name: 'Toy Safety Database',      description: 'ASTM / EN-71 / ISO toy-safety registry',                       type: 'safety',     region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🧸' },
  { id: 'automotivePartsDb',     name: 'Automotive Parts DB',      description: 'OEM part-number cross-reference',                              type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🔧' },
  { id: 'wineSpiritsDb',         name: 'Wine & Spirits DB',        description: 'Wine, spirits & alcohol product registry',                     type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🍷' },
  { id: 'textileDb',             name: 'Textile & Apparel DB',     description: 'OEKO-TEX & textile certification registry',                    type: 'cert',       region: 'global',   defaultEnabled: true, requiresKey: false, icon: '👕' },

  // ───── Tier 1: Food / Nutrition ─────
  { id: 'usdaFoodData',          name: 'USDA FoodData Central',    description: 'US Dept. of Agriculture nutrition data',                       type: 'product',    region: 'us',       defaultEnabled: true, requiresKey: false, icon: '🇺🇸' },

  // ───── Tier 1: Commercial Lookups (free tiers) ─────
  { id: 'upcItemDb',             name: 'UPCitemdb',                description: 'Universal product code database (free tier)',                  type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🔍' },
  { id: 'datakick',              name: 'Datakick',                 description: 'Community product database',                                   type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '⚡' },
  { id: 'barcodeLookup',         name: 'Barcode Lookup',           description: 'Multi-source product lookup',                                  type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🔎' },
  { id: 'barcodeSpider',         name: 'Barcode Spider',           description: 'Product data API (free tier)',                                 type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🕷️' },
  { id: 'barcodeMonster',        name: 'Barcode Monster',          description: 'Free barcode lookup service',                                  type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '👾' },
  { id: 'eanDb',                 name: 'EAN-DB',                   description: 'European Article Number database',                             type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🗃️' },
  { id: 'eanSearch',             name: 'EAN Search',               description: 'European article number search',                               type: 'product',    region: 'europe',   defaultEnabled: true, requiresKey: false, icon: '🇪🇺' },
  { id: 'goUpc',                 name: 'Go-UPC Global',            description: 'International product database',                               type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🌐' },
  { id: 'amazonPaApi',           name: 'Amazon Product Advertising', description: 'Amazon catalog cross-reference',                              type: 'product',    region: 'global',   defaultEnabled: true, requiresKey: true,  icon: '📦' },

  // ───── Tier 1: Regulatory Cross-reference ─────
  { id: 'regulatoryAgencies',    name: 'Regulatory Agencies',      description: 'Global regulatory body cross-reference',                       type: 'regulatory', region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🏛️' },

  // ───── Tier 2: Regional Free Sources (Round 29c) ─────
  { id: 'koreanMfds',                name: 'Korean MFDS Food Safety',     description: 'Korean Ministry of Food & Drug Safety imported food database',  type: 'product',   region: 'asia',     defaultEnabled: true, requiresKey: false, icon: '🇰🇷' },
  { id: 'openBeautyFactsRegional',   name: 'OBF Regional Mirrors',        description: 'Open Beauty Facts country mirrors (Nigeria, India, Brazil, …)', type: 'product',   region: 'global',   defaultEnabled: true, requiresKey: false, icon: '💄' },
  { id: 'openFoodFactsRegional',     name: 'OFF Regional Deep Mirrors',   description: 'Deep OFF country mirrors covering Africa, Asia, Latin America',  type: 'product',   region: 'global',   defaultEnabled: true, requiresKey: false, icon: '🌍' },
];

/** Region display names for UI grouping. */
const REGIONS = {
  global:   { label: 'Global',           icon: '🌐' },
  us:       { label: 'United States',    icon: '🇺🇸' },
  canada:   { label: 'Canada',           icon: '🇨🇦' },
  eu:       { label: 'European Union',   icon: '🇪🇺' },
  europe:   { label: 'Europe',           icon: '🌍' },
  africa:   { label: 'Africa',           icon: '🌍' },
  asia:     { label: 'Asia',             icon: '🌏' },
  oceania:  { label: 'Oceania',          icon: '🌏' },
  americas: { label: 'Americas',         icon: '🌎' },
};

/** Type categories for UI grouping. */
const TYPES = {
  product:    { label: 'Product Data',         icon: '📦' },
  recall:     { label: 'Recalls & Safety',     icon: '⚠️' },
  pharma:     { label: 'Pharmaceutical',       icon: '💊' },
  safety:     { label: 'Safety Standards',     icon: '🛡️' },
  price:      { label: 'Price Data',           icon: '💰' },
  cert:       { label: 'Certifications',       icon: '✅' },
  regulatory: { label: 'Regulatory',           icon: '🏛️' },
  reference:  { label: 'Reference Data',       icon: '📚' },
};

/**
 * Check if a source is enabled given a config object from cache/DB.
 *
 * Resolution order:
 *   1. cfg.disabledSources (Set/Array of ids) — explicit kill switch
 *   2. cfg.databases[id] — admin UI per-source toggle
 *   3. defaultEnabled from registry
 *
 * @param {string} id
 * @param {object|null|undefined} cfg
 * @returns {boolean}
 */
function isEnabled(id, cfg) {
  // Explicit disabled list (env var or runtime kill switch)
  if (cfg && Array.isArray(cfg.disabledSources) && cfg.disabledSources.includes(id)) return false;
  if (cfg && cfg.disabledSources instanceof Set && cfg.disabledSources.has(id)) return false;

  // Per-source toggle from admin UI
  if (cfg && cfg.databases && Object.prototype.hasOwnProperty.call(cfg.databases, id)) {
    return cfg.databases[id] !== false;
  }

  // Default from registry
  const def = SOURCE_REGISTRY.find(s => s.id === id);
  return def ? def.defaultEnabled : true;
}

/**
 * Get a registry entry by id.
 * @param {string} id
 */
function getSource(id) {
  return SOURCE_REGISTRY.find(s => s.id === id) || null;
}

/**
 * Build a default databases-enabled map (id -> true) for new admin configs.
 */
function defaultDatabasesMap() {
  const map = {};
  for (const s of SOURCE_REGISTRY) map[s.id] = s.defaultEnabled;
  return map;
}

module.exports = {
  SOURCE_REGISTRY,
  REGIONS,
  TYPES,
  isEnabled,
  getSource,
  defaultDatabasesMap,
};
