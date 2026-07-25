export type Tab = 'home' | 'sessions' | 'board'

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
        Home
      </button>
      <button
        className={`tab ${active === 'sessions' ? 'tab--active' : ''}`}
        onClick={onSessions}
      >
        Sessions
      </button>
      <button className={`tab ${active === 'board' ? 'tab--active' : ''}`} onClick={onBoard}>
        Board
      </button>
    </nav>
  )
}
