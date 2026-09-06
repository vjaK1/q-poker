import { useEffect, useState } from 'react'
import {
  createPlayer,
  listPlayers,
  renamePlayer,
  setPlayerGuest,
  archivePlayer,
  unarchivePlayer,
  type Player,
} from '../lib/ledger'
import { getSettings, setSettings } from '../lib/settings'
import { getThemePref, setThemePref, type ThemePref } from '../lib/theme'
import { centsToDollars, dollarsToCents, formatMoney } from '../lib/money'
import { signOut } from '../lib/auth'
import { useBusy } from '../hooks/useBusy'
import { Sheet } from '../components/Sheet'

const THEMES: Array<{ key: ThemePref; label: string }> = [
  { key: 'light', label: 'Paper' },
  { key: 'dark', label: 'Midnight' },
  { key: 'system', label: 'Match phone' },
]

/** Settings (§4.9): who you are, theme, default buy-in, denominations, players. */
export function SettingsScreen({
  email,
  onBack,
  onPickMe,
}: {
  email: string | null
  onBack: () => void
  onPickMe: () => void
}) {
  const [theme, setTheme] = useState(getThemePref())
  const [buyInText, setBuyInText] = useState(centsToDollars(getSettings().defaultBuyInCents))
  const [buyInError, setBuyInError] = useState<string | null>(null)
  const [denoms, setDenoms] = useState(getSettings().denominationsCents)
  const [newDenomText, setNewDenomText] = useState('')
  const [denomError, setDenomError] = useState<string | null>(null)
  const [myPlayerId] = useState(getSettings().myPlayerId)
  const [players, setPlayers] = useState<Player[] | null>(null)
  const [editing, setEditing] = useState<Player | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const { busy, error, run } = useBusy()

  async function reloadPlayers() {
    setPlayers(await listPlayers(true))
  }
  useEffect(() => {
    void reloadPlayers().catch(() => setPlayers([]))
  }, [])

  function saveBuyIn() {
    try {
      const cents = dollarsToCents(buyInText)
      if (cents <= 0) throw new Error('Buy-in must be more than zero')
      setSettings({ defaultBuyInCents: cents })
      setBuyInText(centsToDollars(cents))
      setBuyInError(null)
    } catch (err) {
      setBuyInError(err instanceof Error ? err.message : String(err))
    }
  }

  function addDenom() {
    try {
      const cents = dollarsToCents(newDenomText)
      if (cents <= 0) throw new Error('Chip value must be more than zero')
      if (denoms.includes(cents)) throw new Error('That chip value already exists')
      const next = [...denoms, cents].sort((a, b) => b - a)
      setDenoms(next)
      setSettings({ denominationsCents: next })
      setNewDenomText('')
      setDenomError(null)
    } catch (err) {
      setDenomError(err instanceof Error ? err.message : String(err))
    }
  }

  function removeDenom(cents: number) {
    if (denoms.length === 1) return
    const next = denoms.filter((d) => d !== cents)
    setDenoms(next)
    setSettings({ denominationsCents: next })
  }

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onBack}>
          ‹ Home
        </button>
        <span className="screen-title">Settings</span>
        <span style={{ width: '4.5rem' }} />
      </header>

      <div className="card">
        <span className="muted">You</span>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <span className="row-main">
            <span className="row-title">
              {myPlayerId === null
                ? 'Nobody picked yet'
                : (players?.find((p) => p.id === myPlayerId)?.name ?? '…')}
            </span>
            <span className="row-sub">
              {myPlayerId === null
                ? 'Home shows your numbers once you pick your name'
                : 'Home and Sessions show your numbers'}
            </span>
          </span>
          <button className="btn btn--small" onClick={onPickMe}>
            {myPlayerId === null ? 'Pick your name' : 'Change'}
          </button>
        </div>
      </div>

      <div className="card">
        <span className="muted">Theme</span>
        <div className="chips">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`chip ${theme === t.key ? 'chip--active' : ''}`}
              onClick={() => {
                setThemePref(t.key)
                setTheme(t.key)
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <span className="muted">Default buy-in</span>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <input
            className="select"
            inputMode="decimal"
            value={buyInText}
            onChange={(e) => setBuyInText(e.target.value)}
            onBlur={saveBuyIn}
          />
          <button className="btn btn--small" onClick={saveBuyIn}>
            Save
          </button>
        </div>
        {buyInError && <p className="notice notice--error">{buyInError}</p>}
      </div>

      <div className="card">
        <span className="muted">Chip denominations (cash-out steppers)</span>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {denoms.map((d) => (
            <button
              key={d}
              className="chip"
              disabled={denoms.length === 1}
              onClick={() => removeDenom(d)}
              title="Tap to remove"
            >
              {formatMoney(d)} ✕
            </button>
          ))}
        </div>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <input
            className="select"
            inputMode="decimal"
            placeholder="e.g. 2 or 0.50"
            value={newDenomText}
            onChange={(e) => setNewDenomText(e.target.value)}
          />
          <button className="btn btn--small" onClick={addDenom} disabled={!newDenomText.trim()}>
            Add
          </button>
        </div>
        {denomError && <p className="notice notice--error">{denomError}</p>}
      </div>

      <div className="card">
        <span className="muted">Players (tap to edit)</span>
        {players === null && <p className="muted">Loading…</p>}
        {players !== null && (
          <div className="list">
            {players.map((p) => (
              <button key={p.id} className={`row ${p.archivedAt ? 'row--dim' : ''}`} onClick={() => setEditing(p)}>
                <span className="row-main">
                  <span className="row-title">{p.name}</span>
                  <span className="row-sub">
                    {[
                      p.id === myPlayerId ? 'you' : null,
                      p.isGuest ? 'guest' : null,
                      p.archivedAt ? 'archived' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'regular'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        <form
          className="btn-row"
          style={{ alignItems: 'center' }}
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await createPlayer(newPlayerName)
              setNewPlayerName('')
              await reloadPlayers()
            })
          }}
        >
          <input
            className="select"
            placeholder="New player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
          />
          <button className="btn btn--small" type="submit" disabled={busy || !newPlayerName.trim()}>
            Add
          </button>
        </form>
      </div>

      {error && <p className="notice notice--error">{error}</p>}

      <p className="muted">Signed in as {email ?? 'unknown'}.</p>
      <button className="btn" onClick={() => void signOut()}>
        Sign out
      </button>

      {editing && (
        <PlayerEditSheet
          player={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await reloadPlayers()
          }}
        />
      )}
    </div>
  )
}

/**
 * Rename, guest flag, archive. "This is me" is deliberately not here any more:
 * that lives on the Who are you? screen (§4.10), reached from the You card.
 */
function PlayerEditSheet({
  player,
  onClose,
  onSaved,
}: {
  player: Player
  onClose: () => void
  onSaved: (player: Player) => Promise<void>
}) {
  const [name, setName] = useState(player.name)
  const [isGuest, setIsGuest] = useState(player.isGuest)
  const { busy, error, run } = useBusy()

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">Edit player</div>
      <div className="field">
        <label htmlFor="edit-player-name">Name</label>
        <input
          id="edit-player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" checked={isGuest} onChange={(e) => setIsGuest(e.target.checked)} />
        Guest (hidden from the leaderboard by default)
      </label>
      <button
        className="btn btn--primary"
        disabled={busy || !name.trim()}
        onClick={() =>
          void run(async () => {
            let updated = player
            if (name.trim() !== player.name) updated = await renamePlayer(player.id, name)
            if (isGuest !== player.isGuest) updated = await setPlayerGuest(player.id, isGuest)
            await onSaved(updated)
          })
        }
      >
        Save
      </button>
      <button
        className="btn"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const updated = player.archivedAt
              ? await unarchivePlayer(player.id)
              : await archivePlayer(player.id)
            await onSaved(updated)
          })
        }
      >
        {player.archivedAt ? 'Unarchive' : 'Archive (hide from pickers)'}
      </button>
      {error && <p className="notice notice--error">{error}</p>}
      <button className="btn" disabled={busy} onClick={onClose}>
        Cancel
      </button>
    </Sheet>
  )
}
