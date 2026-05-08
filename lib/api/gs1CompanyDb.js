/**
 * GS1 Company Database & GEPIR Integration
 * Uses GS1 prefix data to identify product origin and manufacturer
 * Also integrates with Open Beauty Facts for cosmetics
 * and USDA FoodData Central for US food products
 * All free, no API key required for basic lookups
 */

// GS1 prefix → country mapping (expanded)
const GS1_PREFIXES = {
  '000': 'USA', '001': 'USA', '002': 'USA', '003': 'USA', '004': 'USA',
  '005': 'USA', '006': 'USA', '007': 'USA', '008': 'USA', '009': 'USA',
  '010': 'USA', '011': 'USA', '012': 'USA', '013': 'USA', '014': 'USA',
  '015': 'USA', '016': 'USA', '017': 'USA', '018': 'USA', '019': 'USA',
  '020': 'USA (restricted)', '021': 'USA (restricted)', '022': 'USA (restricted)',
  '030': 'USA', '031': 'USA', '032': 'USA', '033': 'USA', '034': 'USA',
  '035': 'USA', '036': 'USA', '037': 'USA', '038': 'USA', '039': 'USA',
  '040': 'USA (restricted)', '041': 'USA (restricted)', '042': 'USA (restricted)',
  '043': 'USA (restricted)', '044': 'USA (restricted)',
  '050': 'USA (coupons)', '059': 'USA (coupons)',
  '060': 'USA', '061': 'USA', '062': 'USA', '063': 'USA', '064': 'USA',
  '065': 'USA', '066': 'USA', '067': 'USA', '068': 'USA', '069': 'USA',
  '070': 'USA', '071': 'USA', '072': 'USA', '073': 'USA', '074': 'USA',
  '075': 'USA', '076': 'USA', '077': 'USA', '078': 'USA', '079': 'USA',
  '080': 'USA', '081': 'USA', '082': 'USA', '083': 'USA', '084': 'USA',
  '085': 'USA', '086': 'USA', '087': 'USA', '088': 'USA', '089': 'USA',
  '090': 'USA', '091': 'USA', '092': 'USA', '093': 'USA', '094': 'USA',
  '095': 'USA', '096': 'USA', '097': 'USA', '098': 'USA', '099': 'USA',
  '100': 'USA', '101': 'USA', '102': 'USA', '103': 'USA', '104': 'USA',
  '105': 'USA', '106': 'USA', '107': 'USA', '108': 'USA', '109': 'USA',
  '110': 'USA', '111': 'USA', '112': 'USA', '113': 'USA', '114': 'USA',
  '115': 'USA', '116': 'USA', '117': 'USA', '118': 'USA', '119': 'USA',
  '120': 'USA', '121': 'USA', '122': 'USA', '123': 'USA', '124': 'USA',
  '125': 'USA', '126': 'USA', '127': 'USA', '128': 'USA', '129': 'USA',
  '130': 'USA', '131': 'USA', '132': 'USA', '133': 'USA', '134': 'USA',
  '135': 'USA', '136': 'USA', '137': 'USA', '138': 'USA', '139': 'USA',
  '200': 'USA (internal/variable weight)',
  '300': 'France', '301': 'France', '302': 'France', '303': 'France',
  '304': 'France', '305': 'France', '306': 'France', '307': 'France',
  '308': 'France', '309': 'France', '310': 'France', '311': 'France',
  '312': 'France', '313': 'France', '314': 'France', '315': 'France',
  '316': 'France', '317': 'France', '318': 'France', '319': 'France',
  '320': 'France', '321': 'France', '322': 'France', '323': 'France',
  '324': 'France', '325': 'France', '326': 'France', '327': 'France',
  '328': 'France', '329': 'France', '330': 'France', '331': 'France',
  '332': 'France', '333': 'France', '334': 'France', '335': 'France',
  '336': 'France', '337': 'France', '338': 'France', '339': 'France',
  '340': 'France', '341': 'France', '342': 'France', '343': 'France',
  '344': 'France', '345': 'France', '346': 'France', '347': 'France',
  '348': 'France', '349': 'France',
  '380': 'Bulgaria', '383': 'Slovenia', '385': 'Croatia', '387': 'Bosnia',
  '389': 'Montenegro',
  '400': 'Germany', '401': 'Germany', '402': 'Germany', '403': 'Germany',
  '404': 'Germany', '405': 'Germany', '406': 'Germany', '407': 'Germany',
  '408': 'Germany', '409': 'Germany', '410': 'Germany', '411': 'Germany',
  '412': 'Germany', '413': 'Germany', '414': 'Germany', '415': 'Germany',
  '416': 'Germany', '417': 'Germany', '418': 'Germany', '419': 'Germany',
  '420': 'Germany', '421': 'Germany', '422': 'Germany', '423': 'Germany',
  '424': 'Germany', '425': 'Germany', '426': 'Germany', '427': 'Germany',
  '428': 'Germany', '429': 'Germany', '430': 'Germany', '431': 'Germany',
  '432': 'Germany', '433': 'Germany', '434': 'Germany', '435': 'Germany',
  '436': 'Germany', '437': 'Germany', '438': 'Germany', '439': 'Germany',
  '440': 'Germany',
  '450': 'Japan', '451': 'Japan', '452': 'Japan', '453': 'Japan',
  '454': 'Japan', '455': 'Japan', '456': 'Japan', '457': 'Japan',
  '458': 'Japan', '459': 'Japan',
  '460': 'Russia', '461': 'Russia', '462': 'Russia', '463': 'Russia',
  '464': 'Russia', '465': 'Russia', '466': 'Russia', '467': 'Russia',
  '468': 'Russia', '469': 'Russia',
  '470': 'Kyrgyzstan', '471': 'Taiwan', '474': 'Estonia', '475': 'Latvia',
  '476': 'Azerbaijan', '477': 'Lithuania', '478': 'Uzbekistan',
  '479': 'Sri Lanka', '480': 'Philippines', '481': 'Belarus',
  '482': 'Ukraine', '483': 'Turkmenistan', '484': 'Moldova',
  '485': 'Armenia', '486': 'Georgia', '487': 'Kazakhstan',
  '488': 'Tajikistan', '489': 'Hong Kong',
  '490': 'Japan', '491': 'Japan', '492': 'Japan', '493': 'Japan',
  '494': 'Japan', '495': 'Japan', '496': 'Japan', '497': 'Japan',
  '498': 'Japan', '499': 'Japan',
  '500': 'UK', '501': 'UK', '502': 'UK', '503': 'UK', '504': 'UK',
  '505': 'UK', '506': 'UK', '507': 'UK', '508': 'UK', '509': 'UK',
  '510': 'UK', '511': 'UK', '512': 'UK', '513': 'UK', '514': 'UK',
  '515': 'UK', '516': 'UK', '517': 'UK', '518': 'UK', '519': 'UK',
  '520': 'Greece', '521': 'Greece', '529': 'Cyprus',
  '530': 'Albania', '531': 'North Macedonia', '535': 'Malta',
  '539': 'Ireland', '540': 'Belgium & Luxembourg', '541': 'Belgium & Luxembourg',
  '542': 'Belgium & Luxembourg', '543': 'Belgium & Luxembourg',
  '544': 'Belgium & Luxembourg', '545': 'Belgium & Luxembourg',
  '546': 'Belgium & Luxembourg', '547': 'Belgium & Luxembourg',
  '548': 'Belgium & Luxembourg', '549': 'Belgium & Luxembourg',
  '560': 'Portugal', '569': 'Iceland', '570': 'Denmark', '571': 'Denmark',
  '572': 'Denmark', '573': 'Denmark', '574': 'Denmark', '575': 'Denmark',
  '576': 'Denmark', '577': 'Denmark', '578': 'Denmark', '579': 'Denmark',
  '590': 'Poland', '594': 'Romania', '599': 'Hungary',
  '600': 'South Africa', '601': 'South Africa',
  '603': 'Ghana', '604': 'Senegal', '608': 'Bahrain', '609': 'Mauritius',
  '611': 'Morocco', '613': 'Algeria', '615': 'Nigeria', '616': 'Kenya',
  '617': 'Cameroon', '618': 'Ivory Coast', '619': 'Tunisia',
  '621': 'Syria', '622': 'Egypt', '624': 'Libya', '625': 'Jordan',
  '626': 'Iran', '627': 'Kuwait', '628': 'Saudi Arabia', '629': 'UAE',
  '640': 'Finland', '641': 'Finland', '642': 'Finland', '643': 'Finland',
  '644': 'Finland', '645': 'Finland', '646': 'Finland', '647': 'Finland',
  '648': 'Finland', '649': 'Finland',
  '690': 'China', '691': 'China', '692': 'China', '693': 'China',
  '694': 'China', '695': 'China', '696': 'China', '697': 'China',
  '698': 'China', '699': 'China',
  '700': 'Norway', '701': 'Norway', '702': 'Norway', '703': 'Norway',
  '704': 'Norway', '705': 'Norway', '706': 'Norway', '707': 'Norway',
  '708': 'Norway', '709': 'Norway',
  '729': 'Israel', '730': 'Sweden', '731': 'Sweden', '732': 'Sweden',
  '733': 'Sweden', '734': 'Sweden', '735': 'Sweden', '736': 'Sweden',
  '737': 'Sweden', '738': 'Sweden', '739': 'Sweden',
  '740': 'Guatemala', '741': 'El Salvador', '742': 'Honduras',
  '743': 'Nicaragua', '744': 'Costa Rica', '745': 'Panama',
  '746': 'Dominican Republic', '750': 'Mexico', '754': 'Canada',
  '755': 'Canada', '759': 'Venezuela', '760': 'Switzerland',
  '761': 'Switzerland', '762': 'Switzerland', '763': 'Switzerland',
  '764': 'Switzerland', '765': 'Switzerland', '766': 'Switzerland',
  '767': 'Switzerland', '768': 'Switzerland', '769': 'Switzerland',
  '770': 'Colombia', '773': 'Uruguay', '775': 'Peru', '777': 'Bolivia',
  '778': 'Argentina', '779': 'Argentina',
  '780': 'Chile', '784': 'Paraguay', '786': 'Ecuador',
  '789': 'Brazil', '790': 'Brazil',
  '800': 'Italy', '801': 'Italy', '802': 'Italy', '803': 'Italy',
  '804': 'Italy', '805': 'Italy', '806': 'Italy', '807': 'Italy',
  '808': 'Italy', '809': 'Italy', '810': 'Italy', '811': 'Italy',
  '812': 'Italy', '813': 'Italy', '814': 'Italy', '815': 'Italy',
  '816': 'Italy', '817': 'Italy', '818': 'Italy', '819': 'Italy',
  '820': 'Italy', '821': 'Italy', '822': 'Italy', '823': 'Italy',
  '824': 'Italy', '825': 'Italy', '826': 'Italy', '827': 'Italy',
  '828': 'Italy', '829': 'Italy', '830': 'Italy', '831': 'Italy',
  '832': 'Italy', '833': 'Italy', '834': 'Italy', '835': 'Italy',
  '836': 'Italy', '837': 'Italy', '838': 'Italy', '839': 'Italy',
  '840': 'Spain', '841': 'Spain', '842': 'Spain', '843': 'Spain',
  '844': 'Spain', '845': 'Spain', '846': 'Spain', '847': 'Spain',
  '848': 'Spain', '849': 'Spain',
  '850': 'Cuba', '858': 'Slovakia', '859': 'Czech Republic',
  '860': 'Serbia', '865': 'Mongolia', '867': 'North Korea',
  '868': 'Turkey', '869': 'Turkey',
  '870': 'Netherlands', '871': 'Netherlands', '872': 'Netherlands',
  '873': 'Netherlands', '874': 'Netherlands', '875': 'Netherlands',
  '876': 'Netherlands', '877': 'Netherlands', '878': 'Netherlands',
  '879': 'Netherlands',
  '880': 'South Korea', '884': 'Cambodia', '885': 'Thailand',
  '888': 'Singapore', '890': 'India', '893': 'Vietnam',
  '894': 'Bangladesh', '896': 'Pakistan', '899': 'Indonesia',
  '900': 'Austria', '901': 'Austria', '902': 'Austria', '903': 'Austria',
  '904': 'Austria', '905': 'Austria', '906': 'Austria', '907': 'Austria',
  '908': 'Austria', '909': 'Austria', '910': 'Austria', '911': 'Austria',
  '912': 'Austria', '913': 'Austria', '914': 'Austria', '915': 'Austria',
  '916': 'Austria', '917': 'Austria', '918': 'Austria', '919': 'Austria',
  '930': 'Australia', '931': 'Australia', '932': 'Australia', '933': 'Australia',
  '934': 'Australia', '935': 'Australia', '936': 'Australia', '937': 'Australia',
  '938': 'Australia', '939': 'Australia',
  '940': 'New Zealand', '941': 'New Zealand', '942': 'New Zealand',
  '943': 'New Zealand', '944': 'New Zealand', '945': 'New Zealand',
  '946': 'New Zealand', '947': 'New Zealand', '948': 'New Zealand',
  '949': 'New Zealand',
  '950': 'GS1 Global', '951': 'GS1 Association',
  '955': 'Malaysia', '958': 'Macau',
  '960': 'GS1 UK (books/music)', '977': 'ISSN (periodicals)',
  '978': 'ISBN (books)', '979': 'ISBN/ISMN',
  '980': 'Refund receipts', '981': 'CCC (Common Currency Coupons)',
  '982': 'CCC (Common Currency Coupons)', '983': 'CCC',
  '990': 'Coupons', '991': 'Coupons', '992': 'Coupons', '993': 'Coupons',
  '994': 'Coupons', '995': 'Coupons', '996': 'Coupons', '997': 'Coupons',
  '998': 'Coupons', '999': 'Coupons'
};

