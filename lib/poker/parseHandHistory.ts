import type { Card, Post, PostType, Rank, Seat, Suit } from './types'

const RANKS = new Set(['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'])
const SUITS = new Set(['h', 'd', 'c', 's'])

// Tudo é armazenado como inteiro em centavos
export function parseMoney(raw: string): number {
    const cleaned = raw.replace(/[$,]/g, '')
    const [wholePart, decimalPart = ''] = cleaned.split('.')
    const centsPart = (decimalPart + '00').slice(0, 2)
    return Number(wholePart) * 100 + Number(centsPart)
} 

export function parseCard(raw: string): Card {
    const rank = raw[0]
    const suit = raw[1]
    if (!RANKS.has(rank) || !SUITS.has(suit)) {
        throw new Error(`Invalid card format: "${raw}"`)
    }
    return { rank: rank as Rank, suit: suit as Suit}
}

// Fatiado por lookahead no header, não por linha em branco, a contagem de linhas em branco entre mãos não é garantida pelo formato.
export function splitHandBlocks(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n')
  return normalized
    .split(/(?=^PokerStars Hand #\d+:)/m)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
}

const HEADER_RE = /^PokerStars Hand #(\d+):\s+Hold'em No Limit \(\$?(\d+(?:\.\d+)?)\/\$?(\d+(?:\.\d+)?)\) - (\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2}) UTC/

export function parseHeader(block: string) {
  const line = block.split('\n')[0]
  const match = line.match(HEADER_RE)
  if (!match) {
    throw new Error(`Unrecognized hand header: "${line}"`)
  }
  const [, id, sb, bb, year, month, day, hour, minute, second] = match
  return {
    id,
    dateIso: `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`,
    smallBlind: parseMoney(sb),
    bigBlind: parseMoney(bb),
  }
}

const TABLE_RE = /^Table '(.+)' (\d+)-max(?: \([^)]*\))? Seat #(\d+) is the button/

export function parseTableInfo(block: string) {
  const line = block.split('\n')[1]
  const match = line.match(TABLE_RE)
  if (!match) {
    throw new Error(`Unrecognized table line: "${line}"`)
  }
  const [, tableName, maxSeats, buttonSeat] = match
  return {
    tableName,
    maxSeats: Number(maxSeats),
    buttonSeat: Number(buttonSeat),
  }
}

const SEAT_RE = /^Seat (\d+): (.+) \((\d+(?:\.\d+)?) in chips\)(?: is sitting out)?\s*$/

// Ordem de retorno é a ordem do arquivo, não a ordem da mesa — de propósito.
// Ver armadilha #1 no OVERVIEW.md: derivar posição é responsabilidade da Fase 2.
export function parseSeats(block: string): Seat[] {
  const seats: Seat[] = []
  for (const line of block.split('\n')) {
    const match = line.match(SEAT_RE)
    if (!match) continue
    const [full, seatNumber, playerName, chips] = match
    seats.push({
      seatNumber: Number(seatNumber),
      playerName,
      chips: parseMoney(chips),
      isSittingOut: full.includes('is sitting out'),
    })
  }
  return seats
}

const POST_RE = /^(.+?): posts (small blind|big blind|small & big blinds) (\d+(?:\.\d+)?)/

const POST_TYPE_BY_LABEL: Record<string, PostType> = {
  'small blind': 'sb',
  'big blind': 'bb',
  'small & big blinds': 'sb+bb',
}

export function parsePosts(block: string): Post[] {
  const posts: Post[] = []
  for (const line of block.split('\n')) {
    const match = line.match(POST_RE)
    if (!match) continue
    const [, player, label, amount] = match
    posts.push({ player, type: POST_TYPE_BY_LABEL[label], amount: parseMoney(amount) })
  }
  return posts
}

const DEALT_RE = /^Dealt to (.+) \[([^\]]+)\]/

export function parseDealtHoleCards(block: string): { player: string; cards: Card[] } | null {
  for (const line of block.split('\n')) {
    const match = line.match(DEALT_RE)
    if (!match) continue
    const [, player, cardsRaw] = match
    return { player, cards: cardsRaw.split(' ').map(parseCard) }
  }
  return null
}