import type { Player, Session, SessionStatus, Tx, TxType } from './types'

/**
 * Test-only fixture helpers, shared by derive.test.ts and export.test.ts.
 * Includes the spec §5.1 reference session, which the text export must
 * reproduce byte-for-byte.
 */

let txSeq = 0

export function tx(args: {
  sessionId: string
  playerId: string
  type: TxType
  amountCents: number
  createdAt: string
  correctsTransactionId?: string
  id?: string
}): Tx {
  txSeq += 1
  return {
    id: args.id ?? `t${String(txSeq).padStart(4, '0')}`,
    sessionId: args.sessionId,
    playerId: args.playerId,
    type: args.type,
    amountCents: args.amountCents,
    denominations: null,
    secondCountConfirmed: false,
    correctsTransactionId: args.correctsTransactionId ?? null,
    note: args.correctsTransactionId ? 'test correction' : null,
    createdAt: args.createdAt,
  }
}

export function session(
  id: string,
  startedAt: string,
  status: SessionStatus = 'saved',
): Session {
  return { id, startedAt, endedAt: null, status, createdAt: startedAt }
}

export function player(id: string, name: string, isGuest = false): Player {
  return { id, name, isGuest, archivedAt: null, createdAt: '2026-01-01T00:00:00Z' }
}

/** ISO timestamp `minutes` after a base instant. */
export function at(baseIso: string, minutes: number): string {
  return new Date(Date.parse(baseIso) + minutes * 60_000).toISOString()
}

/**
 * One player's night in one call: buy_in at +startMin, extra rebuys of $10
 * spread minutes apart, cash_out at +endMin.
 */
export function play(
  sessionId: string,
  base: string,
  playerId: string,
  opts: { inCents: number; outCents: number; startMin: number; endMin: number },
): Tx[] {
  const txs: Tx[] = [
    tx({
      sessionId,
      playerId,
      type: 'buy_in',
      amountCents: 1000,
      createdAt: at(base, opts.startMin),
    }),
  ]
  let remaining = opts.inCents - 1000
  let minute = opts.startMin + 30
  while (remaining > 0) {
    txs.push(
      tx({ sessionId, playerId, type: 'rebuy', amountCents: 1000, createdAt: at(base, minute) }),
    )
    remaining -= 1000
    minute += 10
  }
  txs.push(
    tx({
      sessionId,
      playerId,
      type: 'cash_out',
      amountCents: opts.outCents,
      createdAt: at(base, opts.endMin),
    }),
  )
  return txs
}

// ------------------- the spec §5.1 reference session -----------------------

export const REF_BASE = '2026-07-24T09:00:00Z' // 19:00 Fri 24 Jul, Melbourne
export const REF_SESSION = session('ref', REF_BASE)

/** name, total in (cents), cash out (cents), in the spec output's seat order. */
export const REF_PLAYERS: Array<[string, number, number]> = [
  ['Victor', 2000, 4470],
  ['Francis', 6000, 5540],
  ['DK', 6000, 0],
  ['Ray', 4000, 0],
  ['Doug', 2000, 5750],
  ['AT', 2000, 0],
  ['Josh', 2000, 3180],
  ['Riley', 1000, 4380],
  ['Ken', 2000, 1080],
  ['Wilson', 3000, 5600],
]

export function referenceTxs(): Tx[] {
  return REF_PLAYERS.flatMap(([name, inCents, outCents], i) =>
    play('ref', REF_BASE, name, {
      inCents,
      outCents,
      startMin: i, // staggered buy-ins fix the seat order
      endMin: 240 + i,
    }),
  )
}
