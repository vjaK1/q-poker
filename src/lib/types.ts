export type SessionStatus = 'live' | 'counting' | 'saved' | 'discarded'

export type TxType = 'buy_in' | 'rebuy' | 'cash_out' | 'correction'

/** Chip breakdown for a cash_out: keys are chip values in cents, values are counts. */
export type Denominations = Record<string, number>

export interface Player {
  id: string
  name: string
  isGuest: boolean
  archivedAt: string | null
  createdAt: string
}

export interface Session {
  id: string
  startedAt: string
  endedAt: string | null
  status: SessionStatus
  createdAt: string
}

export interface Tx {
  id: string
  sessionId: string
  playerId: string
  type: TxType
  amountCents: number
  denominations: Denominations | null
  secondCountConfirmed: boolean
  correctsTransactionId: string | null
  note: string | null
  createdAt: string
}

export type BoardWindow = 'all' | 'last10' | 'month'

export type BoardSort = 'net' | 'hourly' | 'games' | 'hours' | 'winRate'

export type BoardDir = 'desc' | 'asc'
