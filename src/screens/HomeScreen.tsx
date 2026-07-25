import type { LiveSessionState } from '../lib/ledger'
import { formatMoney } from '../lib/money'
import { formatElapsed, formatMelbourneTime } from '../lib/time'
import { useNow } from '../hooks/useNow'

export function HomeScreen({
  live,
  email,
  savedNote,
  onStart,
  onResume,
  onSignOut,
}: {
  live: LiveSessionState | null
  email: string | null
  savedNote: string | null
  onStart: () => void
  onResume: () => void
  onSignOut: () => void
}) {
  const now = useNow(30_000)

  return (
    <div className="screen screen--tabbed">
      <header className="app-header">
        <h1>Q.Poker</h1>
        <button className="btn btn--inline" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      {savedNote && <div className="banner banner--ok">{savedNote}</div>}

      {live ? (
        <div className="card">
          <div className="row-sub">
            Live · started {formatMelbourneTime(live.session.startedAt)} ·{' '}
            <span className="timer">{formatElapsed(live.session.startedAt, now)}</span>
            {live.session.status === 'counting' && ' · counting stacks'}
          </div>
          <div className="hero">
            <div className="hero-money">{formatMoney(live.summary.onTableCents)}</div>
            <div className="hero-sub">on the table</div>
          </div>
          <button className="btn btn--primary" onClick={onResume}>
            Resume session
          </button>
        </div>
      ) : (
        <div className="card">
          <p className="muted">No live session.</p>
          <button className="btn btn--primary" onClick={onStart}>
            Start session
          </button>
        </div>
      )}

      <p className="muted">
        Signed in as {email ?? 'unknown'}. Dashboard, sessions and board arrive in later
        milestones.
      </p>
    </div>
  )
}
