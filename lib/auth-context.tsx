'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: string | null }>
  resendEmailOtp: (email: string) => Promise<{ error: string | null }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Lazily get the supabase client only on the client side
  const getClient = () => {
    if (typeof window === 'undefined') return null
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    // Dynamic import to avoid SSR issues
    const { getSupabaseClient } = require('./supabase')
    return getSupabaseClient()
  }

  useEffect(() => {
    const supabase = getClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    void supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      const s: Session | null = result.data.session
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, s: Session | null) => {
        setSession(s)
        setUser(s?.user ?? null)
        setLoading(false)
      }
    )

    return () => authListener.subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const supabase = getClient()
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error: string | null; needsEmailConfirmation: boolean }> => {
    const supabase = getClient()
    if (!supabase) return { error: 'Supabase not configured', needsEmailConfirmation: false }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? '' },
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/verify-email`
          : 'https://veri9.com/verify-email'
      }
    })
    if (error) return { error: error.message, needsEmailConfirmation: false }
    // If Supabase returns a user but no session, email confirmation is required.
    // If both exist, the user is immediately signed in.
    const needsEmailConfirmation = !!(data?.user && !data?.session)
    return { error: null, needsEmailConfirmation }
  }

  const signOut = async (): Promise<void> => {
    const supabase = getClient()
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('veri9_user')
      window.location.href = '/'
    }
  }

  // Verify the OTP code (6 or 8 digits) that Supabase emails after signup.
  // On success, Supabase creates a session automatically and onAuthStateChange fires.
  const verifyEmailOtp = async (email: string, token: string): Promise<{ error: string | null }> => {
    const supabase = getClient()
    if (!supabase) return { error: 'Supabase not configured' }
    const cleanToken = token.replace(/\s+/g, '').trim()
    // 'email' covers both the old 'signup' type and the new unified 'email' OTP
    // Supabase returns "Token has expired or is invalid" if the type is wrong,
    // so we try 'email' first then fall back to 'signup' for older projects.
    let result = await supabase.auth.verifyOtp({ email, token: cleanToken, type: 'email' })
    if (result.error) {
      const retry = await supabase.auth.verifyOtp({ email, token: cleanToken, type: 'signup' })
      if (!retry.error) result = retry
    }
    if (result.error) return { error: result.error.message }
    return { error: null }
  }

  // Resend the signup OTP (if the user never got the code or it expired).
  const resendEmailOtp = async (email: string): Promise<{ error: string | null }> => {
    const supabase = getClient()
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/verify-email`
          : 'https://veri9.com/verify-email',
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const isAdmin: boolean =
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    (user?.user_metadata?.role === 'admin') ||
    false

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, verifyEmailOtp, resendEmailOtp, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}