import type { BoardSort, BoardWindow, Player, Session, Tx } from './types'
import { logicalDayISO } from './time'

/**
 * Every derived number in the app is computed here, at read time, from
 * non-voided transactions. Pure functions only — no I/O — so the same code
 * keeps working when reads come from an offline queue, and so all of it is
 * unit-testable against the spec's reference numbers.
 */

/** $/hr and win rate display as null until a player has this many sessions (§3). */
export const RATE_STAT_MIN_SESSIONS = 5

export interface LedgerEvent extends Tx {
  voided: boolean
  /** On-table total after this event, counting only non-voided transactions. */
  runningTableCents: number
}

export interface PlayerSessionSummary {
  playerId: string
  name: string | null
  buyInCents: number
  rebuyCount: number
  cashOutCents: number
  netCents: number
  firstBuyInAt: string | null
  lastCashOutAt: string | null
  /** last cash-out − first buy-in for THIS player; null until both exist. */
  seatMs: number | null
}

export interface SessionSummary {
  session: Session
  /** Seat order: sorted by each player's first buy-in time. */
  players: PlayerSessionSummary[]
  buyInsCents: number
  cashOutsCents: number
  /** buy-ins − cash-outs: what should still be on the table / in the cash box. */
  onTableCents: number
  /** cash-outs − buy-ins (§3): zero means balanced. */
  discrepancyCents: number
  balanced: boolean
  correctionsCount: number
}

export interface LeaderboardRow {
  player: Player
  games: number
  netCents: number
  seatMs: number
  /** net cents per seat hour; null under the session threshold or with no seat time. */
  hourlyRateCents: number | null
  /** 0–100; null under the session threshold. */
  winRatePct: number | null
  /** +n = n-session win streak, −n = losing streak, 0 = none ($0 nights break streaks). */
  streak: number
  bestNightCents: number | null
  totalRebuys: number
}

export interface LeaderboardOptions {
  window: BoardWindow
  sort: BoardSort
  includeGuests: boolean
  now: Date
}

/** Chronological order: created_at, then id as a stable tiebreak. */
export function sortTxs(txs: Tx[]): Tx[] {
  return [...txs].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
}

/**
 * A transaction is voided when a correction that is not itself voided points
 * at it — so correcting a correction un-voids the original (append-only undo).
 */
export function computeVoidedIds(txs: Tx[]): Set<string> {
  const correctionsByTarget = new Map<string, Tx[]>()
  for (const t of txs) {
    if (t.type === 'correction' && t.correctsTransactionId) {
      const list = correctionsByTarget.get(t.correctsTransactionId) ?? []
      list.push(t)
      correctionsByTarget.set(t.correctsTransactionId, list)
    }
  }

  const memo = new Map<string, boolean>()
  const inProgress = new Set<string>()
  const isVoided = (id: string): boolean => {
    const known = memo.get(id)
    if (known !== undefined) return known
    // Cycles are impossible with append-only inserts; guard anyway.
    if (inProgress.has(id)) return false
    inProgress.add(id)
    const voided = (correctionsByTarget.get(id) ?? []).some((c) => !isVoided(c.id))
    inProgress.delete(id)
    memo.set(id, voided)
    return voided
  }

  const out = new Set<string>()
  for (const t of txs) if (isVoided(t.id)) out.add(t.id)
  return out
}

/** Money effect of one transaction on the table. Corrections carry none. */
function tableDeltaCents(t: Tx): number {
  switch (t.type) {
    case 'buy_in':
    case 'rebuy':
      return t.amountCents
    case 'cash_out':
      return -t.amountCents
    case 'correction':
      return 0
  }
}

/** Audit-trail view: every transaction, flagged, with running on-table totals. */
export function buildEvents(txs: Tx[]): LedgerEvent[] {
  const voided = computeVoidedIds(txs)
  let running = 0
  return sortTxs(txs).map((t) => {
    const isVoided = voided.has(t.id)
    if (!isVoided) running += tableDeltaCents(t)
    return { ...t, voided: isVoided, runningTableCents: running }
  })
}

export function summarizeSession(
  session: Session,
  txs: Tx[],
  playersById?: ReadonlyMap<string, Player>,
): SessionSummary {
  const voided = computeVoidedIds(txs)
  const byPlayer = new Map<string, PlayerSessionSummary>()
  let buyIns = 0
  let cashOuts = 0
  let corrections = 0

  for (const t of sortTxs(txs)) {
    if (t.type === 'correction') {
      corrections += 1
      continue
    }
    if (voided.has(t.id)) continue

    let s = byPlayer.get(t.playerId)
    if (!s) {
      s = {
        playerId: t.playerId,
        name: playersById?.get(t.playerId)?.name ?? null,
        buyInCents: 0,
        rebuyCount: 0,
        cashOutCents: 0,
        netCents: 0,
        firstBuyInAt: null,
        lastCashOutAt: null,
        seatMs: null,
      }
      byPlayer.set(t.playerId, s)
    }

    if (t.type === 'buy_in' || t.type === 'rebuy') {
      s.buyInCents += t.amountCents
      if (t.type === 'rebuy') s.rebuyCount += 1
      if (s.firstBuyInAt === null) s.firstBuyInAt = t.createdAt
      buyIns += t.amountCents
    } else {
      s.cashOutCents += t.amountCents
      s.lastCashOutAt = t.createdAt
      cashOuts += t.amountCents
    }
  }

  for (const s of byPlayer.values()) {
    s.netCents = s.cashOutCents - s.buyInCents
    s.seatMs =
      s.firstBuyInAt !== null && s.lastCashOutAt !== null
        ? Date.parse(s.lastCashOutAt) - Date.parse(s.firstBuyInAt)
        : null
  }

  const players = [...byPlayer.values()].sort((a, b) => {
    if (a.firstBuyInAt !== null && b.firstBuyInAt !== null) {
      return a.firstBuyInAt.localeCompare(b.firstBuyInAt) || a.playerId.localeCompare(b.playerId)
    }
    if (a.firstBuyInAt !== null) return -1
    if (b.firstBuyInAt !== null) return 1
    return a.playerId.localeCompare(b.playerId)
  })

  const discrepancy = cashOuts - buyIns
  return {
    session,
    players,
    buyInsCents: buyIns,
    cashOutsCents: cashOuts,
    onTableCents: buyIns - cashOuts,
    discrepancyCents: discrepancy,
    balanced: discrepancy === 0,
    correctionsCount: corrections,
  }
}

