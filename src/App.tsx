import { useEffect, useState } from 'react'
import { isSupabaseConfigured, onAuthChange, signOut, type AuthUser } from './lib/auth'
import { listPlayers } from './lib/ledger'
import { LoginScreen } from './screens/LoginScreen'

export default function App() {
  return isSupabaseConfigured ? <AuthedApp /> : <SetupScreen />
}

type AuthState =
  | { phase: 'loading' }
  | { phase: 'signed-out' }
  | { phase: 'signed-in'; user: AuthUser }

function AuthedApp() {
  const [auth, setAuth] = useState<AuthState>({ phase: 'loading' })

  useEffect(
    () =>
      onAuthChange((user) =>
        setAuth(user ? { phase: 'signed-in', user } : { phase: 'signed-out' }),
      ),
    [],
  )

  if (auth.phase === 'loading') {
    return (
      <div className="screen screen--center">
        <p className="muted">Loading…</p>
      </div>
    )
  }
  if (auth.phase === 'signed-out') return <LoginScreen />
  return <Shell email={auth.user.email} />
}

type DbCheck =
  | { state: 'checking' }
  | { state: 'ok'; players: number }
  | { state: 'error'; message: string }

function Shell({ email }: { email: string | null }) {
  const [db, setDb] = useState<DbCheck>({ state: 'checking' })

  useEffect(() => {
    let cancelled = false
    listPlayers(true)
      .then((players) => {
        if (!cancelled) setDb({ state: 'ok', players: players.length })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setDb({ state: 'error', message: err instanceof Error ? err.message : String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="screen">
      <header className="app-header">
        <h1>Q.Poker</h1>
        <button className="btn btn--inline" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      <div className="card">
        <p>
          Signed in as <strong>{email ?? 'unknown'}</strong>.
        </p>
        {db.state === 'checking' && <p className="muted">Checking database…</p>}
        {db.state === 'ok' && (
          <p className="notice notice--ok">
            Database connected — {db.players} player{db.players === 1 ? '' : 's'} on file
            {db.players === 0 ? ' (expected on a fresh install)' : ''}.
          </p>
        )}
        {db.state === 'error' && (
          <div>
            <p className="notice notice--error">{db.message}</p>
            <p className="muted">Has the schema migration been run in the SQL editor?</p>
          </div>
        )}
      </div>

      <p className="muted">
        Milestone 1: auth + data layer. Session tracking arrives in milestone 2.
      </p>
    </div>
  )
}

function SetupScreen() {
  return (
    <div className="screen screen--center">
      <div className="card">
        <h1>Q.Poker — setup needed</h1>
        <p>
          Supabase isn't configured yet. Open <code>.env.local</code> and replace the
          placeholders:
        </p>
        <p className="mono">
          VITE_SUPABASE_URL — Supabase dashboard → Project Settings → Data API → Project URL
          <br />
          VITE_SUPABASE_ANON_KEY — Project Settings → API Keys → anon public
        </p>
        <p className="muted">Then restart the dev server.</p>
      </div>
    </div>
  )
}
