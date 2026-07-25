import { describe, expect, it } from 'vitest'
import { formatMelbourneTime, logicalDayISO, sessionDisplayName } from './time'

describe('logicalDayISO — 3am rule, Melbourne', () => {
  it('assigns a past-midnight game to the previous evening', () => {
    // 01:30 Sat 25 Jul AEST (+10)
    expect(logicalDayISO('2026-07-24T15:30:00Z')).toBe('2026-07-24')
  })
  it('2:59am still belongs to the previous day', () => {
    expect(logicalDayISO('2026-07-24T16:59:00Z')).toBe('2026-07-24')
  })
  it('3:00am exactly starts the new day', () => {
    expect(logicalDayISO('2026-07-24T17:00:00Z')).toBe('2026-07-25')
  })
  it('an evening start is its own day', () => {
    // 19:02 Fri 24 Jul AEST
    expect(logicalDayISO('2026-07-24T09:02:00Z')).toBe('2026-07-24')
  })
  it('handles daylight saving (AEDT, +11)', () => {
    // 01:30 Sat 10 Jan AEDT
    expect(logicalDayISO('2026-01-09T14:30:00Z')).toBe('2026-01-09')
  })
})

describe('sessionDisplayName', () => {
  it('matches the spec format: Fri 24 Jul', () => {
    expect(sessionDisplayName('2026-07-24T09:02:00Z')).toBe('Fri 24 Jul')
  })
  it('uses the logical day for past-midnight starts', () => {
    // 01:30 Sat 25 Jul AEST still reads as Friday's session
    expect(sessionDisplayName('2026-07-24T15:30:00Z')).toBe('Fri 24 Jul')
  })
  it('does not zero-pad the day', () => {
    expect(sessionDisplayName('2026-07-03T09:00:00Z')).toBe('Fri 3 Jul')
  })
})

describe('formatMelbourneTime', () => {
  it('shows real wall-clock time, no logical-day shift', () => {
    expect(formatMelbourneTime('2026-07-24T09:02:00Z')).toBe('19:02')
  })
})
