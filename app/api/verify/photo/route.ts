/**
 * /api/verify/photo
 * AI Photo Authentication via Google Cloud Vision
 *
 * POST { imageBase64: string, mimeType?: string }
 *
 * Returns a ScanResult-compatible object that ProductResultCard can render.
 */
import { NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ocrImage } = require('@/lib/api/googleVisionOcr')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Known counterfeit red-flags in label text
const COUNTERFEIT_FLAGS = [
  'replica', 'inspired by', 'imitation', 'quality replica', 'aaa quality', '1:1 copy',
]

// Quality markers for authentic goods
const AUTHENTIC_MARKERS = [
  'made in france', 'made in italy', 'made in usa', 'made in germany', 'made in japan',
  'genuine leather', 'full grain leather', 'made in switzerland', 'swiss made',
  'serial no', 'serial number', 'lot no', 'lot number', 'reg. no',
]

export async function POST(request: Request) {
  let body: { imageBase64?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body — expected JSON' }, { status: 400 })
  }

  const { imageBase64 } = body
  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
  }

  // Size guard — base64 of 5MB image ≈ 6.67MB
  if (imageBase64.length > 7_000_000) {
    return NextResponse.json({ error: 'Image too large. Please use an image under 5MB.' }, { status: 413 })
  }

  // ── Call Google Vision ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let visionResult: any
  try {
    visionResult = await ocrImage({ imageBase64 })
  } catch (err) {
    return NextResponse.json({ error: `Vision API error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }

  // API key not configured
  if (visionResult.skipped === 'no_api_key') {
    return NextResponse.json({
      barcode: 'PHOTO_AUTH',
      productName: 'Photo AI Not Configured',
      brand: 'Photo Authentication',
      manufacturer: 'Veri9',
      category: 'Photo Authentication',
      trustScore: 0,
      status: 'INSUFFICIENT_DATA',
      sources: [{ name: 'Google Cloud Vision', found: false, info: 'API key not configured' }],
      recall: false,
      timestamp: Date.now(),
      description:
        'Photo AI is not yet configured on this server.\n\n' +
        '• The administrator needs to add GOOGLE_VISION_API_KEY to the environment, OR\n' +
        '• Connect Google Cloud Vision in Admin → Integrations.\n\n' +
        'In the meantime, please use the Barcode or Serial # tabs for verification — they work fully.',
      verificationTime: '< 1s',
      crossRefPassed: 0,
      crossRefTotal: 1,
      details: { authMethod: 'PHOTO_AI', configIssue: true },
    })
  }

  // API error (HTTP 4xx/5xx, permission denied, quota exceeded, network error)
  if (visionResult.apiError) {
    const errMsg = visionResult.error || 'Unknown Vision API error'
    const isQuota = /quota|limit|exceeded/i.test(errMsg)
    const isAuth  = /permission|unauthorized|invalid|key|403|401/i.test(errMsg)
    let hint = 'Please try again in a moment, or use the Barcode / Serial # tabs for verification.'
    if (isQuota) hint = 'The Photo AI service has reached its usage quota. Please try again later, or use Barcode / Serial # verification.'
    else if (isAuth) hint = 'Photo AI credentials need to be refreshed by the administrator. Please use Barcode / Serial # verification for now.'
    return NextResponse.json({
      barcode: 'PHOTO_AUTH',
      productName: 'Photo AI Service Unavailable',
      brand: 'Photo Authentication',
      manufacturer: 'Veri9',
      category: 'Photo Authentication',
      trustScore: 0,
      status: 'INSUFFICIENT_DATA',
      sources: [{ name: 'Google Cloud Vision', found: false, info: `Service error: ${errMsg.slice(0, 100)}` }],
      recall: false,
      timestamp: Date.now(),
      description: `The Photo AI service is temporarily unavailable.\n\n${hint}\n\nTechnical detail: ${errMsg}`,
      verificationTime: '< 2s',
      crossRefPassed: 0,
      crossRefTotal: 1,
      details: { authMethod: 'PHOTO_AI', apiError: true, errorMessage: errMsg },
    })
  }

  // No text/logos found — API worked fine, photo just didn't show readable text
  if (!visionResult.found) {
    return NextResponse.json({
      barcode: 'PHOTO_AUTH',
      productName: 'Photo Unclear — Retake Recommended',
      brand: 'Photo Authentication',
      manufacturer: 'Veri9',
      category: 'Photo Authentication',
      trustScore: 15,
      status: 'INSUFFICIENT_DATA',
      sources: [{ name: 'Google Cloud Vision', found: false, info: 'No readable text or logos' }],
      recall: false,
      timestamp: Date.now(),
      description:
        'The Photo AI could not find any readable text or logos in the image.\n\n' +
        '📸 To get a better result, please retake the photo with these tips:\n' +
        '• Ensure the product label is clearly visible and fills most of the frame\n' +
        '• Use good, even lighting (avoid glare & shadows)\n' +
        '• Hold the camera steady and focus on the label\n' +
        '• If the product has a barcode, use the Barcode tab for faster & more accurate verification\n' +
        '• If the product has a serial number, use the Serial # tab',
      verificationTime: '< 2s',
      crossRefPassed: 0,
      crossRefTotal: 1,
      details: { authMethod: 'PHOTO_AI', noTextFound: true },
    })
  }

  const {
    fullText = '',
    lines = [],
    brandCandidates = [],
    productNameCandidates = [],
    digits = [],
    logosDetected = [],
  } = visionResult

  const fullTextLower = (fullText as string).toLowerCase()
  const checks: { name: string; result: string; pass: boolean | null }[] = []
  const notes: string[] = []
  let confidence = 40
  let resolvedBrand = (logosDetected as { description: string }[])[0]?.description
    || (brandCandidates as string[])[0]
    || 'Unknown'
  const resolvedName = (productNameCandidates as string[])[0] || 'Product (Photo Auth)'

  // ── Check 1: Logo detection ──────────────────────────────────────────────
  const logos = logosDetected as { description: string; score: number }[]
  if (logos.length > 0) {
    const top = logos[0]
    checks.push({ name: 'Logo Detection', result: `Detected: ${top.description} (${(top.score * 100).toFixed(0)}% confidence)`, pass: true })
    resolvedBrand = top.description
    confidence = Math.min(confidence + 30, 92)
    notes.push(`Google Vision detected the ${top.description} logo with ${(top.score * 100).toFixed(0)}% confidence.`)
  } else if ((brandCandidates as string[]).length > 0) {
    checks.push({ name: 'Brand Text', result: `Possible brand(s): ${(brandCandidates as string[]).slice(0, 3).join(', ')}`, pass: true })
    confidence = Math.min(confidence + 15, 80)
  } else {
    checks.push({ name: 'Brand Detection', result: 'No brand or logo detected', pass: false })
    confidence = Math.max(confidence - 10, 10)
    notes.push('Could not identify a brand. Ensure the brand name/logo is visible.')
  }

  // ── Check 2: Counterfeit red-flag language ─────────────────────────────
  const foundFlags = COUNTERFEIT_FLAGS.filter(f => fullTextLower.includes(f))
  if (foundFlags.length > 0) {
    checks.push({ name: 'Counterfeit Language', result: `⚠️ Suspicious text: "${foundFlags.join('", "')}"`, pass: false })
    notes.push(`ALERT: Label contains counterfeit indicators: ${foundFlags.join(', ')}`)
    confidence = Math.max(confidence - 40, 5)
  } else {
    checks.push({ name: 'Counterfeit Language', result: 'No counterfeit language detected', pass: true })
  }

  // ── Check 3: Authentic quality markers ────────────────────────────────
  const foundMarkers = AUTHENTIC_MARKERS.filter(m => fullTextLower.includes(m))
  if (foundMarkers.length > 0) {
    checks.push({ name: 'Authenticity Markers', result: `Found: ${foundMarkers.slice(0, 3).join(', ')}`, pass: true })
    confidence = Math.min(confidence + 15, 92)
    notes.push(`Authentic quality markers found: ${foundMarkers.join(', ')}.`)
  } else {
    checks.push({ name: 'Authenticity Markers', result: 'No standard authenticity markers found', pass: null })
  }

  // ── Check 4: Serial / lot number digits ───────────────────────────────
  const digs = digits as string[]
  if (digs.length > 0) {
    checks.push({ name: 'Serial/Code Digits', result: `Found ${digs.length} numeric code(s): ${digs.slice(0, 3).join(', ')}`, pass: true })
    notes.push(`Serial/lot codes found: ${digs.join(', ')}. Use Serial # Lookup tab to verify further.`)
    confidence = Math.min(confidence + 8, 92)
  } else {
    checks.push({ name: 'Serial/Code Digits', result: 'No serial or lot numbers detected', pass: null })
  }

  // ── Check 5: Text quantity ────────────────────────────────────────────
  const wordCount = (fullText as string).split(/\s+/).filter(Boolean).length
  if (wordCount < 3) {
    checks.push({ name: 'Label Content', result: `Very little text (${wordCount} words) — image may be unclear`, pass: false })
    confidence = Math.max(confidence - 10, 5)
    notes.push('Very little text detected. Try photographing the label directly in good light.')
  } else {
    checks.push({ name: 'Label Content', result: `${wordCount} words extracted from photo`, pass: true })
  }

  // ── Final verdict ──────────────────────────────────────────────────────
  let statusKey: string
  if (confidence >= 75)      statusKey = 'VERIFIED'
  else if (confidence >= 55) statusKey = 'LIKELY_AUTHENTIC'
  else if (confidence >= 35) statusKey = 'INSUFFICIENT_DATA'
  else if (confidence >= 20) statusKey = 'SUSPICIOUS'
  else                       statusKey = 'COUNTERFEIT'

  const summary = confidence >= 75
    ? `Photo analysis confirms authentic ${resolvedBrand} product characteristics.`
    : confidence >= 55
      ? `Photo analysis is consistent with an authentic ${resolvedBrand} product. Physical inspection recommended for high-value items.`
      : foundFlags.length > 0
        ? `Counterfeit indicators detected in label text. This product may not be genuine.`
        : `Photo analysis was inconclusive. Use Barcode Scan or Serial # Lookup for more reliable verification.`

  const checksText = checks.map(c => `${c.pass === true ? '✓' : c.pass === false ? '✗' : '?'} ${c.name}: ${c.result}`).join('\n')
  const notesText = notes.length > 0 ? '\n\nNotes:\n' + notes.join('\n') : ''

  // Sources array in ProductResultCard format
  const sourcesArr = [
    { name: 'Google Cloud Vision — Logo Detection', found: logos.length > 0, info: logos[0]?.description },
    { name: 'Google Cloud Vision — Text Detection', found: wordCount > 0, info: `${wordCount} words` },
    { name: 'Counterfeit Language Check', found: foundFlags.length === 0 },
    { name: 'Authenticity Markers Check', found: foundMarkers.length > 0 },
  ]

  return NextResponse.json({
    barcode: digs[0] || 'PHOTO_AUTH',
    productName: resolvedName,
    brand: resolvedBrand,
    manufacturer: resolvedBrand,
    category: 'Photo Authentication',
    trustScore: confidence,
    status: statusKey,
    sources: sourcesArr,
    recall: false,
    timestamp: Date.now(),
    description: summary + '\n\n' + checksText + notesText,
    verificationTime: '< 3s',
    crossRefPassed: checks.filter(c => c.pass === true).length,
    crossRefTotal: checks.length,
    // Raw Vision data for advanced display
    details: {
      authMethod: 'PHOTO_AI',
      linesExtracted: (lines as string[]).length,
      brandCandidates: (brandCandidates as string[]).slice(0, 5),
      productNameCandidates: (productNameCandidates as string[]).slice(0, 5),
      digitsFound: digs,
      logosDetected: logos.slice(0, 5),
      checks,
      notes,
    },
  })
}
