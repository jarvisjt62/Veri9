/**
 * /api/verify/qr
 * QR Code → Brand URL Follow & Authentication
 *
 * POST { url: string }
 *
 * Strategy:
 *  1. Parse the URL — extract domain, query params, embedded codes
 *  2. Check against known brand verification domain registry
 *  3. Follow redirects to final destination (up to 5 hops)
 *  4. Detect authentication platform (Certilogo, Authentic8, Entrupy, etc.)
 *  5. Scrape page title / meta for product info
 *  6. Score legitimacy of the domain against known trusted patterns
 *  7. Return ScanResult-compatible object
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── HTML entity decoder for scraped page titles / descriptions ──────────────
// Decodes common named entities + numeric entities (decimal and hex).
function decodeHtmlEntities(input: string): string {
  if (!input) return input
  const namedEntities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
    '&#39;': "'", '&nbsp;': ' ',
    '&ndash;': '–', '&mdash;': '—',
    '&lsquo;': '‘', '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”',
    '&laquo;': '«', '&raquo;': '»',
    '&hellip;': '…', '&bull;': '•', '&middot;': '·',
    '&copy;': '©', '&reg;': '®', '&trade;': '™',
    '&deg;': '°', '&plusmn;': '±', '&times;': '×', '&divide;': '÷',
    '&euro;': '€', '&pound;': '£', '&yen;': '¥', '&cent;': '¢',
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&agrave;': 'à', '&egrave;': 'è', '&igrave;': 'ì', '&ograve;': 'ò', '&ugrave;': 'ù',
    '&acirc;': 'â', '&ecirc;': 'ê', '&icirc;': 'î', '&ocirc;': 'ô', '&ucirc;': 'û',
    '&atilde;': 'ã', '&ntilde;': 'ñ', '&otilde;': 'õ',
    '&auml;': 'ä', '&euml;': 'ë', '&iuml;': 'ï', '&ouml;': 'ö', '&uuml;': 'ü',
    '&ccedil;': 'ç', '&szlig;': 'ß',
  }
  let out = input
  // Named entities
  out = out.replace(/&[a-zA-Z]+;/g, (match) => namedEntities[match] ?? match)
  // Decimal numeric entities &#8211;
  out = out.replace(/&#(\d+);/g, (_, num) => {
    try { return String.fromCodePoint(parseInt(num, 10)) } catch { return _ }
  })
  // Hex numeric entities &#x2013;
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return _ }
  })
  return out
}

// ─── Known legitimate brand verification domains ─────────────────────────────
// Format: domain → { brand, platform, trustBonus, note }
const TRUSTED_BRAND_DOMAINS: Record<string, {
  brand: string; platform: string; trustBonus: number; note: string
}> = {
  // ── Authentication platforms ──
  'certilogo.com':          { brand: 'Multi-brand',  platform: 'Certilogo',     trustBonus: 35, note: 'Certilogo platform — used by Armani, Versace, Calvin Klein, Hugo Boss, Tommy Hilfiger' },
  'authenticate.me':        { brand: 'Multi-brand',  platform: 'Authenticate',  trustBonus: 30, note: 'Authenticate.me digital product passport' },
  'legitcheck.app':         { brand: 'Multi-brand',  platform: 'LegitCheck',    trustBonus: 25, note: 'LegitCheck AI authentication platform' },
  'entrupy.com':            { brand: 'Multi-brand',  platform: 'Entrupy',       trustBonus: 35, note: 'Entrupy AI microscopy authentication' },
  'authentique.io':         { brand: 'Multi-brand',  platform: 'Authentique',   trustBonus: 28, note: 'Authentique NFC/QR authentication' },
  'authena.io':             { brand: 'Multi-brand',  platform: 'Authena',       trustBonus: 28, note: 'Authena blockchain authentication' },
  'arianee.com':            { brand: 'Multi-brand',  platform: 'Arianee',       trustBonus: 30, note: 'Arianee digital product passport (luxury)' },
  'aura.global':            { brand: 'Multi-brand',  platform: 'AURA Blockchain', trustBonus: 32, note: 'AURA Blockchain Consortium (LVMH, Prada, Cartier, OTB)' },
  'genuinemark.io':         { brand: 'Multi-brand',  platform: 'GenuineMark',   trustBonus: 25, note: 'GenuineMark QR authentication' },
  'scantrust.com':          { brand: 'Multi-brand',  platform: 'ScanTrust',     trustBonus: 30, note: 'ScanTrust supply chain authentication' },
  'vc.gs1.org':             { brand: 'GS1',          platform: 'GS1 DigitalLink', trustBonus: 38, note: 'GS1 Digital Link — official GS1 verification' },
  'id.gs1.org':             { brand: 'GS1',          platform: 'GS1',           trustBonus: 38, note: 'GS1 product identity' },
  // ── Nike ──
  'nike.com':               { brand: 'Nike',         platform: 'Nike Official', trustBonus: 40, note: 'Official Nike website' },
  'auth.nike.com':          { brand: 'Nike',         platform: 'Nike Auth',     trustBonus: 42, note: 'Nike product authentication portal' },
  // ── Adidas ──
  'adidas.com':             { brand: 'Adidas',       platform: 'Adidas Official', trustBonus: 40, note: 'Official Adidas website' },
  // ── Luxury fashion ──
  'louisvuitton.com':       { brand: 'Louis Vuitton', platform: 'LV Official',  trustBonus: 42, note: 'Official Louis Vuitton website' },
  'gucci.com':              { brand: 'Gucci',        platform: 'Gucci Official', trustBonus: 42, note: 'Official Gucci website' },
  'prada.com':              { brand: 'Prada',        platform: 'Prada Official', trustBonus: 42, note: 'Official Prada website' },
  'hermes.com':             { brand: 'Hermès',       platform: 'Hermès Official', trustBonus: 42, note: 'Official Hermès website' },
  'chanel.com':             { brand: 'Chanel',       platform: 'Chanel Official', trustBonus: 42, note: 'Official Chanel website' },
  'burberry.com':           { brand: 'Burberry',     platform: 'Burberry Official', trustBonus: 40, note: 'Official Burberry website' },
  'dior.com':               { brand: 'Dior',         platform: 'Dior Official', trustBonus: 42, note: 'Official Dior website' },
  'versace.com':            { brand: 'Versace',      platform: 'Versace Official', trustBonus: 40, note: 'Official Versace website' },
  // ── Watches ──
  'rolex.com':              { brand: 'Rolex',        platform: 'Rolex Official', trustBonus: 42, note: 'Official Rolex website' },
  'omega.com':              { brand: 'Omega',        platform: 'Omega Official', trustBonus: 40, note: 'Official Omega website' },
  'tagheuer.com':           { brand: 'TAG Heuer',    platform: 'TAG Heuer Official', trustBonus: 40, note: 'Official TAG Heuer website' },
  'cartier.com':            { brand: 'Cartier',      platform: 'Cartier Official', trustBonus: 42, note: 'Official Cartier website' },
  // ── Electronics ──
  'apple.com':              { brand: 'Apple',        platform: 'Apple Official', trustBonus: 42, note: 'Official Apple website' },
  'samsung.com':            { brand: 'Samsung',      platform: 'Samsung Official', trustBonus: 40, note: 'Official Samsung website' },
  'checkcoverage.apple.com': { brand: 'Apple',       platform: 'Apple Coverage', trustBonus: 45, note: 'Apple warranty & coverage check — highly trusted' },
  'sony.com':               { brand: 'Sony',         platform: 'Sony Official',  trustBonus: 40, note: 'Official Sony website' },
  'lg.com':                 { brand: 'LG',           platform: 'LG Official',    trustBonus: 40, note: 'Official LG website' },
  'philips.com':            { brand: 'Philips',      platform: 'Philips Official', trustBonus: 40, note: 'Official Philips website' },
  'panasonic.com':          { brand: 'Panasonic',    platform: 'Panasonic Official', trustBonus: 40, note: 'Official Panasonic website' },
  'bose.com':               { brand: 'Bose',         platform: 'Bose Official',  trustBonus: 40, note: 'Official Bose website' },
  'dyson.com':              { brand: 'Dyson',        platform: 'Dyson Official', trustBonus: 40, note: 'Official Dyson website' },
  'microsoft.com':          { brand: 'Microsoft',    platform: 'Microsoft Official', trustBonus: 42, note: 'Official Microsoft website' },
  // ── VeSync brand family (Etekcity, LEVOIT, Cosori, VeSync) ──
  'vesync.com':             { brand: 'VeSync',       platform: 'VeSync Official', trustBonus: 38, note: 'Official VeSync Co. Ltd website — parent of Etekcity, LEVOIT, Cosori' },
  'barcode.vesync.com':     { brand: 'Etekcity / VeSync', platform: 'VeSync Barcode Auth', trustBonus: 40, note: 'Official VeSync product barcode & QR verification portal (Etekcity, LEVOIT, Cosori)' },
  'etekcity.com':           { brand: 'Etekcity',     platform: 'Etekcity Official', trustBonus: 38, note: 'Official Etekcity website (VeSync brand)' },
  'levoit.com':             { brand: 'LEVOIT',       platform: 'LEVOIT Official', trustBonus: 38, note: 'Official LEVOIT website (VeSync brand)' },
  'cosori.com':             { brand: 'Cosori',       platform: 'Cosori Official', trustBonus: 38, note: 'Official Cosori website (VeSync brand)' },
  // ── Home & Kitchen brands ──
  'instantpot.com':         { brand: 'Instant Pot',  platform: 'Instant Pot Official', trustBonus: 36, note: 'Official Instant Pot website' },
  'instantbrands.com':      { brand: 'Instant Brands', platform: 'Instant Brands Official', trustBonus: 36, note: 'Official Instant Brands (Instant Pot, Pyrex, Corelle)' },
  'keurig.com':             { brand: 'Keurig',       platform: 'Keurig Official', trustBonus: 38, note: 'Official Keurig website' },
  'nespresso.com':          { brand: 'Nespresso',    platform: 'Nespresso Official', trustBonus: 38, note: 'Official Nespresso website' },
  'cuisinart.com':          { brand: 'Cuisinart',    platform: 'Cuisinart Official', trustBonus: 36, note: 'Official Cuisinart website' },
  'kitchenaid.com':         { brand: 'KitchenAid',   platform: 'KitchenAid Official', trustBonus: 38, note: 'Official KitchenAid website' },
  'vitamix.com':            { brand: 'Vitamix',      platform: 'Vitamix Official', trustBonus: 38, note: 'Official Vitamix website' },
  'ninjakitchen.com':       { brand: 'Ninja',        platform: 'Ninja Kitchen Official', trustBonus: 36, note: 'Official Ninja Kitchen website' },
  'sharkclean.com':         { brand: 'Shark',        platform: 'Shark Official', trustBonus: 36, note: 'Official Shark website' },
  'irobotpartner.com':      { brand: 'iRobot',       platform: 'iRobot Auth',    trustBonus: 35, note: 'Official iRobot partner verification' },
  'irobot.com':             { brand: 'iRobot',       platform: 'iRobot Official', trustBonus: 36, note: 'Official iRobot website' },
  // ── Specialty Food, Wine & Olive Oil producers ──
  'entimio.com':            { brand: 'Entimio',      platform: 'Entimio Official', trustBonus: 32, note: 'Official Entimio specialty olive oil producer' },
  'oliveoilcommission.com': { brand: 'IOC',          platform: 'Intl. Olive Council', trustBonus: 35, note: 'International Olive Council reference authority' },
  'colavita.com':           { brand: 'Colavita',     platform: 'Colavita Official', trustBonus: 34, note: 'Official Colavita olive oil' },
  'californiaoliveranch.com': { brand: 'California Olive Ranch', platform: 'COR Official', trustBonus: 34, note: 'Official California Olive Ranch' },
  'lucini.com':             { brand: 'Lucini',       platform: 'Lucini Official',  trustBonus: 32, note: 'Official Lucini Italia' },
  'simiwinery.com':         { brand: 'SIMI',         platform: 'SIMI Winery Official', trustBonus: 36, note: 'Official SIMI Winery (Sonoma County)' },
  'simi.com':               { brand: 'SIMI',         platform: 'SIMI Winery Official', trustBonus: 36, note: 'Official SIMI Winery' },
  'constellationbrands.com': { brand: 'Constellation Brands', platform: 'Constellation Official', trustBonus: 36, note: 'Official Constellation Brands (Robert Mondavi, SIMI, Kim Crawford)' },
  'robertmondaviwinery.com': { brand: 'Robert Mondavi', platform: 'Robert Mondavi Official', trustBonus: 36, note: 'Official Robert Mondavi Winery' },
  'kimcrawfordwines.com':   { brand: 'Kim Crawford', platform: 'Kim Crawford Official', trustBonus: 34, note: 'Official Kim Crawford wines' },
  'mouton-rothschild.com':  { brand: 'Château Mouton Rothschild', platform: 'Mouton Rothschild Official', trustBonus: 40, note: 'Official Château Mouton Rothschild' },
  'lafite.com':             { brand: 'Château Lafite Rothschild', platform: 'Lafite Official', trustBonus: 40, note: 'Official Château Lafite Rothschild' },
  'dom.fr':                 { brand: 'Dom Pérignon', platform: 'Dom Pérignon Official', trustBonus: 38, note: 'Official Dom Pérignon' },
  'moet.com':               { brand: 'Moët & Chandon', platform: 'Moët Official',  trustBonus: 38, note: 'Official Moët & Chandon' },
  // ── Olive oil & food certification / reference bodies ──
  'worldolivecenter.com':   { brand: 'World Olive Center for Health', platform: 'WOCH Reference', trustBonus: 34, note: 'World Olive Center for Health — olive oil science & certification reference authority' },
  'internationaloliveoil.org': { brand: 'IOC',       platform: 'Intl. Olive Council', trustBonus: 38, note: 'International Olive Council (IOC) — UN-recognized olive oil authority' },
  'oliveoiltimes.com':      { brand: 'Olive Oil Times', platform: 'Olive Oil Times', trustBonus: 30, note: 'Olive Oil Times — industry reference publication' },
  'aromaticolivecenter.com': { brand: 'Aromatic Olive Center', platform: 'AOC', trustBonus: 30, note: 'Aromatic Olive Center certification' },
  'naooa.org':              { brand: 'NAOOA',        platform: 'North American Olive Oil Assoc.', trustBonus: 34, note: 'North American Olive Oil Association' },
  'wine.com':               { brand: 'Wine.com',     platform: 'Wine.com',       trustBonus: 32, note: 'Wine.com verified retailer' },
  // ── Health & Wellness ──
  'omron.com':              { brand: 'Omron',        platform: 'Omron Official', trustBonus: 36, note: 'Official Omron Healthcare website' },
  'withings.com':           { brand: 'Withings',     platform: 'Withings Official', trustBonus: 35, note: 'Official Withings health device website' },
  'garmin.com':             { brand: 'Garmin',       platform: 'Garmin Official', trustBonus: 40, note: 'Official Garmin website' },
  'fitbit.com':             { brand: 'Fitbit',       platform: 'Fitbit Official', trustBonus: 38, note: 'Official Fitbit website' },
  'theragun.com':           { brand: 'Theragun',     platform: 'Theragun Official', trustBonus: 36, note: 'Official Theragun website' },
  // ── Pharma / Health ──
  'fda.gov':                { brand: 'FDA',          platform: 'US FDA',        trustBonus: 45, note: 'US Food & Drug Administration — official' },
  'who.int':                { brand: 'WHO',          platform: 'WHO',           trustBonus: 45, note: 'World Health Organization — official' },
  'drugs.com':              { brand: 'Multi-brand',  platform: 'Drugs.com',     trustBonus: 28, note: 'Drugs.com medication verification' },
  // ── Wine & spirits ──
  'vivino.com':             { brand: 'Multi-brand',  platform: 'Vivino',        trustBonus: 25, note: 'Vivino wine database' },
  'bottlecapps.com':        { brand: 'Multi-brand',  platform: 'BottleCapps',   trustBonus: 20, note: 'Spirits authentication' },
  // ── Automotive / Tools ──
  'bosch.com':              { brand: 'Bosch',        platform: 'Bosch Official', trustBonus: 38, note: 'Official Bosch website' },
  'dewalt.com':             { brand: 'DeWalt',       platform: 'DeWalt Official', trustBonus: 38, note: 'Official DeWalt website' },
  'milwaukeetool.com':      { brand: 'Milwaukee Tool', platform: 'Milwaukee Official', trustBonus: 38, note: 'Official Milwaukee Tool website' },
  'stanleytools.com':       { brand: 'Stanley',      platform: 'Stanley Official', trustBonus: 35, note: 'Official Stanley Tools website' },
  // ── Beauty / Personal Care ──
  'neutrogena.com':         { brand: 'Neutrogena',   platform: 'Neutrogena Official', trustBonus: 35, note: 'Official Neutrogena website' },
  'loreal.com':             { brand: "L'Oréal",      platform: "L'Oréal Official", trustBonus: 38, note: "Official L'Oréal website" },
  'olay.com':               { brand: 'Olay',         platform: 'Olay Official',  trustBonus: 35, note: 'Official Olay website' },
  'dove.com':               { brand: 'Dove',         platform: 'Dove Official',  trustBonus: 35, note: 'Official Dove website' },
  'gillette.com':           { brand: 'Gillette',     platform: 'Gillette Official', trustBonus: 36, note: 'Official Gillette website' },
  // ── Retail / Platform verification ──
  'amazon.com':             { brand: 'Amazon',       platform: 'Amazon Official', trustBonus: 35, note: 'Official Amazon website — product may be sold there' },
  'walmart.com':            { brand: 'Walmart',      platform: 'Walmart Official', trustBonus: 32, note: 'Official Walmart website' },
}

// ─── Known phishing / counterfeit hosting patterns ────────────────────────────
const SUSPICIOUS_PATTERNS = [
  /bit\.ly/i, /tinyurl/i, /t\.co/i,          // pure shorteners with no brand value
  /shopify.*fake/i, /aliexpress/i,
  /\.tk$/i, /\.ml$/i, /\.ga$/i, /\.cf$/i,    // free TLDs commonly abused
  /[0-9]{4,}\.[a-z]{2,4}$/i,                 // numeric-heavy domains
]

// Domains that are shorteners but can be legitimate (follow their redirect)
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
  'short.io', 'rb.gy', 'cutt.ly', 'is.gd',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isUrl(str: string): boolean {
  return /^https?:\/\//i.test(str) || /^www\./i.test(str)
}

// Extract embedded barcode from QR URL query params
function extractEmbeddedBarcode(url: string): string | null {
  try {
    const u = new URL(url)
    // Common param names brands use for serial/code
    const codeParams = ['barcode', 'code', 'serial', 'id', 'product', 'sku', 'gtin', 'uid', 'tag', 'item', 'ref', 'productId']
    for (const p of codeParams) {
      const val = u.searchParams.get(p)
      if (val && /^[A-Z0-9\-]{4,}$/i.test(val)) return val
    }
    // Check path segments for GTIN-like numbers
    const pathParts = u.pathname.split('/').filter(Boolean)
    for (const part of pathParts) {
      if (/^\d{8,14}$/.test(part)) return part  // numeric GTIN
    }
  } catch { /* ignore */ }
  return null
}

