import { getSupabase } from './supabaseClient'
import { assertCents, denominationsTotalCents } from './money'
import {
  buildEvents,
  computeLeaderboard,
  computePlayerSeries,
  summarizeSession,
  type LeaderboardRow,
  type LedgerEvent,
  type PlayerSeriesPoint,
  type SessionSummary,
} from './derive'
import type {
  BoardDir,
  BoardSort,
  BoardWindow,
  Denominations,
  Player,
  Session,
  SessionStatus,
  Tx,
  TxType,
} from './types'

/**
 * The ONLY module that talks to the database. Components import this and
 * nothing lower. The append-only rule is absolute: this module has no code
 * path that issues UPDATE or DELETE on transactions — corrections are inserts.
 */

export type {
  BoardDir,
  BoardSort,
  BoardWindow,
  Denominations,
  Player,
  Session,
  SessionStatus,
  Tx,
  TxType,
}
export type { LeaderboardRow, LedgerEvent, PlayerSeriesPoint, SessionSummary }
export type { PlayerSessionSummary, ReconcileHint } from './derive'
export { RATE_STAT_MIN_SESSIONS, reconcileHint, seatedPlayerIds } from './derive'

const db = () => getSupabase()

// ------------------------------ row mapping -------------------------------

interface PlayerRow {
  id: string
  name: string
  is_guest: boolean
  archived_at: string | null
  created_at: string
}

interface SessionRow {
  id: string
  started_at: string
  ended_at: string | null
  status: SessionStatus
  created_at: string
}

interface TxRow {
  id: string
  session_id: string
  player_id: string
  type: TxType
  amount_cents: number
  denominations: Denominations | null
  second_count_confirmed: boolean
  corrects_transaction_id: string | null
  note: string | null
  created_at: string
}

const toPlayer = (r: PlayerRow): Player => ({
  id: r.id,
  name: r.name,
  isGuest: r.is_guest,
  archivedAt: r.archived_at,
  createdAt: r.created_at,
})

const toSession = (r: SessionRow): Session => ({
  id: r.id,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  status: r.status,
  createdAt: r.created_at,
})

const toTx = (r: TxRow): Tx => ({
  id: r.id,
  sessionId: r.session_id,
  playerId: r.player_id,
  type: r.type,
  amountCents: r.amount_cents,
  denominations: r.denominations,
  secondCountConfirmed: r.second_count_confirmed,
  correctsTransactionId: r.corrects_transaction_id,
  note: r.note,
  createdAt: r.created_at,
})

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null) throw new Error('Query returned no data')
  return res.data
}

// -------------------------------- players ---------------------------------

export async function listPlayers(includeArchived = false): Promise<Player[]> {
  const base = db().from('players').select('*')
  const filtered = includeArchived ? base : base.is('archived_at', null)
  const rows = unwrap<PlayerRow[]>(await filtered.order('name', { ascending: true }))
  return rows.map(toPlayer)
}

/**
 * Names are identities in this app (exports, leaderboards, history), so they
 * are unique case- and whitespace-insensitively. A duplicate name would fork
 * a player's history in two, which is exactly what happened on 2026-07-31.
 * A DB unique index backstops this check.
 */
async function assertNameFree(name: string, exceptId?: string): Promise<void> {
  const players = await listPlayers(true)
  const clash = players.find(
    (p) => p.id !== exceptId && p.name.trim().toLowerCase() === name.trim().toLowerCase(),
  )
  if (clash) {
    throw new Error(
      `A player named "${clash.name}" already exists${clash.archivedAt ? ' (archived, see Settings)' : ''}. ` +
        'Add a surname or initial if this is a different person.',
    )
  }
}

export async function createPlayer(name: string, isGuest = false): Promise<Player> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Player name cannot be empty')
  await assertNameFree(trimmed)
  const res = await db()
    .from('players')
    .insert({ name: trimmed, is_guest: isGuest })
    .select()
    .single()
  return toPlayer(unwrap<PlayerRow>(res))
}

export async function renamePlayer(id: string, name: string): Promise<Player> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Player name cannot be empty')
  await assertNameFree(trimmed, id)
  const res = await db().from('players').update({ name: trimmed }).eq('id', id).select().single()
  return toPlayer(unwrap<PlayerRow>(res))
}

