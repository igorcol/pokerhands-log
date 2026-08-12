import type { Card, Suit } from '@/lib/poker/types'

// Carta de baralho em SVG. Naipe é path desenhado, não caractere Unicode — ♠♥♦♣ depende
// de qual fonte o SO resolve (às vezes vira emoji colorido) e não escala com nitidez.
// Os paths preenchem o viewBox 24×24 de ponta a ponta: sobra de margem dentro do viewBox
// encolhe o glyph de novo depois do `size`, e a carta fica visualmente vazia.
// Três tamanhos fixos em vez de prop livre: mantém o ritmo visual consistente na lista.

export const SIZES = {
  sm: { w: 20, h: 28, rank: 10, suit: 9.5, radius: 3, gap: 0.5 },
  md: { w: 29, h: 40, rank: 14.5, suit: 13, radius: 3.5, gap: 1 },
  lg: { w: 40, h: 55, rank: 20, suit: 18, radius: 4.5, gap: 1.5 },
  table: { w: 38, h: 53, rank: 17, suit: 13, radius: 4, gap: 1 },
  board: { w: 48, h: 67, rank: 23, suit: 16, radius: 5, gap: 2 },
} as const

export type CardSize = keyof typeof SIZES

const RED_SUITS = new Set<Suit>(['h', 'd'])

function SuitGlyph({ suit, size }: { suit: Suit; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {suit === 's' && (
        <path d="M12 0.8C12 0.8 2.4 8.6 2.4 14.5a4.9 4.9 0 0 0 8.4 3.5c.1 2.4-.9 4-2.4 5.2h7.2c-1.5-1.2-2.5-2.8-2.4-5.2a4.9 4.9 0 0 0 8.4-3.5C21.6 8.6 12 0.8 12 0.8Z" />
      )}
      {suit === 'h' && (
        <path d="M12 23.2S1 15.4 1 8.6A5.6 5.6 0 0 1 12 6.2 5.6 5.6 0 0 1 23 8.6c0 6.8-11 14.6-11 14.6Z" />
      )}
      {suit === 'd' && <path d="M12 0.6 22.6 12 12 23.4 1.4 12 12 0.6Z" />}
      {suit === 'c' && (
        <>
          <circle cx="12" cy="6.4" r="5.1" />
          <circle cx="5.9" cy="14" r="5.1" />
          <circle cx="18.1" cy="14" r="5.1" />
          <path d="M12 12.2c.4 4.8-.7 8-2.3 10.5h4.6c-1.6-2.5-2.7-5.7-2.3-10.5Z" />
        </>
      )}
    </svg>
  )
}

export function PlayingCard({ card, size = 'md' }: { card: Card; size?: CardSize }) {
  const spec = SIZES[size]
  const tone = RED_SUITS.has(card.suit) ? 'text-suit-red' : 'text-suit-black'

  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center bg-face leading-none ${tone} shadow-[0_2px_5px_rgba(0,0,0,0.5)]`}
      style={{ width: spec.w, height: spec.h, borderRadius: spec.radius, gap: spec.gap }}
      role="img"
      aria-label={`${card.rank}${card.suit}`}
    >
      <span className="font-semibold tracking-tight" style={{ fontSize: spec.rank }}>
        {card.rank}
      </span>
      <SuitGlyph suit={card.suit} size={spec.suit} />
    </div>
  )
}

// As duas cartas do hero, levemente sobrepostas e giradas — lê como "mão segurada"
// e vira o elemento que o olho procura ao varrer a lista.
export function HoleCards({ cards, size = 'md' }: { cards: Card[]; size?: CardSize }) {
  return (
    <div className="flex">
      {cards.map((card, index) => (
        <div
          key={`${card.rank}${card.suit}`}
          className={index === 0 ? '-rotate-6' : 'rotate-6 -ml-2'}
        >
          <PlayingCard card={card} size={size} />
        </div>
      ))}
    </div>
  )
}

export function Board({ cards, size = 'sm' }: { cards: Card[]; size?: CardSize }) {
  if (cards.length === 0) return <span className="font-mono text-xs text-ink-3">—</span>
  return (
    <div className="flex gap-0.75">
      {cards.map((card) => (
        <PlayingCard key={`${card.rank}${card.suit}`} card={card} size={size} />
      ))}
    </div>
  )
}