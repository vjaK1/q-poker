import { useEffect, useState } from 'react'
import {
  getLeaderboard,
  RATE_STAT_MIN_SESSIONS,
  type BoardSort,
  type BoardWindow,
  type LeaderboardRow,
} from '../lib/ledger'
import { formatSignedMoney } from '../lib/money'
import { NetBarChart } from '../components/NetBarChart'

const WINDOWS: Array<{ key: BoardWindow; label: string }> = [
  { key: 'all', label: 'All-time' },
  { key: 'last10', label: 'Last 10' },
  { key: 'month', label: 'Month' },
]

const SORTS: Array<{ key: BoardSort; label: string }> = [
  { key: 'net', label: 'Net P/L' },
  { key: 'hourly', label: '$/hr' },
  { key: 'games', label: 'Games played' },
  { key: 'hours', label: 'Hours played' },
  { key: 'winRate', label: 'Win rate' },
]

export function hoursLabel(seatMs: number): string {
  return `${Math.round(seatMs / 3_600_000)}h`
}

/** Board tab (§4.8): windows, sorts, ranked rows, guests hidden by default. */
export function BoardScreen({ onOpenPlayer }: { onOpenPlayer: (playerId: string) => void }) {
  const [window, setWindow] = useState<BoardWindow>('all')
  const [sort, setSort] = useState<BoardSort>('net')
  const [includeGuests, setIncludeGuests] = useState(false)
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    getLeaderboard({ window, sort, includeGuests })
      .then((r) => {
        if (!cancelled) setRows(r)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [window, sort, includeGuests])

  return (
    <div className="screen screen--tabbed">
      <header className="app-header">
        <h1>Board</h1>
      </header>

      <div className="chips">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            className={`chip ${window === w.key ? 'chip--active' : ''}`}
            onClick={() => setWindow(w.key)}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="btn-row" style={{ alignItems: 'center' }}>
        <select
          className="select"
          value={sort}
          onChange={(e) => setSort(e.target.value as BoardSort)}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
        <label className="chip" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={includeGuests}
            onChange={(e) => setIncludeGuests(e.target.checked)}
          />
          Guests
        </label>
      </div>

      {error && <p className="notice notice--error">{error}</p>}
      {rows === null && !error && <p className="muted">Loading…</p>}
      {rows !== null && rows.length === 0 && (
        <p className="muted">No saved sessions in this window yet.</p>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="card">
          <span className="muted">Net P/L</span>
          <NetBarChart rows={rows} />
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="list">
          {rows.map((r, i) => (
            <button key={r.player.id} className="row" onClick={() => onOpenPlayer(r.player.id)}>
              <span className="board-rank">{i + 1}</span>
              <span className="row-main">
                <span className="row-title">
                  {r.player.name}
                  {r.player.isGuest ? ' (guest)' : ''}
                </span>
                <span className="row-sub">
                  {r.games} game{r.games === 1 ? '' : 's'} · {hoursLabel(r.seatMs)}
                </span>
              </span>
              <span className={`row-end ${r.netCents >= 0 ? 'pos' : 'neg'}`}>
                {formatSignedMoney(r.netCents)}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="muted">Rate stats need {RATE_STAT_MIN_SESSIONS}+ games.</p>
    </div>
  )
}
