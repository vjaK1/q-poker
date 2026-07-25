import { useEffect, useState } from 'react'
import { createPlayer, listPlayers, type Player } from '../lib/ledger'
import { useBusy } from '../hooks/useBusy'
import { Sheet } from './Sheet'

/**
 * "Add player": pick from existing (non-archived) players or create a new one
 * (name + guest flag). What happens on pick is the caller's business —
 * the start screen adds a roster row, the live screen buys them straight in.
 */
export function AddPlayerSheet({
  excludeIds,
  pickLabel,
  onPick,
  onClose,
}: {
  excludeIds: string[]
  pickLabel: string
  onPick: (player: Player) => Promise<void>
  onClose: () => void
}) {
  const [existing, setExisting] = useState<Player[] | null>(null)
  const [name, setName] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const { busy, error, run } = useBusy()

  useEffect(() => {
    let cancelled = false
    listPlayers()
      .then((players) => {
        if (!cancelled) setExisting(players)
      })
      .catch(() => {
        if (!cancelled) setExisting([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const candidates = (existing ?? []).filter((p) => !excludeIds.includes(p.id))

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">Add player</div>

      {existing === null && <p className="muted">Loading players…</p>}
      {existing !== null && candidates.length > 0 && (
        <div className="list">
          {candidates.map((p) => (
            <button
              key={p.id}
              className="row"
              disabled={busy}
              onClick={() => void run(() => onPick(p))}
            >
              <span className="row-main">
                <span className="row-title">{p.name}</span>
                {p.isGuest && <span className="row-sub">guest</span>}
              </span>
              <span className="muted">{pickLabel}</span>
            </button>
          ))}
        </div>
      )}
      {existing !== null && candidates.length === 0 && (
        <p className="muted">No other players yet. Create one below.</p>
      )}

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => {
            const created = await createPlayer(name, isGuest)
            setName('')
            setIsGuest(false)
            await onPick(created)
          })
        }}
      >
        <div className="field">
          <label htmlFor="new-player-name">New player</label>
          <input
            id="new-player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={isGuest}
            onChange={(e) => setIsGuest(e.target.checked)}
          />
          Guest (hidden from the leaderboard by default)
        </label>
        <button className="btn btn--primary" type="submit" disabled={busy || !name.trim()}>
          Create &amp; {pickLabel.toLowerCase()}
        </button>
      </form>

      {error && <p className="notice notice--error">{error}</p>}
      <button className="btn" onClick={onClose} disabled={busy}>
        Cancel
      </button>
    </Sheet>
  )
}
