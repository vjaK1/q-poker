import { useEffect, useState } from 'react'
import {
  discardSession,
  getSessionDetail,
  type LedgerEvent,
  type SessionDetail,
} from '../lib/ledger'
import { formatMoney, formatSignedMoney } from '../lib/money'
import { formatMelbourneTime, sessionDisplayName } from '../lib/time'
import { useBusy } from '../hooks/useBusy'

/** Session detail (§4.7): per-player summary plus the full audit trail. */
export function SessionDetailScreen({
  sessionId,
  onBack,
  onExport,
}: {
  sessionId: string
  onBack: () => void
  onExport: (sessionId: string) => void
}) {
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const { busy, error, run } = useBusy()

  useEffect(() => {
    let cancelled = false
    getSessionDetail(sessionId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loadError !== null) {
    return (
      <div className="screen">
        <p className="notice notice--error">{loadError}</p>
        <button className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    )
  }

  if (detail === null) {
    return (
      <div className="screen screen--center">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  const nameOf = (playerId: string) =>
    detail.players.find((p) => p.id === playerId)?.name ?? 'Player'

  const describe = (e: LedgerEvent): string => {
    switch (e.type) {
      case 'buy_in':
        return `${nameOf(e.playerId)} bought in`
      case 'rebuy':
        return `${nameOf(e.playerId)} rebought`
      case 'cash_out':
        return `${nameOf(e.playerId)} cashed out`
      case 'correction': {
        const target = detail.events.find((t) => t.id === e.correctsTransactionId)
        const what = target ? `${describe(target)} ${formatMoney(target.amountCents)}` : 'an entry'
        return `Correction (${e.note ?? 'no note'}): voided ${what}`
      }
    }
  }

  const signedCents = (e: LedgerEvent): number | null => {
    switch (e.type) {
      case 'buy_in':
      case 'rebuy':
        return e.amountCents
      case 'cash_out':
        return -e.amountCents
      case 'correction':
        return null
    }
  }

  const s = detail.summary

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onBack}>
          ‹ Sessions
        </button>
        <span className="screen-title">{sessionDisplayName(detail.session.startedAt)}</span>
        <span style={{ width: '4.5rem' }} />
      </header>

      <div className="card footer-stats">
        <span>
          In
          <br />
          <strong>{formatMoney(s.buyInsCents)}</strong>
        </span>
        <span style={{ textAlign: 'center' }}>
          Out
          <br />
          <strong>{formatMoney(s.cashOutsCents)}</strong>
        </span>
        <span style={{ textAlign: 'right' }}>
          {s.balanced ? (
            <span className="check">Balanced ✓</span>
          ) : (
            <span style={{ color: 'var(--warn)' }}>Off by {formatMoney(s.discrepancyCents)}</span>
          )}
        </span>
      </div>

      <div className="list">
        {s.players.map((p) => (
          <div key={p.playerId} className="row">
            <span className="row-main">
              <span className="row-title">{p.name ?? p.playerId}</span>
              <span className="row-amount">
                In for {formatMoney(p.buyInCents)} · out {formatMoney(p.cashOutCents)}
              </span>
            </span>
            <span className={`row-end ${p.netCents >= 0 ? 'pos' : 'neg'}`}>
              {formatSignedMoney(p.netCents)}
            </span>
          </div>
        ))}
      </div>

      <h2 className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
        Audit trail
      </h2>
      <div className="list">
        {detail.events.map((e) => (
          <div
            key={e.id}
            className={`row ${e.voided ? 'audit-row--voided' : ''} ${
              e.type === 'correction' ? 'audit-row--correction' : ''
            }`}
          >
            <span className="row-main">
              <span className="row-title" style={{ fontWeight: 500 }}>
                {describe(e)}
              </span>
              <span className="row-sub">{formatMelbourneTime(e.createdAt)}</span>
            </span>
            <span className="row-end">
              {signedCents(e) !== null && (
                <span className={signedCents(e)! >= 0 ? 'pos' : 'neg'}>
                  {formatSignedMoney(signedCents(e)!)}
                </span>
              )}
              <span className="row-sub" style={{ display: 'block' }}>
                table {formatMoney(e.runningTableCents)}
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="muted">
        {s.correctionsCount === 0
          ? 'No corrections'
          : `${s.correctionsCount} correction${s.correctionsCount === 1 ? '' : 's'}`}
      </p>

      <button className="btn btn--primary" onClick={() => onExport(sessionId)}>
        Export
      </button>

      {error && <p className="notice notice--error">{error}</p>}

      {confirmDiscard ? (
        <div className="btn-row">
          <button
            className="btn btn--danger"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await discardSession(sessionId)
                onBack()
              })
            }
          >
            Yes, discard this session
          </button>
          <button className="btn" disabled={busy} onClick={() => setConfirmDiscard(false)}>
            Keep it
          </button>
        </div>
      ) : (
        <button
          className="btn btn--danger"
          disabled={busy}
          onClick={() => setConfirmDiscard(true)}
        >
          Discard session
        </button>
      )}
    </div>
  )
}
