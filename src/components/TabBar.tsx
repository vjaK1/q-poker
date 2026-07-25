export type Tab = 'home' | 'sessions'

/** Bottom tabs (§4). Board joins in milestone 5. */
export function TabBar({
  active,
  onHome,
  onSessions,
}: {
  active: Tab
  onHome: () => void
  onSessions: () => void
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
    </nav>
  )
}
