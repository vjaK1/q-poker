/**
 * 'light' is the Paper theme, 'dark' is Midnight (decided 2026-08-01).
 * Paper is the app's default; 'system' ("Match phone") is opt-in.
 */
export type ThemePref = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'qpoker.theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'light'
}

export function setThemePref(pref: ThemePref): void {
  localStorage.setItem(STORAGE_KEY, pref)
  applyTheme()
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  return pref === 'system' ? (darkQuery().matches ? 'dark' : 'light') : pref
}

function applyTheme(): void {
  document.documentElement.dataset.theme = resolve(getThemePref())
  // Keep the browser chrome in step with the active theme's background token.
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (bg && meta) meta.content = bg
}

export function initTheme(): void {
  applyTheme()
  darkQuery().addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme()
  })
}
