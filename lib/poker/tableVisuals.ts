// Identidade visual derivada do dado: cor de cada jogador e faixa de ficha de cada valor.
// Cor por jogador é determinística a partir do nome, então o mesmo vilão tem sempre a mesma
// cor na mesa e no log. Faixa de ficha é relativa ao big blind, não absoluta — assim a
// escala cromática funciona igual em 250/500 e em 1/2.

export interface PlayerIdentity {
  initial: string
  from: string
  to: string
}

const HERO_IDENTITY = { from: '#E0313E', to: '#9B1F29' }

const PLAYER_COLORS = [
  { from: '#7A5C3D', to: '#4A3725' },
  { from: '#3D5C7A', to: '#25384A' },
  { from: '#5C3D6E', to: '#382542' },
  { from: '#3D6E5C', to: '#254238' },
  { from: '#6E3D4A', to: '#42252C' },
  { from: '#4A4A5C', to: '#2C2C38' },
  { from: '#5C5C3D', to: '#383825' },
  { from: '#3D4A4A', to: '#252C2C' },
]

function hashName(name: string): number {
  let hash = 5381
  for (let index = 0; index < name.length; index++) {
    hash = ((hash << 5) + hash + name.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

// Primeiro caractere alfanumérico: nomes começam com ponto, número ou espaço com frequência
// suficiente ("o.colombini2", "1948allen", "ms spartan") pra name[0] não servir.
function initialOf(name: string): string {
  const match = name.match(/[a-z0-9]/i)
  return (match?.[0] ?? '?').toUpperCase()
}

export function playerIdentity(name: string, isHero = false): PlayerIdentity {
  const palette = isHero ? HERO_IDENTITY : PLAYER_COLORS[hashName(name) % PLAYER_COLORS.length]
  return { initial: initialOf(name), ...palette }
}

export interface ChipTier {
  index: number
  color: string
  shade: string
  stackHeight: number
}

// Cores de ficha de cassino real (branco, verde, azul, roxo, laranja) em versão dessaturada.
// Os cortes são em big blinds porque é assim que jogador lê tamanho de aposta.
const CHIP_TIERS: { maxBigBlinds: number; color: string; shade: string }[] = [
  { maxBigBlinds: 2, color: '#9A9A96', shade: '#6E6E6A' },
  { maxBigBlinds: 10, color: '#2E8B57', shade: '#1F6540' },
  { maxBigBlinds: 30, color: '#3D6FA8', shade: '#2A4E76' },
  { maxBigBlinds: 75, color: '#7048B4', shade: '#4E3180' },
  { maxBigBlinds: Number.POSITIVE_INFINITY, color: '#C87A2E', shade: '#8F5620' },
]

export function chipTier(value: number, bigBlind: number): ChipTier {
  const inBigBlinds = bigBlind > 0 ? value / bigBlind : 0
  const index = CHIP_TIERS.findIndex((tier) => inBigBlinds < tier.maxBigBlinds)
  const resolved = index === -1 ? CHIP_TIERS.length - 1 : index

  return {
    index: resolved,
    color: CHIP_TIERS[resolved].color,
    shade: CHIP_TIERS[resolved].shade,
    stackHeight: Math.min(resolved + 1, 4),
  }
}