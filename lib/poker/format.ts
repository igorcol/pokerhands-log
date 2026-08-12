import type { HandOutcome } from './handResult'
import type { Street } from './types'

// Formatação de exibição: centavos → texto, e enums → português. Fica isolado aqui pra
// a UI nunca fazer conta de dinheiro — e pra trocar pt-BR por outro locale num lugar só.

export type OutcomeTone = 'win' | 'loss' | 'neutral'

const STREET_LABEL: Record<Street, string> = {
  preflop: 'pré-flop',
  flop: 'flop',
  turn: 'turn',
  river: 'river',
}

// Play money nunca tem fração (50000 = 500); cash real tem (25 = 0,25). Decidir pelo
// próprio valor evita carregar um flag "é play money?" desde o parser.
export function formatChips(cents: number): string {
  const hasFraction = cents % 100 !== 0
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

// Sinal de menos é U+2212, não hífen: alinha com os dígitos em fonte tabular.
export function formatNet(cents: number): string {
  if (cents === 0) return '0'
  return `${cents > 0 ? '+' : '−'}${formatChips(Math.abs(cents))}`
}

export function formatTime(dateIso: string): string {
  return new Date(dateIso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatOutcome(outcome: HandOutcome): string {
  switch (outcome.kind) {
    case 'folded':
      return `fold no ${STREET_LABEL[outcome.street]}`
    case 'won-without-showdown':
      return outcome.street === 'preflop'
        ? 'venceu pré-flop'
        : `venceu no ${STREET_LABEL[outcome.street]}`
    case 'showdown-won':
      return 'showdown · venceu'
    case 'showdown-split':
      return 'showdown · pote dividido'
    case 'showdown-lost':
      return 'showdown · perdeu'
  }
}

export function isShowdown(outcome: HandOutcome): boolean {
  return outcome.kind.startsWith('showdown-')
}


// Fold sempre fica neutro mesmo com net negativo: é o caso comum (7 de 11 mãos no
// fixture), não a exceção — colorir de vermelho enche a lista de vermelho e apaga o
// que realmente importa destacar (showdown perdido, pote ganho).
export function outcomeTone(outcome: HandOutcome, net: number): OutcomeTone {
  if (outcome.kind === 'folded') return 'neutral'
  if (net > 0) return 'win'
  if (net < 0) return 'loss'
  return 'neutral'
}