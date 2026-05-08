import { createBrowserClient } from '@supabase/ssr'

// Use fallback empty strings to avoid crash during static prerendering
// Real values must be set in Vercel environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Browser client - use in Client Components
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton for client-side use (safe to call, lazy init)
let browserClient: ReturnType<typeof createBrowserClient> | null = null
export function getSupabaseClient() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    // During SSR/prerender without env vars, return a dummy-safe client
    // The client will throw on actual auth operations but won't crash on import
    browserClient = createBrowserClient(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder-key'
    )
  }
  return browserClient
}