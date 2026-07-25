import { useEffect, useState } from 'react'
import {
  addBuyIn,
  createSession,
  getLastSavedRoster,
  type LiveSessionState,
  type Player,
} from '../lib/ledger'
import { getSettings } from '../lib/settings'
import { formatMoney } from '../lib/money'
import { formatMelbourneTime } from '../lib/time'
import { useBusy } from '../hooks/useBusy'
import { AddPlayerSheet } from '../components/AddPlayerSheet'

/**
 * Quick-start (§4.2): pre-seats the previous session's roster, each ready at
 * the default buy-in. Tapping a row records the buy_in; the session itself is
 * created on the first buy-in.
 */
export function StartSessionScreen({
  live,
  refresh,
  onToTable,
  onBack,
}: {
  live: LiveSessionState | null
  refresh: () => Promise<void>
  onToTable: () => void
  onBack: () => void
}) {
  const settings = getSettings()
  const [roster, setRoster] = useState<Player[] | null>(null)
  const [adding, setAdding] = useState(false)
  const { busy, error, run } = useBusy()

  useEffect(() => {
    let cancelled = false
    getLastSavedRoster()
      .then((players) => {
        if (!cancelled) setRoster(players)
      })
      .catch(() => {
        if (!cancelled) setRoster([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Players already bought in this session (when resuming into this screen).
  const boughtIn = new Map(
    (live?.summary.players ?? [])
      .filter((p) => p.buyInCents > 0)
      .map((p) => [p.playerId, p] as const),
  )

  // Roster rows: last session's roster plus anyone already in tonight.
  const rosterIds = new Set((roster ?? []).map((p) => p.id))
  const extraTonight = (live?.players ?? []).filter(
    (p) => boughtIn.has(p.id) && !rosterIds.has(p.id),
  )
  const rows = [...(roster ?? []), ...extraTonight]

  async function buyIn(player: Player) {
    const sessionId = live?.session.id ?? (await createSession()).id
    await addBuyIn(sessionId, player.id, settings.defaultBuyInCents)
    await refresh()
  }

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onBack}>
          ‹ Home
        </button>
        <span className="screen-title">Start session</span>
        <span style={{ width: '4.5rem' }} />
      </header>

      <p className="muted">
        Tap a player to buy them in at {formatMoney(settings.defaultBuyInCents)}.
      </p>

      {roster === null ? (
        <p className="muted">Loading roster…</p>
      ) : (
        <div className="list">
          {rows.map((player) => {
            const done = boughtIn.get(player.id)
            return (
              <button
                key={player.id}
                className="row"
                disabled={busy || done !== undefined}
                onClick={() => void run(() => buyIn(player))}
              >
                <span className="row-main">
                  <span className="row-title">{player.name}</span>
                  {player.isGuest && <span className="row-sub">guest</span>}
                </span>
                {done ? (
                  <span className="row-end">
                    {formatMoney(done.buyInCents)} ·{' '}
                    {done.firstBuyInAt ? formatMelbourneTime(done.firstBuyInAt) : ''}{' '}
                    <span className="check">✓</span>
                  </span>
                ) : (
                  <span className="muted">{formatMoney(settings.defaultBuyInCents)}</span>
                )}
              </button>
            )
          })}
          <button className="row" onClick={() => setAdding(true)} disabled={busy}>
            <span className="row-main row-title">＋ Add player</span>
          </button>
        </div>
      )}

      {error && <p className="notice notice--error">{error}</p>}

      <button
        className="btn btn--primary"
        onClick={onToTable}
        disabled={boughtIn.size === 0}
      >
        To the table →
      </button>

      {adding && (
        <AddPlayerSheet
          excludeIds={rows.map((p) => p.id)}
          pickLabel="Add"
          onPick={async (player) => {
            setRoster((r) => [...(r ?? []), player])
            setAdding(false)
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
