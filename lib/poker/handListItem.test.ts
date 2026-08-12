import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { withResults } from './handResult'
import { filterByPeriod, filterHandListItems, toHandListItem } from './handListItem'
import { parseHandHistory } from './parseHandHistory'

const fixture = readFileSync(
  join(__dirname, '__fixtures__/hh-octavia-ii-2026-08-12.txt'),
  'utf-8',
)
const items = withResults(parseHandHistory(fixture)).map(toHandListItem)

describe('toHandListItem', () => {
  it('carries the hero-facing fields for every hand', () => {
    expect(items).toHaveLength(11)
    expect(items[0]).toMatchObject({
      id: '261727959310',
      position: 'CO',
      pot: 1121000,
      net: -50000,
      isShowdown: false,
    })
  })

  it('captures the stack before the hand, for the bankroll curve', () => {
    expect(items[0].startStack).toBe(5000000)
    expect(items[1].startStack).toBe(4950000)
  })
})

describe('filterByPeriod', () => {
  // "now" derivado do próprio timestamp do fixture com métodos locais (setHours/setDate/
  // setMonth) em vez de strings ISO fixas — assim o teste não depende do fuso horário
  // de quem roda. A feature em si é local por design ("hoje" é o hoje de quem usa).
  const reference = new Date(items[0].dateIso)

  const laterSameDay = new Date(reference)
  laterSameDay.setHours(23, 59, 0, 0)

  const nextDay = new Date(reference)
  nextDay.setDate(nextDay.getDate() + 1)

  const nextMonth = new Date(reference)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  it('"today" matches the local calendar day', () => {
    expect(filterByPeriod(items, 'today', laterSameDay)).toHaveLength(11)
    expect(filterByPeriod(items, 'today', nextDay)).toHaveLength(0)
  })

  it('"7d" is a rolling window, still matching the next day', () => {
    expect(filterByPeriod(items, '7d', nextDay)).toHaveLength(11)
    expect(filterByPeriod(items, '7d', nextMonth)).toHaveLength(0)
  })

  it('"month" matches the calendar month, not 30 rolling days', () => {
    expect(filterByPeriod(items, 'month', laterSameDay)).toHaveLength(11)
    expect(filterByPeriod(items, 'month', nextMonth)).toHaveLength(0)
  })

  it('"all" never filters', () => {
    expect(filterByPeriod(items, 'all', nextMonth)).toHaveLength(11)
  })
})

describe('filterHandListItems', () => {
  it('"won" and "lost" partition every hand exactly once (no draws in the fixture)', () => {
    const won = filterHandListItems(items, 'won')
    const lost = filterHandListItems(items, 'lost')
    expect(won.length + lost.length).toBe(11)
    expect(won.every((item) => item.net > 0)).toBe(true)
    expect(lost.every((item) => item.net < 0)).toBe(true)
  })

  it('"showdown" keeps only hands that reached showdown', () => {
    expect(filterHandListItems(items, 'showdown')).toHaveLength(3)
  })

  it('"biggest-pots" reorders by pot, descending, without dropping hands', () => {
    const sorted = filterHandListItems(items, 'biggest-pots')
    expect(sorted).toHaveLength(11)
    expect(sorted[0].pot).toBe(4728600)
    const pots = sorted.map((item) => item.pot)
    expect(pots).toEqual([...pots].sort((a, b) => b - a))
  })
})