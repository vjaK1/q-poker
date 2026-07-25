import { describe, expect, it } from 'vitest'
import { buildEvents, summarizeSession } from './derive'
import { buildSessionsCsv, buildTextExport, buildTransactionsCsv } from './export'
import { at, play, player, REF_SESSION, referenceTxs, session, tx } from './testUtils'
import type { Player, Tx } from './types'

function playersByIdFromNames(ids: string[]): Map<string, Player> {
  return new Map(ids.map((id) => [id, player(id, id)]))
}

function refSummary() {
  const txs = referenceTxs()
  const names = playersByIdFromNames(txs.map((t) => t.playerId))
  return summarizeSession(REF_SESSION, txs, names)
}

// The spec's reference output, §5.1: "must match byte-for-byte given this input".
const REFERENCE_OUTPUT = [
  'Fri 24 Jul',
  '',
  'Victor  (-20)  44.70   24.70',
  'Francis (-60)  55.40   -4.60',
  'DK      (-60)   0.00  -60.00',
  'Ray     (-40)   0.00  -40.00',
  'Doug    (-20)  57.50   37.50',
  'AT      (-20)   0.00  -20.00',
  'Josh    (-20)  31.80   11.80',
  'Riley   (-10)  43.80   33.80',
  'Ken     (-20)  10.80   -9.20',
  'Wilson  (-30)  56.00   26.00',
  '',
  'In 300.00 · Out 300.00 · Balanced',
].join('\n')

describe('buildTextExport', () => {
  it('reproduces the spec reference output byte-for-byte', () => {
    const text = buildTextExport(refSummary(), {
      header: true,
      footer: true,
      sortByNet: false,
    })
    expect(text).toBe(REFERENCE_OUTPUT)
  })

  it('header toggle removes the date and its blank line', () => {
    const text = buildTextExport(refSummary(), {
      header: false,
      footer: true,
      sortByNet: false,
    })
    expect(text.startsWith('Victor  (-20)')).toBe(true)
  })

  it('footer toggle removes the totals line', () => {
    const text = buildTextExport(refSummary(), {
      header: true,
      footer: false,
      sortByNet: false,
    })
    expect(text.endsWith('Wilson  (-30)  56.00   26.00')).toBe(true)
  })

  it('sort-by-net orders descending', () => {
    const text = buildTextExport(refSummary(), {
      header: false,
      footer: false,
      sortByNet: true,
    })
    const lines = text.split('\n')
    expect(lines[0].startsWith('Doug')).toBe(true) // +37.50, biggest winner
    expect(lines.at(-1)!.startsWith('DK')).toBe(true) // −60.00, biggest loser
  })

  it('unbalanced sessions footer shows the delta', () => {
    const base = '2026-07-24T09:00:00Z'
    const s = session('unb', base)
    const txs = [
      ...play('unb', base, 'A', { inCents: 1000, outCents: 0, startMin: 0, endMin: 240 }),
      ...play('unb', base, 'B', { inCents: 1000, outCents: 1500, startMin: 1, endMin: 241 }),
    ]
    const text = buildTextExport(summarizeSession(s, txs, playersByIdFromNames(['A', 'B'])), {
      header: false,
      footer: true,
      sortByNet: false,
    })
    expect(text.endsWith('In 20.00 · Out 15.00 · Off by -5.00')).toBe(true)
  })

  it('non-whole buy-ins keep their decimals in the bracket', () => {
    const base = '2026-07-24T09:00:00Z'
    const s = session('frac', base)
    const txs: Tx[] = [
      tx({ sessionId: 'frac', playerId: 'A', type: 'buy_in', amountCents: 1050, createdAt: at(base, 0) }),
      tx({ sessionId: 'frac', playerId: 'A', type: 'cash_out', amountCents: 1050, createdAt: at(base, 60) }),
    ]
    const text = buildTextExport(summarizeSession(s, txs, playersByIdFromNames(['A'])), {
      header: false,
      footer: false,
      sortByNet: false,
    })
    expect(text).toBe('A (-10.50)  10.50  0.00')
  })
})

describe('CSV exports', () => {
  const base = '2026-07-24T09:00:00Z'
  const s = session('csv1', base)
  const buyIn = tx({ sessionId: 'csv1', playerId: 'A', type: 'buy_in', amountCents: 1000, createdAt: at(base, 0) })
  const badRebuy = tx({ sessionId: 'csv1', playerId: 'A', type: 'rebuy', amountCents: 1000, createdAt: at(base, 30) })
  const fix = tx({ sessionId: 'csv1', playerId: 'A', type: 'correction', amountCents: 0, createdAt: at(base, 31), correctsTransactionId: badRebuy.id })
  const cashOut: Tx = {
    ...tx({ sessionId: 'csv1', playerId: 'A', type: 'cash_out', amountCents: 750, createdAt: at(base, 240) }),
    denominations: { '100': 4, '25': 12, '5': 10 },
    secondCountConfirmed: true,
  }
  const txs = [buyIn, badRebuy, fix, cashOut]
  const players = [player('A', 'A')]
  const source = {
    session: s,
    summary: summarizeSession(s, txs, playersByIdFromNames(['A'])),
    events: buildEvents(txs),
    players,
  }

  it('transactions.csv has the spec header and one row per event, voided included', () => {
    const csv = buildTransactionsCsv(source)
    const lines = csv.split('\n')
    expect(lines[0]).toBe(
      'session_id,session_date,timestamp,player,type,amount,denominations,running_table_total,corrects_event_id,note',
    )
    expect(lines).toHaveLength(1 + 4)
    // buy_in: 19:00 Melbourne with +10:00 offset, running total 10.00
    expect(lines[1]).toBe(`csv1,2026-07-24,2026-07-24T19:00:00+10:00,A,buy_in,10.00,,10.00,,`)
    // voided rebuy still listed; running total unchanged by it
    expect(lines[2]).toContain('rebuy,10.00,,10.00')
    // correction references it
    expect(lines[3]).toContain(`correction,0.00,,10.00,${badRebuy.id},test correction`)
    // denominations JSON is quoted with doubled quotes (JS orders numeric keys ascending)
    expect(lines[4]).toContain('"{""5"":10,""25"":12,""100"":4}"')
    expect(lines[4]).toContain('cash_out,7.50')
  })

  it('sessions.csv has the spec header and per-player rows', () => {
    const csv = buildSessionsCsv(source)
    const lines = csv.split('\n')
    expect(lines[0]).toBe(
      'session_id,date,player,buy_ins_total,rebuy_count,cash_out,net,seat_in,seat_out,hours_played,session_balanced,session_discrepancy',
    )
    // rebuy was voided: buy-ins 10.00, 0 rebuys, out 7.50, net -2.50, 4 hours seat time
    expect(lines[1]).toBe(
      `csv1,2026-07-24,A,10.00,0,7.50,-2.50,2026-07-24T19:00:00+10:00,2026-07-24T23:00:00+10:00,4.00,false,-2.50`,
    )
  })
})
