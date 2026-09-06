import { useEffect, useState } from 'react'
import { listPlayers, type Player } from '../lib/ledger'
import { setSettings } from '../lib/settings'

/**
 * "Who are you?" (§4.10): pick the player that is you on this phone. Shown
 * once after first sign-in, and again on demand from Home or Settings.
 * Search-first because the group has ~40 names. No creating players here:
 * a wrong pick is fixable in Settings, a duplicate profile is not
 * (2026-07-31). "Not now" is remembered so the screen never nags a phone
 * that is only used for banking.
 */
export function WhoAreYouScreen({ onDone }: { onDone: () => void }) {
  const [players, setPlayers] = useState<Player[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Player | null>(null)

  useEffect(() => {
    let cancelled = false
    listPlayers()
      .then((list) => {
        if (!cancelled) setPlayers(list)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const needle = query.trim().toLowerCase()
  const matches = (players ?? []).filter(
    (p) => needle === '' || p.name.toLowerCase().includes(needle),
  )

  return (
    <div className="screen screen--fill">
      <header>
        <h1>Who are you?</h1>
        <p className="muted" style={{ margin: '0.375rem 0 0' }}>
          Pick your name so Home shows your numbers. You can change this any time in Settings.
        </p>
      </header>

      <input
        className="select picker-search"
        type="search"
        placeholder="Search names"
        aria-label="Search names"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loadError !== null && (
        <p className="notice notice--error">Couldn't load the players ({loadError}).</p>
      )}
      {players === null && loadError === null && <p className="muted">Loading players…</p>}

      {players !== null && (
        <div className="list picker-list" role="radiogroup" aria-label="Players">
          {matches.map((p) => {
            const isPicked = picked?.id === p.id
            return (
              <button
                key={p.id}
                className={`row ${isPicked ? 'row--picked' : ''}`}
                role="radio"
                aria-checked={isPicked}
                onClick={() => setPicked(p)}
              >
                <span className="row-main">
                  <span className="row-title">
                    {p.name}
                    {p.isGuest && <span className="muted"> (guest)</span>}
                  </span>
                </span>
                <span className="picker-tick" aria-hidden="true">
                  ✓
                </span>
              </button>
            )
          })}
          {matches.length === 0 && (
            <p className="muted" style={{ margin: 0, padding: '0.75rem 1rem' }}>
              No one called that yet.
            </p>
          )}
        </div>
      )}

      <div className="picker-footer">
        <button
          className="btn btn--primary"
          disabled={picked === null}
          onClick={() => {
            if (picked === null) return
            setSettings({ myPlayerId: picked.id })
            onDone()
          }}
        >
          {picked === null ? 'Continue' : `Continue as ${picked.name}`}
        </button>
        <button
          className="btn btn--quiet"
          onClick={() => {
            setSettings({ whoAmIDismissed: true })
            onDone()
          }}
        >
          Not now
        </button>
        <p className="muted picker-hint">Not in the list? Ask whoever runs the game to add you.</p>
      </div>
    </div>
  )
}
