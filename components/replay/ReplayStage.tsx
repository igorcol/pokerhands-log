'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    activePlayer,
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

const SPEEDS = [0.5, 1, 2] as const
const BASE_INTERVAL_MS = 550

// Orquestra o replay: um índice de frame local, um timer que avança 1 por vez
// Nunca interpola, nunca pula direto pro alvo, scrub e passo são a mesma operação (setFrame)
// Atalhos de teclado. Ainda sem animação (Fase 4d) nem navegação entre mãos (4e).

export function ReplayStage({ hand }: { hand: Hand }) {
    const router = useRouter()

    const timeline = useMemo(() => buildTimeline(hand), [hand])
    const layout = useMemo(() => seatLayout(hand), [hand])
    const segments = useMemo(() => streetSegments(timeline), [timeline])

    const [frame, setFrame] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)

    const clampedFrame = Math.min(Math.max(frame, 0), timeline.length)

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
        if (!isPlaying || clampedFrame >= timeline.length) return
        const timer = setTimeout(() => {
            setFrame((f) => {
                const next = Math.min(f + 1, timeline.length)
                if (next >= timeline.length) setIsPlaying(false)
                return next
            })
        }, BASE_INTERVAL_MS / speed)
        return () => clearTimeout(timer)
    }, [isPlaying, clampedFrame, timeline.length, speed])

    // Ignora quando o foco está num campo de texto — não existe nenhum agora, mas evita
    // que espaço/setas quebrem uma busca ou filtro que venha a entrar na tela depois.
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

            switch (event.key) {
                case ' ':
                    event.preventDefault()
                    if (!isPlaying && clampedFrame >= timeline.length) setFrame(0)
                    setIsPlaying((p) => !p)
                    break
                case 'ArrowRight':
                    setIsPlaying(false)
                    setFrame((f) => Math.min(f + 1, timeline.length))
                    break
                case 'ArrowLeft':
                    setIsPlaying(false)
                    setFrame((f) => Math.max(f - 1, 0))
                    break
                case 'Home':
                    setIsPlaying(false)
                    setFrame(0)
                    break
                case 'End':
                    setIsPlaying(false)
                    setFrame(timeline.length)
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
                        setFrame(segment.startFrame)
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
    }, [timeline.length, segments, router, isPlaying, clampedFrame])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-base p-10">
            <Table
                hand={hand}
                state={state}
                layout={layout}
                activePlayerName={activePlayerName}
                lastActions={lastActions}
            />
            <Controls
                frame={clampedFrame}
                totalFrames={timeline.length}
                phase={phase}
                isPlaying={isPlaying}
                speed={speed}
                segments={segments}
                onTogglePlay={() => {
                    if (!isPlaying && clampedFrame >= timeline.length) setFrame(0)
                    setIsPlaying((p) => !p)
                }}
                onStepBack={() => {
                    setIsPlaying(false)
                    setFrame((f) => Math.max(f - 1, 0))
                }}
                onStepForward={() => {
                    setIsPlaying(false)
                    setFrame((f) => Math.min(f + 1, timeline.length))
                }}
                onJumpStart={() => {
                    setIsPlaying(false)
                    setFrame(0)
                }}
                onJumpEnd={() => {
                    setIsPlaying(false)
                    setFrame(timeline.length)
                }}
                onJump={(target) => {
                    setIsPlaying(false)
                    setFrame(target)
                }}
                onSpeedChange={setSpeed}
            />
        </div>
    )
}