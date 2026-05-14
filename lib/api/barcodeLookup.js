/**
 * Barcode Lookup API Integration
 * Uses multiple free sources for barcode/company verification
 * - GS1 GEPIR (Global Electronic Party Information Registry)
 * - Barcode Lookup API (free tier)
 * - UPCitemdb (free)
 */

/**
 * Look up barcode via UPCitemdb (free, no API key)
 * @param {string} barcode - UPC/EAN barcode
 * @returns {object} Product data or null
 */
async function lookupUPCitemdb(barcode) {
  try {
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Veri9-App/1.0' }
    });
    const data = await response.json();

    if (data.code === 'OK' && data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        found: true,
        source: 'UPCitemdb',
        barcode,
        name: item.title || 'Unknown',
        brand: item.brand || 'Unknown',
        manufacturer: item.manufacturer || item.brand || 'Unknown',
        category: item.category || null,
        description: item.description || null,
        images: item.images || [],
        lowestPrice: item.lowest_recorded_price || null,
        highestPrice: item.highest_recorded_price || null,
        offers: item.offers ? item.offers.slice(0, 3).map(o => ({
          merchant: o.merchant,
          price: o.price,
          link: o.link
        })) : [],
        allItems: data.items.slice(0, 5).map(i => ({
          title: i.title,
          brand: i.brand,
          upc: i.upc
        }))
      };
    }

    return { found: false, source: 'UPCitemdb', barcode };
  } catch (error) {
    console.error('UPCitemdb lookup error:', error.message);
    return { found: false, source: 'UPCitemdb', barcode, error: error.message };
  }
}

/**
 * Look up barcode via Barcode Lookup API
 * https://www.barcodelookup.com/api — paid tier ($30/mo = 35k requests)
 * Set BARCODE_LOOKUP_API_KEY in env. Falls back to "not found" if missing.
 *
 * Coverage highlight: ~500M SKUs globally, strong on US household / grocery
 * / pharmacy items (exactly what free APIs like OpenFoodFacts miss —
 * e.g. Mrs Dash seasonings).
 *
 * @param {string} barcode - UPC/EAN barcode
 * @returns {object} Product data or null
 */
async function lookupBarcodeAPI(barcode) {
  const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
  if (!apiKey) {
    return { found: false, source: 'BarcodeLookup', barcode, skipped: 'no_api_key' };
  }
  try {
    const url = `https://api.barcodelookup.com/v3/products?barcode=${encodeURIComponent(barcode)}&formatted=y&key=${encodeURIComponent(apiKey)}`;
    // 6-second timeout so a slow Barcode Lookup response never blocks the whole verification
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Veri9-App/1.0' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!response.ok) {
      // 403 = bad/expired key, 404 = not found, 429 = rate limited
      return { found: false, source: 'BarcodeLookup', barcode, httpStatus: response.status };
    }

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      return {
        found: true,
        source: 'BarcodeLookup',
        barcode,
        name: product.product_name || 'Unknown',
        brand: product.brand || 'Unknown',
        manufacturer: product.manufacturer || 'Unknown',
        category: product.category || null,
        description: product.description || null,
        image: product.images ? product.images[0] : null,
        ingredients: product.ingredients || null,
        weight: product.weight || null,
        dimensions: product.dimensions || null,
        stores: product.stores || null,
        lastUpdated: product.last_updated || null
      };
    }

    return { found: false, source: 'BarcodeLookup', barcode };
  } catch (error) {
    console.error('BarcodeLookup error:', error.message);
    return { found: false, source: 'BarcodeLookup', barcode, error: error.message };
  }
}

/**
 * Extract GS1 company prefix from a barcode
 * GS1 prefixes identify the company that issued the barcode
 * @param {string} barcode - Full barcode
 * @returns {object} GS1 prefix information
 */
