import { useState } from 'react'
import { addRebuy, reconcileHint, saveSession, type LiveSessionState } from '../lib/ledger'
import { getSettings } from '../lib/settings'
import { formatMoney } from '../lib/money'
import { useBusy } from '../hooks/useBusy'
import { Sheet } from '../components/Sheet'

/**
 * Reconcile (§4.6): balanced → green banner and save; unbalanced → the delta
 * with a pattern-matched hint, a log-missed-rebuy shortcut, and an explicit
 * extra confirmation if saving anyway.
 */
export function ReconcileScreen({
  state,
  refresh,
  onSaved,
  onBackToCount,
}: {
  state: LiveSessionState
  refresh: () => Promise<void>
  onSaved: (note: string) => void
  onBackToCount: () => void
}) {
  const settings = getSettings()
  const { busy, error, run } = useBusy()
  const [confirmUnbalanced, setConfirmUnbalanced] = useState(false)
  const [loggingRebuy, setLoggingRebuy] = useState(false)

  const s = state.summary
  const hint = reconcileHint(s.discrepancyCents, settings.defaultBuyInCents, s.buyInsCents)

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onBackToCount} disabled={busy}>
          ‹ Count
        </button>
        <span className="screen-title">Reconcile</span>
        <span style={{ width: '4.5rem' }} />
      </header>

      <div className="card footer-stats">
        <span>
          Buy-ins logged
          <br />
          <strong>{formatMoney(s.buyInsCents)}</strong>
        </span>
        <span style={{ textAlign: 'right' }}>
          Cash-outs counted
          <br />
          <strong>{formatMoney(s.cashOutsCents)}</strong>
        </span>
      </div>

      {hint.kind === 'balanced' ? (
        <div className="banner banner--ok">Balanced — every dollar accounted for</div>
      ) : (
        <>
          <div className="banner banner--warn">Off by {formatMoney(s.discrepancyCents)}</div>
          {hint.kind === 'missed-rebuy' ? (
            <p className="muted">
              Exactly {hint.missedCount} buy-in{hint.missedCount === 1 ? '' : 's'} over. Likely an
              unlogged rebuy — check whether the cash box holds{' '}
              {formatMoney(hint.boxShouldHoldCents)}.
            </p>
          ) : (
            <p className="muted">
              Likely a miscount or chips off the table — recount the largest stacks.
            </p>
          )}
        </>
      )}

      <div className="list">
        {s.players.map((p) => (
          <div key={p.playerId} className="row">
            <span className="row-main row-title">{p.name ?? p.playerId}</span>
            <span className={`row-end ${p.netCents >= 0 ? 'pos' : 'neg'}`}>
              {formatMoney(p.netCents)}
            </span>
          </div>
        ))}
      </div>

      {error && <p className="notice notice--error">{error}</p>}

      {hint.kind === 'balanced' ? (
        <button
          className="btn btn--primary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await saveSession(state.session.id)
              onSaved('Session saved — balanced ✓')
            })
          }
        >
          Save session
        </button>
      ) : (
        <>
          {hint.kind === 'missed-rebuy' && (
            <button className="btn" disabled={busy} onClick={() => setLoggingRebuy(true)}>
              Log missed rebuy
            </button>
          )}
          {hint.kind === 'miscount' && (
            <button className="btn" disabled={busy} onClick={onBackToCount}>
              Back to the count
            </button>
          )}
          {confirmUnbalanced ? (
            <button
              className="btn btn--warn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await saveSession(state.session.id)
                  onSaved(`Session saved — off by ${formatMoney(s.discrepancyCents)}`)
                })
              }
            >
              Confirm — save off by {formatMoney(s.discrepancyCents)}
            </button>
          ) : (
            <button className="btn" disabled={busy} onClick={() => setConfirmUnbalanced(true)}>
              Save anyway
            </button>
          )}
        </>
      )}

      {loggingRebuy && (
        <Sheet onClose={() => setLoggingRebuy(false)}>
          <div className="sheet-title">Missed rebuy — who was it?</div>
          <div className="list">
            {s.players.map((p) => (
              <button
                key={p.playerId}
                className="row"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await addRebuy(state.session.id, p.playerId, settings.defaultBuyInCents)
                    await refresh()
                    setLoggingRebuy(false)
                  })
                }
              >
                <span className="row-main row-title">{p.name ?? p.playerId}</span>
                <span className="muted">+{formatMoney(settings.defaultBuyInCents)}</span>
              </button>
            ))}
          </div>
          <button className="btn" disabled={busy} onClick={() => setLoggingRebuy(false)}>
            Cancel
          </button>
        </Sheet>
      )}
    </div>
  )
}
