import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseHandHistory } from './parseHandHistory'
import { applyEvents } from './tableState'
import { buildTimeline } from './timeline'

const fixture = readFileSync(
  join(__dirname, '__fixtures__/hh-octavia-ii-2026-08-12.txt'),
  'utf-8',
)
const hands = parseHandHistory(fixture)

describe('applyEvents', () => {
  it("reproduces the next hand's starting stacks for every player present in both hands", () => {
    for (let i = 0; i < hands.length - 1; i++) {
      const current = hands[i]
      const next = hands[i + 1]
      const finalState = applyEvents(current, buildTimeline(current))

      for (const seat of current.seats) {
        const nextSeat = next.seats.find((s) => s.playerName === seat.playerName)
        if (!nextSeat) continue // saiu da mesa — não tem "próxima mão" pra comparar
        expect(finalState.players.get(seat.playerName)?.stack).toBe(nextSeat.chips)
      }
    }
  })

  it('reduces every final pot to totalPot (bruto, incluindo rake)', () => {
    for (const hand of hands) {
      const finalState = applyEvents(hand, buildTimeline(hand))
      expect(finalState.pot).toBe(hand.totalPot)
    }
  })

  it('is deterministic for every prefix of the timeline (hand 1)', () => {
    const hand = hands[0]
    const timeline = buildTimeline(hand)
    for (let i = 0; i <= timeline.length; i++) {
      expect(applyEvents(hand, timeline.slice(0, i))).toEqual(applyEvents(hand, timeline.slice(0, i)))
    }
  })

  it('produces two winners for the split pot (hand 6)', () => {
    const finalState = applyEvents(hands[5], buildTimeline(hands[5]))
    expect(finalState.winners).toEqual([
      { player: 'KURFTERRIER', amount: 1106800 },
      { player: 'o.colombini2', amount: 1106800 },
    ])
  })

  it('marks folded players correctly at the end of hand 1', () => {
    const finalState = applyEvents(hands[0], buildTimeline(hands[0]))
    expect(finalState.players.get('hoboexpress')?.isFolded).toBe(true)
    expect(finalState.players.get('o.colombini2')?.isFolded).toBe(true)
    expect(finalState.players.get('vinal33')?.isFolded).toBe(false)
  })

  it('reveals hole cards for both shown and mucked hands (hand 1)', () => {
    const finalState = applyEvents(hands[0], buildTimeline(hands[0]))
    expect(finalState.players.get('vinal33')?.holeCards).toEqual([
      { rank: '9', suit: 'h' },
      { rank: 'K', suit: 'c' },
    ])
    expect(finalState.players.get('joes555')?.holeCards).toEqual([
      { rank: '8', suit: 'h' },
      { rank: '7', suit: 'h' },
    ])
  })

  it('ends with the full board and river street when the hand reaches showdown (hand 1)', () => {
    const finalState = applyEvents(hands[0], buildTimeline(hands[0]))
    expect(finalState.board).toHaveLength(5)
    expect(finalState.street).toBe('river')
  })
})