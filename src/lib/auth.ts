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

/**
 * Alternative to clicking the link: the same email carries a 6-digit code
 * (once {{ .Token }} is in the Supabase email template). Typing it here signs
 * in THIS context — essential for the installed PWA, where mail links open
 * Safari instead of the app.
 */
export async function verifyEmailOtp(email: string, code: string): Promise<void> {
  const { error } = await getSupabase().auth.verifyOtp({
    email,
    token: code.trim(),
    type: 'email',
  })
  if (error) throw new Error(error.message)
}

/**
 * Supabase redirects a failed auth attempt (expired or already-used magic
 * link, etc.) back to the app with an error in the URL hash instead of
 * tokens. Surfacing it is the difference between "nothing happened" and
 * knowing what actually went wrong. Only touches the URL when an error is
 * actually present, so it never races with detectSessionInUrl on a real
 * successful sign-in (which also lands via the hash).
 */
export function consumeUrlAuthError(): string | null {
  const hash = window.location.hash
  if (!hash || !hash.includes('error=')) return null
  const params = new URLSearchParams(hash.slice(1))
  const description = params.get('error_description')
  history.replaceState(null, '', window.location.pathname + window.location.search)
  return description ? description.replace(/\+/g, ' ') : (params.get('error') ?? 'Sign-in failed')
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
