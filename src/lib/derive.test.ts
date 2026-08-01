import { describe, expect, it } from 'vitest'
import {
  buildEvents,
  computeLeaderboard,
  computePlayerSeries,
  computeStreak,
  computeVoidedIds,
  reconcileHint,
  seatedPlayerIds,
  summarizeSession,
} from './derive'
import type { Tx } from './types'
import {
  at,
  play,
  player,
  REF_PLAYERS,
  REF_SESSION,
  referenceTxs,
  session,
  tx,
} from './testUtils'

describe('summarizeSession — spec reference session', () => {
  const summary = summarizeSession(REF_SESSION, referenceTxs())

  it('reproduces every per-player net from the spec output', () => {
    const expectedNets = [2470, -460, -6000, -4000, 3750, -2000, 1180, 3380, -920, 2600]
    expect(summary.players.map((p) => p.netCents)).toEqual(expectedNets)
  })

  it('keeps seat order (first buy-in time)', () => {
    expect(summary.players.map((p) => p.playerId)).toEqual(REF_PLAYERS.map(([name]) => name))
  })

  it('balances: In 300.00 · Out 300.00', () => {
    expect(summary.buyInsCents).toBe(30000)
    expect(summary.cashOutsCents).toBe(30000)
    expect(summary.discrepancyCents).toBe(0)
    expect(summary.balanced).toBe(true)
    expect(summary.onTableCents).toBe(0)
  })

  it('tracks per-player buy-in totals and rebuy counts', () => {
    const francis = summary.players.find((p) => p.playerId === 'Francis')!
    expect(francis.buyInCents).toBe(6000)
    expect(francis.rebuyCount).toBe(5)
    const riley = summary.players.find((p) => p.playerId === 'Riley')!
    expect(riley.buyInCents).toBe(1000)
    expect(riley.rebuyCount).toBe(0)
  })

  it('computes seat time as last cash-out − first buy-in, per player', () => {
    for (const p of summary.players) {
      expect(p.seatMs).toBe(240 * 60_000)
    }
  })

  it('running on-table total lands on zero after the last cash-out', () => {
    const events = buildEvents(referenceTxs())
    expect(events.at(-1)!.runningTableCents).toBe(0)
    // and peaks at total buy-ins once everyone is in
    expect(Math.max(...events.map((e) => e.runningTableCents))).toBe(30000)
  })
})

// ------------------------------ corrections --------------------------------

describe('voiding via corrections', () => {
  const base = '2026-07-24T09:00:00Z'
  const s = session('s1', base)

  it('a corrected transaction drops out of every derived number', () => {
    const b1 = tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) })
    const c1 = tx({ sessionId: 's1', playerId: 'p1', type: 'correction', amountCents: 0, createdAt: at(base, 5), correctsTransactionId: b1.id })
    const summary = summarizeSession(s, [b1, c1])
    expect(summary.buyInsCents).toBe(0)
    expect(summary.players).toHaveLength(0)
    expect(summary.correctionsCount).toBe(1)
  })

  it('correcting a correction un-voids the original (append-only undo)', () => {
    const b1 = tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) })
    const c1 = tx({ sessionId: 's1', playerId: 'p1', type: 'correction', amountCents: 0, createdAt: at(base, 5), correctsTransactionId: b1.id })
    const c2 = tx({ sessionId: 's1', playerId: 'p1', type: 'correction', amountCents: 0, createdAt: at(base, 10), correctsTransactionId: c1.id })
    const voided = computeVoidedIds([b1, c1, c2])
    expect(voided.has(b1.id)).toBe(false)
    expect(voided.has(c1.id)).toBe(true)
    const summary = summarizeSession(s, [b1, c1, c2])
    expect(summary.buyInsCents).toBe(1000)
    expect(summary.correctionsCount).toBe(2)
  })

  it('voided rows appear in events but do not move the running total', () => {
    const b1 = tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) })
    const b2 = tx({ sessionId: 's1', playerId: 'p2', type: 'buy_in', amountCents: 1000, createdAt: at(base, 1) })
    const c1 = tx({ sessionId: 's1', playerId: 'p1', type: 'correction', amountCents: 0, createdAt: at(base, 2), correctsTransactionId: b1.id })
    const events = buildEvents([b1, b2, c1])
    expect(events.map((e) => e.voided)).toEqual([true, false, false])
    // b1 is voided retroactively, so the running totals count only b2
    expect(events.map((e) => e.runningTableCents)).toEqual([0, 1000, 1000])
  })
})

// ------------------------- mid-session cash-out ----------------------------

