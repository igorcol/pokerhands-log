import type { Action, ActionType, AmbientEvent, Card, Hand, PostType, Street } from './types'

// Converte uma Hand parseada numa lista plana de eventos cronológicos (ReplayEvent[]).
// É a base do replay: cada frame do player é só `applyEvents(events.slice(0, i))`, nunca
// setTimeout encadeado. Ordem dentro de cada street é street → ações → ambient — ambient é
// só flavor (não muda estado de jogo), então não precisa de posição exata em relação às ações.

export type ReplayEvent =
  | { kind: 'post'; player: string; postType: PostType; amount: number }
  | { kind: 'deal-hole'; player: string; cards: Card[] }
  | {
      kind: 'action'
      street: Street
      player: string
      type: ActionType
      amount: number
      totalBet: number
      isAllIn: boolean
    }
  | { kind: 'street'; street: Street; cards: Card[] }
  | { kind: 'uncalled-return'; player: string; amount: number }
  | {
      kind: 'reveal'
      player: string
      cards: Card[]
      description: string | null
      source: 'showdown' | 'summary-muck'
    }
  | { kind: 'collect'; player: string; amount: number }
  | { kind: 'ambient'; player: string | null; text: string }

const STREET_ORDER: Street[] = ['preflop', 'flop', 'turn', 'river']

function streetsPlayed(board: Card[]): Set<Street> {
  const streets = new Set<Street>(['preflop'])
  if (board.length >= 3) streets.add('flop')
  if (board.length >= 4) streets.add('turn')
  if (board.length >= 5) streets.add('river')
  return streets
}

// Board é cumulativo no Hand; aqui devolvemos só a carta nova da street, pro
// replay poder animar "essa carta específica virou agora".
function newCardsForStreet(board: Card[], street: Street): Card[] {
  if (street === 'flop') return board.slice(0, 3)
  if (street === 'turn') return [board[3]]
  if (street === 'river') return [board[4]]
  return []
}

function groupAmbientBySection(events: AmbientEvent[]): Map<AmbientEvent['section'], AmbientEvent[]> {
  const map = new Map<AmbientEvent['section'], AmbientEvent[]>()
  for (const event of events) {
    const list = map.get(event.section) ?? []
    list.push(event)
    map.set(event.section, list)
  }
  return map
}

function toActionEvent(action: Action): ReplayEvent {
  return {
    kind: 'action',
    street: action.street,
    player: action.player,
    type: action.type,
    amount: action.amount,
    totalBet: action.totalBet,
    isAllIn: action.isAllIn,
  }
}

export function buildTimeline(hand: Hand): ReplayEvent[] {
  const events: ReplayEvent[] = []
  const played = streetsPlayed(hand.board)
  const ambientBySection = groupAmbientBySection(hand.ambientEvents)

  for (const post of hand.posts) {
    events.push({ kind: 'post', player: post.player, postType: post.type, amount: post.amount })
  }

  if (hand.dealtHoleCards) {
    events.push({
      kind: 'deal-hole',
      player: hand.dealtHoleCards.player,
      cards: hand.dealtHoleCards.cards,
    })
  }

  for (const street of STREET_ORDER) {
    if (!played.has(street)) break

    if (street !== 'preflop') {
      events.push({ kind: 'street', street, cards: newCardsForStreet(hand.board, street) })
    }

    for (const action of hand.actions.filter((a) => a.street === street)) {
      events.push(toActionEvent(action))
    }

    for (const ambient of ambientBySection.get(street) ?? []) {
      events.push({ kind: 'ambient', player: ambient.player, text: ambient.text })
    }
  }

  for (const uncalled of hand.uncalledBets) {
    events.push({ kind: 'uncalled-return', player: uncalled.player, amount: uncalled.amount })
  }

  for (const reveal of hand.reveals) {
    events.push({
      kind: 'reveal',
      player: reveal.player,
      cards: reveal.cards,
      description: reveal.description,
      source: reveal.source,
    })
  }

  for (const winner of hand.winners) {
    events.push({ kind: 'collect', player: winner.player, amount: winner.amount })
  }

  for (const ambient of ambientBySection.get('summary') ?? []) {
    events.push({ kind: 'ambient', player: ambient.player, text: ambient.text })
  }

  return events
}