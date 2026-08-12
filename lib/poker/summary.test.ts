import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatChips, formatNet, formatOutcome } from './format'
import { parseHandHistory } from './parseHandHistory'
import { summarizeHands, withResults } from './summary'

const fixture = readFileSync(
  join(__dirname, '__fixtures__/hh-octavia-ii-2026-08-12.txt'),
  'utf-8',
)
const entries = withResults(parseHandHistory(fixture))
const summary = summarizeHands(entries)

describe('formatChips', () => {
  it('omits decimals for whole values (play money)', () => {
    expect(formatChips(50000)).toBe('500')
    expect(formatChips(4728600)).toBe('47.286')
  })

  it('keeps decimals for fractional values (real money)', () => {
    expect(formatChips(25)).toBe('0,25')
    expect(formatChips(150)).toBe('1,50')
  })
})

describe('formatNet', () => {
  it('prefixes an explicit sign, using U+2212 for negatives', () => {
    expect(formatNet(997200)).toBe('+9.972')
    expect(formatNet(-550000)).toBe('−5.500')
    expect(formatNet(0)).toBe('0')
  })
})

describe('formatOutcome', () => {
  it('describes each outcome in pt-BR', () => {
    expect(formatOutcome({ kind: 'folded', street: 'preflop' })).toBe('fold no pré-flop')
    expect(formatOutcome({ kind: 'won-without-showdown', street: 'turn' })).toBe('venceu no turn')
    expect(formatOutcome({ kind: 'showdown-split' })).toBe('showdown · pote dividido')
  })
})

describe('summarizeHands', () => {
  it('aggregates the whole fixture', () => {
    expect(summary.handCount).toBe(11)
    expect(summary.net).toBe(147400)
    expect(summary.wonCount).toBe(4)
    expect(summary.showdownCount).toBe(3)
    expect(summary.showdownWonCount).toBe(2)
    expect(summary.biggestPot).toBe(4728600)
  })

  it('tracks the stack from the first hand through the net result', () => {
    expect(summary.startingStack).toBe(5000000)
    expect(summary.endingStack).toBe(5147400)
  })

  it('picks the biggest win', () => {
    expect(summary.biggestWin?.result.net).toBe(997200)
    expect(summary.biggestWin?.hand.id).toBe('261728025415')
  })

  it('returns a neutral summary for an empty slice', () => {
    expect(summarizeHands([])).toMatchObject({ handCount: 0, net: 0, biggestWin: null })
  })
})