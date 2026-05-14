'use client'

import { useState, useEffect } from 'react'

export interface PlatformConfig {
  maintenanceMode: boolean
  registrationEnabled: boolean
  scannerEnabled: boolean
  userDashboardEnabled: boolean
  communityReportsEnabled: boolean
  darkModeForced: boolean
  darkModeDefault: 'light' | 'dark' | 'system'
  announcementEnabled: boolean
  announcementText: string
  announcementColor: string
  maintenanceMessage: string
  updatedAt?: string
  // Section visibility flags (admin-controllable)
  featuredSection: boolean
  testimonialSection: boolean
  ctaSection: boolean
  journeySection: boolean
  teamSection: boolean
  careersPage: boolean
  securityPage: boolean
  apiDevPage: boolean
}

const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  maintenanceMode: false,
  registrationEnabled: true,
  scannerEnabled: true,
  userDashboardEnabled: true,
  communityReportsEnabled: true,
  darkModeForced: false,
  darkModeDefault: 'system',
  announcementEnabled: false,
  announcementText: '🎉 New feature: Real-time barcode scanning with advanced verification!',
  announcementColor: '#635bff',
  maintenanceMessage: 'We are performing scheduled maintenance. We will be back shortly.',
  // Sections disabled by default (enable via admin panel)
  featuredSection: true,
  testimonialSection: false,
  ctaSection: true,
  journeySection: false,
  teamSection: false,
  careersPage: false,
  securityPage: false,
  apiDevPage: false,
}

const LOCAL_KEY = 'veri9_platform_config'

/**
 * usePlatformConfig — reads the admin-set platform config from:
 * 1. localStorage (instant, no network)
 * 2. /api/admin/config (service-role, bypasses RLS so regular users can read admin's settings)
 * Also listens for:
 *   - StorageEvent (admin saves in another tab)
 *   - Custom 'veri9-config-update' event (admin saves in same tab)
 *   - Polls /api/admin/config every 15 seconds for near-real-time sync
 */
export function usePlatformConfig(): PlatformConfig {
  const [config, setConfig] = useState<PlatformConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_PLATFORM_CONFIG
    try {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return DEFAULT_PLATFORM_CONFIG
  })

  useEffect(() => {
    let cancelled = false

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        if (json?.config) {
          const pc = { ...DEFAULT_PLATFORM_CONFIG, ...json.config }
          setConfig(prev => {
            // Only update if changed (by comparing updatedAt, or stringify)
            if (prev.updatedAt === pc.updatedAt && JSON.stringify(prev) === JSON.stringify(pc)) {
              return prev
            }
            try { localStorage.setItem(LOCAL_KEY, JSON.stringify(pc)) } catch {}
            return pc
          })
        }
      } catch (e) {
        // Silently fail - use cached/default config
        console.warn('[PlatformConfig] Fetch failed:', e)
      }
    }

    // Initial fetch
    fetchConfig()
    // Poll every 15 seconds for near real-time updates
    const interval = setInterval(fetchConfig, 15000)

    // Listen for storage events (admin changed config in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY && e.newValue) {
        try {
          setConfig({ ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(e.newValue) })
        } catch { /* ignore */ }
      }
    }
    // Custom event for same-tab instant updates (admin page dispatches this after save)
    const handleCustom = (e: Event) => {
      const ce = e as CustomEvent
      if (ce.detail) {
        setConfig({ ...DEFAULT_PLATFORM_CONFIG, ...ce.detail })
      } else {
        fetchConfig()
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('veri9-config-update', handleCustom)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('veri9-config-update', handleCustom)
    }
  }, [])

  return config
}
