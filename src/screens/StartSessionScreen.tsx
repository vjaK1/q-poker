import { useEffect, useState } from 'react'
import {
  addBuyIn,
  addCorrection,
  createSession,
  discardSession,
  getLastSavedRoster,
  type LedgerEvent,
  type LiveSessionState,
  type Player,
} from '../lib/ledger'
import { getSettings } from '../lib/settings'
import { formatMoney } from '../lib/money'
import { useBusy } from '../hooks/useBusy'
import { AddPlayerSheet } from '../components/AddPlayerSheet'

/**
 * Quick-start (§4.2): pre-seats the previous session's roster, each ready at
 * the default buy-in. Tapping a row records the buy_in; the session itself is
 * created on the first buy-in. Tapping a bought-in row again takes them back
 * off: the buy_in is voided with an "Undo" correction (the ledger stays
 * append-only), and an emptied table discards the just-created session.
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

  // A player can be taken back off only while their whole night is that one
  // buy-in. Anything more (a rebuy, a cash-out) belongs to the live screen.
  function soleBuyIn(playerId: string): LedgerEvent | null {
    const mine = (live?.events ?? []).filter(
      (e) => e.playerId === playerId && !e.voided && e.type !== 'correction',
    )
    return mine.length === 1 && mine[0].type === 'buy_in' ? mine[0] : null
  }

  async function takeOff(player: Player, buyInEvent: LedgerEvent) {
    if (!live) return
    await addCorrection({
      sessionId: live.session.id,
      playerId: player.id,
      correctsTransactionId: buyInEvent.id,
      note: 'Undo',
    })
    // Nobody left on the table: drop the empty session rather than leaving a
    // ghost live game on Home. The next tap simply creates a fresh one.
    const someoneElseIn = live.summary.players.some(
      (p) => p.playerId !== player.id && p.buyInCents > 0,
    )
    if (!someoneElseIn) await discardSession(live.session.id)
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
        Tap a player to buy them in at {formatMoney(settings.defaultBuyInCents)}. Tap them
        again to take them off.
      </p>

      {roster === null ? (
        <p className="muted">Loading roster…</p>
      ) : (
        <div className="list">
          {rows.map((player) => {
            const done = boughtIn.get(player.id)
            const removable = done !== undefined ? soleBuyIn(player.id) : null
            return (
              <button
                key={player.id}
                className="row"
                disabled={busy || (done !== undefined && removable === null)}
                aria-label={
                  done === undefined
                    ? `Buy ${player.name} in`
                    : removable
                      ? `Take ${player.name} off the table`
                      : undefined
                }
                onClick={() =>
                  void run(() => (removable ? takeOff(player, removable) : buyIn(player)))
                }
              >
                <span className="row-main">
                  <span className="row-title">{player.name}</span>
                  {player.isGuest && <span className="row-sub">guest</span>}
                </span>
                {done ? (
                  <span className="row-end">
                    <span className="row-amount">
                      {formatMoney(done.buyInCents)} <span className="check">✓</span>
                    </span>
                    {removable && (
                      <span className="row-sub" style={{ display: 'block' }}>
                        tap to remove
                      </span>
                    )}
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
