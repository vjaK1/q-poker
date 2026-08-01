import type { LeaderboardRow } from '../lib/ledger'

/**
 * Diverging horizontal bars: net P/L per player around a shared zero axis,
 * winners right in --pos, losers left in --neg. Bars always encode net;
 * row order is taken from the caller, so the chart lines up name-for-name
 * with the ranked list below under every sort and direction.
 * Exact figures live in the ranked list below, so bars stay unlabelled;
 * the chart is hidden from screen readers because that list is the
 * accessible table view of the same data.
 */
export function NetBarChart({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) return null

  const maxPos = Math.max(0, ...rows.map((r) => r.netCents))
  const maxNeg = Math.max(0, ...rows.map((r) => -r.netCents))
  const span = maxPos + maxNeg || 1
  const zeroPct = (maxNeg / span) * 100

  return (
    <div aria-hidden="true">
      {rows.map((r) => {
        const widthPct = (Math.abs(r.netCents) / span) * 100
        const positive = r.netCents >= 0
        return (
          <div key={r.player.id} className="netbar-row">
            <span className="netbar-name">{r.player.name}</span>
            <span className="netbar-track">
              <span className="netbar-axis" style={{ left: `${zeroPct}%` }} />
              <span
                className={`netbar-bar ${positive ? 'netbar-bar--pos' : 'netbar-bar--neg'}`}
                style={
                  positive
                    ? { left: `${zeroPct}%`, width: `${widthPct}%` }
                    : { left: `${zeroPct - widthPct}%`, width: `${widthPct}%` }
                }
              />
            </span>
          </div>
        )
      })}
    </div>
  )
}
