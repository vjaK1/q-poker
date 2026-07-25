import { seatedPlayerIds, type LiveSessionState } from '../lib/ledger'
import { formatMoney } from '../lib/money'

/**
 * Count queue (§4.5): work through every player still seated when the session
 * ended. The footer is the mid-count tripwire — "remaining should hold $Y"
 * shrinks as counts land; if the physical stacks can't hold Y, something is
 * already wrong.
 */
export function CountQueueScreen({
  state,
  queueIds,
  onCount,
  onRecount,
  onReconcile,
  onHome,
}: {
  state: LiveSessionState
  queueIds: string[]
  onCount: (playerId: string) => void
  onRecount: (playerId: string, cashOutTxId: string) => void
  onReconcile: () => void
  onHome: () => void
}) {
  const seated = new Set(seatedPlayerIds(state.events))

  const members = queueIds.map((id) => {
    const ps = state.summary.players.find((p) => p.playerId === id)
    const name = ps?.name ?? state.players.find((p) => p.id === id)?.name ?? 'Player'
    const lastCashOut = [...state.events]
      .reverse()
      .find((e) => e.playerId === id && !e.voided && e.type === 'cash_out')
    const done = !seated.has(id) && lastCashOut !== undefined
    return { id, name, lastCashOut, done }
  })

  const doneCount = members.filter((m) => m.done).length
  const countedCents = members
    .filter((m) => m.done)
    .reduce((sum, m) => sum + (m.lastCashOut?.amountCents ?? 0), 0)
  const allCounted = members.length > 0 && doneCount === members.length

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onHome}>
          ‹ Home
        </button>
        <span className="screen-title">
          Count ending stacks · {doneCount} of {members.length}
        </span>
        <span style={{ width: '4.5rem' }} />
      </header>

      <div className="list">
        {members.map((m) =>
          m.done ? (
            <button
              key={m.id}
              className="row row--dim"
              onClick={() => onRecount(m.id, m.lastCashOut!.id)}
            >
              <span className="row-main">
                <span className="row-title">{m.name}</span>
                <span className="row-sub">
                  {m.lastCashOut!.secondCountConfirmed ? '2nd count ✓' : '2nd count skipped'} ·
                  tap to recount
                </span>
              </span>
              <span className="row-end">{formatMoney(m.lastCashOut!.amountCents)}</span>
            </button>
          ) : (
            <button key={m.id} className="row" onClick={() => onCount(m.id)}>
              <span className="row-main">
                <span className="row-title">{m.name}</span>
                <span className="row-sub">waiting to be counted</span>
              </span>
              <span className="muted">Count →</span>
            </button>
          ),
        )}
      </div>

      <div className="card footer-stats">
        <span>
          Counted so far
          <br />
          <strong>{formatMoney(countedCents)}</strong>
        </span>
        <span style={{ textAlign: 'right' }}>
          Remaining should hold
          <br />
          <strong>{formatMoney(state.summary.onTableCents)}</strong>
        </span>
      </div>

      {allCounted && (
        <button className="btn btn--primary" onClick={onReconcile}>
          Everyone counted — reconcile →
        </button>
      )}
    </div>
  )
}
