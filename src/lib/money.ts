import type { Denominations } from './types'

/**
 * Money is integer cents everywhere in storage and logic. These helpers do the
 * cents ↔ display conversion with pure integer/string math — no floats, ever.
 */

export function assertCents(value: number, label = 'amount'): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer number of cents, got ${value}`)
  }
}

/** 4470 → "44.70", -460 → "-4.60". Always two decimals, no symbol. */
export function centsToDollars(cents: number): string {
  if (!Number.isInteger(cents)) throw new Error(`cents must be an integer, got ${cents}`)
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

/** 4470 → "$44.70", -460 → "-$4.60". */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${centsToDollars(Math.abs(cents))}`
}

/** "10", "10.5", "10.50", "$10", "-4.60" → integer cents. Throws on anything else. */
export function dollarsToCents(input: string): number {
  const m = /^(-?)\$?(\d+)(?:\.(\d{1,2}))?$/.exec(input.trim().replace(/^\$-/, '-$'))
  if (!m) throw new Error(`Not a dollar amount: "${input}"`)
  const [, sign, whole, frac = ''] = m
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0') || '0')
  return sign === '-' ? -cents : cents
}

/** Sum of a cash-out chip breakdown, validating shape as it goes. */
export function denominationsTotalCents(denoms: Denominations): number {
  let total = 0
  for (const [key, count] of Object.entries(denoms)) {
    const denomCents = Number(key)
    if (!Number.isInteger(denomCents) || denomCents <= 0) {
      throw new Error(`Denomination keys must be positive integer cents, got "${key}"`)
    }
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`Denomination counts must be non-negative integers, got ${count} for "${key}"`)
    }
    total += denomCents * count
  }
  return total
}
