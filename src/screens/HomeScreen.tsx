import { useEffect, useState } from 'react'
import {
  getHomeData,
  RATE_STAT_MIN_SESSIONS,
  type HomeData,
  type LiveSessionState,
  type PlayerStats,
} from '../lib/ledger'
import { getSettings } from '../lib/settings'
import { formatMoney, formatSignedMoney } from '../lib/money'
import {
  formatElapsed,
  formatMelbourneTime,
  melbourneDayName,
  sessionDisplayName,
} from '../lib/time'
import { useNow } from '../hooks/useNow'
import { BankrollChart } from '../components/BankrollChart'

interface StatTile {
  label: string
  value: string
  /** Quiet second line under the value. */
  sub?: string
  /** 'pos' / 'neg' colour the value; 'empty' is a placeholder in body type. */
  tone?: 'pos' | 'neg' | 'empty'
}

function signTone(cents: number): 'pos' | 'neg' | undefined {
  if (cents > 0) return 'pos'
  if (cents < 0) return 'neg'
  return undefined
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** The six personal tiles under the bankroll (§4.1). */
function statTiles(stats: PlayerStats): StatTile[] {
  const { games, wins, streak, rank, bestNight, worstNight } = stats
  return [
    {
      label: 'Win rate',
      value:
        stats.winRatePct !== null
          ? `${Math.round(stats.winRatePct)}%`
          : `${RATE_STAT_MIN_SESSIONS}+ games`,
      sub: games > 0 ? `${wins} of ${plural(games, 'night', 'nights')}` : undefined,
      tone: stats.winRatePct === null ? 'empty' : undefined,
    },
    {
      label: 'Average night',
      value: stats.avgNightCents !== null ? formatSignedMoney(stats.avgNightCents) : 'No games yet',
      sub: games > 0 ? `over ${plural(games, 'game', 'games')}` : undefined,
      tone: stats.avgNightCents !== null ? signTone(stats.avgNightCents) : 'empty',
    },
    {
      label: 'Best night',
      value: bestNight ? formatSignedMoney(bestNight.netCents) : 'No games yet',
      sub: bestNight ? sessionDisplayName(bestNight.session.startedAt) : undefined,
      tone: bestNight ? signTone(bestNight.netCents) : 'empty',
    },
    {
      label: 'Worst night',
      value: worstNight ? formatSignedMoney(worstNight.netCents) : 'No games yet',
      sub: worstNight ? sessionDisplayName(worstNight.session.startedAt) : undefined,
      tone: worstNight ? signTone(worstNight.netCents) : 'empty',
    },
    {
      label: 'Streak',
      value:
        streak > 0
          ? plural(streak, 'win', 'wins')
          : streak < 0
            ? plural(-streak, 'loss', 'losses')
            : 'None',
      sub: streak !== 0 ? 'in a row' : games > 0 ? 'last night was even' : 'no games yet',
      tone: streak > 0 ? 'pos' : streak < 0 ? 'neg' : 'empty',
    },
    {
      label: 'Rank',
      value: rank ? `#${rank.position}` : 'Unranked',
      sub: rank
        ? `of ${plural(rank.of, 'player', 'players')}`
        : games > 0
          ? "guests aren't ranked"
          : 'no games yet',
      tone: rank ? undefined : 'empty',
    },
  ]
}

function monthLine(month: PlayerStats['month']): string {
  if (month.games === 0) return 'No games this month yet'
  return `${formatSignedMoney(month.netCents)} this month · ${plural(month.games, 'game', 'games')}`
}

/** Home dashboard (§4.1): idle and live states. */
export function HomeScreen({
  live,
  savedNote,
  onStart,
  onResume,
  onSettings,
  onPickMe,
}: {
  live: LiveSessionState | null
  savedNote: string | null
  onStart: () => void
  onResume: () => void
  onSettings: () => void
  onPickMe: () => void
}) {
  const now = useNow(30_000)
  const [myPlayerId] = useState(getSettings().myPlayerId)
  const [data, setData] = useState<HomeData | null>(null)

  useEffect(() => {
    let cancelled = false
    getHomeData(myPlayerId)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [myPlayerId, live])

  const me = data?.me ?? null

  return (
    <div className="screen screen--tabbed">
      <header className="app-header">
        <span>
          <h1>Home</h1>
          <span className="muted">{melbourneDayName(new Date(now))}</span>
        </span>
        <button className="btn btn--inline" aria-label="Settings" onClick={onSettings}>
          ⚙
        </button>
      </header>

      {savedNote && <div className="banner banner--ok">{savedNote}</div>}

      {live && (
        <div className="card">
          <div className="row-sub">
            Live · started {formatMelbourneTime(live.session.startedAt)} ·{' '}
            <span className="timer">{formatElapsed(live.session.startedAt, now)}</span>
            {live.session.status === 'counting' && ' · counting stacks'}
          </div>
          <div className="hero">
            <div className="hero-money">{formatMoney(live.summary.onTableCents)}</div>
            <div className="hero-sub">on the table</div>
          </div>
          <button className="btn btn--primary" onClick={onResume}>
            Resume session
          </button>
        </div>
      )}

      <div className="card">
        <span className="muted">Your bankroll</span>
        {myPlayerId === null ? (
          <>
            <p>Pick your name to see your lifetime numbers.</p>
            <button className="btn" onClick={onPickMe}>
              Pick your name
            </button>
          </>
        ) : (
          <>
            <div
              className={`hero-money ${(me?.lifetimeNetCents ?? 0) >= 0 ? 'pos' : 'neg'}`}
              style={{ fontSize: '2rem' }}
            >
              {formatSignedMoney(me?.lifetimeNetCents ?? 0)}
            </div>
            {me && me.series.length >= 1 && <BankrollChart series={me.series} height={120} />}
            {me && <span className="row-sub">{monthLine(me.stats.month)}</span>}
          </>
        )}
      </div>

      {me && (
        <div className="stat-grid">
          {statTiles(me.stats).map((t) => (
            <div key={t.label} className="card stat-card">
              <span className="muted">{t.label}</span>
              <span
                className={`stat-value ${t.tone === 'empty' ? 'stat-value--empty' : (t.tone ?? '')}`}
              >
                {t.value}
              </span>
              {t.sub && <span className="row-sub">{t.sub}</span>}
            </div>
          ))}
        </div>
      )}

      {!live && (
        <button className="btn btn--primary" onClick={onStart}>
          Start session
        </button>
      )}
    </div>
  )
}
