/**
 * Single-series line chart (bankroll over sessions). One hue (the theme
 * accent), 2px stroke, no legend needed for one series; the optional zero
 * baseline is recessive (border token).
 */
export function Sparkline({
  values,
  height = 40,
  showZeroLine = false,
}: {
  values: number[]
  height?: number
  showZeroLine?: boolean
}) {
  if (values.length < 2) return null

  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const span = max - min || 1
  const x = (i: number) => (i / (values.length - 1)) * 100
  const y = (v: number) => 95 - ((v - min) / span) * 90
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
      role="img"
      aria-label="Cumulative profit and loss by session"
    >
      {showZeroLine && (
        <line
          x1="0"
          y1={y(0)}
          x2="100"
          y2={y(0)}
          stroke="var(--border)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
