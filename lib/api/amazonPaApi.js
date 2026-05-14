/**
 * Amazon Product Advertising API v5 integration
 *
 * Requires an Amazon Associates account (free) + PA-API credentials:
 *   AMAZON_PAAPI_ACCESS_KEY    (AWS-style access key id)
 *   AMAZON_PAAPI_SECRET_KEY    (AWS-style secret key)
 *   AMAZON_PAAPI_PARTNER_TAG   (your Amazon Associates partner tag)
 *   AMAZON_PAAPI_HOST          (optional, defaults to webservices.amazon.com)
 *   AMAZON_PAAPI_REGION        (optional, defaults to us-east-1)
 *
 * We call SearchItems with Keywords=<barcode>. PA-API v5 doesn't take
 * EAN/UPC as a first-class identifier, but Amazon's search indexes them
 * so a barcode keyword search reliably returns the matching ASIN.
 *
 * Signed with AWS Signature Version 4 using Node's built-in crypto —
 * NO extra npm dependency required (Vercel-friendly).
 *
 * If any env var is missing, we skip gracefully so verification still works.
 */

const crypto = require('crypto');

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

async function lookupAmazon(barcode) {
  const accessKey  = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey  = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;
  const host       = process.env.AMAZON_PAAPI_HOST   || 'webservices.amazon.com';
  const region     = process.env.AMAZON_PAAPI_REGION || 'us-east-1';

  if (!accessKey || !secretKey || !partnerTag) {
    return { found: false, source: 'Amazon', barcode, skipped: 'no_credentials' };
  }

  const path = '/paapi5/searchitems';
  const target = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';
  const service = 'ProductAdvertisingAPI';

  const payload = JSON.stringify({
    Keywords: String(barcode),
    SearchIndex: 'All',
    ItemCount: 3,
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com',
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'ItemInfo.Classifications',
      'ItemInfo.ContentInfo',
      'ItemInfo.ExternalIds',
      'ItemInfo.ManufactureInfo',
      'ItemInfo.ProductInfo',
      'ItemInfo.Features',
      'Images.Primary.Medium',
      'Offers.Listings.Price',
    ],
  });

  // ---- AWS Signature V4 --------------------------------------------------
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders = 'content-encoding;host;x-amz-date;x-amz-target';

  const payloadHash = sha256Hex(payload);
  const canonicalRequest =
    `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const kDate    = hmac('AWS4' + secretKey, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign).toString('hex');

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // ---- Request ----------------------------------------------------------
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        'content-encoding': 'amz-1.0',
        'content-type': 'application/json; charset=utf-8',
        'host': host,
        'x-amz-date': amzDate,
        'x-amz-target': target,
        'Authorization': authHeader,
      },
      body: payload,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      // PA-API returns 429 for throttling, 401/403 for bad creds
      return { found: false, source: 'Amazon', barcode, httpStatus: res.status };
    }
    const data = await res.json();
    const items = (data && data.SearchResult && data.SearchResult.Items) || [];

    // Prefer the item whose ExternalIds contain the exact barcode we searched
    const digits = String(barcode).replace(/\D/g, '');
    const exact = items.find(i => {
      const ext = i.ItemInfo && i.ItemInfo.ExternalIds;
      const flat = [];
      if (ext && ext.EANs && ext.EANs.DisplayValues) flat.push(...ext.EANs.DisplayValues);
      if (ext && ext.UPCs && ext.UPCs.DisplayValues) flat.push(...ext.UPCs.DisplayValues);
      return flat.some(v => String(v).replace(/\D/g, '') === digits);
    });
    const item = exact || items[0];
    if (!item) {
      return { found: false, source: 'Amazon', barcode };
    }

    const title = item.ItemInfo && item.ItemInfo.Title && item.ItemInfo.Title.DisplayValue;
    const brandObj = item.ItemInfo && item.ItemInfo.ByLineInfo && item.ItemInfo.ByLineInfo.Brand;
    const manufObj = item.ItemInfo && item.ItemInfo.ByLineInfo && item.ItemInfo.ByLineInfo.Manufacturer;
    const classObj = item.ItemInfo && item.ItemInfo.Classifications;
    const image = item.Images && item.Images.Primary && item.Images.Primary.Medium && item.Images.Primary.Medium.URL;
    const features = (item.ItemInfo && item.ItemInfo.Features && item.ItemInfo.Features.DisplayValues) || [];
    const price = item.Offers && item.Offers.Listings && item.Offers.Listings[0] && item.Offers.Listings[0].Price && item.Offers.Listings[0].Price.DisplayAmount;

    return {
      found: true,
      source: 'Amazon',
      barcode,
      asin: item.ASIN,
      name: title || 'Unknown',
      brand: (brandObj && brandObj.DisplayValue) || 'Unknown',
      manufacturer: (manufObj && manufObj.DisplayValue) || 'Unknown',
      category: (classObj && classObj.ProductGroup && classObj.ProductGroup.DisplayValue) || null,
      binding: (classObj && classObj.Binding && classObj.Binding.DisplayValue) || null,
      image,
      features: features.slice(0, 5),
      price,
      detailPageURL: item.DetailPageURL,
      isExactMatch: Boolean(exact),
    };
  } catch (err) {
    const msg = err && (err.message || String(err));
    console.error('[AMAZON PA-API]', msg);
    return { found: false, source: 'Amazon', barcode, error: msg };
  }
}

module.exports = { lookupAmazon };