function extractGS1Prefix(barcode) {
  const gs1Prefixes = {
    '000-019': 'GS1 US',
    '020-029': 'GS1 US (Restricted distribution)',
    '030-039': 'GS1 US (Drugs)',
    '040-049': 'GS1 US (Restricted distribution)',
    '050-059': 'GS1 US (Coupons)',
    '060-099': 'GS1 US',
    '100-139': 'GS1 US',
    '200-299': 'GS1 US (Restricted distribution)',
    '300-379': 'GS1 France',
    '380': 'GS1 Bulgaria',
    '383': 'GS1 Slovenia',
    '385': 'GS1 Croatia',
    '387': 'GS1 Bosnia',
    '389': 'GS1 Montenegro',
    '400-440': 'GS1 Germany',
    '450-459': 'GS1 Japan',
    '460-469': 'GS1 Russia',
    '471': 'GS1 Taiwan',
    '474': 'GS1 Estonia',
    '475': 'GS1 Latvia',
    '476': 'GS1 Azerbaijan',
    '477': 'GS1 Lithuania',
    '478': 'GS1 Uzbekistan',
    '479': 'GS1 Sri Lanka',
    '480': 'GS1 Philippines',
    '481': 'GS1 Belarus',
    '482': 'GS1 Ukraine',
    '484': 'GS1 Moldova',
    '485': 'GS1 Armenia',
    '486': 'GS1 Georgia',
    '487': 'GS1 Kazakhstan',
    '489': 'GS1 Hong Kong',
    '490-499': 'GS1 Japan',
    '500-509': 'GS1 UK',
    '520-521': 'GS1 Greece',
    '528': 'GS1 Lebanon',
    '529': 'GS1 Cyprus',
    '530': 'GS1 Albania',
    '531': 'GS1 Macedonia',
    '535': 'GS1 Malta',
    '539': 'GS1 Ireland',
    '540-549': 'GS1 Belgium & Luxembourg',
    '560': 'GS1 Portugal',
    '569': 'GS1 Iceland',
    '570-579': 'GS1 Denmark',
    '590': 'GS1 Poland',
    '594': 'GS1 Romania',
    '599': 'GS1 Hungary',
    '600-601': 'GS1 South Africa',
    '603': 'GS1 Ghana',
    '604': 'GS1 Senegal',
    '608': 'GS1 Bahrain',
    '609': 'GS1 Mauritius',
    '611': 'GS1 Morocco',
    '613': 'GS1 Algeria',
    '615': 'GS1 Nigeria',
    '616': 'GS1 Kenya',
    '618': 'GS1 Ivory Coast',
    '619': 'GS1 Tunisia',
    '620': 'GS1 Tanzania',
    '621': 'GS1 Syria',
    '622': 'GS1 Egypt',
    '624': 'GS1 Libya',
    '625': 'GS1 Jordan',
    '626': 'GS1 Iran',
    '627': 'GS1 Kuwait',
    '628': 'GS1 Saudi Arabia',
    '629': 'GS1 Emirates',
    '630': 'GS1 Qatar',
    '631': 'GS1 Namibia',
    '640-649': 'GS1 Finland',
    '690-699': 'GS1 China',
    '700-709': 'GS1 Norway',
    '729': 'GS1 Israel',
    '730-739': 'GS1 Sweden',
    '740': 'GS1 Guatemala',
    '741': 'GS1 El Salvador',
    '742': 'GS1 Honduras',
    '743': 'GS1 Nicaragua',
    '744': 'GS1 Costa Rica',
    '745': 'GS1 Panama',
    '746': 'GS1 Dominican Republic',
    '750': 'GS1 Mexico',
    '754-755': 'GS1 Canada',
    '759': 'GS1 Venezuela',
    '760-769': 'GS1 Switzerland',
    '770-771': 'GS1 Colombia',
    '773': 'GS1 Uruguay',
    '775': 'GS1 Peru',
    '777': 'GS1 Bolivia',
    '778-779': 'GS1 Argentina',
    '780': 'GS1 Chile',
    '784': 'GS1 Paraguay',
    '786': 'GS1 Ecuador',
    '789-790': 'GS1 Brazil',
    '800-839': 'GS1 Italy',
    '840-849': 'GS1 Spain',
    '850': 'GS1 Cuba',
    '858': 'GS1 Slovakia',
    '859': 'GS1 Czech Republic',
    '860': 'GS1 Serbia',
    '865': 'GS1 Mongolia',
    '867': 'GS1 North Korea',
    '868-869': 'GS1 Turkey',
    '870-879': 'GS1 Netherlands',
    '880': 'GS1 South Korea',
    '884': 'GS1 Cambodia',
    '885': 'GS1 Thailand',
    '888': 'GS1 Singapore',
    '890': 'GS1 India',
    '893': 'GS1 Vietnam',
    '896': 'GS1 Pakistan',
    '899': 'GS1 Indonesia',
    '900-919': 'GS1 Austria',
    '930-939': 'GS1 Australia',
    '940-949': 'GS1 New Zealand',
    '950': 'GS1 Global Office',
    '955': 'GS1 Malaysia',
    '958': 'GS1 Macau'
  };

  // Extract the first 3 digits for country/organization identification
  const prefix3 = barcode.substring(0, 3);

  let region = 'Unknown';
  for (const [range, name] of Object.entries(gs1Prefixes)) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number);
      if (Number(prefix3) >= start && Number(prefix3) <= end) {
        region = name;
        break;
      }
    } else if (prefix3 === range) {
      region = name;
      break;
    }
  }

  return {
    prefix: prefix3,
    region,
    barcode,
    barcodeType: barcode.length <= 8 ? 'EAN-8/UPC-E' :
                 barcode.length === 12 ? 'UPC-A' :
                 barcode.length === 13 ? 'EAN-13' :
                 barcode.length === 14 ? 'GTIN-14' :
                 'Unknown'
  };
}

/**
 * Multi-source barcode lookup
 * Tries multiple sources and aggregates results
 * @param {string} barcode - The barcode to look up
 * @returns {object} Aggregated results from all sources
 */
async function multiSourceLookup(barcode) {
  const gs1Info = extractGS1Prefix(barcode);

  // Run all lookups in parallel for speed
  const [upcResult, barcodeResult] = await Promise.allSettled([
    lookupUPCitemdb(barcode),
    lookupBarcodeAPI(barcode)
  ]);

  const sources = [];

  if (upcResult.status === 'fulfilled' && upcResult.value.found) {
    sources.push(upcResult.value);
  }
  if (barcodeResult.status === 'fulfilled' && barcodeResult.value.found) {
    sources.push(barcodeResult.value);
  }

  return {
    barcode,
    gs1: gs1Info,
    sources,
    totalSourcesFound: sources.length
  };
}

module.exports = { lookupUPCitemdb, lookupBarcodeAPI, extractGS1Prefix, multiSourceLookup };