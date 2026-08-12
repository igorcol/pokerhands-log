import type { Hand, PositionName } from './types'

// Convenção simplificada de 6 posições (não a nomenclatura completa de mesa
// cheia com UTG+1/UTG+2/HJ). Suficiente pra revisão pessoal de mão; se um dia
// precisar de granularidade GTO, isso vira uma tabela por tamanho de mesa.
//
// Heads-up (2 jogadores ativos) não é tratado corretamente: o botão também é
// o small blind nessa configuração, e essa função não faz essa fusão. Não tem
// mão heads-up no fixture atual — se aparecer, é o gatilho pra corrigir isso.
function positionNameForOffset(offset: number, activePlayerCount: number): PositionName {
  if (offset === 0) return 'BTN'
  if (offset === 1) return 'SB'
  if (offset === 2) return 'BB'
  if (offset === activePlayerCount - 1) return 'CO'
  if (offset === 3) return 'UTG'
  return 'MP'
}

export function derivePositions(hand: Hand): Map<string, PositionName> {
  const activeSeats = hand.seats
    .filter((seat) => !seat.isSittingOut)
    .sort((a, b) => a.seatNumber - b.seatNumber)

  const buttonIndex = activeSeats.findIndex((seat) => seat.seatNumber === hand.buttonSeat)
  if (buttonIndex === -1) {
    throw new Error(`Button seat ${hand.buttonSeat} is not an active seat in hand ${hand.id}`)
  }

  const activePlayerCount = activeSeats.length
  const positions = new Map<string, PositionName>()

  for (let offset = 0; offset < activePlayerCount; offset++) {
    const seat = activeSeats[(buttonIndex + offset) % activePlayerCount]
    positions.set(seat.playerName, positionNameForOffset(offset, activePlayerCount))
  }

  return positions
}