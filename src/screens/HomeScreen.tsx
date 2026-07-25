import { useEffect, useState } from 'react'
import { getHomeData, type HomeData, type LiveSessionState } from '../lib/ledger'
import { getSettings } from '../lib/settings'
import { formatMoney, formatSignedMoney } from '../lib/money'
import {
  formatElapsed,
  formatMelbourneTime,
  melbourneDayName,
  sessionDisplayName,
} from '../lib/time'
import { useNow } from '../hooks/useNow'
import { Sparkline } from '../components/Sparkline'

/** Home dashboard (§4.1): idle and live states. */
export function HomeScreen({
  live,
  savedNote,
  onStart,
  onResume,
  onBoard,
  onSettings,
}: {
  live: LiveSessionState | null
  savedNote: string | null
  onStart: () => void
  onResume: () => void
  onBoard: () => void
  onSettings: () => void
}) {
  const now = useNow(30_000)
  const [myPlayerId] = useState(getSettings().myPlayerId)
  const [data, setData] = useState<HomeData | null>(null)

  useEffect(() => {
    let cancelled = false
    getHomeData(myPlayerId)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [myPlayerId, live])

  return (
    <div className="screen screen--tabbed">
      <header className="app-header">
        <span>
          <h1>Home</h1>
          <span className="muted">{melbourneDayName(new Date(now))}</span>
        </span>
        <button className="btn btn--inline" aria-label="Settings" onClick={onSettings}>
          ⚙
        </button>
      </header>

      {savedNote && <div className="banner banner--ok">{savedNote}</div>}

      {live && (
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
      )}

      <div className="card">
        <span className="muted">Your bankroll</span>
        {myPlayerId === null ? (
          <>
            <p>Pick who you are to see your lifetime numbers.</p>
            <button className="btn" onClick={onSettings}>
              This is me…
            </button>
          </>
        ) : (
          <>
            <div
              className={`hero-money ${(data?.me?.lifetimeNetCents ?? 0) >= 0 ? 'pos' : 'neg'}`}
              style={{ fontSize: '2rem' }}
            >
              {formatSignedMoney(data?.me?.lifetimeNetCents ?? 0)}
            </div>
            {data?.me && data.me.cumulative.length >= 2 && (
              <Sparkline values={[0, ...data.me.cumulative]} />
            )}
          </>
        )}
      </div>

      {data?.lastSession && (
        <div className="card">
          <span className="muted">Last session</span>
          <div className="row" style={{ padding: 0, minHeight: 0, border: 0 }}>
            <span className="row-main row-title">
              {sessionDisplayName(data.lastSession.session.startedAt)}
            </span>
            {data.lastSession.myNetCents !== null && (
              <span
                className={`row-end ${data.lastSession.myNetCents >= 0 ? 'pos' : 'neg'}`}
              >
                {formatSignedMoney(data.lastSession.myNetCents)}
              </span>
            )}
          </div>
        </div>
      )}

      {data && data.top3.length > 0 && (
        <button className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={onBoard}>
          <span className="muted">Leaderboard</span>
          {data.top3.map((r, i) => (
            <div key={r.player.id} className="row" style={{ padding: 0, minHeight: 36, border: 0 }}>
              <span className="row-main">
                {i + 1}. {r.player.name}
              </span>
              <span className={`row-end ${r.netCents >= 0 ? 'pos' : 'neg'}`}>
                {formatSignedMoney(r.netCents)}
              </span>
            </div>
          ))}
          <span className="muted">Full board →</span>
        </button>
      )}

      {!live && (
        <button className="btn btn--primary" onClick={onStart}>
          Start session
        </button>
      )}
    </div>
  )
}
