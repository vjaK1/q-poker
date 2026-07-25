import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, onAuthChange, signOut, type AuthUser } from './lib/auth'
import { getLiveSessionState, seatedPlayerIds, type LiveSessionState } from './lib/ledger'
import { LoginScreen } from './screens/LoginScreen'
import { HomeScreen } from './screens/HomeScreen'
import { StartSessionScreen } from './screens/StartSessionScreen'
import { LiveSessionScreen } from './screens/LiveSessionScreen'
import { CashOutScreen } from './screens/CashOutScreen'
import { CountQueueScreen } from './screens/CountQueueScreen'
import { ReconcileScreen } from './screens/ReconcileScreen'

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
  return <SessionApp email={auth.user.email} />
}

// ---------------------------------------------------------------------------
// View machine (no router by design — tap-driven app, decided 2026-07-25)
// ---------------------------------------------------------------------------

type View =
  | { name: 'home' }
  | { name: 'start' }
  | { name: 'live' }
  | { name: 'cashout'; playerId: string; origin: 'live' | 'count'; recountsTxId?: string }
  | { name: 'count' }
  | { name: 'reconcile' }

// The count queue (who was seated when "End session" was tapped) survives an
// app reload via localStorage; the fallback is whoever is seated now.
const queueKey = (sessionId: string) => `qpoker.countQueue.${sessionId}`

function loadQueue(sessionId: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(queueKey(sessionId)) ?? 'null')
    return Array.isArray(parsed) && parsed.every((x) => typeof x === 'string') ? parsed : null
  } catch {
    return null
  }
}

function SessionApp({ email }: { email: string | null }) {
  const [view, setView] = useState<View>({ name: 'home' })
  const [live, setLive] = useState<LiveSessionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savedNote, setSavedNote] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLive(await getLiveSessionState())
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  if (loading) {
    return (
      <div className="screen screen--center">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (loadError !== null && live === null) {
    return (
      <div className="screen screen--center">
        <p className="notice notice--error">{loadError}</p>
        <button className="btn" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    )
  }

  // Keep the view consistent with reality: no session → home/start only;
  // counting sessions never show the live screen and vice versa.
  let effective: View = view
  if (live === null) {
    if (view.name !== 'home' && view.name !== 'start') effective = { name: 'home' }
  } else if (live.session.status === 'counting') {
    if (view.name === 'live' || view.name === 'start') effective = { name: 'count' }
  } else if (view.name === 'count' || view.name === 'reconcile') {
    effective = { name: 'live' }
  }

  const goHome = () => setView({ name: 'home' })

  switch (effective.name) {
    case 'home':
      return (
        <HomeScreen
          live={live}
          email={email}
          savedNote={savedNote}
          onStart={() => {
            setSavedNote(null)
            setView({ name: 'start' })
          }}
          onResume={() =>
            setView(live?.session.status === 'counting' ? { name: 'count' } : { name: 'live' })
          }
          onSignOut={() => void signOut()}
        />
      )

    case 'start':
      return (
        <StartSessionScreen
          live={live}
          refresh={refresh}
          onToTable={() => setView({ name: 'live' })}
          onBack={goHome}
        />
      )

    case 'live':
      return (
        <LiveSessionScreen
          state={live!}
          refresh={refresh}
          onHome={goHome}
          onCashOut={(playerId) => setView({ name: 'cashout', playerId, origin: 'live' })}
          onCounting={(queueIds) => {
            localStorage.setItem(queueKey(live!.session.id), JSON.stringify(queueIds))
            setView({ name: 'count' })
          }}
        />
      )

    case 'cashout':
      return (
        <CashOutScreen
          state={live!}
          playerId={effective.playerId}
          recountsTxId={effective.recountsTxId}
          refresh={refresh}
          onDone={() =>
            setView(effective.origin === 'live' ? { name: 'live' } : { name: 'count' })
          }
          onCancel={() =>
            setView(effective.origin === 'live' ? { name: 'live' } : { name: 'count' })
          }
        />
      )

    case 'count': {
      const queueIds = loadQueue(live!.session.id) ?? seatedPlayerIds(live!.events)
      if (queueIds.length === 0) {
        // Reloaded after everything was counted — straight to reconcile.
        return renderReconcile()
      }
      return (
        <CountQueueScreen
          state={live!}
          queueIds={queueIds}
          onCount={(playerId) => setView({ name: 'cashout', playerId, origin: 'count' })}
          onRecount={(playerId, cashOutTxId) =>
            setView({ name: 'cashout', playerId, origin: 'count', recountsTxId: cashOutTxId })
          }
          onReconcile={() => setView({ name: 'reconcile' })}
          onHome={goHome}
        />
      )
    }

    case 'reconcile':
      return renderReconcile()
  }

  function renderReconcile() {
    return (
      <ReconcileScreen
        state={live!}
        refresh={refresh}
        onSaved={(note) => {
          localStorage.removeItem(queueKey(live!.session.id))
          setSavedNote(note)
          setView({ name: 'home' })
          void refresh()
        }}
        onBackToCount={() => setView({ name: 'count' })}
      />
    )
  }
}

function SetupScreen() {
  return (
    <div className="screen screen--center">
      <div className="card">
        <h1>Q.Poker setup</h1>
        <p>
          Supabase isn't configured yet. Open <code>.env.local</code> and replace the
          placeholders:
        </p>
        <p className="mono">
          VITE_SUPABASE_URL: Supabase dashboard → Project Settings → Data API → Project URL
          <br />
          VITE_SUPABASE_ANON_KEY: Project Settings → API Keys → anon public
        </p>
        <p className="muted">Then restart the dev server.</p>
      </div>
    </div>
  )
}
