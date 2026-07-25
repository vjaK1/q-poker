import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The Supabase client lives here and is imported ONLY by ledger.ts (data) and
 * auth.ts (auth). Components never touch it — that boundary is what lets an
 * offline/IndexedDB queue slot into ledger.ts later as a one-file change.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  Boolean(url) && Boolean(key) && !url.includes('YOUR-PROJECT-REF') && !key.startsWith('YOUR-')

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured — fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and restart the dev server.',
    )
  }
  client ??= createClient(url, key)
  return client
}
