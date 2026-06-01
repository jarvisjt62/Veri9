/**
 * Server-side helper to load the platform_config (admin toggle state).
 *
 * This is read by /api/verify before invoking the engine, so disabled
 * sources are actually skipped (no network call). Cached for 30 seconds
 * to avoid hitting Supabase on every scan.
 */

import { createClient } from '@supabase/supabase-js'

interface DatabaseToggle {
  /** New schema: stable id matching sourceRegistry */
  id?: string
  /** Legacy schema: human-readable name */
  name?: string
  enabled?: boolean
  description?: string
}

interface PlatformConfig {
  databases?: DatabaseToggle[]
  // (other fields exist but engine doesn't use them)
  [key: string]: unknown
}

export interface EngineConfig {
  /** Map of source-id → enabled. Engine consults this. */
  databases: Record<string, boolean>
  /** Optional explicit kill switch. */
  disabledSources?: string[]
  /** Source timestamp. */
  loadedAt: number
}

// Map legacy admin "name" strings to new registry ids so old saved configs
// (from before Round 29b) keep working.
const NAME_TO_ID: Record<string, string> = {
  'Open Food Facts':                 'openFoodFacts',
  'OpenFDA Drug Database':           'openFDA',
  'GS1 GEPIR / Country Prefix':      'gs1CompanyDb',
  'UPCitemdb':                       'upcItemDb',
  'Open Beauty Facts':               'openBeautyFacts',
  'USDA FoodData Central':           'usdaFoodData',
  'NHTSA Vehicle Database':          'nhtsa',
  'WHO Essential Medicines':         'whoMedicines',
  'Open Library / ISBN':             'openLibrary',
  'Datakick':                        'datakick',
  'Barcode Lookup':                  'barcodeLookup',
  'EAN Search':                      'eanSearch',
  'Regulatory Agencies':             'regulatoryAgencies',
  'Go-UPC Global DB':                'goUpc',
  'Open Prices DB':                  'openPrices',
  'Open Product Folksonomy':         'openProductData',
  'NIH RxNav Drug DB':               'nihRxNav',
  'CPSC Recalls (US)':               'cpscRecalls',
}

let _cache: { value: EngineConfig | null; expiresAt: number } = {
  value: null,
  expiresAt: 0,
}

const TTL_MS = 30 * 1000 // 30s — short enough that toggle changes propagate fast

export async function loadEngineConfig(): Promise<EngineConfig | null> {
  const now = Date.now()
  if (_cache.value && now < _cache.expiresAt) return _cache.value

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL

    if (!supabaseUrl || !serviceRoleKey || !adminEmail) return null

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('user_profiles')
      .select('metadata')
      .eq('email', adminEmail)
      .single()

    if (error || !data) return null

    const meta = data.metadata as { platform_config?: PlatformConfig } | null
    const platform = meta?.platform_config || {}
    const dbs = Array.isArray(platform.databases) ? platform.databases : []

    const databases: Record<string, boolean> = {}
    for (const entry of dbs) {
      if (!entry || typeof entry !== 'object') continue
      const id = entry.id || (entry.name ? NAME_TO_ID[entry.name] : undefined)
      if (!id) continue
      databases[id] = entry.enabled !== false
    }

    const cfg: EngineConfig = {
      databases,
      loadedAt: now,
    }
    _cache = { value: cfg, expiresAt: now + TTL_MS }
    return cfg
  } catch (e) {
    console.warn('[engineConfig] load failed:', (e as Error).message)
    return null
  }
}

/** Force-clear the in-memory cache (called when admin saves new config). */
export function clearEngineConfigCache(): void {
  _cache = { value: null, expiresAt: 0 }
}
