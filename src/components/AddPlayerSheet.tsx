import { useEffect, useState } from 'react'
import { createPlayer, listPlayers, type Player } from '../lib/ledger'
import { useBusy } from '../hooks/useBusy'
import { Sheet } from './Sheet'

/**
 * "Add player": one box that searches existing players first and only offers
 * to create a new one when nobody matches. Redesigned after a real incident
 * (2026-07-31): with ~40 players in the group, the old unfiltered list made
 * creating "Ken" again easier than finding him, which forked histories.
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const { busy, error, run } = useBusy()

  useEffect(() => {
    let cancelled = false
    listPlayers()
      .then((players) => {
        if (!cancelled) setExisting(players)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const query = name.trim().toLowerCase()
  const candidates = (existing ?? []).filter((p) => !excludeIds.includes(p.id))
  const matches = query
    ? candidates.filter((p) => p.name.toLowerCase().includes(query))
    : candidates
  const exact = (existing ?? []).find((p) => p.name.trim().toLowerCase() === query)
  const exactInSession = exact !== undefined && excludeIds.includes(exact.id)

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">Add player</div>

      <div className="field">
        <label htmlFor="player-search">Name</label>
        <input
          id="player-search"
          placeholder="Search, or type a new name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {loadError !== null && (
        <p className="notice notice--error">
          Couldn't load existing players ({loadError}). Careful with creating new ones here,
          you might duplicate someone.
        </p>
      )}
      {existing === null && loadError === null && <p className="muted">Loading players…</p>}

      {matches.length > 0 && (
        <div className="list">
          {matches.map((p) => (
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

      {exactInSession && <p className="muted">{exact.name} is already in this session.</p>}
      {query !== '' && exact !== undefined && !exactInSession && (
        <p className="muted">
          {exact.name} already exists. Tap them above instead of creating a double.
        </p>
      )}

      {query !== '' && exact === undefined && existing !== null && (
        <div className="card">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={isGuest}
              onChange={(e) => setIsGuest(e.target.checked)}
            />
            Guest (hidden from the leaderboard by default)
          </label>
          <button
            className="btn btn--primary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const created = await createPlayer(name, isGuest)
                setName('')
                setIsGuest(false)
                await onPick(created)
              })
            }
          >
            Create new player "{name.trim()}"
          </button>
        </div>
      )}

      {error && <p className="notice notice--error">{error}</p>}
      <button className="btn" onClick={onClose} disabled={busy}>
        Cancel
      </button>
    </Sheet>
  )
}
