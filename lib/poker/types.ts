export type Suit = 'h' | 'd' | 'c' | 's'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'
export type PositionName = 'BTN' | 'SB' | 'BB' | 'UTG' | 'MP' | 'CO' // TODO: tabela por tamanho de mesa

export type Street = 'preflop' | 'flop' | 'turn' | 'river'
// Em cash game só tem 3 tips. Ante/dead blind fica de fora
export type PostType = 'sb' | 'bb' | 'sb+bb'
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise'

export interface Card {
    rank: Rank
    suit: Suit
}

export interface Seat {
    seatNumber: number
    playerName: string
    chips: number // cents
    isSittingOut: boolean
}

export interface Post {
    player: string
    type: PostType
    amount: number // cents
}

export interface Action {
    street: Street
    player: string
    type: ActionType
    // totalBet é sempre o total acumulado do jogador na street: em bet/raise vem
    // direto do texto (bet: valor bruto; raise: o número depois do "to"). Em call,
    // soma ao total anterior do jogador. amount é sempre totalBet menos o total
    // anterior do PRÓPRIO jogador — nem sempre bate com o "X" de "raises X to Y":
    // se ele já tinha fichas na street (ex.: pagou blind), o X do texto ignora isso.
    // Resolvido aqui uma vez, com um mapa de total-por-jogador-por-street.
    amount: number
    totalBet: number
    isAllIn: boolean
}

export interface UncalledBetReturn {
    player: string
    amount: number
}

export interface Reveal {
    player: string
    cards: Card[]
    // null quando a única fonte foi "mucked [..]" no SUMMARY. a PokerStars não dá
    // descrição de mão pra muck, só pra "shows"/"showed".
    description: string | null
    source: 'showdown' | 'summary-muck'
}

export interface Winner {
  player: string
  amount: number // cents
}

export interface AmbientEvent {
  player: string | null // null quando o evento não é de um jogador específico
  section: Street | 'summary' // seção do arquivo onde a linha apareceu
  text: string // texto original, ex.: "leaves the table", "is connected"
}

export interface Hand {
    id: string
    dateIso: string
    tableName: string
    maxSeats: number
    smallBlind: number
    bigBlind: number
    buttonSeat: number
    seats: Seat[]
    posts: Post[]
    dealtHoleCards: { player: string; cards: Card[] } | null
    actions: Action[]
    board: Card[]
    uncalledBets: UncalledBetReturn[]
    reveals: Reveal[]
    winners: Winner[]
    ambientEvents: AmbientEvent[]
    totalPot: number 
    rake: number
}