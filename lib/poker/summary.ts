import type { HandListItem } from './handListItem'

// Agrega uma lista de HandListItem no que o topo da tela mostra: resultado do recorte,
// contagens e destaques. Opera sobre o view model, não sobre Hand — o mesmo código serve
// pro primeiro render no servidor e pra re-filtragem no cliente.

export interface HandsSummary {
  handCount: number
  net: number
  wonCount: number
  showdownCount: number
  showdownWonCount: number
  biggestPot: number
  biggestWin: HandListItem | null
  startingStack: number
  endingStack: number
}

export function summarizeHandListItems(items: HandListItem[]): HandsSummary {
  const net = items.reduce((sum, item) => sum + item.net, 0)
  const showdowns = items.filter((item) => item.isShowdown)
  const startingStack = items[0]?.startStack ?? 0

  return {
    handCount: items.length,
    net,
    wonCount: items.filter((item) => item.net > 0).length,
    showdownCount: showdowns.length,
    showdownWonCount: showdowns.filter((item) => item.net > 0).length,
    biggestPot: items.reduce((max, item) => Math.max(max, item.pot), 0),
    biggestWin: items.reduce<HandListItem | null>(
      (best, item) => (item.net > (best?.net ?? 0) ? item : best),
      null,
    ),
    startingStack,
    endingStack: startingStack + net,
  }
}

// Ponto de partida + o net acumulado de cada mão, na ordem em que vieram — alimenta a
// sparkline. Assume items em ordem cronológica; quem ordena por pote (filtro "maiores
// potes") não deve passar o resultado direto pra cá.
export function buildStackCurve(items: HandListItem[]): number[] {
  const start = items[0]?.startStack ?? 0
  return items.reduce<number[]>(
    (curve, item) => [...curve, curve[curve.length - 1] + item.net],
    [start],
  )
}