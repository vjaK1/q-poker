import { useEffect, useState } from 'react'
import { getPlayerProfile, RATE_STAT_MIN_SESSIONS, type PlayerProfile } from '../lib/ledger'
import { formatMoney, formatSignedMoney } from '../lib/money'
import { Sparkline } from '../components/Sparkline'
import { hoursLabel } from './BoardScreen'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function streakLabel(streak: number): string {
  if (streak > 0) return `${streak}W`
  if (streak < 0) return `${-streak}L`
  return '0'
}

/** Player profile (§4.8): bankroll chart plus lifetime stat cards. */
export function PlayerProfileScreen({
  playerId,
  onBack,
}: {
  playerId: string
  onBack: () => void
}) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getPlayerProfile(playerId)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [playerId])

  if (error !== null) {
    return (
      <div className="screen">
        <p className="notice notice--error">{error}</p>
        <button className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="screen screen--center">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  const { player, stats, series } = profile
  const underThreshold = stats !== null && stats.games < RATE_STAT_MIN_SESSIONS

  const statCards: Array<{ label: string; value: string; className?: string }> =
    stats === null
      ? []
      : [
          {
            label: 'Win rate',
            value: stats.winRatePct !== null ? `${Math.round(stats.winRatePct)}%` : '—',
          },
          {
            label: '$/hr',
            value:
              stats.hourlyRateCents !== null
                ? formatSignedMoney(Math.round(stats.hourlyRateCents))
                : '—',
          },
          {
            label: 'Best night',
            value: stats.bestNightCents !== null ? formatSignedMoney(stats.bestNightCents) : '—',
            className: stats.bestNightCents !== null && stats.bestNightCents >= 0 ? 'pos' : 'neg',
          },
          { label: 'Streak', value: streakLabel(stats.streak) },
          { label: 'Hours', value: hoursLabel(stats.seatMs) },
          { label: 'Rebuys', value: String(stats.totalRebuys) },
        ]

  return (
    <div className="screen">
      <header className="app-header">
        <button className="btn btn--inline" onClick={onBack}>
          ‹ Board
        </button>
        <span className="screen-title">{player.name}</span>
        <span style={{ width: '4.5rem' }} />
      </header>

      <div className="card" style={{ flexDirection: 'row', alignItems: 'center' }}>
        <span className="avatar">{initials(player.name)}</span>
        <span className="row-main">
          <span className="row-title">
            {player.name}
            {player.isGuest ? ' (guest)' : ''}
          </span>
          <span className="row-sub">
            {stats === null ? 'No saved sessions yet' : `${stats.games} sessions`}
          </span>
        </span>
        {stats !== null && (
          <span className={`row-end ${stats.netCents >= 0 ? 'pos' : 'neg'}`}>
            {formatSignedMoney(stats.netCents)}
          </span>
        )}
      </div>

      {series.length >= 2 && (
        <div className="card">
          <span className="muted">Bankroll across sessions</span>
          <Sparkline values={[0, ...series.map((p) => p.cumulativeCents)]} height={120} showZeroLine />
          <div className="footer-stats muted">
            <span>{formatMoney(0)}</span>
            <span>now {formatSignedMoney(series.at(-1)!.cumulativeCents)}</span>
          </div>
        </div>
      )}

      {stats !== null && (
        <div className="stat-grid">
          {statCards.map((c) => (
            <div key={c.label} className="card stat-card">
              <span className="muted">{c.label}</span>
              <span className={`stat-value ${c.className ?? ''}`}>{c.value}</span>
            </div>
          ))}
        </div>
      )}
      {underThreshold && (
        <p className="muted">Rate stats need {RATE_STAT_MIN_SESSIONS}+ games.</p>
      )}
    </div>
  )
}
