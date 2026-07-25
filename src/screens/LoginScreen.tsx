import { useState, type FormEvent } from 'react'
import { signInWithMagicLink } from '../lib/auth'

type Phase = 'idle' | 'sending' | 'sent'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setPhase('sending')
    try {
      await signInWithMagicLink(email.trim())
      setPhase('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('idle')
    }
  }

  if (phase === 'sent') {
    return (
      <div className="screen screen--center">
        <div className="card">
          <h1>Check your email</h1>
          <p>
            Magic link sent to <strong>{email}</strong>. Open it on this device to sign in.
          </p>
          <button className="btn" onClick={() => setPhase('idle')}>
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen screen--center">
      <form className="card" onSubmit={(e) => void onSubmit(e)}>
        <h1>Q.Poker</h1>
        <p className="muted">Sign in with your magic link.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled={phase === 'sending'}>
          {phase === 'sending' ? 'Sending…' : 'Send magic link'}
        </button>
        {error && (
          <div>
            <p className="notice notice--error">{error}</p>
            {/signup/i.test(error) && (
              <p className="muted">
                Sign-ups are disabled by design. Create your user first: Supabase dashboard →
                Authentication → Users → Add user.
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
