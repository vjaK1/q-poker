import { useEffect, useState } from 'react'
import { listPlayers, type Player } from '../lib/ledger'
import { getSettings, setSettings } from '../lib/settings'
import { signOut } from '../lib/auth'
import { Sheet } from './Sheet'

/**
 * Minimal settings behind the Home gear: the "this is me" picker and sign
 * out. Theme, default buy-in, denominations and player management arrive in
 * milestone 6 on this same surface.
 */
export function SettingsSheet({
  email,
  onClose,
  onChanged,
}: {
  email: string | null
  onClose: () => void
  onChanged: () => void
}) {
  const [players, setPlayers] = useState<Player[] | null>(null)
  const [myPlayerId, setMyPlayerId] = useState(getSettings().myPlayerId)

  useEffect(() => {
    let cancelled = false
    listPlayers()
      .then((p) => {
        if (!cancelled) setPlayers(p)
      })
      .catch(() => {
        if (!cancelled) setPlayers([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function pick(id: string | null) {
    setSettings({ myPlayerId: id })
    setMyPlayerId(id)
    onChanged()
  }

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">Settings</div>

      <p className="muted">This is me (drives Your bankroll and your net):</p>
      {players === null && <p className="muted">Loading players…</p>}
      {players !== null && (
        <div className="list">
          {players.map((p) => (
            <button key={p.id} className="row" onClick={() => pick(p.id)}>
              <span className="row-main row-title">{p.name}</span>
              {myPlayerId === p.id && <span className="check">✓</span>}
            </button>
          ))}
          {myPlayerId !== null && (
            <button className="row row--dim" onClick={() => pick(null)}>
              <span className="row-main">Clear selection</span>
            </button>
          )}
          {players.length === 0 && (
            <div className="row row--dim">
              <span className="row-main">No players yet. Start a session first.</span>
            </div>
          )}
        </div>
      )}

      <p className="muted">
        Signed in as {email ?? 'unknown'}. Theme, default buy-in and chip settings arrive in
        milestone 6.
      </p>
      <button className="btn" onClick={() => void signOut()}>
        Sign out
      </button>
      <button className="btn" onClick={onClose}>
        Close
      </button>
    </Sheet>
  )
}
