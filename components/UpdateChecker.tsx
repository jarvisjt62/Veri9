'use client'

import { useEffect, useRef, useState } from 'react'
import { BUILD_VERSION } from '@/lib/build-info'

/**
 * Polls /api/version and prompts the user to reload when a new build is live.
 *
 * Behavior:
 *  - First poll happens 5 seconds after mount (after initial paint settles).
 *  - Subsequent polls every 60 seconds.
 *  - Also polls when the tab regains focus / becomes visible (catches users
 *    coming back to a tab that's been open for hours/days).
 *  - When the deployed version differs from the bundled BUILD_VERSION:
 *      • Clears stale localStorage caches (verification-cache, OFF cache, etc.)
 *      • Shows a non-dismissible toast/banner with a "Reload Now" button.
 *      • If user ignores it for 5 minutes, auto-reloads the page silently.
 *
 * Safe to render anywhere in the tree (mounts once, has no visual footprint
 * until an update is detected).
 */
export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [newVersion, setNewVersion] = useState<string | null>(null)
  const dismissedAtRef = useRef<number | null>(null)
  const checkInProgressRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const STORAGE_KEYS_TO_PURGE = [
      // App data caches that should NOT survive a deploy
      'veri9-verification-cache',
      'veri9-off-cache',
      'veri9-product-cache',
      // Add others here as new caches are introduced
    ]

    const purgeStaleCaches = () => {
      try {
        for (const key of STORAGE_KEYS_TO_PURGE) {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        }
      } catch {
        /* ignore quota / privacy errors */
      }
    }

    const hardReload = () => {
      purgeStaleCaches()
      // Append a cache-busting query param so any aggressive intermediary
      // CDN/SW serves a fresh document. The server will redirect back to /
      // if needed.
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('_v', Date.now().toString(36))
        window.location.replace(url.toString())
      } catch {
        window.location.reload()
      }
    }

    const check = async () => {
      if (cancelled || checkInProgressRef.current) return
      checkInProgressRef.current = true
      try {
        const res = await fetch('/api/version', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!res.ok) return
        const data = (await res.json()) as { version?: string }
        if (cancelled) return
        if (data.version && data.version !== BUILD_VERSION) {
          setNewVersion(data.version)
          setUpdateAvailable(true)
        }
      } catch {
        /* network blip — try again next interval */
      } finally {
        checkInProgressRef.current = false
      }
    }

    // First check 5s after mount (let the page settle)
    timeoutId = setTimeout(check, 5_000)

    // Then every 60s
    const interval = setInterval(check, 60_000)

    // Also check immediately when the tab regains visibility/focus
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', check)

    // 5-minute auto-reload safety net: once we know an update is available
    // and the user hasn't acted, force-reload silently so they don't keep
    // hitting stale code that could cause subtle bugs.
    const safetyId = setInterval(() => {
      if (!updateAvailable) return
      const dismissedAt = dismissedAtRef.current
      if (dismissedAt && Date.now() - dismissedAt > 5 * 60_000) {
        hardReload()
      }
    }, 30_000)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      clearInterval(interval)
      clearInterval(safetyId)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', check)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAvailable])

  // Track when banner first appears so the safety net can measure idle time
  useEffect(() => {
    if (updateAvailable && dismissedAtRef.current === null) {
      dismissedAtRef.current = Date.now()
    }
  }, [updateAvailable])

  if (!updateAvailable) return null

  const handleReload = () => {
    try {
      const keys = ['veri9-verification-cache', 'veri9-off-cache', 'veri9-product-cache']
      for (const k of keys) {
        try { localStorage.removeItem(k) } catch {}
        try { sessionStorage.removeItem(k) } catch {}
      }
    } catch {}
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('_v', Date.now().toString(36))
      window.location.replace(url.toString())
    } catch {
      window.location.reload()
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: 'linear-gradient(135deg, #635bff 0%, #4f46e5 100%)',
        color: '#fff',
        padding: '12px 18px',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(99, 91, 255, 0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        maxWidth: 'min(560px, calc(100vw - 32px))',
        fontSize: '0.88rem',
        fontWeight: 500,
        animation: 'veri9-update-slide-up 0.35s ease-out',
      }}
    >
      <style>{`
        @keyframes veri9-update-slide-up {
          from { transform: translate(-50%, 30px); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
      `}</style>
      <span style={{ fontSize: '1.1rem' }}>🔄</span>
      <span style={{ flex: 1, lineHeight: 1.35 }}>
        <strong style={{ fontWeight: 700 }}>New version available</strong>
        <br />
        <span style={{ opacity: 0.92, fontSize: '0.78rem' }}>
          Reload to get the latest features and fixes.
          {newVersion && (
            <span style={{ marginLeft: 6, opacity: 0.7, fontFamily: 'monospace' }}>
              ({newVersion.slice(0, 7)})
            </span>
          )}
        </span>
      </span>
      <button
        onClick={handleReload}
        style={{
          background: '#fff',
          color: '#4f46e5',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 9,
          fontWeight: 800,
          fontSize: '0.82rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Reload now
      </button>
    </div>
  )
}
