export type ThemePref = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'qpoker.theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
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
}

export function initTheme(): void {
  applyTheme()
  darkQuery().addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme()
  })
}
