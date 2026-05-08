import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client - use in Client Components
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton for client-side use
let browserClient: ReturnType<typeof createBrowserClient> | null = null
export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}