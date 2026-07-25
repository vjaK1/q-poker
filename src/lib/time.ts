/**
 * Timestamps are stored UTC (timestamptz) and displayed in Australia/Melbourne.
 * A session's logical day is the Melbourne calendar date of (started_at − 3h),
 * so a game running past midnight — or starting at 1am — belongs to the
 * previous evening. 3:00am exactly starts a new day.
 */

const MELBOURNE = 'Australia/Melbourne'
const LOGICAL_DAY_OFFSET_MS = 3 * 60 * 60 * 1000

function toInstant(ts: string | Date): Date {
  return typeof ts === 'string' ? new Date(ts) : ts
}

function shifted(ts: string | Date): Date {
  return new Date(toInstant(ts).getTime() - LOGICAL_DAY_OFFSET_MS)
}

/** Logical day of a timestamp as "YYYY-MM-DD" (Melbourne, 3am rule). */
export function logicalDayISO(ts: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MELBOURNE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(shifted(ts))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Derived session display name, e.g. "Fri 24 Jul" (Melbourne, 3am rule).
 * Built from fixed tables, not locale data — the text export must match the
 * spec byte-for-byte and CLDR locales disagree on abbreviations ("July", "Sept").
 */
export function sessionDisplayName(startedAt: string | Date): string {
  const [y, m, d] = logicalDayISO(startedAt).split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday} ${d} ${MONTHS[m - 1]}`
}

/** Elapsed duration for the live timer, e.g. "2h 14m" or "38m". */
export function formatElapsed(startedAt: string | Date, nowMs: number): string {
  const totalMinutes = Math.max(0, Math.floor((nowMs - toInstant(startedAt).getTime()) / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

/** Wall-clock time in Melbourne, e.g. "19:02". No logical-day shift — real time. */
export function formatMelbourneTime(ts: string | Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: MELBOURNE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(toInstant(ts))
}
