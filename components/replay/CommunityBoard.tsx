import { PlayingCard } from '@/components/poker/PlayingCard'
import type { Card } from '@/lib/poker/types'

// Cinco posições sempre reservadas, mesmo vazias. 
// A mesa não pode "pular" de tamanho quando o turn ou o river chegam.

export function CommunityBoard({ cards }: { cards: Card[] }) {
  return (
    <div className="flex items-end gap-1.75">
      {Array.from({ length: 5 }, (_, index) => {
        const card = cards[index]
        return card ? (
          <PlayingCard key={index} card={card} size="board" />
        ) : (
          <div key={index} className="h-16.75 w-12 rounded-md bg-white/[0.022]" />
        )
      })}
    </div>
  )
}