describe('mid-session cash-out and re-entry (no special casing)', () => {
  const base = '2026-07-24T09:00:00Z'
  const s = session('s1', base)
  const txs = [
    tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) }),
    tx({ sessionId: 's1', playerId: 'p1', type: 'cash_out', amountCents: 2500, createdAt: at(base, 60) }),
    tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 120) }),
    tx({ sessionId: 's1', playerId: 'p1', type: 'cash_out', amountCents: 500, createdAt: at(base, 180) }),
  ]

  it('sums multiple buy-ins and cash-outs', () => {
    const p = summarizeSession(s, txs).players[0]
    expect(p.buyInCents).toBe(2000)
    expect(p.cashOutCents).toBe(3000)
    expect(p.netCents).toBe(1000)
  })

  it('seat time spans first buy-in to LAST cash-out', () => {
    const p = summarizeSession(s, txs).players[0]
    expect(p.seatMs).toBe(180 * 60_000)
  })
})

// ---------------------------- seated players -------------------------------

describe('seatedPlayerIds', () => {
  const base = '2026-07-24T09:00:00Z'

  it('mid-session cash-out unseats; a fresh buy-in re-seats', () => {
    const txs = [
      tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) }),
      tx({ sessionId: 's1', playerId: 'p2', type: 'buy_in', amountCents: 1000, createdAt: at(base, 1) }),
      tx({ sessionId: 's1', playerId: 'p1', type: 'cash_out', amountCents: 500, createdAt: at(base, 60) }),
    ]
    expect(seatedPlayerIds(buildEvents(txs))).toEqual(['p2'])

    txs.push(
      tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 90) }),
    )
    expect(seatedPlayerIds(buildEvents(txs))).toEqual(['p1', 'p2'])
  })

  it('a rebuy logged after the cash-out (missed rebuy) does not re-seat', () => {
    const txs = [
      tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) }),
      tx({ sessionId: 's1', playerId: 'p1', type: 'cash_out', amountCents: 2000, createdAt: at(base, 240) }),
      tx({ sessionId: 's1', playerId: 'p1', type: 'rebuy', amountCents: 1000, createdAt: at(base, 250) }),
    ]
    expect(seatedPlayerIds(buildEvents(txs))).toEqual([])
  })

  it('a voided cash-out leaves the player seated', () => {
    const b = tx({ sessionId: 's1', playerId: 'p1', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) })
    const out = tx({ sessionId: 's1', playerId: 'p1', type: 'cash_out', amountCents: 500, createdAt: at(base, 60) })
    const fix = tx({ sessionId: 's1', playerId: 'p1', type: 'correction', amountCents: 0, createdAt: at(base, 61), correctsTransactionId: out.id })
    expect(seatedPlayerIds(buildEvents([b, out, fix]))).toEqual(['p1'])
  })
})

// ---------------------------- reconcile hints ------------------------------

describe('reconcileHint', () => {
  it('zero delta is balanced', () => {
    expect(reconcileHint(0, 1000, 30000)).toEqual({ kind: 'balanced' })
  })
  it('positive multiples of the default buy-in suggest missed rebuys', () => {
    expect(reconcileHint(1000, 1000, 30000)).toEqual({
      kind: 'missed-rebuy',
      missedCount: 1,
      boxShouldHoldCents: 31000,
    })
    expect(reconcileHint(3000, 1000, 30000)).toEqual({
      kind: 'missed-rebuy',
      missedCount: 3,
      boxShouldHoldCents: 33000,
    })
  })
  it('anything else suggests a miscount', () => {
    expect(reconcileHint(500, 1000, 30000)).toEqual({ kind: 'miscount' })
    expect(reconcileHint(-1000, 1000, 30000)).toEqual({ kind: 'miscount' })
  })
})

// ------------------------------- streaks -----------------------------------

describe('computeStreak', () => {
  it('counts consecutive recent wins', () => {
    expect(computeStreak([-100, 100, 200, 300])).toBe(3)
  })
  it('counts consecutive recent losses as negative', () => {
    expect(computeStreak([100, -100, -200])).toBe(-2)
  })
  it('a $0 night breaks any streak', () => {
    expect(computeStreak([100, 100, 0])).toBe(0)
    expect(computeStreak([100, 0, 100])).toBe(1)
  })
  it('empty history is streak 0', () => {
    expect(computeStreak([])).toBe(0)
  })
})

// ---------------------------- player series --------------------------------

