import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parseCard,
  parseDealtHoleCards,
  parseHeader,
  parseMoney,
  parsePosts,
  parseSeats,
  parseTableInfo,
  splitHandBlocks,
} from './parseHandHistory'

const fixture = readFileSync(
  join(__dirname, '__fixtures__/hh-octavia-ii-2026-08-12.txt'),
  'utf-8',
)
const hands = splitHandBlocks(fixture)

describe('parseMoney', () => {
  it('parses integers, scaling to cents', () => {
    expect(parseMoney('500')).toBe(50000)
    expect(parseMoney('0')).toBe(0)
  })

  it('parses decimals for real-money formats', () => {
    expect(parseMoney('0.25')).toBe(25)
    expect(parseMoney('1.5')).toBe(150)
  })

  it('strips $ sign and thousand separators', () => {
    expect(parseMoney('$1,234.56')).toBe(123456)
  })
})

describe('parseCard', () => {
  it('parses rank and suit', () => {
    expect(parseCard('8d')).toEqual({ rank: '8', suit: 'd' })
    expect(parseCard('Th')).toEqual({ rank: 'T', suit: 'h' })
    expect(parseCard('Ac')).toEqual({ rank: 'A', suit: 'c' })
  })

  it('throws on malformed card', () => {
    expect(() => parseCard('Xz')).toThrow()
  })
})

describe('splitHandBlocks', () => {
  it('splits the fixture into 11 hands', () => {
    expect(hands).toHaveLength(11)
  })

  it('keeps the header as the first line of each block', () => {
    for (const hand of hands) {
      expect(hand.split('\n')[0]).toMatch(/^PokerStars Hand #\d+:/)
    }
  })
})

describe('parseHeader', () => {
  it('parses id, timestamp and blinds from hand 1', () => {
    expect(parseHeader(hands[0])).toEqual({
      id: '261727959310',
      dateIso: '2026-08-12T16:20:22.000Z',
      smallBlind: 25000,
      bigBlind: 50000,
    })
  })

  it('throws on an unrecognized header', () => {
    expect(() => parseHeader('not a real hand history')).toThrow()
  })
})

describe('parseTableInfo', () => {
  it('parses table name, max seats and button from hand 1', () => {
    expect(parseTableInfo(hands[0])).toEqual({
      tableName: 'Octavia II',
      maxSeats: 9,
      buttonSeat: 4,
    })
  })
})

describe('parseSeats', () => {
  it('preserves file order instead of sorting by seat number (armadilha #1)', () => {
    const seats = parseSeats(hands[0])
    expect(seats.map((s) => s.seatNumber)).toEqual([5, 6, 7, 1, 2, 3, 4, 8, 9])
  })

  it('flags sitting-out seats correctly', () => {
    const seats = parseSeats(hands[0])
    const sittingOut = seats.filter((s) => s.isSittingOut).map((s) => s.playerName)
    expect(sittingOut).toEqual(['1948allen', 'achladokampo', 'KURFTERRIER'])
  })

  it('handles a busted player with 0 chips (hand 9)', () => {
    const seats = parseSeats(hands[8])
    expect(seats.find((s) => s.playerName === 'KURFTERRIER')).toEqual({
      seatNumber: 7,
      playerName: 'KURFTERRIER',
      chips: 0,
      isSittingOut: true,
    })
  })
})

describe('parsePosts', () => {
  it('captures all 3 posts in hand 1, including the extra big blind (armadilha #2)', () => {
    expect(parsePosts(hands[0])).toEqual([
      { player: 'ms spartan', type: 'sb', amount: 25000 },
      { player: 'vinal33', type: 'bb', amount: 50000 },
      { player: 'o.colombini2', type: 'bb', amount: 50000 },
    ])
  })

  it('parses a combined small & big blind post as sb+bb (armadilha #3, hand 8)', () => {
    expect(parsePosts(hands[7])).toEqual([
      { player: 'ms spartan', type: 'sb', amount: 25000 },
      { player: 'vinal33', type: 'bb', amount: 50000 },
      { player: '1948allen', type: 'sb+bb', amount: 75000 },
    ])
  })
})

describe('parseDealtHoleCards', () => {
  it('identifies the hero from the Dealt to line', () => {
    expect(parseDealtHoleCards(hands[0])).toEqual({
      player: 'o.colombini2',
      cards: [
        { rank: '8', suit: 'd' },
        { rank: '2', suit: 'h' },
      ],
    })
  })
})