export async function setPlayerGuest(id: string, isGuest: boolean): Promise<Player> {
  const res = await db().from('players').update({ is_guest: isGuest }).eq('id', id).select().single()
  return toPlayer(unwrap<PlayerRow>(res))
}

export async function archivePlayer(id: string): Promise<Player> {
  const res = await db()
    .from('players')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return toPlayer(unwrap<PlayerRow>(res))
}

export async function unarchivePlayer(id: string): Promise<Player> {
  const res = await db().from('players').update({ archived_at: null }).eq('id', id).select().single()
  return toPlayer(unwrap<PlayerRow>(res))
}

// -------------------------------- sessions --------------------------------

/** Created on the first buy-in of the night (status 'live', started_at now). */
export async function createSession(): Promise<Session> {
  const res = await db().from('sessions').insert({}).select().single()
  return toSession(unwrap<SessionRow>(res))
}

/** The session with status 'live' or 'counting', if any. */
export async function getLiveSession(): Promise<Session | null> {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .in('status', ['live', 'counting'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toSession(data as SessionRow) : null
}

export async function getSession(id: string): Promise<Session> {
  const res = await db().from('sessions').select('*').eq('id', id).single()
  return toSession(unwrap<SessionRow>(res))
}

export async function listSessions(includeDiscarded = false): Promise<Session[]> {
  const base = db().from('sessions').select('*')
  const filtered = includeDiscarded ? base : base.neq('status', 'discarded')
  const res = await filtered.order('started_at', { ascending: false })
  return unwrap<SessionRow[]>(res).map(toSession)
}

/**
 * Discard a session: it disappears from every list, stat and export, but its
 * rows remain in the database. Never deletes anything.
 */
export async function discardSession(sessionId: string): Promise<Session> {
  const { data, error } = await db()
    .from('sessions')
    .update({ status: 'discarded' })
    .eq('id', sessionId)
    .select()
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as SessionRow[]
  if (rows.length === 0) throw new Error('Session not found')
  return toSession(rows[0])
}

/** "End session" — starts the count queue. Only valid from 'live'. */
export async function beginCounting(sessionId: string): Promise<Session> {
  const { data, error } = await db()
    .from('sessions')
    .update({ status: 'counting' })
    .eq('id', sessionId)
    .eq('status', 'live')
    .select()
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as SessionRow[]
  if (rows.length === 0) throw new Error('Session is not live, so counting cannot start')
  return toSession(rows[0])
}

/** "Save session" at reconcile. Only valid from 'counting'. */
export async function saveSession(sessionId: string): Promise<Session> {
  const { data, error } = await db()
    .from('sessions')
    .update({ status: 'saved', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('status', 'counting')
    .select()
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as SessionRow[]
  if (rows.length === 0) throw new Error('Session is not in the counting state, so it cannot be saved')
  return toSession(rows[0])
}

// ---------------------- transactions (inserts only) -----------------------

async function insertTx(row: {
  session_id: string
  player_id: string
  type: TxType
  amount_cents: number
  denominations?: Denominations | null
  second_count_confirmed?: boolean
  corrects_transaction_id?: string | null
  note?: string | null
}): Promise<Tx> {
  const res = await db().from('transactions').insert(row).select().single()
  return toTx(unwrap<TxRow>(res))
}

export async function addBuyIn(
  sessionId: string,
  playerId: string,
  amountCents: number,
): Promise<Tx> {
  assertCents(amountCents, 'buy-in')
  return insertTx({
    session_id: sessionId,
    player_id: playerId,
    type: 'buy_in',
    amount_cents: amountCents,
  })
}

export async function addRebuy(
  sessionId: string,
  playerId: string,
  amountCents: number,
): Promise<Tx> {
  assertCents(amountCents, 'rebuy')
  return insertTx({
    session_id: sessionId,
    player_id: playerId,
    type: 'rebuy',
    amount_cents: amountCents,
  })
}

export async function addCashOut(
  sessionId: string,
  playerId: string,
  amountCents: number,
  denominations: Denominations | null,
  secondCountConfirmed: boolean,
): Promise<Tx> {
  assertCents(amountCents, 'cash-out')
  if (denominations !== null) {
    const total = denominationsTotalCents(denominations)
    if (total !== amountCents) {
      throw new Error(
        `Denomination breakdown totals ${total} cents but cash-out amount is ${amountCents} cents`,
      )
    }
  }
  return insertTx({
    session_id: sessionId,
    player_id: playerId,
    type: 'cash_out',
    amount_cents: amountCents,
    denominations,
    second_count_confirmed: secondCountConfirmed,
  })
}

/**
 * Voids the target transaction. Corrections always carry amount 0 — the voided
 * amount simply drops out of every derived number; a replacement value, if
 * needed, is a fresh buy_in/rebuy/cash_out row.
 */
export async function addCorrection(args: {
  sessionId: string
  playerId: string
  correctsTransactionId: string
  note: string
}): Promise<Tx> {
  if (!args.note.trim()) throw new Error('A correction needs a note explaining it')
  return insertTx({
    session_id: args.sessionId,
    player_id: args.playerId,
    type: 'correction',
    amount_cents: 0,
    corrects_transaction_id: args.correctsTransactionId,
    note: args.note.trim(),
  })
}

// ------------------------------- derivations ------------------------------

async function fetchSessionTxs(sessionId: string): Promise<Tx[]> {
  const res = await db()
    .from('transactions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
  return unwrap<TxRow[]>(res).map(toTx)
}

/** Audit trail: every transaction with voided flags and running on-table totals. */
export async function getSessionEvents(sessionId: string): Promise<LedgerEvent[]> {
  return buildEvents(await fetchSessionTxs(sessionId))
}

/** Per-player buy-ins / ending stack / net / seat time, plus session totals. */
export async function getSessionSummary(sessionId: string): Promise<SessionSummary> {
  const [session, txs, players] = await Promise.all([
    getSession(sessionId),
    fetchSessionTxs(sessionId),
    listPlayers(true),
  ])
  return summarizeSession(session, txs, new Map(players.map((p) => [p.id, p])))
}

/** Everything the live screens need in one fetch: session, audit events, summary. */
export interface LiveSessionState {
  session: Session
  events: LedgerEvent[]
  summary: SessionSummary
  /** All players (incl. archived), for resolving names anywhere in the flow. */
  players: Player[]
}

export async function getLiveSessionState(): Promise<LiveSessionState | null> {
  const session = await getLiveSession()
  if (!session) return null
  const [txs, players] = await Promise.all([fetchSessionTxs(session.id), listPlayers(true)])
  const playersById = new Map(players.map((p) => [p.id, p]))
  return {
    session,
    events: buildEvents(txs),
    summary: summarizeSession(session, txs, playersById),
    players,
  }
}

async function fetchAllTxs(): Promise<Tx[]> {
  const res = await db().from('transactions').select('*')
  return unwrap<TxRow[]>(res).map(toTx)
}

/** One line per saved session for the Sessions tab list. */
export interface SessionOverviewRow {
  session: Session
  playerCount: number
  buyInsCents: number
  discrepancyCents: number
  balanced: boolean
  /** Net per playerId, for the "your net" column. */
  netsByPlayer: Record<string, number>
}

export async function getSessionsOverview(): Promise<SessionOverviewRow[]> {
  const [sessions, txs] = await Promise.all([listSessions(), fetchAllTxs()])
  const bySession = new Map<string, Tx[]>()
  for (const t of txs) {
    const list = bySession.get(t.sessionId) ?? []
    list.push(t)
    bySession.set(t.sessionId, list)
  }
  return sessions
    .filter((s) => s.status === 'saved')
    .map((session) => {
      const summary = summarizeSession(session, bySession.get(session.id) ?? [])
      return {
        session,
        playerCount: summary.players.length,
        buyInsCents: summary.buyInsCents,
        discrepancyCents: summary.discrepancyCents,
        balanced: summary.balanced,
        netsByPlayer: Object.fromEntries(summary.players.map((p) => [p.playerId, p.netCents])),
      }
    })
}

/** Everything the Home dashboard needs in one fetch. */
export interface HomeData {
  top3: LeaderboardRow[]
  /** null when no "this is me" player is set. */
  me: { lifetimeNetCents: number; cumulative: number[] } | null
  lastSession: { session: Session; myNetCents: number | null } | null
}

export async function getHomeData(myPlayerId: string | null): Promise<HomeData> {
  const [players, sessions, txs] = await Promise.all([
    listPlayers(true),
    listSessions(),
    fetchAllTxs(),
  ])
  const top3 = computeLeaderboard(players, sessions, txs, {
    window: 'all',
    sort: 'net',
    includeGuests: false,
    now: new Date(),
  }).slice(0, 3)

  const saved = sessions
    .filter((s) => s.status === 'saved')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  const last = saved.at(-1) ?? null
  let lastSession: HomeData['lastSession'] = null
  if (last) {
    const summary = summarizeSession(
      last,
      txs.filter((t) => t.sessionId === last.id),
    )
    const mine =
      myPlayerId !== null ? summary.players.find((p) => p.playerId === myPlayerId) : undefined
    lastSession = { session: last, myNetCents: mine ? mine.netCents : null }
  }

  let me: HomeData['me'] = null
  if (myPlayerId !== null) {
    const series = computePlayerSeries(myPlayerId, sessions, txs)
    me = {
      lifetimeNetCents: series.at(-1)?.cumulativeCents ?? 0,
      cumulative: series.map((p) => p.cumulativeCents),
    }
  }
  return { top3, me, lastSession }
}

/** Board profile: lifetime stats plus the cumulative bankroll series. */
export interface PlayerProfile {
  player: Player
  /** null if they have never played a saved session. */
  stats: LeaderboardRow | null
  series: PlayerSeriesPoint[]
}

export async function getPlayerProfile(playerId: string): Promise<PlayerProfile> {
  const [players, sessions, txs] = await Promise.all([
    listPlayers(true),
    listSessions(),
    fetchAllTxs(),
  ])
  const player = players.find((p) => p.id === playerId)
  if (!player) throw new Error('Player not found')
  const stats =
    computeLeaderboard(players, sessions, txs, {
      window: 'all',
      sort: 'net',
      includeGuests: true,
      now: new Date(),
    }).find((r) => r.player.id === playerId) ?? null
  return { player, stats, series: computePlayerSeries(playerId, sessions, txs) }
}

/** Everything the session detail screen needs: summary, audit events, names. */
export interface SessionDetail {
  session: Session
  summary: SessionSummary
  events: LedgerEvent[]
  players: Player[]
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  const [session, txs, players] = await Promise.all([
    getSession(sessionId),
    fetchSessionTxs(sessionId),
    listPlayers(true),
  ])
  const playersById = new Map(players.map((p) => [p.id, p]))
  return {
    session,
    summary: summarizeSession(session, txs, playersById),
    events: buildEvents(txs),
    players,
  }
}

/** Quick-start roster: the previous saved session's players, in seat order. */
export async function getLastSavedRoster(): Promise<Player[]> {
  const { data, error } = await db()
    .from('sessions')
    .select('*')
    .eq('status', 'saved')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return []
  const session = toSession(data as SessionRow)
  const [txs, players] = await Promise.all([fetchSessionTxs(session.id), listPlayers(false)])
  const byId = new Map(players.map((p) => [p.id, p]))
  return summarizeSession(session, txs)
    .players.map((ps) => byId.get(ps.playerId))
    .filter((p): p is Player => p !== undefined)
}

export async function getLeaderboard(opts?: {
  window?: BoardWindow
  sort?: BoardSort
  dir?: BoardDir
  includeGuests?: boolean
}): Promise<LeaderboardRow[]> {
  const [players, sessions, txs] = await Promise.all([
    listPlayers(true),
    listSessions(),
    fetchAllTxs(),
  ])
  return computeLeaderboard(players, sessions, txs, {
    window: opts?.window ?? 'all',
    sort: opts?.sort ?? 'net',
    dir: opts?.dir ?? 'desc',
    includeGuests: opts?.includeGuests ?? false,
    now: new Date(),
  })
}