describe('computePlayerSeries', () => {
  const s1 = session('ps1', '2026-06-05T09:00:00.000Z')
  const s2 = session('ps2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ps3', '2026-06-19T09:00:00.000Z')
  const sLive = session('psLive', '2026-06-26T09:00:00.000Z', 'live')
  const txs = [
    ...play('ps1', s1.startedAt, 'p1', { inCents: 1000, outCents: 2000, startMin: 0, endMin: 240 }),
    ...play('ps2', s2.startedAt, 'p1', { inCents: 1000, outCents: 500, startMin: 0, endMin: 240 }),
    // p1 sits out s3; p2 plays it
    ...play('ps3', s3.startedAt, 'p2', { inCents: 1000, outCents: 1000, startMin: 0, endMin: 240 }),
    ...play('psLive', sLive.startedAt, 'p1', { inCents: 9000, outCents: 0, startMin: 0, endMin: 60 }),
  ]
  const sessions = [s1, s2, s3, sLive]

  it('accumulates nets across played saved sessions only', () => {
    const series = computePlayerSeries('p1', sessions, txs)
    expect(series.map((p) => p.session.id)).toEqual(['ps1', 'ps2'])
    expect(series.map((p) => p.netCents)).toEqual([1000, -500])
    expect(series.map((p) => p.cumulativeCents)).toEqual([1000, 500])
  })

  it('is empty for a player with no saved sessions', () => {
    expect(computePlayerSeries('nobody', sessions, txs)).toEqual([])
  })
})

// ----------------------------- leaderboard ---------------------------------

