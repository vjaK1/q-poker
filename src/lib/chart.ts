/**
 * Pure layout maths for the bankroll chart. Kept out of the component so the
 * tick and label choices are unit-testable.
 */

/** Gridline steps in cents: whole dollars, multiples of $5, so labels never need cents. */
const STEPS = [
  500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000,
  1000000,
]

/**
 * Gridline values covering [loCents, hiCents], always including $0, on a
 * "nice" step chosen so there are at most `maxIntervals` steps across the
 * data (the floor/ceil to whole steps can add one at each end). Always at
 * least two ticks, so the chart has a non-zero vertical range.
 */
export function moneyTicks(loCents: number, hiCents: number, maxIntervals = 4): number[] {
  const lo = Math.min(loCents, 0)
  const hi = Math.max(hiCents, 0)
  const span = Math.max(hi - lo, 1)
  const step = STEPS.find((s) => span / s <= maxIntervals) ?? STEPS[STEPS.length - 1]
  const first = Math.floor(lo / step) * step
  let last = Math.ceil(hi / step) * step
  if (last === first) last = first + step
  const ticks: number[] = []
  for (let v = first; v <= last; v += step) ticks.push(v)
  return ticks
}

/**
 * Which points get a date label along the bottom. Point 0 is the $0 start
 * line and never labelled; games are points 1..pointCount-1. Labels spread
 * evenly by game number and always include the latest game.
 */
export function labelIndices(pointCount: number, maxLabels: number): number[] {
  const games = pointCount - 1
  if (games <= 0) return []
  const k = Math.max(1, Math.min(maxLabels, games))
  if (k === 1) return [games]
  const out = new Set<number>()
  for (let j = 0; j < k; j++) out.add(1 + Math.round((j * (games - 1)) / (k - 1)))
  return [...out].sort((a, b) => a - b)
}
