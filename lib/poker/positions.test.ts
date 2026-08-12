import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseHandHistory, splitHandBlocks } from './parseHandHistory'
import { derivePositions } from './positions'
import type { PositionName } from './types'

const fixture = readFileSync(
  join(__dirname, '__fixtures__/hh-octavia-ii-2026-08-12.txt'),
  'utf-8',
)
const rawBlocks = splitHandBlocks(fixture)
const hands = parseHandHistory(fixture)

const SUMMARY_SEAT_POSITION_RE = /^Seat \d+: (.+?) \((button|small blind|big blind)\)/
const LABEL_TO_POSITION: Record<string, PositionName> = {
  button: 'BTN',
  'small blind': 'SB',
  'big blind': 'BB',
}

describe('derivePositions', () => {
  it('matches the (button)/(small blind)/(big blind) labels declared in every SUMMARY', () => {
    for (let i = 0; i < hands.length; i++) {
      const positions = derivePositions(hands[i])
      for (const line of rawBlocks[i].split('\n')) {
        const match = line.trim().match(SUMMARY_SEAT_POSITION_RE)
        if (!match) continue
        const [, player, label] = match
        expect(positions.get(player)).toBe(LABEL_TO_POSITION[label])
      }
    }
  })

  it('assigns UTG/MP/CO in the correct real action order (hand 1, 6 active players)', () => {
    const positions = derivePositions(hands[0])
    expect(positions.get('hoboexpress')).toBe('UTG')
    expect(positions.get('LA-GreatOne')).toBe('MP')
    expect(positions.get('o.colombini2')).toBe('CO')
    expect(positions.get('joes555')).toBe('BTN')
    expect(positions.get('ms spartan')).toBe('SB')
    expect(positions.get('vinal33')).toBe('BB')
  })

  it('handles 7 active players, with two seats sharing MP (hand 9)', () => {
    const positions = derivePositions(hands[8])
    expect(positions.get('ms spartan')).toBe('BTN')
    expect(positions.get('vinal33')).toBe('SB')
    expect(positions.get('LA-GreatOne')).toBe('BB')
    expect(positions.get('o.colombini2')).toBe('UTG')
    expect(positions.get('joes555')).toBe('MP')
    expect(positions.get('1948allen')).toBe('MP')
    expect(positions.get('achladokampo')).toBe('CO')
  })

  it('throws when the button seat is not active (defensive)', () => {
    const brokenHand = { ...hands[0], buttonSeat: 999 }
    expect(() => derivePositions(brokenHand)).toThrow()
  })
})