import type { LedgerEvent, PlayerSessionSummary, SessionSummary } from './derive'
import type { Player, Session } from './types'
import { centsToDollars } from './money'
import { formatMelbourneISO, logicalDayISO, sessionDisplayName } from './time'

/**
 * Exports (§5). Pure functions; buildTextExport is pinned byte-for-byte to
 * the spec's reference output by export.test.ts.
 */

export interface TextExportOptions {
  header: boolean
  footer: boolean
  sortByNet: boolean
}

/** "(-20)" for whole dollars, "(-10.50)" otherwise (money in, so negative). */
function bracket(buyInCents: number): string {
  const dollars = centsToDollars(buyInCents)
  return `(-${dollars.endsWith('.00') ? dollars.slice(0, -3) : dollars})`
}

const displayName = (p: PlayerSessionSummary) => p.name ?? p.playerId

/** §5.1 group-chat text export. */
export function buildTextExport(summary: SessionSummary, opts: TextExportOptions): string {
  const players = opts.sortByNet
    ? [...summary.players].sort((a, b) => b.netCents - a.netCents)
    : summary.players

  const cells = players.map((p) => ({
    name: displayName(p),
    bracket: bracket(p.buyInCents),
    stack: centsToDollars(p.cashOutCents),
    net: centsToDollars(p.netCents),
  }))

  const nameWidth = Math.max(...cells.map((c) => c.name.length), 0) + 1
  const bracketWidth = Math.max(...cells.map((c) => c.bracket.length), 0)
  const stackWidth = Math.max(...cells.map((c) => c.stack.length), 0)
  const netWidth = Math.max(...cells.map((c) => c.net.length), 0)

  const lines = cells.map(
    (c) =>
      c.name.padEnd(nameWidth) +
      c.bracket.padEnd(bracketWidth) +
      '  ' +
      c.stack.padStart(stackWidth) +
      '  ' +
      c.net.padStart(netWidth),
  )

  const parts: string[] = []
  if (opts.header) parts.push(sessionDisplayName(summary.session.startedAt), '')
  parts.push(...lines)
  if (opts.footer) {
    const verdict = summary.balanced
      ? 'Balanced'
      : `Off by ${centsToDollars(summary.discrepancyCents)}`
    parts.push(
      '',
      `In ${centsToDollars(summary.buyInsCents)} · Out ${centsToDollars(summary.cashOutsCents)} · ${verdict}`,
    )
  }
  return parts.join('\n')
}

// --------------------------------- CSV -------------------------------------

function csvField(value: string | number | boolean): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvLine(fields: Array<string | number | boolean>): string {
  return fields.map(csvField).join(',')
}

export interface ExportSource {
  session: Session
  summary: SessionSummary
  events: LedgerEvent[]
  players: Player[]
}

/** §5.2 transactions.csv: one row per event, the evidence file. Voided rows included. */
export function buildTransactionsCsv(source: ExportSource): string {
  const day = logicalDayISO(source.session.startedAt)
  const nameOf = (playerId: string) =>
    source.players.find((p) => p.id === playerId)?.name ?? playerId
  const rows = source.events.map((e) =>
    csvLine([
      source.session.id,
      day,
      formatMelbourneISO(e.createdAt),
      nameOf(e.playerId),
      e.type,
      centsToDollars(e.amountCents),
      e.denominations !== null ? JSON.stringify(e.denominations) : '',
      centsToDollars(e.runningTableCents),
      e.correctsTransactionId ?? '',
      e.note ?? '',
    ]),
  )
  return [
    'session_id,session_date,timestamp,player,type,amount,denominations,running_table_total,corrects_event_id,note',
    ...rows,
  ].join('\n')
}

/** §5.2 sessions.csv: one row per player, drops into the existing Excel sheet. */
export function buildSessionsCsv(source: ExportSource): string {
  const day = logicalDayISO(source.session.startedAt)
  const rows = source.summary.players.map((p) =>
    csvLine([
      source.session.id,
      day,
      displayName(p),
      centsToDollars(p.buyInCents),
      p.rebuyCount,
      centsToDollars(p.cashOutCents),
      centsToDollars(p.netCents),
      p.firstBuyInAt !== null ? formatMelbourneISO(p.firstBuyInAt) : '',
      p.lastCashOutAt !== null ? formatMelbourneISO(p.lastCashOutAt) : '',
      p.seatMs !== null ? (p.seatMs / 3_600_000).toFixed(2) : '',
      source.summary.balanced,
      centsToDollars(source.summary.discrepancyCents),
    ]),
  )
  return [
    'session_id,date,player,buy_ins_total,rebuy_count,cash_out,net,seat_in,seat_out,hours_played,session_balanced,session_discrepancy',
    ...rows,
  ].join('\n')
}
