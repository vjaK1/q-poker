import { useState } from 'react'
import { addCashOut, addCorrection, type Denominations, type LiveSessionState } from '../lib/ledger'
import { getSettings } from '../lib/settings'
import { centsToDollars, formatMoney } from '../lib/money'
import { useBusy } from '../hooks/useBusy'

/**
 * Cash-out (§4.4): denomination steppers → auto total → awaiting 2nd count →
 * confirm (second_count_confirmed = true) or skip (false). Only then is the
 * cash_out row inserted. When recounting (from the count queue), the old
 * cash_out is first voided with a correction, then the new count is inserted.
 */
export function CashOutScreen({
  state,
  playerId,
  recountsTxId,
  refresh,
  onDone,
  onCancel,
}: {
  state: LiveSessionState
  playerId: string
  /** Set when this count replaces an earlier cash_out (recount flow). */
  recountsTxId?: string
  refresh: () => Promise<void>
  onDone: () => void
  onCancel: () => void
}) {
  const settings = getSettings()
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [awaitingSecond, setAwaitingSecond] = useState(false)
  const { busy, error, run } = useBusy()

  const summary = state.summary.players.find((p) => p.playerId === playerId)
  const name = summary?.name ?? state.players.find((p) => p.id === playerId)?.name ?? 'Player'
  const boughtIn = summary?.buyInCents ?? 0
  const priorCashOut =
    recountsTxId === undefined
      ? (summary?.cashOutCents ?? 0)
      : (summary?.cashOutCents ?? 0) -
        (state.events.find((e) => e.id === recountsTxId)?.amountCents ?? 0)

  const totalCents = settings.denominationsCents.reduce(
    (sum, d) => sum + d * (counts[d] ?? 0),
    0,
  )
  const netAfter = priorCashOut + totalCents - boughtIn

  function bump(denom: number, delta: number) {
    setCounts((c) => ({ ...c, [denom]: Math.max(0, (c[denom] ?? 0) + delta) }))
  }

  function breakdown(): Denominations | null {
    const entries = settings.denominationsCents
      .filter((d) => (counts[d] ?? 0) > 0)
      .map((d) => [String(d), counts[d]] as const)
    return entries.length > 0 ? Object.fromEntries(entries) : null
  }

  async function insert(secondCountConfirmed: boolean) {
    if (recountsTxId !== undefined) {
      await addCorrection({
        sessionId: state.session.id,
        playerId,
        correctsTransactionId: recountsTxId,
        note: 'Recount',
      })
    }
    await addCashOut(state.session.id, playerId, totalCents, breakdown(), secondCountConfirmed)
    await refresh()
    onDone()
  }

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onCancel} disabled={busy}>
          ‹ Back
        </button>
        <span className="screen-title">
          {recountsTxId !== undefined ? 'Recount' : 'Cash out'} · {name}
        </span>
        <span style={{ width: '4.5rem' }} />
      </header>

      {!awaitingSecond ? (
        <>
          <div className="list">
            {settings.denominationsCents.map((d) => (
              <div key={d} className="stepper-row">
                <span className="stepper-label">{formatMoney(d)}</span>
                <span className="stepper">
                  <button disabled={busy || (counts[d] ?? 0) === 0} onClick={() => bump(d, -1)}>
                    −
                  </button>
                  <span className="stepper-count">{counts[d] ?? 0}</span>
                  <button disabled={busy} onClick={() => bump(d, 1)}>
                    +
                  </button>
                </span>
                <span className="stepper-subtotal">
                  {centsToDollars(d * (counts[d] ?? 0))}
                </span>
              </div>
            ))}
          </div>

          <div className="hero">
            <div className="hero-money">{formatMoney(totalCents)}</div>
            <div className="hero-sub">
              Bought in {formatMoney(boughtIn)} · net{' '}
              <span className={netAfter >= 0 ? 'pos' : 'neg'}>{formatMoney(netAfter)}</span>
            </div>
          </div>

          <button className="btn btn--primary" disabled={busy} onClick={() => setAwaitingSecond(true)}>
            First count done
          </button>
        </>
      ) : (
        <>
          <div className="banner banner--warn">Awaiting 2nd count</div>
          <p className="muted">
            Hand the stack to someone else. They recount it and confirm the total below matches.
          </p>
          <div className="list">
            {settings.denominationsCents
              .filter((d) => (counts[d] ?? 0) > 0)
              .map((d) => (
                <div key={d} className="stepper-row">
                  <span className="stepper-label">{formatMoney(d)}</span>
                  <span className="stepper-count">× {counts[d]}</span>
                  <span className="stepper-subtotal" style={{ marginLeft: 'auto' }}>
                    {centsToDollars(d * (counts[d] ?? 0))}
                  </span>
                </div>
              ))}
          </div>
          <div className="hero">
            <div className="hero-money">{formatMoney(totalCents)}</div>
            <div className="hero-sub">
              Bought in {formatMoney(boughtIn)} · net{' '}
              <span className={netAfter >= 0 ? 'pos' : 'neg'}>{formatMoney(netAfter)}</span>
            </div>
          </div>

          <button
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void run(() => insert(true))}
          >
            Confirm 2nd count ✓
          </button>
          <div className="btn-row">
            <button className="btn" disabled={busy} onClick={() => setAwaitingSecond(false)}>
              Adjust count
            </button>
            <button className="btn" disabled={busy} onClick={() => void run(() => insert(false))}>
              Skip 2nd count
            </button>
          </div>
        </>
      )}

      {error && <p className="notice notice--error">{error}</p>}
    </div>
  )
}
