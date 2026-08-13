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
import { ReplayHeader } from './ReplayHeader'
import { buildEventLog } from '@/lib/poker/eventLog'
import { EventLog } from './EventLog'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SPEEDS = [0.5, 1, 2] as const
const DEFAULT_JUMP_DELAY_MS = 1200

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
    const [isLogOpen, setIsLogOpen] = useState(true)

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

    const logGroups = useMemo(() => buildEventLog(hand, timeline), [hand, timeline])

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
        <div className="flex min-h-screen bg-base">
            <div className="flex min-w-0 flex-1 flex-col">
                <ReplayHeader isLogOpen={isLogOpen} onToggleLog={() => setIsLogOpen((o) => !o)} />
                <div className="flex min-h-0 flex-1 items-center justify-center px-10 pb-4">
                    <Table
                        hand={hand}
                        state={state}
                        layout={layout}
                        activePlayerName={activePlayerName}
                        lastActions={lastActions}
                        instant={instant}
                    />
                </div>

                <div className="shrink-0 px-6 pb-5">
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
            </div>

            {isLogOpen && (
                <aside className="flex h-screen w-82.5 shrink-0 flex-col border-l border-hairline-soft bg-[#0B0B0D]">
                    <div className="flex h-15.5 shrink-0 items-center justify-between px-5">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
                            Sequência
                        </span>
                        <span className="font-mono text-[11px] text-ink-3">
                            {clampedFrame} / {timeline.length}
                        </span>
                    </div>
                    <EventLog
                        groups={logGroups}
                        frame={clampedFrame}
                        hero={hand.dealtHoleCards?.player ?? null}
                        onJump={(target) => {
                            setIsPlaying(false)
                            jumpTo(target)
                        }}
                    />
                </aside>
            )}
        </div>
    )
}