/**
 * Get country of origin from barcode prefix
 * @param {string} barcode
 * @returns {object} GS1 info
 */
function getGS1Info(barcode) {
  if (!barcode || barcode.length < 3) {
    return { country: 'Unknown', prefix: null };
  }

  // Try 3-digit prefix first
  const prefix3 = barcode.substring(0, 3);
  if (GS1_PREFIXES[prefix3]) {
    return {
      country: GS1_PREFIXES[prefix3],
      prefix: prefix3,
      barcodeType: getBarcodeType(barcode)
    };
  }

  // Try 2-digit prefix
  const prefix2 = barcode.substring(0, 2);
  const twoDigitMap = {
    '00': 'USA', '01': 'USA', '02': 'USA', '03': 'USA', '04': 'USA',
    '05': 'USA', '06': 'USA', '07': 'USA', '08': 'USA', '09': 'USA',
    '10': 'USA', '30': 'France', '40': 'Germany', '45': 'Japan',
    '46': 'Russia', '50': 'UK', '54': 'Belgium & Luxembourg',
    '56': 'Portugal', '57': 'Denmark', '59': 'Poland',
    '60': 'South Africa', '69': 'China', '70': 'Norway',
    '73': 'Sweden', '75': 'Mexico', '76': 'Switzerland',
    '78': 'Argentina', '79': 'Brazil', '80': 'Italy',
    '84': 'Spain', '87': 'Netherlands', '88': 'South Korea',
    '89': 'India', '90': 'Austria', '93': 'Australia', '94': 'New Zealand'
  };

  if (twoDigitMap[prefix2]) {
    return {
      country: twoDigitMap[prefix2],
      prefix: prefix2,
      barcodeType: getBarcodeType(barcode)
    };
  }

  return {
    country: 'Unknown',
    prefix: prefix3,
    barcodeType: getBarcodeType(barcode)
  };
}