describe('computeLeaderboard', () => {
  const players = [
    player('alice', 'Alice'),
    player('bob', 'Bob', true), // guest
    player('cara', 'Cara'),
    player('dave', 'Dave'),
  ]

  // 12 saved sessions: 6 in June, 6 in July 2026, all starting 19:00 Melbourne.
  const days = [
    '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06',
    '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06',
  ]
  const sessions = days.map((d, i) => session(`s${i + 1}`, `${d}T09:00:00.000Z`))

  // Alice plays all 12. Chronological nets: the first six vary, the last six are +100 each.
  const aliceNets = [1000, -500, 0, 2000, 1500, 500, 100, 100, 100, 100, 100, 100]

  const txs: Tx[] = sessions.flatMap((s, i) => {
    const base = s.startedAt
    const all: Tx[] = []
    // Alice: 4h seat, buy-in $10, cash out $10 + net
    all.push(
      ...play(s.id, base, 'alice', {
        inCents: 1000,
        outCents: 1000 + aliceNets[i],
        startMin: 0,
        endMin: 240,
      }),
    )
    // Bob (guest) plays the first two sessions, +$5 each
    if (i < 2) {
      all.push(...play(s.id, base, 'bob', { inCents: 1000, outCents: 1500, startMin: 1, endMin: 241 }))
    }
    // Cara plays the first four: −10, +2, +3, +4 dollars
    if (i < 4) {
      const caraNets = [-1000, 200, 300, 400]
      all.push(
        ...play(s.id, base, 'cara', {
          inCents: 2000,
          outCents: 2000 + caraNets[i],
          startMin: 2,
          endMin: 242,
        }),
      )
    }
    // Dave plays the first two: +1, −1 dollars
    if (i < 2) {
      const daveNets = [100, -100]
      all.push(
        ...play(s.id, base, 'dave', { inCents: 1000, outCents: 1000 + daveNets[i], startMin: 3, endMin: 243 }),
      )
    }
    return all
  })

  // Live and discarded sessions with big numbers that must be ignored everywhere
  const liveSession = session('live1', '2026-07-24T09:00:00.000Z', 'live')
  const liveTxs = play('live1', liveSession.startedAt, 'alice', {
    inCents: 100000,
    outCents: 0,
    startMin: 0,
    endMin: 60,
  })
  const discardedSession = session('disc1', '2026-07-17T09:00:00.000Z', 'discarded')
  const discardedTxs = play('disc1', discardedSession.startedAt, 'alice', {
    inCents: 50000,
    outCents: 0,
    startMin: 0,
    endMin: 60,
  })

  const allSessions = [...sessions, liveSession, discardedSession]
  const allTxs = [...txs, ...liveTxs, ...discardedTxs]
  const now = new Date('2026-07-25T12:00:00Z')

  it('all-time: aggregates only saved sessions, guests hidden by default', () => {
    const rows = computeLeaderboard(players, allSessions, allTxs, {
      window: 'all', sort: 'net', includeGuests: false, now,
    })
    expect(rows.map((r) => r.player.id)).toEqual(['alice', 'dave', 'cara'])
    const alice = rows[0]
    expect(alice.games).toBe(12) // neither the live nor the discarded session counted
    expect(alice.netCents).toBe(5100)
    expect(alice.seatMs).toBe(12 * 240 * 60_000)
    expect(alice.hourlyRateCents).toBeCloseTo(5100 / 48, 5)
    expect(alice.winRatePct).toBeCloseTo((10 / 12) * 100, 5)
    expect(alice.streak).toBe(9) // the $0 night in s3 stops the count
    expect(alice.bestNightCents).toBe(2000)
  })

  it('rate stats are null under 5 sessions', () => {
    const rows = computeLeaderboard(players, allSessions, allTxs, {
      window: 'all', sort: 'net', includeGuests: false, now,
    })
    const cara = rows.find((r) => r.player.id === 'cara')!
    expect(cara.games).toBe(4)
    expect(cara.winRatePct).toBeNull()
    expect(cara.hourlyRateCents).toBeNull()
    expect(cara.streak).toBe(3)
    expect(cara.bestNightCents).toBe(400)
  })

  it('includeGuests reveals guests', () => {
    const rows = computeLeaderboard(players, allSessions, allTxs, {
      window: 'all', sort: 'net', includeGuests: true, now,
    })
    const bob = rows.find((r) => r.player.id === 'bob')!
    expect(bob.games).toBe(2)
    expect(bob.netCents).toBe(1000)
    expect(bob.streak).toBe(2)
  })

  it('last10 is one shared window: the 10 most recent saved sessions', () => {
    const rows = computeLeaderboard(players, allSessions, allTxs, {
      window: 'last10', sort: 'net', includeGuests: true, now,
    })
    const alice = rows.find((r) => r.player.id === 'alice')!
    expect(alice.games).toBe(10)
    // Bob and Dave only played the two oldest sessions — outside the window
    expect(rows.find((r) => r.player.id === 'bob')).toBeUndefined()
    expect(rows.find((r) => r.player.id === 'dave')).toBeUndefined()
    const cara = rows.find((r) => r.player.id === 'cara')!
    expect(cara.games).toBe(2) // s3 and s4 only
  })

  it('sorting by winRate sinks null (under-threshold) rows to the bottom', () => {
    const rows = computeLeaderboard(players, allSessions, allTxs, {
      window: 'all', sort: 'winRate', includeGuests: false, now,
    })
    expect(rows[0].player.id).toBe('alice')
    // among the nulls, tiebreak is net: Dave (0) above Cara (−100)
    expect(rows.map((r) => r.player.id)).toEqual(['alice', 'dave', 'cara'])
  })

  it('ascending net is the exact mirror: biggest loser first', () => {
    const rows = computeLeaderboard(players, allSessions, allTxs, {
      window: 'all', sort: 'net', dir: 'asc', includeGuests: false, now,
    })
    // nets: Cara −100, Dave 0, Alice +5100
    expect(rows.map((r) => r.player.id)).toEqual(['cara', 'dave', 'alice'])
  })

  it('ascending still sinks under-threshold rate rows to the bottom', () => {
    const rows = computeLeaderboard(players, allSessions, allTxs, {
      window: 'all', sort: 'winRate', dir: 'asc', includeGuests: false, now,
    })
    // Alice is the only row with enough games for a win rate, so she stays on
    // top even ascending; the null rows keep to the bottom with their net
    // tiebreak mirrored too (Cara −100 now above Dave 0).
    expect(rows.map((r) => r.player.id)).toEqual(['alice', 'cara', 'dave'])
  })

  it('month window respects the 3am logical-day rule on both ends', () => {
    const monthPlayers = [player('alice', 'Alice')]
    const sJul = session('sJul', '2026-07-10T09:00:00.000Z') // 19:00 Fri 10 Jul
    const sEdge = session('sEdge', '2026-07-31T16:00:00.000Z') // 02:00 Sat 1 Aug → logical 31 Jul
    const sAug = session('sAug', '2026-08-01T09:00:00.000Z') // 19:00 Sat 1 Aug
    const monthTxs = [
      ...play('sJul', sJul.startedAt, 'alice', { inCents: 1000, outCents: 2000, startMin: 0, endMin: 240 }),
      ...play('sEdge', sEdge.startedAt, 'alice', { inCents: 1000, outCents: 2000, startMin: 0, endMin: 240 }),
      ...play('sAug', sAug.startedAt, 'alice', { inCents: 1000, outCents: 2000, startMin: 0, endMin: 240 }),
    ]
    const sessions3 = [sJul, sEdge, sAug]

    // 02:30am on 1 Aug: "now" still logically belongs to July
    const lateNightJuly = new Date('2026-07-31T16:30:00Z')
    const julyRows = computeLeaderboard(monthPlayers, sessions3, monthTxs, {
      window: 'month', sort: 'net', includeGuests: false, now: lateNightJuly,
    })
    expect(julyRows[0].games).toBe(2) // sJul + sEdge; sAug excluded

    // the following evening it is August
    const augustEvening = new Date('2026-08-01T10:00:00Z')
    const augustRows = computeLeaderboard(monthPlayers, sessions3, monthTxs, {
      window: 'month', sort: 'net', includeGuests: false, now: augustEvening,
    })
    expect(augustRows[0].games).toBe(1) // sAug only
  })
})
