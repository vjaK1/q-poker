/**
 * Local settings (agreed 2026-07-25): single user, one phone — these live in
 * localStorage, not the database. Settings UI arrives in milestone 6; until
 * then the defaults below are what the app uses.
 */

export interface Settings {
  defaultBuyInCents: number
  /** Chip values driving the cash-out steppers, largest first. */
  denominationsCents: number[]
}

const DEFAULTS: Settings = {
  defaultBuyInCents: 1000,
  // $10, $1.00, $0.25, $0.05 (Victor's game; editable UI arrives in milestone 6)
  denominationsCents: [1000, 100, 25, 5],
}

const STORAGE_KEY = 'qpoker.settings'

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      defaultBuyInCents:
        Number.isInteger(parsed.defaultBuyInCents) && parsed.defaultBuyInCents! > 0
          ? parsed.defaultBuyInCents!
          : DEFAULTS.defaultBuyInCents,
      denominationsCents:
        Array.isArray(parsed.denominationsCents) &&
        parsed.denominationsCents.length > 0 &&
        parsed.denominationsCents.every((d) => Number.isInteger(d) && d > 0)
          ? parsed.denominationsCents
          : [...DEFAULTS.denominationsCents],
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setSettings(partial: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...partial }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
