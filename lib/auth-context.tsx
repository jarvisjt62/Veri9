'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get initial session
    void supabase.auth.getSession().then((result: { data: { session: Session | null }; error: unknown }) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? '' },
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard`
          : 'https://veri9.com/dashboard'
      }
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('veri9_user')
      window.location.href = '/'
    }
  }

  const isAdmin: boolean =
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    (user?.user_metadata?.role === 'admin') ||
    false

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, isAdmin }}>
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