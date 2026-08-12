'use client'

import { formatPhase } from '@/lib/poker/replayView'
import type { StreetSegment } from '@/lib/poker/replayView'

// Scrub segmentado por street em vez de um <input range> genérico: 
// cada bloco é proporcional ao número de eventos da street, e clicar nele pula pro começo dela
// assim dá pra ver ONDE se está na mão, não só "40% do caminho".

export function StreetTrack({
  segments,
  frame,
  onJump,
}: {
  segments: StreetSegment[]
  frame: number
  onJump: (frame: number) => void
}) {
  return (
    <div className="flex gap-1">
      {segments.map((segment) => {
        const span = segment.endFrame - segment.startFrame
        const played = Math.min(Math.max(frame - segment.startFrame, 0), span)
        const fillPct = span > 0 ? (played / span) * 100 : 0

        return (
          <button
            key={segment.phase}
            type="button"
            onClick={() => onJump(segment.startFrame)}
            title={formatPhase(segment.phase)}
            className="h-1.25 cursor-pointer overflow-hidden rounded-full bg-white/[0.07]"
            style={{ flex: segment.eventCount }}
          >
            <span className="block h-full rounded-full bg-carmine" style={{ width: `${fillPct}%` }} />
          </button>
        )
      })}
    </div>
  )
}