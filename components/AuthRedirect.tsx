'use client'

/**
 * AuthRedirect — invisible client component dropped into the homepage.
 * If the user is already signed in, redirects them straight to /dashboard
 * so they never have to see the landing page again after login.
 */

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function AuthRedirect() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      window.location.replace('/dashboard')
    }
  }, [user, loading])

  return null  // renders nothing — purely a side-effect component
}
