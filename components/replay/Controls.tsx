'use client'

import { formatPhase } from '@/lib/poker/replayView'
import type { ReplayPhase, StreetSegment } from '@/lib/poker/replayView'
import { StreetTrack } from './StreetTrack'

const SPEEDS = [0.5, 1, 2] as const

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-full bg-white/4.5 text-[11px] text-ink-2 hover:bg-white/10 hover:text-ink"
    >
      {children}
    </button>
  )
}

export function Controls({
  frame,
  totalFrames,
  phase,
  isPlaying,
  speed,
  segments,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onJumpStart,
  onJumpEnd,
  onJump,
  onSpeedChange,
}: {
  frame: number
  totalFrames: number
  phase: ReplayPhase
  isPlaying: boolean
  speed: (typeof SPEEDS)[number]
  segments: StreetSegment[]
  onTogglePlay: () => void
  onStepBack: () => void
  onStepForward: () => void
  onJumpStart: () => void
  onJumpEnd: () => void
  onJump: (frame: number) => void
  onSpeedChange: (speed: (typeof SPEEDS)[number]) => void
}) {
  return (
    <div className="w-full max-w-[min(90vw,1200px)]">
      <div className="mb-3.5">
        <StreetTrack segments={segments} frame={frame} onJump={onJump} />
      </div>
      <div className="flex items-center gap-3.5">
        <IconButton onClick={onJumpStart} label="Início">⏮</IconButton>
        <IconButton onClick={onStepBack} label="Passo anterior">◀</IconButton>
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-carmine text-sm text-white shadow-[0_6px_20px_rgba(224,49,62,0.35)] hover:bg-[#ED4350]"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <IconButton onClick={onStepForward} label="Próximo passo">▶</IconButton>
        <IconButton onClick={onJumpEnd} label="Fim">⏭</IconButton>

        <span className="font-mono text-[11px] text-ink-3">
          {frame} / {totalFrames} · {formatPhase(phase)}
        </span>

        <div className="ml-auto flex gap-0.5 rounded-full bg-white/[0.035] p-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] ${
                speed === s ? 'bg-white/10 font-medium text-ink' : 'text-ink-2'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}