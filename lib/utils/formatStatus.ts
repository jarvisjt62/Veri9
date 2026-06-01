/**
 * Centralized status formatter for Veri9 verdicts.
 *
 * The engine emits machine-style enums (VERIFIED, LIKELY_AUTHENTIC, NOT_FOUND, …).
 * The UI must always display human-friendly labels.
 *
 * Use:
 *   import { formatStatus, getStatusMeta } from '@/lib/utils/formatStatus'
 *   formatStatus('LIKELY_AUTHENTIC')           // → "Likely Authentic"
 *   getStatusMeta('NOT_FOUND').label           // → "Not Found"
 *   getStatusMeta('NOT_FOUND').color           // → "#475569"
 */

export type EngineStatus =
  | 'VERIFIED'
  | 'LIKELY_AUTHENTIC'
  | 'INSUFFICIENT_DATA'
  | 'NOT_FOUND'
  | 'SUSPICIOUS'
  | 'COUNTERFEIT'
  | 'RECALLED'
  | 'UNREADABLE'
  // Legacy lowercase variants (kept for backward compatibility)
  | 'authentic'
  | 'suspicious'
  | 'counterfeit'
  | 'recalled'
  | 'unreadable'
  | 'not_found'

export interface StatusMeta {
  /** Human-friendly label shown in the UI (no underscores, title case). */
  label: string
  /** Single-emoji icon for badges. */
  icon: string
  /** Foreground / text color. */
  color: string
  /** Badge background color. */
  bg: string
  /** Border color (for cards / outlined badges). */
  border: string
  /** Short user-facing description (one sentence). */
  description: string
  /** Tone bucket — useful for analytics, charts, filters. */
  tone: 'positive' | 'caution' | 'negative' | 'neutral'
}

const META: Record<string, StatusMeta> = {
  VERIFIED: {
    label: 'Authentic',
    icon: '✅',
    color: '#15803d',
    bg: '#dcfce7',
    border: '#86efac',
    description: 'Confirmed in multiple authoritative databases.',
    tone: 'positive',
  },
  LIKELY_AUTHENTIC: {
    label: 'Likely Authentic',
    icon: '✅',
    color: '#15803d',
    bg: '#dcfce7',
    border: '#86efac',
    description: 'Found in trusted databases with consistent data.',
    tone: 'positive',
  },
  INSUFFICIENT_DATA: {
    label: 'Limited Information',
    icon: '⚠️',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fcd34d',
    description: 'Some data found, but not enough to confirm authenticity.',
    tone: 'caution',
  },
  NOT_FOUND: {
    label: 'Not Found',
    icon: 'ℹ️',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#cbd5e1',
    description: 'This product is not listed in any of our databases yet.',
    tone: 'neutral',
  },
  SUSPICIOUS: {
    label: 'Suspicious',
    icon: '⚠️',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fcd34d',
    description: 'Conflicting information detected across sources.',
    tone: 'caution',
  },
  COUNTERFEIT: {
    label: 'Counterfeit',
    icon: '🚫',
    color: '#9f1239',
    bg: '#ffe4e6',
    border: '#fda4af',
    description: 'Strong indicators this product is fake or tampered.',
    tone: 'negative',
  },
  RECALLED: {
    label: 'Recalled',
    icon: '⚠️',
    color: '#c2410c',
    bg: '#ffedd5',
    border: '#fdba74',
    description: 'This product has an active safety recall.',
    tone: 'negative',
  },
  UNREADABLE: {
    label: 'Rescan Needed',
    icon: '📷',
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#93c5fd',
    description: 'The barcode could not be read clearly. Please rescan.',
    tone: 'caution',
  },
}

// Map every legacy / lowercase / alias variant to a canonical key.
const ALIASES: Record<string, string> = {
  authentic: 'LIKELY_AUTHENTIC',
  AUTHENTIC: 'LIKELY_AUTHENTIC',
  verified: 'VERIFIED',
  likely_authentic: 'LIKELY_AUTHENTIC',
  insufficient_data: 'INSUFFICIENT_DATA',
  not_found: 'NOT_FOUND',
  notfound: 'NOT_FOUND',
  suspicious: 'SUSPICIOUS',
  counterfeit: 'COUNTERFEIT',
  fake: 'COUNTERFEIT',
  recalled: 'RECALLED',
  unreadable: 'UNREADABLE',
}

const FALLBACK: StatusMeta = {
  label: 'Unknown',
  icon: '❔',
  color: '#64748b',
  bg: '#f8fafc',
  border: '#e2e8f0',
  description: 'Status could not be determined.',
  tone: 'neutral',
}

/**
 * Resolve any status string (canonical, lowercase, alias) to its metadata.
 */
export function getStatusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return FALLBACK
  const upper = String(status).toUpperCase()
  if (META[upper]) return META[upper]
  const aliased = ALIASES[String(status)] || ALIASES[upper] || ALIASES[String(status).toLowerCase()]
  if (aliased && META[aliased]) return META[aliased]
  return FALLBACK
}

/**
 * Quick label-only helper (e.g. for inline text, share strings, CSV export).
 */
export function formatStatus(status: string | null | undefined): string {
  return getStatusMeta(status).label
}

/**
 * Label with leading icon — for badges and headings.
 */
export function formatStatusWithIcon(status: string | null | undefined): string {
  const m = getStatusMeta(status)
  return `${m.icon} ${m.label}`
}

/**
 * The full canonical list — useful for admin dropdowns / filters.
 */
export const ALL_STATUSES: { value: string; label: string }[] = Object.entries(META).map(
  ([value, meta]) => ({ value, label: meta.label })
)