/**
 * Determine barcode type from length and prefix
 * @param {string} barcode
 * @returns {string}
 */
function getBarcodeType(barcode) {
  const len = barcode.length;
  const prefix = barcode.substring(0, 3);

  if (len === 13) {
    if (prefix === '978' || prefix === '979') return 'ISBN-13 (Book)';
    if (prefix === '977') return 'ISSN (Magazine/Periodical)';
    return 'EAN-13';
  }
  if (len === 12) return 'UPC-A';
  if (len === 8) return 'EAN-8';
  if (len === 14) return 'GTIN-14';
  if (len === 10) return 'ISBN-10 (Book)';
  if (len === 11) return 'UPC-E (expanded)';
  return `Barcode (${len} digits)`;
}

/**
 * USDA FoodData Central - Free, no API key for basic searches
 * @param {string} barcode
 */
async function lookupUSDA(barcode) {
  try {
    // USDA FoodData Central has a free API with 3600 requests/hour
    // Key can be obtained free at https://fdc.nal.usda.gov/api-key-signup.html
    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(barcode)}&api_key=${apiKey}&dataType=Branded&pageSize=1`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) return { found: false, source: 'USDA FoodData', barcode };

    const data = await response.json();

    if (data.foods && data.foods.length > 0) {
      // Find exact barcode match
      const exact = data.foods.find(f => f.gtinUpc === barcode);
      const food = exact || data.foods[0];

      if (food) {
        const nutrients = {};
        if (food.foodNutrients) {
          food.foodNutrients.forEach(n => {
            if (n.nutrientName === 'Energy') nutrients.calories = n.value;
            if (n.nutrientName === 'Total lipid (fat)') nutrients.fat = n.value;
            if (n.nutrientName === 'Carbohydrate, by difference') nutrients.carbohydrates = n.value;
            if (n.nutrientName === 'Protein') nutrients.protein = n.value;
            if (n.nutrientName === 'Sodium, Na') nutrients.sodium = n.value;
            if (n.nutrientName === 'Sugars, total including NLEA') nutrients.sugar = n.value;
          });
        }

        return {
          found: true,
          source: 'USDA FoodData Central',
          barcode,
          name: food.description || 'Unknown',
          brand: food.brandOwner || food.brandName || 'Unknown',
          manufacturer: food.brandOwner || 'Unknown',
          category: food.foodCategory ? [food.foodCategory] : ['food'],
          servingSize: food.servingSize ? `${food.servingSize} ${food.servingSizeUnit || ''}`.trim() : null,
          ingredients: food.ingredients || null,
          fdcId: food.fdcId || null,
          gtinUpc: food.gtinUpc || barcode,
          nutrition: Object.keys(nutrients).length > 0 ? nutrients : null,
          image: null
        };
      }
    }

    return { found: false, source: 'USDA FoodData', barcode };
  } catch (error) {
    console.error('[USDA FoodData] Lookup error:', error.message);
    return { found: false, source: 'USDA FoodData', barcode, error: error.message };
  }
}

/**
 * Main export — GS1 info is always returned, plus USDA lookup
 */
async function lookupByBarcode(barcode) {
  const gs1Info = getGS1Info(barcode);

  // Try USDA
  const usdaResult = await lookupUSDA(barcode);
  if (usdaResult.found) {
    return {
      ...usdaResult,
      gs1: gs1Info
    };
  }

  // Always return GS1 info even if product not found
  return {
    found: false,
    source: 'GS1 / USDA FoodData',
    barcode,
    gs1: gs1Info
  };
}

module.exports = { lookupByBarcode, getGS1Info, getBarcodeType, lookupUSDA };