// Follow redirects (max 5 hops) and return final URL + title
async function followUrl(startUrl: string): Promise<{
  finalUrl: string; title: string; description: string; hops: number; error?: string
}> {
  let current = startUrl
  let hops = 0
  let title = ''
  let description = ''

  while (hops < 5) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 6000)
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',   // handle manually to count hops
        headers: {
          'User-Agent': 'Mozilla/5.0 (Veri9 Product Authenticator; +https://veri9.com) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timer))

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) break
        current = loc.startsWith('http') ? loc : new URL(loc, current).toString()
        hops++
        continue
      }

      if (res.ok) {
        // Read up to 32KB of HTML for title/meta
        const reader = res.body?.getReader()
        if (reader) {
          let html = ''
          let bytesRead = 0
          while (bytesRead < 32768) {
            const { done, value } = await reader.read()
            if (done) break
            html += new TextDecoder().decode(value)
            bytesRead += value?.length ?? 0
          }
          reader.cancel()

          const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
          if (titleMatch) title = decodeHtmlEntities(titleMatch[1].trim())

          const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})["']/i)
            || html.match(/<meta[^>]+content=["']([^"']{1,300})["'][^>]+name=["']description["']/i)
          if (descMatch) description = decodeHtmlEntities(descMatch[1].trim())

          // Look for og:title if no title
          if (!title) {
            const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i)
            if (ogTitle) title = decodeHtmlEntities(ogTitle[1].trim())
          }
        }
      }
      break
    } catch (err) {
      return { finalUrl: current, title: '', description: '', hops, error: err instanceof Error ? err.message : 'fetch failed' }
    }
  }

  return { finalUrl: current, title, description, hops }
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(request: Request) {
  let body: { url?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  let rawUrl = (body.url || '').trim()
  if (!rawUrl) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  // Add https:// if missing
  if (/^www\./i.test(rawUrl)) rawUrl = 'https://' + rawUrl
  if (!isUrl(rawUrl)) {
    return NextResponse.json({ error: `Not a URL: "${rawUrl.slice(0, 80)}"` }, { status: 400 })
  }

  const checks: { name: string; result: string; pass: boolean | null }[] = []
  const notes: string[] = []
  const sourcesFound: string[] = []
  let confidence = 20   // baseline for "got a URL, nothing else yet"

  const originalDomain = extractDomain(rawUrl)
  const embeddedCode = extractEmbeddedBarcode(rawUrl)

  // ── Check 1: Domain reputation ────────────────────────────────────────────
  const trusted = TRUSTED_BRAND_DOMAINS[originalDomain]
  const isSuspicious = SUSPICIOUS_PATTERNS.some(p => p.test(rawUrl))
  const isShortener = URL_SHORTENERS.includes(originalDomain)

  if (trusted) {
    checks.push({ name: 'Domain Reputation', result: `✅ Trusted: ${trusted.platform} (${trusted.brand})`, pass: true })
    confidence = Math.min(confidence + trusted.trustBonus, 92)
    notes.push(trusted.note)
    sourcesFound.push(trusted.platform)
  } else if (isSuspicious) {
    checks.push({ name: 'Domain Reputation', result: `⚠️ Suspicious domain pattern: ${originalDomain}`, pass: false })
    confidence = Math.max(confidence - 20, 5)
    notes.push(`Domain "${originalDomain}" matches known phishing/counterfeit patterns.`)
  } else if (isShortener) {
    checks.push({ name: 'Domain Reputation', result: `🔗 URL shortener (${originalDomain}) — following redirect…`, pass: null })
  } else {
    checks.push({ name: 'Domain Reputation', result: `Unknown domain: ${originalDomain} — following URL to investigate`, pass: null })
  }

  // ── Check 2: HTTPS ────────────────────────────────────────────────────────
  const isHttps = rawUrl.startsWith('https://')
  // HTTP check deferred until after followUrl() — HTTP->HTTPS redirect is normal brand behaviour
  // We will add the HTTPS check result after we know the final URL

  // ── Check 3: Embedded barcode/code in URL ─────────────────────────────────
  let resolvedBrand = trusted?.brand || 'Unknown'
  let resolvedName = 'QR Code Authentication'
  let resolvedPlatform = trusted?.platform || 'Unknown'

  if (embeddedCode) {
    checks.push({ name: 'Embedded Code', result: `Code found in URL: ${embeddedCode}`, pass: true })
    notes.push(`QR code contains embedded identifier: ${embeddedCode}`)
    confidence = Math.min(confidence + 8, 92)
  }

  // ── Check 4: Follow URL and inspect final destination ─────────────────────
  const { finalUrl, title, description: pageDesc, hops, error: fetchError } = await followUrl(rawUrl)
  const finalDomain = extractDomain(finalUrl)
  const finalTrusted = TRUSTED_BRAND_DOMAINS[finalDomain]

  // Now add deferred HTTPS check — if original was HTTP but final is HTTPS, that is normal
  const finalIsHttps = finalUrl.startsWith('https://')
  if (!isHttps && finalIsHttps) {
    checks.push({ name: 'HTTPS / Encryption', result: 'HTTP redirects to HTTPS — encrypted connection established', pass: true })
  } else if (isHttps) {
    checks.push({ name: 'HTTPS / Encryption', result: 'URL uses HTTPS (encrypted)', pass: true })
  } else {
    checks.push({ name: 'HTTPS / Encryption', result: '⚠️ Final URL is HTTP (not encrypted) — minor concern', pass: null })
    confidence = Math.max(confidence - 5, 5)  // smaller penalty (was -10), HTTP-only final is unusual
  }

  if (fetchError) {
    checks.push({ name: 'URL Follow', result: `Could not fetch URL: ${fetchError}`, pass: null })
    notes.push('URL could not be reached — may be expired, region-locked, or a single-use token.')
  } else {
    checks.push({ name: 'URL Follow', result: hops > 0 ? `Followed ${hops} redirect(s) → ${finalDomain}` : `Loaded ${finalDomain} directly`, pass: true })

    if (finalDomain !== originalDomain) {
      if (finalTrusted) {
        checks.push({ name: 'Final Destination', result: `✅ Redirected to trusted domain: ${finalDomain} (${finalTrusted.platform})`, pass: true })
        confidence = Math.min(confidence + finalTrusted.trustBonus, 93)
        notes.push(`After ${hops} redirect(s), URL resolved to ${finalTrusted.platform} — ${finalTrusted.note}`)
        resolvedBrand = finalTrusted.brand
        resolvedPlatform = finalTrusted.platform
        if (!sourcesFound.includes(finalTrusted.platform)) sourcesFound.push(finalTrusted.platform)
      } else {
        checks.push({ name: 'Final Destination', result: `Redirected to unknown domain: ${finalDomain}`, pass: null })
        notes.push(`URL redirects to ${finalDomain} which is not in our trusted brand domain registry.`)
      }
    }

    // Extract brand info from page title/meta
    if (title) {
      resolvedName = title.slice(0, 80)
      checks.push({ name: 'Page Content', result: `Title: "${title.slice(0, 60)}${title.length > 60 ? '…' : ''}"`, pass: true })
      confidence = Math.min(confidence + 5, 93)

      // Try to detect brand from title
      const titleLower = title.toLowerCase()
      const brandKeywords: [string, string][] = [
        ['nike', 'Nike'], ['adidas', 'Adidas'], ['louis vuitton', 'Louis Vuitton'],
        ['gucci', 'Gucci'], ['prada', 'Prada'], ['chanel', 'Chanel'],
        ['rolex', 'Rolex'], ['omega', 'Omega'], ['apple', 'Apple'],
        ['samsung', 'Samsung'], ['certilogo', 'Certilogo'],
        ['armani', 'Armani'], ['versace', 'Versace'], ['hermes', 'Hermès'],
        ['burberry', 'Burberry'], ['dior', 'Dior'], ['cartier', 'Cartier'],
        // VeSync brand family
        ['vesync', 'VeSync'], ['etekcity', 'Etekcity'], ['levoit', 'LEVOIT'], ['cosori', 'Cosori'],
        // Electronics
        ['sony', 'Sony'], ['lg electronics', 'LG'], ['philips', 'Philips'],
        ['bose', 'Bose'], ['dyson', 'Dyson'], ['microsoft', 'Microsoft'],
        ['garmin', 'Garmin'], ['fitbit', 'Fitbit'],
        // Home / Kitchen
        ['instant pot', 'Instant Pot'], ['keurig', 'Keurig'], ['nespresso', 'Nespresso'],
        ['kitchenaid', 'KitchenAid'], ['vitamix', 'Vitamix'], ['ninja', 'Ninja'],
        ['shark', 'Shark'], ['irobot', 'iRobot'], ['roomba', 'iRobot'],
        // Tools
        ['bosch', 'Bosch'], ['dewalt', 'DeWalt'], ['milwaukee', 'Milwaukee Tool'],
        // Beauty
        ["l'oreal", "L'Oréal"], ['neutrogena', 'Neutrogena'], ['gillette', 'Gillette'],
        // Generic auth signals
        ['authentic', 'Authenticated'], ['verified', 'Verified'], ['genuine', 'Genuine'],
      ]
      for (const [kw, brandName] of brandKeywords) {
        if (titleLower.includes(kw)) {
          if (resolvedBrand === 'Unknown' || resolvedBrand === 'Multi-brand') resolvedBrand = brandName
          break
        }
      }
    }

    // Check for authentication success signals in page content
    const contentLower = (title + ' ' + pageDesc).toLowerCase()
    const authSuccessKws = ['authentic', 'verified', 'genuine', 'legitimate', 'original', 'valid', 'authenticated']
    const authFailKws = ['invalid', 'not found', 'expired', 'error', 'not valid', 'fake', 'counterfeit']
    const successMatch = authSuccessKws.some(k => contentLower.includes(k))
    const failMatch = authFailKws.some(k => contentLower.includes(k))

    if (successMatch && !failMatch) {
      checks.push({ name: 'Authentication Result', result: 'Page indicates product is authentic/verified', pass: true })
      confidence = Math.min(confidence + 15, 95)
      notes.push('Authentication page confirmed product authenticity.')
    } else if (failMatch) {
      checks.push({ name: 'Authentication Result', result: '⚠️ Page may indicate invalid/expired code', pass: false })
      confidence = Math.max(confidence - 15, 5)
      notes.push('Authentication page may show a negative or expired result.')
    } else {
      checks.push({ name: 'Authentication Result', result: 'Could not determine pass/fail from page content', pass: null })
    }
  }

  // ── Check 5: Domain age / structure signals ───────────────────────────────
  // Counterfeit sites often have very long, hyphenated, or typosquatted domains
  const domainToCheck = finalDomain || originalDomain
  const isTyposquat = /[0-9]/.test(domainToCheck.split('.')[0]) ||      // e.g. n1ke.com
    domainToCheck.split('.')[0].includes('--') ||                        // double hyphen
    domainToCheck.length > 40                                            // absurdly long
  if (isTyposquat) {
    checks.push({ name: 'Domain Structure', result: `⚠️ Domain looks like a typosquat or fake: ${domainToCheck}`, pass: false })
    confidence = Math.max(confidence - 20, 5)
    notes.push(`Domain "${domainToCheck}" has characteristics of a typosquatting or counterfeit domain.`)
  } else {
    checks.push({ name: 'Domain Structure', result: `Domain structure looks normal: ${domainToCheck}`, pass: true })
  }

  // ── Smart fallback: clean unknown domains ──────────────────────────────
  // If the domain is not in the trusted registry BUT every automatic signal
  // came back clean (HTTPS, reachable, normal structure, legible page title,
  // not a shortener, not a suspicious pattern), give a moderate confidence
  // bump so legitimate niche / specialty brands aren't reflexively flagged
  // as "Suspicious". This moves a typical clean unknown from ~20 → ~45-55
  // (INSUFFICIENT_DATA or LIKELY_AUTHENTIC) rather than SUSPICIOUS.
  if (!trusted && !finalTrusted && !isSuspicious && !isShortener && !isTyposquat && !fetchError && finalIsHttps && title) {
    const cleanBonus = 22
    confidence = Math.min(confidence + cleanBonus, 60) // cap at 60 — never VERIFIED without a trusted match
    checks.push({
      name: 'Clean Domain Signals',
      result: `Unknown brand but domain passes all automated safety checks (HTTPS, reachable, legible content, clean structure)`,
      pass: true,
    })
    notes.push(`Domain "${domainToCheck}" is not in our trusted brand registry but shows no red flags. Verify the brand independently before purchase.`)
  }

  // ── Bonus for trusted domains with non-parseable content ───────────────
  // If the domain IS trusted but we couldn't parse page content (PDF, image,
  // or no title tag), still give a moderate bump so trusted PDFs don't fall
  // into SUSPICIOUS just because they're not HTML pages.
  if ((trusted || finalTrusted) && !fetchError && finalIsHttps && !title) {
    const trustedPdfBonus = 12
    confidence = Math.min(confidence + trustedPdfBonus, 68) // cap below VERIFIED (75)
    checks.push({
      name: 'Trusted Domain (Non-HTML)',
      result: `Domain is trusted (${trusted?.brand || finalTrusted?.brand}) but page content could not be parsed (likely PDF or image)`,
      pass: true,
    })
    notes.push(`Domain "${domainToCheck}" is in our trusted registry. The destination appears to be a PDF or non-HTML document, so we couldn't extract page content for verification.`)
  }

  // ── Final verdict ──────────────────────────────────────────────────────────
  let statusKey: string
  if (confidence >= 75)      statusKey = 'VERIFIED'
  else if (confidence >= 55) statusKey = 'LIKELY_AUTHENTIC'
  else if (confidence >= 35) statusKey = 'INSUFFICIENT_DATA'
  else if (confidence >= 20) statusKey = 'SUSPICIOUS'
  else                       statusKey = 'COUNTERFEIT'

  const isTrustedDomain = !!(trusted || finalTrusted)
  const summary = confidence >= 75
    ? `✅ QR code leads to a verified ${resolvedBrand} authentication page. Product appears authentic.`
    : isTrustedDomain && confidence >= 55
      ? `🟡 QR code leads to a trusted domain (${resolvedBrand}). The specific page content could not be verified but the domain is legitimate.`
      : confidence >= 55
        ? `🟡 QR code leads to a plausible ${resolvedBrand} page. Could not get a definitive pass/fail from the page content.`
        : isTrustedDomain && confidence >= 35
          ? `ℹ️ QR code leads to a trusted domain (${resolvedBrand}) but page content could not be parsed. The domain itself is legitimate.`
          : isSuspicious || isTyposquat
            ? `🚨 QR code leads to a suspicious or unknown domain. Do NOT trust this product.`
            : `⚠️ QR code destination is unknown or unverifiable. Inspect the product physically.`

  const checksText = checks.map(c => `${c.pass === true ? '✓' : c.pass === false ? '✗' : '?'} ${c.name}: ${c.result}`).join('\n')
  const notesText = notes.length > 0 ? '\n\nNotes:\n' + notes.join('\n') : ''
  const urlInfo = `\nOriginal URL: ${rawUrl}\nFinal URL: ${finalUrl}\nPlatform: ${resolvedPlatform}`

  const sourcesArr = [
    { name: `Domain Registry — ${originalDomain}`, found: !!trusted },
    ...(finalDomain !== originalDomain ? [{ name: `Final Domain — ${finalDomain}`, found: !!finalTrusted }] : []),
    { name: 'URL Follow / Redirect Check', found: !fetchError },
    { name: 'Page Content Analysis', found: !!title },
    ...(embeddedCode ? [{ name: `Embedded Code: ${embeddedCode}`, found: true }] : []),
  ]

  return NextResponse.json({
    barcode: embeddedCode || originalDomain,
    productName: resolvedName || `QR Auth — ${resolvedBrand}`,
    brand: resolvedBrand,
    manufacturer: resolvedBrand,
    category: 'QR Code Authentication',
    trustScore: confidence,
    status: statusKey,
    sources: sourcesArr,
    recall: false,
    timestamp: Date.now(),
    description: summary + '\n\n' + checksText + notesText + urlInfo,
    verificationTime: '< 5s',
    crossRefPassed: checks.filter(c => c.pass === true).length,
    crossRefTotal: checks.length,
    // Preserve QR-specific data
    details: {
      authMethod: 'QR_URL',
      originalUrl: rawUrl,
      finalUrl,
      originalDomain,
      finalDomain,
      platform: resolvedPlatform,
      embeddedCode,
      pageTitle: title,
      hops,
      checks,
      notes,
    },
  })
}
