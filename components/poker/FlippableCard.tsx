import type { Card } from '@/lib/poker/types'
import { CardBack } from './CardBack'
import { PlayingCard, SIZES } from './PlayingCard'
import type { CardSize } from './PlayingCard'

// Carta com as duas faces sempre no DOM — virar é rotacionar o container, não trocar
// um componente por outro. React não anima desmontagem sem lib, então nunca desmontamos.
// A face frontal vem de dado estático da Hand (hand.board / hand.reveals), que já existe
// antes do frame chegar lá; o que muda por frame é só o booleano de estar virada.

export function FlippableCard({
  card,
  faceUp,
  present = true,
  size = 'table',
  delayMs = 0,
}: {
  card: Card | null
  faceUp: boolean
  present?: boolean
  size?: CardSize
  delayMs?: number
}) {
  const spec = SIZES[size]
  const showFront = faceUp && card !== null

  return (
    <div style={{ width: spec.w, height: spec.h, perspective: 800 }}>
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: showFront ? 'rotateY(0deg)' : 'rotateY(180deg)',
          // visibility, não opacity: opacity < 1 cria stacking context e ACHATA o
          // subtree 3D, fazendo as duas faces aparecerem juntas durante a transição.
          visibility: present ? 'visible' : 'hidden',
          transition: 'transform 500ms ease-out',
          transitionDelay: `${delayMs}ms`,
        }}
      >
        {/* rotateY(0deg) na frente não é decorativo: sem transform próprio o elemento
            não entra no contexto 3D do pai e o backface-visibility é ignorado. */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          {card && <PlayingCard card={card} size={size} />}
        </div>
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CardBack size={size} />
        </div>
      </div>
    </div>
  )
}