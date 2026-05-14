/**
 * Google Cloud Vision OCR fallback
 *
 * When the barcode is unreadable OR no database has a match, the user can
 * upload (or the scanner can capture) a photo of the product. We ship the
 * image to Vision for TEXT_DETECTION and return the extracted brand /
 * product-name candidates so the verification engine can cross-reference
 * against what the barcode claims.
 *
 * Required env:
 *   GOOGLE_VISION_API_KEY  — a Google Cloud API key with Vision API enabled
 *
 * If the key is missing we return a graceful "skipped" result so the rest
 * of the pipeline is unaffected.
 *
 * Inputs accepted:
 *   - imageBase64: a raw base64 string (no data: prefix)
 *   - imageUrl:    a publicly-fetchable https URL
 *
 * Output:
 *   {
 *     found: boolean,
 *     source: 'GoogleVision',
 *     fullText: string,
 *     lines: string[],
 *     brandCandidates: string[],     // all-caps lines heuristically = brand
 *     productNameCandidates: string[], // title-case multi-word lines
 *     digits: string[],              // any digit runs 8+ long (likely codes)
 *     error?: string
 *   }
 */

async function ocrImage({ imageBase64, imageUrl }) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return { found: false, source: 'GoogleVision', skipped: 'no_api_key' };
  }
  if (!imageBase64 && !imageUrl) {
    return { found: false, source: 'GoogleVision', error: 'no_image_provided' };
  }

  const image = imageBase64
    ? { content: imageBase64 }
    : { source: { imageUri: imageUrl } };

  const body = {
    requests: [{
      image,
      features: [
        { type: 'TEXT_DETECTION', maxResults: 50 },
        { type: 'LOGO_DETECTION', maxResults: 5 },
      ],
    }],
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timer));

    if (!res.ok) {
      let errBody = '';
      try { errBody = await res.text(); } catch {}
      return {
        found: false,
        source: 'GoogleVision',
        apiError: true,
        httpStatus: res.status,
        error: `HTTP ${res.status}: ${errBody.slice(0, 200)}`,
      };
    }
    const data = await res.json();
    const response0 = (data && data.responses && data.responses[0]) || {};

    // Vision API returns structured error inside response when quota/permission issue
    if (response0.error) {
      return {
        found: false,
        source: 'GoogleVision',
        apiError: true,
        error: response0.error.message || 'Vision API returned an error',
        errorCode: response0.error.code,
      };
    }

    const annotations = response0.textAnnotations || [];
    const logos = response0.logoAnnotations || [];

    if (!annotations.length && !logos.length) {
      return {
        found: false,
        source: 'GoogleVision',
        noTextFound: true,    // explicit: API worked, just nothing in the photo
        fullText: '',
        lines: [],
      };
    }

    // First annotation = full block text; rest = individual words/lines.
    const fullText = (annotations[0] && annotations[0].description) || '';
    const rawLines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

    // Heuristic candidates
    const brandCandidates = [];
    const productNameCandidates = [];
    const digits = [];

    for (const line of rawLines) {
      // All-caps words of 2+ chars, 1-4 words total, no digits -> brand-ish
      if (/^[A-Z][A-Z0-9 &'.\-]{1,30}$/.test(line) && !/\d{4,}/.test(line) && line.split(/\s+/).length <= 4) {
        brandCandidates.push(line);
      }
      // Title case 2+ words, no long digit runs -> product-name-ish
      if (/^([A-Z][a-z]+ ){1,6}[A-Z][a-z]+$/.test(line)) {
        productNameCandidates.push(line);
      }
      // Long digit runs could be barcodes / lot numbers
      const digitMatch = line.match(/\d{8,14}/g);
      if (digitMatch) digits.push(...digitMatch);
    }

    // Logo detections are high-confidence brand signals
    for (const logo of logos) {
      if (logo.description) brandCandidates.unshift(logo.description);
    }

    return {
      found: true,
      source: 'GoogleVision',
      fullText,
      lines: rawLines,
      brandCandidates: [...new Set(brandCandidates)].slice(0, 8),
      productNameCandidates: [...new Set(productNameCandidates)].slice(0, 8),
      digits: [...new Set(digits)].slice(0, 5),
      logosDetected: logos.map(l => ({ description: l.description, score: l.score })),
    };
  } catch (err) {
    const msg = err && (err.message || String(err));
    console.error('[GOOGLE VISION]', msg);
    return { found: false, source: 'GoogleVision', apiError: true, error: msg };
  }
}

module.exports = { ocrImage };
