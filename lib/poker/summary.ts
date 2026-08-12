import { deriveHandResult } from './handResult'
import type { HandResult } from './handResult'
import { isShowdown } from './format'
import type { Hand } from './types'

// Agrega uma lista de mãos no que o topo da tela mostra: resultado do recorte, contagens
// e destaques. Recebe o recorte já filtrado — quem decide o que entra é a página, então
// o mesmo código serve pra "hoje", "7 dias" ou "tudo" sem saber qual é.

export interface HandWithResult {
  hand: Hand
  result: HandResult
}

export interface HandsSummary {
  handCount: number
  net: number
  wonCount: number
  showdownCount: number
  showdownWonCount: number
  biggestPot: number
  biggestWin: HandWithResult | null
  startingStack: number
  endingStack: number
}

export function withResults(hands: Hand[]): HandWithResult[] {
  return hands.flatMap((hand) => {
    const result = deriveHandResult(hand)
    return result ? [{ hand, result }] : []
  })
}

export function summarizeHands(entries: HandWithResult[]): HandsSummary {
  const net = entries.reduce((sum, e) => sum + e.result.net, 0)
  const showdowns = entries.filter((e) => isShowdown(e.result.outcome))

  const first = entries[0]
  const startingStack = first
    ? (first.hand.seats.find((s) => s.playerName === first.result.hero)?.chips ?? 0)
    : 0

  return {
    handCount: entries.length,
    net,
    wonCount: entries.filter((e) => e.result.net > 0).length,
    showdownCount: showdowns.length,
    showdownWonCount: showdowns.filter((e) => e.result.net > 0).length,
    biggestPot: entries.reduce((max, e) => Math.max(max, e.hand.totalPot), 0),
    biggestWin: entries.reduce<HandWithResult | null>(
      (best, e) => (e.result.net > (best?.result.net ?? 0) ? e : best),
      null,
    ),
    startingStack,
    endingStack: startingStack + net,
  }
}