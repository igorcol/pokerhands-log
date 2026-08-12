import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { deriveHandResult } from './handResult'
import type { HandResult } from './handResult'
import { parseHandHistory } from './parseHandHistory'

const fixture = readFileSync(
  join(__dirname, '__fixtures__/hh-octavia-ii-2026-08-12.txt'),
  'utf-8',
)
const hands = parseHandHistory(fixture)
const results = hands.map((hand) => deriveHandResult(hand) as HandResult)

describe('deriveHandResult', () => {
  it('derives a result for every hand in the file', () => {
    expect(results.every((r) => r !== null)).toBe(true)
    expect(results).toHaveLength(11)
  })

  it('derives the net result of each hand, in cents', () => {
    expect(results.map((r) => r.net)).toEqual([
      -50000, 337900, -300000, -250000, -250000, 248100,
      314200, -300000, -550000, -50000, 997200,
    ])
  })

  it('cross-checks net against the next hand starting stack (independent of the reducer)', () => {
    for (let i = 0; i < hands.length - 1; i++) {
      const hero = results[i].hero
      const currentStack = hands[i].seats.find((s) => s.playerName === hero)?.chips
      const nextStack = hands[i + 1].seats.find((s) => s.playerName === hero)?.chips
      if (currentStack === undefined || nextStack === undefined) continue
      expect(results[i].net).toBe(nextStack - currentStack)
    }
  })

  it('sums to the session result of +1.474', () => {
    expect(results.reduce((sum, r) => sum + r.net, 0)).toBe(147400)
  })

  it('classifies how each hand ended for the hero', () => {
    expect(results.map((r) => r.outcome)).toEqual([
      { kind: 'folded', street: 'flop' },
      { kind: 'won-without-showdown', street: 'flop' },
      { kind: 'folded', street: 'preflop' },
      { kind: 'folded', street: 'flop' },
      { kind: 'folded', street: 'flop' },
      { kind: 'showdown-split' },
      { kind: 'showdown-won' },
      { kind: 'folded', street: 'preflop' },
      { kind: 'showdown-lost' },
      { kind: 'folded', street: 'flop' },
      { kind: 'won-without-showdown', street: 'turn' },
    ])
  })

  it('derives position and hole cards for the hero', () => {
    expect(results.map((r) => r.position)).toEqual([
      'CO', 'MP', 'UTG', 'BB', 'SB', 'BTN', 'CO', 'MP', 'UTG', 'BB', 'SB',
    ])
    expect(results[5].holeCards).toEqual([
      { rank: 'J', suit: 'h' },
      { rank: 'J', suit: 'c' },
    ])
  })

  it('reports collected separately from net (split pot keeps only its share)', () => {
    expect(results[5].collected).toBe(1106800)
    expect(results[5].net).toBe(248100)
    expect(results[0].collected).toBe(0)
  })
})