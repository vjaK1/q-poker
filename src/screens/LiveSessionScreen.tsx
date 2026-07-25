import { useState } from 'react'
import {
  addBuyIn,
  addCorrection,
  addRebuy,
  beginCounting,
  seatedPlayerIds,
  type LedgerEvent,
  type LiveSessionState,
  type Player,
  type PlayerSessionSummary,
} from '../lib/ledger'
import { getSettings } from '../lib/settings'
import { formatMoney } from '../lib/money'
import { formatElapsed, formatMelbourneTime } from '../lib/time'
import { useBusy } from '../hooks/useBusy'
import { useNow } from '../hooks/useNow'
import { Sheet } from '../components/Sheet'
import { AddPlayerSheet } from '../components/AddPlayerSheet'

function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')
  return `${n}${suffix}`
}

/** Live session (§4.3): on-table total, player rows with +$10, cash-out, end. */
export function LiveSessionScreen({
  state,
  refresh,
  onHome,
  onCashOut,
  onCounting,
}: {
  state: LiveSessionState
  refresh: () => Promise<void>
  onHome: () => void
  onCashOut: (playerId: string) => void
  onCounting: (queueIds: string[]) => void
}) {
  const settings = getSettings()
  const now = useNow(1000)
  const { busy, error, run } = useBusy()
  const [rebuyFor, setRebuyFor] = useState<PlayerSessionSummary | null>(null)
  const [pickingCashOut, setPickingCashOut] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmUndo, setConfirmUndo] = useState(false)
  const [adding, setAdding] = useState(false)

  const seated = new Set(seatedPlayerIds(state.events))
  const seatedRows = state.summary.players.filter((p) => seated.has(p.playerId))
  const away = state.summary.players.filter((p) => !seated.has(p.playerId))

  // Undo = insert a correction voiding the most recent entry. Fat fingers
  // happen; the ledger stays append-only either way.
  const lastEntry = [...state.events]
    .reverse()
    .find((e) => !e.voided && e.type !== 'correction')
  const nameOf = (playerId: string) =>
    state.players.find((p) => p.id === playerId)?.name ?? 'Player'
  const describeEntry = (e: LedgerEvent) => {
    const kind = e.type === 'buy_in' ? 'buy-in' : e.type === 'rebuy' ? 'rebuy' : 'cash-out'
    return `${nameOf(e.playerId)} ${kind} ${formatMoney(e.amountCents)}`
  }

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onHome}>
          ‹ Home
        </button>
        <span className="screen-title">Live</span>
        <span className="timer">{formatElapsed(state.session.startedAt, now)}</span>
      </header>

      <div className="hero">
        <div className="hero-money">{formatMoney(state.summary.onTableCents)}</div>
        <div className="hero-sub">
          on the table · cash box should hold {formatMoney(state.summary.onTableCents)}
        </div>
      </div>

      <div className="list">
        {seatedRows.map((p) => (
          <div key={p.playerId} className="row">
            <span className="row-main">
              <span className="row-title">{p.name ?? p.playerId}</span>
              <span className="row-amount">In for {formatMoney(p.buyInCents)}</span>
            </span>
            <button
              className="btn btn--small btn--primary"
              disabled={busy}
              onClick={() => setRebuyFor(p)}
            >
              +{formatMoney(settings.defaultBuyInCents)}
            </button>
          </div>
        ))}
        <button className="row" onClick={() => setAdding(true)} disabled={busy}>
          <span className="row-main row-title">＋ Add player</span>
        </button>
      </div>

      {away.length > 0 && (
        <div className="list">
          {away.map((p) => (
            <div key={p.playerId} className="row row--dim">
              <span className="row-main">
                <span className="row-title">{p.name ?? p.playerId}</span>
                <span className="row-amount">Cashed out {formatMoney(p.cashOutCents)}</span>
              </span>
              <button
                className="btn btn--small"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await addBuyIn(state.session.id, p.playerId, settings.defaultBuyInCents)
                    await refresh()
                  })
                }
              >
                Re-enter
              </button>
            </div>
          ))}
        </div>
      )}

      {lastEntry &&
        (confirmUndo ? (
          <div className="btn-row">
            <button
              className="btn btn--warn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await addCorrection({
                    sessionId: state.session.id,
                    playerId: lastEntry.playerId,
                    correctsTransactionId: lastEntry.id,
                    note: 'Undo',
                  })
                  await refresh()
                  setConfirmUndo(false)
                })
              }
            >
              Yes, undo {describeEntry(lastEntry)}
            </button>
            <button className="btn" disabled={busy} onClick={() => setConfirmUndo(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <button className="btn" disabled={busy} onClick={() => setConfirmUndo(true)}>
            Undo last entry: {describeEntry(lastEntry)}
          </button>
        ))}

      {error && <p className="notice notice--error">{error}</p>}

      <div className="btn-row">
        <button
          className="btn"
          disabled={busy || seatedRows.length === 0}
          onClick={() => setPickingCashOut(true)}
        >
          Cash out
        </button>
        {confirmEnd ? (
          <button
            className="btn btn--warn"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const queue = seatedRows.map((p) => p.playerId)
                await beginCounting(state.session.id)
                await refresh()
                onCounting(queue)
              })
            }
          >
            Count stacks now?
          </button>
        ) : (
          <button
            className="btn"
            disabled={busy || seatedRows.length === 0}
            onClick={() => setConfirmEnd(true)}
          >
            End session
          </button>
        )}
      </div>

      {rebuyFor && (
        <Sheet onClose={() => setRebuyFor(null)}>
          <div className="sheet-title">{rebuyFor.name ?? rebuyFor.playerId}</div>
          <div className="hero">
            <div className="hero-money">{formatMoney(settings.defaultBuyInCents)}</div>
            <div className="hero-sub">
              {formatMelbourneTime(new Date(now))} · {ordinal(rebuyFor.rebuyCount + 1)} rebuy
              tonight
            </div>
          </div>
          <p className="muted">Log first, then hand over the rack.</p>
          <button
            className="btn btn--primary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await addRebuy(state.session.id, rebuyFor.playerId, settings.defaultBuyInCents)
                await refresh()
                setRebuyFor(null)
              })
            }
          >
            Confirm rebuy
          </button>
          <button className="btn" disabled={busy} onClick={() => setRebuyFor(null)}>
            Cancel
          </button>
        </Sheet>
      )}

      {pickingCashOut && (
        <Sheet onClose={() => setPickingCashOut(false)}>
          <div className="sheet-title">Who's cashing out?</div>
          <div className="list">
            {seatedRows.map((p) => (
              <button
                key={p.playerId}
                className="row"
                onClick={() => {
                  setPickingCashOut(false)
                  onCashOut(p.playerId)
                }}
              >
                <span className="row-main row-title">{p.name ?? p.playerId}</span>
                <span className="muted">in {formatMoney(p.buyInCents)}</span>
              </button>
            ))}
          </div>
          <button className="btn" onClick={() => setPickingCashOut(false)}>
            Cancel
          </button>
        </Sheet>
      )}

      {adding && (
        <AddPlayerSheet
          excludeIds={state.summary.players.map((p) => p.playerId)}
          pickLabel="Buy in"
          onPick={async (player: Player) => {
            await addBuyIn(state.session.id, player.id, settings.defaultBuyInCents)
            await refresh()
            setAdding(false)
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
