import { useState, type FormEvent } from 'react'
import { signInWithMagicLink, verifyEmailOtp } from '../lib/auth'

type Phase = 'idle' | 'sending' | 'sent'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
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
            Magic link sent to <strong>{email}</strong>. Open it on this device, or type the
            6-digit code from the same email:
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              verifyEmailOtp(email, code).catch((err: unknown) =>
                setError(err instanceof Error ? err.message : String(err)),
              )
            }}
          >
            <div className="field">
              <label htmlFor="otp-code">Code</label>
              <input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={code.trim().length < 6}
              style={{ marginTop: '0.75rem' }}
            >
              Sign in with code
            </button>
          </form>
          {error && <p className="notice notice--error">{error}</p>}
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
