import { describe, expect, it } from 'vitest'
import {
  formatElapsed,
  formatMelbourneISO,
  formatMelbourneTime,
  logicalDayISO,
  sessionDisplayName,
} from './time'

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

describe('formatElapsed', () => {
  const start = '2026-07-24T09:00:00Z'
  it('shows hours and minutes', () => {
    expect(formatElapsed(start, Date.parse('2026-07-24T11:14:30Z'))).toBe('2h 14m')
  })
  it('shows minutes only under an hour', () => {
    expect(formatElapsed(start, Date.parse('2026-07-24T09:38:00Z'))).toBe('38m')
  })
  it('never goes negative', () => {
    expect(formatElapsed(start, Date.parse('2026-07-24T08:59:00Z'))).toBe('0m')
  })
})

describe('formatMelbourneISO', () => {
  it('renders AEST (+10:00) in winter', () => {
    expect(formatMelbourneISO('2026-07-24T09:02:00Z')).toBe('2026-07-24T19:02:00+10:00')
  })
  it('renders AEDT (+11:00) in summer', () => {
    expect(formatMelbourneISO('2026-01-09T14:30:00Z')).toBe('2026-01-10T01:30:00+11:00')
  })
  it('renders midnight as 00, not 24', () => {
    expect(formatMelbourneISO('2026-07-24T14:00:00Z')).toBe('2026-07-25T00:00:00+10:00')
  })
})

describe('formatMelbourneTime', () => {
  it('shows real wall-clock time, no logical-day shift', () => {
    expect(formatMelbourneTime('2026-07-24T09:02:00Z')).toBe('19:02')
  })
})
