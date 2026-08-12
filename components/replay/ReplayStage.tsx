'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    activePlayer,
    frameIntervalMs,
    lastActionsThisStreet,
    phaseAtFrame,
    seatLayout,
    streetSegments,
} from '@/lib/poker/replayView'
import { applyEvents } from '@/lib/poker/tableState'
import { buildTimeline } from '@/lib/poker/timeline'
import type { Hand } from '@/lib/poker/types'
import { Controls } from './Controls'
import { Table } from './Table'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SPEEDS = [0.5, 1, 2] as const
const DEFAULT_JUMP_DELAY_MS = 600

// Orquestra o replay: frame local, timer com timing orgânico (frameIntervalMs), e
// atalhos de teclado. `step`/`jumpTo` decidem passo-vs-salto na origem — só o tick
// automático e o passo pra frente animam; tudo o mais troca o estado direto.
export function ReplayStage({ hand }: { hand: Hand }) {
    const router = useRouter()

    const timeline = useMemo(() => buildTimeline(hand), [hand])
    const layout = useMemo(() => seatLayout(hand), [hand])
    const segments = useMemo(() => streetSegments(timeline), [timeline])

    const [frame, setFrame] = useState(0)
    const [instant, setInstant] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)

    const clampedFrame = Math.min(Math.max(frame, 0), timeline.length)

    // useCallback aqui não é otimização — é pra o efeito do teclado não re-registrar o
    // listener a cada render só porque estas funções foram recriadas.
    const step = useCallback(() => {
        setInstant(false)
        setFrame((f) => Math.min(f + 1, timeline.length))
    }, [timeline.length])

    const jumpTo = useCallback(
        (target: number) => {
            setInstant(true)
            setFrame(Math.min(Math.max(target, 0), timeline.length))
        },
        [timeline.length],
    )

    const state = useMemo(
        () => applyEvents(hand, timeline.slice(0, clampedFrame)),
        [hand, timeline, clampedFrame],
    )
    const activePlayerName = useMemo(
        () => activePlayer(timeline, clampedFrame),
        [timeline, clampedFrame],
    )
    const lastActions = useMemo(
        () => lastActionsThisStreet(timeline, clampedFrame),
        [timeline, clampedFrame],
    )
    const phase = useMemo(() => phaseAtFrame(segments, clampedFrame), [segments, clampedFrame])

    useEffect(() => {
        if (!isPlaying) return
        if (clampedFrame >= timeline.length) return

        const lastEvent = clampedFrame > 0 ? timeline[clampedFrame - 1] : null
        const delay = (lastEvent ? frameIntervalMs(lastEvent) : DEFAULT_JUMP_DELAY_MS) / speed

        const timer = setTimeout(() => {
            setInstant(false)
            setFrame((f) => {
                const next = Math.min(f + 1, timeline.length)
                if (next >= timeline.length) setIsPlaying(false)
                return next
            })
        }, delay)
        return () => clearTimeout(timer)
    }, [isPlaying, clampedFrame, timeline, speed])

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

            switch (event.key) {
                case ' ':
                    event.preventDefault()
                    if (!isPlaying && clampedFrame >= timeline.length) jumpTo(0)
                    setIsPlaying((p) => !p)
                    break
                case 'ArrowRight':
                    setIsPlaying(false)
                    step()
                    break
                case 'ArrowLeft':
                    setIsPlaying(false)
                    jumpTo(clampedFrame - 1)
                    break
                case 'Home':
                    setIsPlaying(false)
                    jumpTo(0)
                    break
                case 'End':
                    setIsPlaying(false)
                    jumpTo(timeline.length)
                    break
                case '1':
                case '2':
                case '3':
                case '4': {
                    const targetPhase = (['preflop', 'flop', 'turn', 'river'] as const)[
                        Number(event.key) - 1
                    ]
                    const segment = segments.find((s) => s.phase === targetPhase)
                    if (segment) {
                        setIsPlaying(false)
                        jumpTo(segment.startFrame)
                    }
                    break
                }
                case 'Escape':
                    router.push('/')
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
      }, [timeline.length, segments, router, isPlaying, clampedFrame, step, jumpTo])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-base p-10">
            <Table
                hand={hand}
                state={state}
                layout={layout}
                activePlayerName={activePlayerName}
                lastActions={lastActions}
                instant={instant}
            />
            <Controls
                frame={clampedFrame}
                totalFrames={timeline.length}
                phase={phase}
                isPlaying={isPlaying}
                speed={speed}
                segments={segments}
                onTogglePlay={() => {
                    if (!isPlaying && clampedFrame >= timeline.length) jumpTo(0)
                    setIsPlaying((p) => !p)
                }}
                onStepBack={() => {
                    setIsPlaying(false)
                    jumpTo(clampedFrame - 1)
                }}
                onStepForward={() => {
                    setIsPlaying(false)
                    step()
                }}
                onJumpStart={() => {
                    setIsPlaying(false)
                    jumpTo(0)
                }}
                onJumpEnd={() => {
                    setIsPlaying(false)
                    jumpTo(timeline.length)
                }}
                onJump={(target) => {
                    setIsPlaying(false)
                    jumpTo(target)
                }}
                onSpeedChange={setSpeed}
            />
        </div>
    )
}