import { getSupabase, isSupabaseConfigured } from './supabaseClient'

export { isSupabaseConfigured }

export interface AuthUser {
  email: string | null
}

/**
 * Magic-link sign-in for the single existing user. shouldCreateUser is false
 * on purpose: the one account is created by hand in the Supabase dashboard,
 * so no stranger's email can ever mint an account here.
 */
export async function signInWithMagicLink(email: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw new Error(error.message)
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut()
  if (error) throw new Error(error.message)
}

/**
 * Subscribe to auth state. Fires immediately with the current session, then on
 * every change (including the magic-link redirect landing). Returns unsubscribe.
 */
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  const supabase = getSupabase()

  void supabase.auth.getSession().then(({ data }) => {
    callback(data.session ? { email: data.session.user.email ?? null } : null)
  })

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ? { email: session.user.email ?? null } : null)
  })
  return () => data.subscription.unsubscribe()
}
