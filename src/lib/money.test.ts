import { describe, expect, it } from 'vitest'
import {
  assertCents,
  centsToDollars,
  denominationsTotalCents,
  dollarsToCents,
  formatMoney,
  formatSignedMoney,
} from './money'

describe('centsToDollars', () => {
  it('formats with two decimals always', () => {
    expect(centsToDollars(4470)).toBe('44.70')
    expect(centsToDollars(0)).toBe('0.00')
    expect(centsToDollars(5)).toBe('0.05')
    expect(centsToDollars(100000)).toBe('1000.00')
  })
  it('handles negatives', () => {
    expect(centsToDollars(-460)).toBe('-4.60')
    expect(centsToDollars(-6000)).toBe('-60.00')
  })
  it('rejects non-integers', () => {
    expect(() => centsToDollars(44.7)).toThrow()
  })
})

describe('formatMoney', () => {
  it('puts the sign before the symbol', () => {
    expect(formatMoney(4470)).toBe('$44.70')
    expect(formatMoney(-460)).toBe('-$4.60')
    expect(formatMoney(0)).toBe('$0.00')
  })
})

describe('formatSignedMoney', () => {
  it('shows explicit plus, bare zero, and minus', () => {
    expect(formatSignedMoney(1000)).toBe('+$10.00')
    expect(formatSignedMoney(-460)).toBe('-$4.60')
    expect(formatSignedMoney(0)).toBe('$0.00')
  })
})

describe('dollarsToCents', () => {
  it('parses whole and fractional dollars', () => {
    expect(dollarsToCents('10')).toBe(1000)
    expect(dollarsToCents('10.5')).toBe(1050)
    expect(dollarsToCents('10.50')).toBe(1050)
    expect(dollarsToCents('0.05')).toBe(5)
    expect(dollarsToCents('$10')).toBe(1000)
    expect(dollarsToCents('-4.60')).toBe(-460)
  })
  it('rejects malformed input', () => {
    expect(() => dollarsToCents('1,000')).toThrow()
    expect(() => dollarsToCents('10.555')).toThrow()
    expect(() => dollarsToCents('ten')).toThrow()
    expect(() => dollarsToCents('')).toThrow()
  })
})

describe('assertCents', () => {
  it('accepts non-negative integers', () => {
    expect(() => assertCents(0)).not.toThrow()
    expect(() => assertCents(1000)).not.toThrow()
  })
  it('rejects floats and negatives', () => {
    expect(() => assertCents(10.5)).toThrow()
    expect(() => assertCents(-1)).toThrow()
  })
})

describe('denominationsTotalCents', () => {
  it('sums the spec example: {"100": 4, "25": 12, "5": 10} = 750', () => {
    expect(denominationsTotalCents({ '100': 4, '25': 12, '5': 10 })).toBe(750)
  })
  it('rejects bad keys and counts', () => {
    expect(() => denominationsTotalCents({ '2.5': 1 })).toThrow()
    expect(() => denominationsTotalCents({ '100': 1.5 })).toThrow()
    expect(() => denominationsTotalCents({ '0': 3 })).toThrow()
  })
})
