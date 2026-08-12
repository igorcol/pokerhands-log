import type {
  Action,
  AmbientEvent,
  Card,
  Post,
  PostType,
  Rank,
  Seat,
  Street,
  Suit,
  UncalledBetReturn,
} from './types'

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

const SECTION_START_RE = /^\*\*\* HOLE CARDS \*\*\*/
const SECTION_END_RE = /^\*\*\* (SHOW DOWN|SUMMARY) \*\*\*/

const STREET_MARKER_RE = /^\*\*\* (FLOP|TURN|RIVER) \*\*\* \[([^\]]+)\](?: \[([^\]]+)\])?/
const STREET_BY_MARKER: Record<string, Street> = { FLOP: 'flop', TURN: 'turn', RIVER: 'river' }

// Board é cumulativo: FLOP mostra as 3 cartas soltas, TURN/RIVER mostram
// [board anterior] [carta nova] — só a carta nova interessa aqui.
export function parseBoard(block: string): Card[] {
  const board: Card[] = []
  for (const line of block.split('\n')) {
    const match = line.match(STREET_MARKER_RE)
    if (!match) continue
    const [, , flopCards, newCard] = match
    const newCardsRaw = newCard ? [newCard] : flopCards.split(' ')
    board.push(...newCardsRaw.map(parseCard))
  }
  return board
}

const FOLD_RE = /^(.+?): folds$/
const CHECK_RE = /^(.+?): checks$/
const CALL_RE = /^(.+?): calls (\d+(?:\.\d+)?)( and is all-in)?$/
const BET_RE = /^(.+?): bets (\d+(?:\.\d+)?)( and is all-in)?$/
const RAISE_RE = /^(.+?): raises \d+(?:\.\d+)? to (\d+(?:\.\d+)?)( and is all-in)?$/
const UNCALLED_RE = /^Uncalled bet \((\d+(?:\.\d+)?)\) returned to (.+)$/

// Aparecem no meio do action stream quando a mão termina sem showdown.
// A extração de quem ganhou fica pra Parte 5 — aqui só evita warning falso.
const COLLECTED_RE = /^.+? collected \d+(?:\.\d+)? from pot$/
const DOESNT_SHOW_RE = /^.+?: doesn't show hand$/

// Whitelist explícita de ruído. Linha desconhecida gera warning — nunca
// descarte silencioso (ver OVERVIEW.md).
const AMBIENT_PATTERNS = [
  /^(.+?) is connected$/,
  /^(.+?) has timed out$/,
  /^(.+?) joins the table at seat #\d+$/,
  /^(.+?) leaves the table$/,
]

function matchAmbient(line: string): string | null {
  for (const pattern of AMBIENT_PATTERNS) {
    const match = line.match(pattern)
    if (match) return match[1]
  }
  return null
}

function scanActionStream(block: string) {
  const posts = parsePosts(block)
  const actions: Action[] = []
  const uncalledBets: UncalledBetReturn[] = []
  const ambientEvents: AmbientEvent[] = []
  const streetTotal = new Map<string, number>()

  let street: Street | null = null
  let inRange = false

  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (SECTION_START_RE.test(line)) {
      inRange = true
      street = 'preflop'
      for (const post of posts) {
        streetTotal.set(post.player, (streetTotal.get(post.player) ?? 0) + post.amount)
      }
      continue
    }
    if (!inRange) continue
    if (SECTION_END_RE.test(line)) break
    if (!street) continue // nunca deveria disparar — inRange só fica true com street setado

    const streetMarker = line.match(STREET_MARKER_RE)
    if (streetMarker) {
      street = STREET_BY_MARKER[streetMarker[1]]
      streetTotal.clear() // aposta reseta a cada street
      continue
    }

    if (DEALT_RE.test(line)) continue
    if (COLLECTED_RE.test(line)) continue
    if (DOESNT_SHOW_RE.test(line)) continue

    const uncalled = line.match(UNCALLED_RE)
    if (uncalled) {
      const [, amount, player] = uncalled
      uncalledBets.push({ player, amount: parseMoney(amount) })
      continue
    }

    const ambientPlayer = matchAmbient(line)
    if (ambientPlayer) {
      ambientEvents.push({ player: ambientPlayer, section: street, text: line })
      continue
    }

    const fold = line.match(FOLD_RE)
    if (fold) {
      const [, player] = fold
      actions.push({
        street,
        player,
        type: 'fold',
        amount: 0,
        totalBet: streetTotal.get(player) ?? 0,
        isAllIn: false,
      })
      continue
    }

    const check = line.match(CHECK_RE)
    if (check) {
      const [, player] = check
      actions.push({
        street,
        player,
        type: 'check',
        amount: 0,
        totalBet: streetTotal.get(player) ?? 0,
        isAllIn: false,
      })
      continue
    }

    const call = line.match(CALL_RE)
    if (call) {
      const [, player, raw, allIn] = call
      const added = parseMoney(raw)
      const totalBet = (streetTotal.get(player) ?? 0) + added
      streetTotal.set(player, totalBet)
      actions.push({ street, player, type: 'call', amount: added, totalBet, isAllIn: Boolean(allIn) })
      continue
    }

    const bet = line.match(BET_RE)
    if (bet) {
      const [, player, raw, allIn] = bet
      const totalBet = parseMoney(raw)
      streetTotal.set(player, totalBet)
      actions.push({ street, player, type: 'bet', amount: totalBet, totalBet, isAllIn: Boolean(allIn) })
      continue
    }

    const raise = line.match(RAISE_RE)
    if (raise) {
      const [, player, raw, allIn] = raise
      const totalBet = parseMoney(raw)
      const added = totalBet - (streetTotal.get(player) ?? 0)
      streetTotal.set(player, totalBet)
      actions.push({ street, player, type: 'raise', amount: added, totalBet, isAllIn: Boolean(allIn) })
      continue
    }

    console.warn(`[parseHandHistory] Unrecognized line in action stream: "${line}"`)
  }

  return { actions, uncalledBets, ambientEvents }
}

export function parseActions(block: string): Action[] {
  return scanActionStream(block).actions
}

export function parseUncalledBets(block: string): UncalledBetReturn[] {
  return scanActionStream(block).uncalledBets
}

export function parseAmbientEvents(block: string): AmbientEvent[] {
  return scanActionStream(block).ambientEvents
}