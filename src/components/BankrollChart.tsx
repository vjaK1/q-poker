import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import type { PlayerSeriesPoint } from '../lib/ledger'
import { labelIndices, moneyTicks } from '../lib/chart'
import { formatSignedMoney } from '../lib/money'
import { sessionDisplayName, sessionShortDate } from '../lib/time'

const PAD = { top: 10, right: 10, bottom: 22, left: 46 }

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Whole-dollar axis label: "$120", "-$40", "$0". Ticks are multiples of $5. */
function tickLabel(cents: number): string {
  return `${cents < 0 ? '-' : ''}$${Math.abs(cents) / 100}`
}

/** Measured width of a block, so the SVG can draw in real pixels and keep text undistorted. */
function useWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.getBoundingClientRect().width)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

/**
 * Bankroll after each game (Home card and player profile). One step per game
 * along the bottom with dates, whole-dollar gridlines with a stronger $0 line,
 * and a touch or hover readout above the plot: the date, that night's net and
 * the bankroll after it. Idle, the readout shows the latest game. One series,
 * one hue (the accent), so no legend.
 */
export function BankrollChart({
  series,
  height = 170,
}: {
  series: PlayerSeriesPoint[]
  height?: number
}) {
  const [wrapRef, width] = useWidth()
  const svgRef = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState<number | null>(null)

  if (series.length === 0) return null

  // Point 0 is the $0 start line; point i is game i.
  const values = [0, ...series.map((p) => p.cumulativeCents)]
  const last = values.length - 1
  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const plotH = height - PAD.top - PAD.bottom
  const ticks = moneyTicks(
    Math.min(...values),
    Math.max(...values),
    clamp(Math.floor(plotH / 40), 2, 5),
  )
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const x = (i: number) => PAD.left + (i / last) * plotW
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo)) * plotH

  const line = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${x(last).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`

  const indexAt = (clientX: number): number => {
    const svg = svgRef.current
    if (!svg) return last
    const px = clientX - svg.getBoundingClientRect().left
    return clamp(Math.round(((px - PAD.left) / plotW) * last), 0, last)
  }
  const scrub = (e: ReactPointerEvent<SVGSVGElement>) => setActive(indexAt(e.clientX))

  const shown = active ?? last
  const game = shown === 0 ? null : series[shown - 1]
  const xLabels = labelIndices(values.length, clamp(Math.floor(plotW / 64), 2, 6))

  return (
    <div className="bankroll-chart">
      <div className="chart-readout" aria-live="polite">
        <span className="muted">
          {game
            ? `${sessionDisplayName(game.session.startedAt)} · game ${shown} of ${series.length}`
            : 'Start'}
        </span>
        <span>
          {game && (
            <>
              <span className="muted">Night </span>
              <span className={game.netCents > 0 ? 'pos' : game.netCents < 0 ? 'neg' : ''}>
                {formatSignedMoney(game.netCents)}
              </span>
              <span className="muted"> · </span>
            </>
          )}
          <span className="muted">Bankroll </span>
          <strong>{formatSignedMoney(values[shown])}</strong>
        </span>
      </div>

      <div ref={wrapRef} style={{ minHeight: height }}>
        {width > 0 && (
          <svg
            ref={svgRef}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`Bankroll after each of ${series.length} games, now ${formatSignedMoney(values[last])}. Touch to read a game.`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              scrub(e)
            }}
            onPointerMove={scrub}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') setActive(null)
            }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? 'var(--muted)' : 'var(--border)'}
                  strokeOpacity={t === 0 ? 0.7 : 1}
                  strokeWidth={1}
                />
                <text className="chart-label" x={PAD.left - 6} y={y(t) + 3.5} textAnchor="end">
                  {tickLabel(t)}
                </text>
              </g>
            ))}
            {xLabels.map((i) => (
              <text
                key={i}
                className="chart-label"
                x={x(i)}
                y={height - 6}
                textAnchor={i === last ? 'end' : x(i) < PAD.left + 20 ? 'start' : 'middle'}
              >
                {sessionShortDate(series[i - 1].session.startedAt)}
              </text>
            ))}
            <path d={area} fill="var(--accent)" fillOpacity={0.08} />
            <path
              d={line}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {active !== null && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="var(--muted)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
            <circle
              cx={x(shown)}
              cy={y(values[shown])}
              r={active === null ? 3.5 : 5}
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          </svg>
        )}
      </div>
    </div>
  )
}
