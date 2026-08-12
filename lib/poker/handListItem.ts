import { isShowdown } from './format'
import type { HandOutcome } from './handResult'
import type { HandWithResult } from './handResult'
import type { Card, PositionName } from './types'

// View model plano que a página serializa pro Client Component: o Hand completo carrega
// actions/posts/reveals que a lista nunca usa, e mantém o componente de cliente sem
// depender de tipo de domínio do parser — só do que ele realmente renderiza.

export interface HandListItem {
  id: string
  dateIso: string
  holeCards: Card[]
  position: PositionName
  board: Card[]
  pot: number
  net: number
  startStack: number
  outcome: HandOutcome
  isShowdown: boolean
}

export function toHandListItem({ hand, result }: HandWithResult): HandListItem {
  const startStack = hand.seats.find((s) => s.playerName === result.hero)?.chips ?? 0

  return {
    id: hand.id,
    dateIso: hand.dateIso,
    holeCards: result.holeCards,
    position: result.position,
    board: hand.board,
    pot: hand.totalPot,
    net: result.net,
    startStack,
    outcome: result.outcome,
    isShowdown: isShowdown(result.outcome),
  }
}

export type PeriodKey = 'today' | '7d' | 'month' | 'all'

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

// "Hoje" e "Mês" são alinhados ao calendário; "7 dias" é janela corrida — é o que cada
// rótulo promete de fato ("últimos 7 dias" já lê como janela móvel por convenção; um
// "mês" corrido de 30 dias soaria estranho pra quem está olhando o calendário).
export function filterByPeriod<T extends { dateIso: string }>(
  items: T[],
  period: PeriodKey,
  now: Date,
): T[] {
  if (period === 'all') return items
  if (period === 'today') return items.filter((item) => isSameDay(new Date(item.dateIso), now))
  if (period === 'month') return items.filter((item) => isSameMonth(new Date(item.dateIso), now))
  return items.filter((item) => now.getTime() - new Date(item.dateIso).getTime() <= SEVEN_DAYS_MS)
}

export type FilterKey = 'all' | 'won' | 'lost' | 'showdown' | 'biggest-pots'

// 'biggest-pots' reordena em vez de excluir — toda mão tem pote, então "filtrar" por
// maior pote só faz sentido como ordenação.
export function filterHandListItems(items: HandListItem[], filter: FilterKey): HandListItem[] {
  switch (filter) {
    case 'all':
      return items
    case 'won':
      return items.filter((item) => item.net > 0)
    case 'lost':
      return items.filter((item) => item.net < 0)
    case 'showdown':
      return items.filter((item) => item.isShowdown)
    case 'biggest-pots':
      return [...items].sort((a, b) => b.pot - a.pot)
  }
}