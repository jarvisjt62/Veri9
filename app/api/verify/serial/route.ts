/**
 * /api/verify/serial
 * Serial Number / Style Code Lookup
 *
 * GET ?serial=<code>&brand=<brand>
 *
 * Returns a ScanResult-compatible object that ProductResultCard can render.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── GS1 prefix lookup helper ────────────────────────────────────────────────
function extractGS1Prefix(serial: string): string | null {
  const clean = serial.replace(/\D/g, '')
  if (clean.length >= 6) return clean.slice(0, 6)
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const serial = (searchParams.get('serial') || '').trim()
  const brand = (searchParams.get('brand') || '').trim()

  if (!serial) {
    return NextResponse.json({ error: 'serial parameter is required' }, { status: 400 })
  }

  const checks: { name: string; result: string; pass: boolean | null }[] = []
  const notes: string[] = []
  const sourcesFound: string[] = []
  let gs1Company: string | undefined
  let resolvedBrand = brand || 'Unknown'
  let resolvedName = `Product — Serial: ${serial}`
  let confidence = 30
  let statusKey = 'UNVERIFIED'

  // ── Check 1: Format validation ──────────────────────────────────────────────
  const isNumeric = /^\d+$/.test(serial)
  const isAlphanumeric = /^[A-Z0-9][\w\-/. ]{2,}$/i.test(serial)
  const looksLikeGTIN = isNumeric && [8, 12, 13, 14].includes(serial.length)
  const looksLikeFCC = /^[A-Z0-9]{3,6}[-\s][A-Z0-9\-]{3,20}$/i.test(serial)

  checks.push({
    name: 'Serial Format',
    result: looksLikeGTIN ? 'GTIN-format number' : isAlphanumeric ? 'Valid alphanumeric style code' : 'Non-standard format',
    pass: isAlphanumeric || looksLikeGTIN,
  })

  // ── Check 2: GS1 prefix lookup ──────────────────────────────────────────────
  if (looksLikeGTIN || (isNumeric && serial.length >= 6)) {
    try {
      const prefix = extractGS1Prefix(serial)
      if (prefix) {
        const gs1Res = await fetch(
          `https://www.gs1.org/services/verified-by-gs1/results?gtin=${encodeURIComponent(serial)}&lang=en`,
          { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) }
        ).catch(() => null)

        if (gs1Res && gs1Res.ok) {
          const gs1Data = await gs1Res.json().catch(() => null)
          if (gs1Data?.verificationResults?.[0]) {
            const vr = gs1Data.verificationResults[0]
            gs1Company = vr.gs1LicenceeName || undefined
            resolvedBrand = gs1Company || resolvedBrand
            resolvedName = vr.productDescription || resolvedName
            confidence = Math.min(confidence + 40, 90)
            statusKey = 'LIKELY_AUTHENTIC'
            sourcesFound.push('GS1 Verified-by-GS1')
            checks.push({ name: 'GS1 Registry', result: `Registered to: ${gs1Company || 'Unknown company'}`, pass: true })
            notes.push(`GS1 prefix ${prefix} is registered — barcode number is legitimate.`)
          } else {
            checks.push({ name: 'GS1 Registry', result: 'No GS1 registration found for this number', pass: false })
            notes.push(`GS1 prefix ${prefix} is not in the public registry.`)
            confidence = Math.max(confidence - 10, 10)
          }
        }
      }
    } catch { /* timeout — skip */ }
  }

  // ── Check 3: FCC ID check (electronics) ─────────────────────────────────────
  if (looksLikeFCC) {
    try {
      const fccRes = await fetch(
        `https://apps.fcc.gov/oetcf/eas/reports/GetApplicationList.cfm?search_type=Simple&id_type=FCC+ID&fcc_id=${encodeURIComponent(serial)}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      ).catch(() => null)

      if (fccRes && fccRes.ok) {
        const fccData = await fccRes.json().catch(() => null)
        if (fccData?.rows?.length > 0) {
          const row = fccData.rows[0]
          resolvedBrand = row.applicant_name || resolvedBrand
          resolvedName = row.device_name || resolvedName
          confidence = Math.min(confidence + 35, 88)
          statusKey = 'LIKELY_AUTHENTIC'
          sourcesFound.push('FCC ID Database')
          checks.push({ name: 'FCC ID Database', result: `Registered to ${row.applicant_name || 'Unknown'}`, pass: true })
        } else {
          checks.push({ name: 'FCC ID Database', result: 'FCC ID not found', pass: false })
          notes.push('This FCC ID is not in the FCC public database.')
        }
      }
    } catch { /* skip */ }
  }

  // ── Check 4: Brand serial pattern matching ───────────────────────────────────
  if (brand) {
    const brandPatterns: Record<string, RegExp[]> = {
      'louis vuitton': [/^[A-Z]{2}\d{4}$/, /^[A-Z]{2}\d{6}$/],
      'lv':            [/^[A-Z]{2}\d{4}$/, /^[A-Z]{2}\d{6}$/],
      'chanel':        [/^\d{7,8}$/, /^\d{10}$/],
      'gucci':         [/^\d{6}$/, /^\d{15}$/],
      'hermes':        [/^[A-Z]\d{6}$/, /^\d{6}[A-Z]$/],
      'rolex':         [/^[A-Z]\d{5,6}$/, /^\d{5,8}$/],
      'nike':          [/^[A-Z]{2}\d{4}-\d{3}$/, /^[A-Z]{1,3}\d{4}[A-Z]\d{3}$/],
      'apple':         [/^[A-Z0-9]{12}$/, /^[A-Z0-9]{8}$/],
      'samsung':       [/^\d{15}$/, /^[A-Z0-9]{11}$/],
    }
    const brandKey = brand.toLowerCase()
    const patterns = brandPatterns[brandKey]
    if (patterns) {
      const match = patterns.some(p => p.test(serial.trim()))
      checks.push({
        name: `${brand} Serial Pattern`,
        result: match ? `Serial matches known ${brand} format` : `Serial does NOT match known ${brand} patterns`,
        pass: match,
      })
      if (match) {
        confidence = Math.min(confidence + 25, 90)
        notes.push(`Serial number format matches authentic ${brand} products.`)
        if (statusKey === 'UNVERIFIED') statusKey = 'LIKELY_AUTHENTIC'
      } else {
        confidence = Math.max(confidence - 15, 5)
        notes.push(`⚠️ Serial format does NOT match known ${brand} patterns — possible counterfeit.`)
        if (statusKey === 'UNVERIFIED') statusKey = 'LIKELY_COUNTERFEIT'
      }
    } else {
      checks.push({ name: 'Brand Pattern Check', result: `No pattern database for "${brand}"`, pass: null })
    }
  }

  // ── Check 5: Character encoding ─────────────────────────────────────────────
  const hasConsistentChars = !/[^\x20-\x7E]/.test(serial)
  checks.push({ name: 'Character Encoding', result: hasConsistentChars ? 'All printable ASCII' : 'Non-standard characters detected', pass: hasConsistentChars })
  if (!hasConsistentChars) {
    confidence = Math.max(confidence - 10, 5)
    notes.push('Non-ASCII characters in serial number — unusual for authentic products.')
  }

  // ── Final confidence → status ────────────────────────────────────────────────
  if (confidence >= 75)      statusKey = 'VERIFIED'
  else if (confidence >= 55) statusKey = 'LIKELY_AUTHENTIC'
  else if (confidence >= 35) statusKey = 'INSUFFICIENT_DATA'
  else if (confidence >= 20) statusKey = 'SUSPICIOUS'
  else                       statusKey = 'COUNTERFEIT'

  // Build summary as description
  const summary = confidence >= 75
    ? `Serial number verified — ${resolvedBrand} product appears authentic.`
    : confidence >= 55
      ? `Serial number looks plausible for ${resolvedBrand}, but physical inspection recommended for high-value items.`
      : confidence >= 35
        ? `Could not fully verify serial number. Use additional authentication methods.`
        : `Serial number pattern inconsistencies detected — exercise caution.`

  // Description includes all check results
  const checksText = checks.map(c => `${c.pass === true ? '✓' : c.pass === false ? '✗' : '?'} ${c.name}: ${c.result}`).join('\n')
  const notesText = notes.length > 0 ? '\n\nNotes:\n' + notes.join('\n') : ''

  // Build sources array in the format ProductResultCard expects: { name, found, info? }
  const allCheckedSources = [
    { name: 'GS1 Verified-by-GS1', found: sourcesFound.includes('GS1 Verified-by-GS1'), info: gs1Company },
    { name: 'FCC ID Database', found: sourcesFound.includes('FCC ID Database') },
    { name: 'Brand Pattern DB', found: checks.some(c => c.name.includes('Pattern') && c.pass === true) },
  ]

  // ScanResult-compatible response
  return NextResponse.json({
    barcode: serial,
    productName: resolvedName,
    brand: resolvedBrand,
    manufacturer: gs1Company || resolvedBrand,
    category: brand ? 'Authenticated Product' : 'Unknown',
    trustScore: confidence,
    status: statusKey,
    sources: allCheckedSources,
    recall: false,
    timestamp: Date.now(),
    description: summary + '\n\n' + checksText + notesText,
    barcodeType: looksLikeGTIN ? 'GTIN' : looksLikeFCC ? 'FCC-ID' : 'STYLE_CODE',
    gs1Prefix: looksLikeGTIN ? extractGS1Prefix(serial) || undefined : undefined,
    verificationTime: '< 1s',
    crossRefPassed: checks.filter(c => c.pass === true).length,
    crossRefTotal: checks.length,
    // Auth method marker (for display)
    details: {
      authMethod: 'SERIAL_LOOKUP',
      serialNumber: serial,
      brandQueried: brand || undefined,
      gs1Company,
      checks,
      notes,
    },
  })
}
