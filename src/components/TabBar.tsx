import type { ReactElement } from 'react'

export type Tab = 'home' | 'sessions' | 'board'

const ICONS: Record<Tab, ReactElement> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1Z" />
    </svg>
  ),
  sessions: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="7" x2="19" y2="7" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="5" y1="17" x2="13" y2="17" />
    </svg>
  ),
  board: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="11" width="4" height="9" rx="1" />
      <rect x="10" y="5" width="4" height="15" rx="1" />
      <rect x="16" y="14" width="4" height="6" rx="1" />
    </svg>
  ),
}

/** Bottom tabs (§4): Home, Sessions, Board. */
export function TabBar({
  active,
  onHome,
  onSessions,
  onBoard,
}: {
  active: Tab
  onHome: () => void
  onSessions: () => void
  onBoard: () => void
}) {
  return (
    <nav className="tabbar">
      <button className={`tab ${active === 'home' ? 'tab--active' : ''}`} onClick={onHome}>
        {ICONS.home}
        Home
      </button>
      <button
        className={`tab ${active === 'sessions' ? 'tab--active' : ''}`}
        onClick={onSessions}
      >
        {ICONS.sessions}
        Sessions
      </button>
      <button className={`tab ${active === 'board' ? 'tab--active' : ''}`} onClick={onBoard}>
        {ICONS.board}
        Board
      </button>
    </nav>
  )
}
