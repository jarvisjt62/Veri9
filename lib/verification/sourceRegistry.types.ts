/**
 * TypeScript types for the Veri9 source registry.
 *
 * The runtime data lives in `sourceRegistry.js` (CommonJS, used by the engine).
 * Admin UI imports those values via `require` but uses these types.
 */

export type SourceType =
  | 'product'
  | 'recall'
  | 'pharma'
  | 'safety'
  | 'price'
  | 'cert'
  | 'regulatory'
  | 'reference'

export type SourceRegion =
  | 'global'
  | 'africa'
  | 'asia'
  | 'europe'
  | 'oceania'
  | 'americas'
  | 'us'
  | 'canada'
  | 'eu'

export interface SourceDef {
  id: string
  name: string
  description: string
  type: SourceType
  region: SourceRegion
  defaultEnabled: boolean
  requiresKey: boolean
  icon?: string
}

export interface RegionMeta {
  label: string
  icon: string
}
