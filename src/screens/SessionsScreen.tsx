import { useEffect, useState } from 'react'
import { getSessionsOverview, type SessionOverviewRow } from '../lib/ledger'
import { formatMoney, formatSignedMoney } from '../lib/money'
import { getSettings } from '../lib/settings'
import { sessionDisplayName } from '../lib/time'

/** Sessions tab (§4.7): saved sessions, newest first. */
export function SessionsScreen({ onOpen }: { onOpen: (sessionId: string) => void }) {
  const [rows, setRows] = useState<SessionOverviewRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSessionsOverview()
      .then((r) => {
        if (!cancelled) setRows(r)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="screen screen--tabbed">
      <header className="app-header">
        <h1>Sessions</h1>
      </header>

      {error && <p className="notice notice--error">{error}</p>}
      {rows === null && !error && <p className="muted">Loading…</p>}
      {rows !== null && rows.length === 0 && (
        <p className="muted">No saved sessions yet. Finish a night and it lands here.</p>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="list">
          {rows.map(({ session, playerCount, buyInsCents, discrepancyCents, balanced, netsByPlayer }) => {
            const myPlayerId = getSettings().myPlayerId
            const myNet = myPlayerId !== null ? netsByPlayer[myPlayerId] : undefined
            return (
              <button key={session.id} className="row" onClick={() => onOpen(session.id)}>
                <span className="row-main">
                  <span className="row-title">{sessionDisplayName(session.startedAt)}</span>
                  <span className="row-sub">
                    {playerCount} player{playerCount === 1 ? '' : 's'} · in{' '}
                    {formatMoney(buyInsCents)}
                  </span>
                </span>
                <span className="row-end">
                  {myNet !== undefined && (
                    <span className={myNet >= 0 ? 'pos' : 'neg'} style={{ display: 'block' }}>
                      {formatSignedMoney(myNet)}
                    </span>
                  )}
                  {balanced ? (
                    <span className="row-sub check">Balanced ✓</span>
                  ) : (
                    <span className="row-sub" style={{ color: 'var(--warn)' }}>
                      Off by {formatMoney(discrepancyCents)}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
