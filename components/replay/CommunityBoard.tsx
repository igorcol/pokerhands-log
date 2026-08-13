import { FlippableCard } from '@/components/poker/FlippableCard'
import { SIZES } from '@/components/poker/PlayingCard'
import type { Card } from '@/lib/poker/types'

// Recebe o board COMPLETO da mão (dado estático) e quantas cartas já foram reveladas
// no frame atual. É isso que permite a frente existir no DOM antes de virar.
// Cinco posições sempre reservadas: a mesa não pode pular de tamanho quando o turn chega.

const FLOP_STAGGER_MS = 80

export function CommunityBoard({
  allCards,
  revealedCount,
}: {
  allCards: Card[]
  revealedCount: number
}) {
  return (
    <div className="flex items-end gap-2">
      {Array.from({ length: 5 }, (_, index) => {
        const card = allCards[index] ?? null
        const isRevealed = index < revealedCount
        // As três do flop chegam num evento só — o escalonamento é puro CSS.
        const delayMs = index < 3 ? index * FLOP_STAGGER_MS : 0

        return (
          <div
            key={index}
            className="relative"
            style={{ width: SIZES.board.w, height: SIZES.board.h }}
          >
            <div
              className="absolute inset-0 bg-white/[0.022]"
              style={{ borderRadius: SIZES.board.radius }}
            />
            {card && (
              <div className="absolute inset-0">
                <FlippableCard
                  card={card}
                  faceUp={isRevealed}
                  present={isRevealed}
                  size="board"
                  delayMs={delayMs}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}