/** Consecutive most-recent wins (+n) or losses (−n); $0 breaks any streak. */
export function computeStreak(chronologicalNets: number[]): number {
  let streak = 0
  for (let i = chronologicalNets.length - 1; i >= 0; i--) {
    const net = chronologicalNets[i]
    if (net > 0) {
      if (streak < 0) break
      streak += 1
    } else if (net < 0) {
      if (streak > 0) break
      streak -= 1
    } else {
      break
    }
  }
  return streak
}

export function computeLeaderboard(
  players: Player[],
  sessions: Session[],
  txs: Tx[],
  opts: LeaderboardOptions,
): LeaderboardRow[] {
  // Only saved sessions ever count toward stats.
  const saved = sessions
    .filter((s) => s.status === 'saved')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  let windowed: Session[]
  switch (opts.window) {
    case 'all':
      windowed = saved
      break
    case 'last10':
      // The 10 most recent saved GROUP sessions — one shared window for everyone.
      windowed = saved.slice(-10)
      break
    case 'month': {
      // Current Melbourne calendar month; the 3am rule applies to sessions and to "now".
      const currentMonth = logicalDayISO(opts.now).slice(0, 7)
      windowed = saved.filter((s) => logicalDayISO(s.startedAt).slice(0, 7) === currentMonth)
      break
    }
  }

  const windowIds = new Set(windowed.map((s) => s.id))
  const txsBySession = new Map<string, Tx[]>()
  for (const t of txs) {
    if (!windowIds.has(t.sessionId)) continue
    const list = txsBySession.get(t.sessionId) ?? []
    list.push(t)
    txsBySession.set(t.sessionId, list)
  }

  const playerById = new Map(players.map((p) => [p.id, p]))
  const rows = new Map<string, LeaderboardRow>()
  const netsByPlayer = new Map<string, number[]>()

  for (const session of windowed) {
    const summary = summarizeSession(session, txsBySession.get(session.id) ?? [])
    for (const ps of summary.players) {
      if (ps.buyInCents === 0) continue // played = put money on the table
      const player = playerById.get(ps.playerId)
      if (!player) continue

      let row = rows.get(ps.playerId)
      if (!row) {
        row = {
          player,
          games: 0,
          netCents: 0,
          seatMs: 0,
          hourlyRateCents: null,
          winRatePct: null,
          streak: 0,
          bestNightCents: null,
          totalRebuys: 0,
        }
        rows.set(ps.playerId, row)
      }

      row.games += 1
      row.netCents += ps.netCents
      row.seatMs += ps.seatMs ?? 0
      row.totalRebuys += ps.rebuyCount
      row.bestNightCents =
        row.bestNightCents === null ? ps.netCents : Math.max(row.bestNightCents, ps.netCents)

      const nets = netsByPlayer.get(ps.playerId) ?? []
      nets.push(ps.netCents)
      netsByPlayer.set(ps.playerId, nets)
    }
  }

  for (const row of rows.values()) {
    const nets = netsByPlayer.get(row.player.id) ?? []
    row.streak = computeStreak(nets)
    if (row.games >= RATE_STAT_MIN_SESSIONS) {
      row.winRatePct = (nets.filter((n) => n > 0).length / row.games) * 100
      row.hourlyRateCents = row.seatMs > 0 ? row.netCents / (row.seatMs / 3_600_000) : null
    }
  }

  let out = [...rows.values()]
  if (!opts.includeGuests) out = out.filter((r) => !r.player.isGuest)
  return sortRows(out, opts.sort)
}

function sortRows(rows: LeaderboardRow[], sort: BoardSort): LeaderboardRow[] {
  const key = (r: LeaderboardRow): number | null => {
    switch (sort) {
      case 'net':
        return r.netCents
      case 'hourly':
        return r.hourlyRateCents
      case 'games':
        return r.games
      case 'hours':
        return r.seatMs
      case 'winRate':
        return r.winRatePct
    }
  }
  const tieBreak = (a: LeaderboardRow, b: LeaderboardRow) =>
    b.netCents - a.netCents || a.player.name.localeCompare(b.player.name)
  return [...rows].sort((a, b) => {
    const ka = key(a)
    const kb = key(b)
    if (ka === null && kb === null) return tieBreak(a, b)
    if (ka === null) return 1 // nulls (under-threshold rate stats) sink to the bottom
    if (kb === null) return -1
    return kb - ka || tieBreak(a, b)
  })
}
