import { SIZES } from './PlayingCard'
import type { CardSize } from './PlayingCard'

// Verso da carta
// Reaproveita as mesmas dimensões do PlayingCard pra nunca dessincronizar de tamanho na mesa.

export function CardBack({ size = 'table' }: { size?: CardSize }) {
  const spec = SIZES[size]

  return (
    <div
      className="relative shrink-0 overflow-hidden shadow-[0_3px_9px_rgba(0,0,0,0.6)]"
      style={{
        width: spec.w,
        height: spec.h,
        borderRadius: spec.radius,
        background: 'linear-gradient(150deg, #42171C 0%, #2A0F13 55%, #1D0A0D 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(45deg, rgba(224,49,62,0.14) 0 2px, transparent 2px 5px)',
        }}
      />
    </div>
  )
}