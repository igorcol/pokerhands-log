'use client'

import { useEffect, useRef } from 'react'
import { PlayingCard } from '@/components/poker/PlayingCard'
import { formatChips } from '@/lib/poker/format'
import type { LogEntry, LogGroup } from '@/lib/poker/eventLog'
import { formatPhase } from '@/lib/poker/replayView'
import type { ReplayEvent } from '@/lib/poker/timeline'
import { Avatar } from './Avatar'
import type { Card } from '@/lib/poker/types'

// Log da sequência. A mesa mostra o AGORA; isto mostra o caminho até aqui — e estudar
// mão é justamente entender a sequência. Cada linha é clicável e leva ao seu frame.

type Tone = 'muted' | 'neutral' | 'solid' | 'accent' | 'strong' | 'win'

const TONE_CLASS: Record<Tone, string> = {
    muted: 'bg-white/[0.04] text-ink-3',
    neutral: 'bg-white/[0.05] text-ink-2',
    solid: 'bg-white/[0.08] text-ink',
    accent: 'bg-carmine/15 text-carmine-soft',
    strong: 'bg-carmine text-white',
    win: 'bg-mint/15 text-mint',
}

interface Label {
    who: string | null
    action: string
    tone: Tone
    value: number | null
    cards?: Card[]
}

function describe(event: ReplayEvent): Label {
    switch (event.kind) {
        case 'post':
            return {
                who: event.player,
                action: event.postType === 'sb+bb' ? 'SB+BB' : event.postType.toUpperCase(),
                tone: 'muted',
                value: event.amount,
            }
        case 'action': {
            if (event.isAllIn) {
                return { who: event.player, action: 'All in', tone: 'strong', value: event.amount }
            }
            const isAggressive = event.type === 'bet' || event.type === 'raise'
            return {
                who: event.player,
                action: event.type,
                tone: event.type === 'fold' ? 'muted' : isAggressive ? 'accent' : event.type === 'call' ? 'solid' : 'neutral',
                value: event.amount > 0 ? event.amount : null,
            }
        }
        case 'uncalled-return':
            return { who: event.player, action: 'volta', tone: 'muted', value: event.amount }
        case 'reveal':
            return {
                who: event.player,
                action: event.source === 'summary-muck' ? 'mucked' : 'mostra',
                tone: 'neutral',
                value: null,
                cards: event.cards,
            }
        case 'collect':
            return { who: event.player, action: 'ganha', tone: 'win', value: event.amount }
        case 'ambient':
            return { who: event.player, action: event.text, tone: 'muted', value: null }
        default:
            return { who: null, action: '', tone: 'muted', value: null }
    }
}

function LogRow({
    entry,
    isCurrent,
    isFuture,
    isHero,
    onJump,
    rowRef,
}: {
    entry: LogEntry
    isCurrent: boolean
    isFuture: boolean
    isHero: boolean
    onJump: (frame: number) => void
    rowRef?: React.Ref<HTMLButtonElement>
}) {
    const label = describe(entry.event)
    const isAmbient = entry.event.kind === 'ambient'

    return (
        <button
            ref={rowRef}
            type="button"
            onClick={() => onJump(entry.frame)}
            className={`relative flex w-full items-center gap-2.5 rounded-[10px] py-1.5 pl-3 pr-2.5 text-left transition-colors ${isCurrent ? 'bg-white/[0.07]' : 'hover:bg-white/3'
                } ${isFuture ? 'opacity-30' : ''}`}
        >
            {isCurrent && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-carmine" />
            )}

            {label.who && !isAmbient ? (
                <Avatar name={label.who} isHero={isHero} size="log" />
            ) : (
                <span className="size-5 shrink-0" />
            )}

            <span
                className={`min-w-0 flex-1 truncate text-[11.5px] ${isAmbient ? 'text-ink-3' : isCurrent ? 'text-ink' : 'text-ink-2'
                    }`}
            >
                {isAmbient ? label.action : label.who}
            </span>

            {label.cards && (
                <span className="flex gap-0.75">
                    {label.cards.map((card) => (
                        <PlayingCard key={`${card.rank}${card.suit}`} card={card} size="sm" />
                    ))}
                </span>
            )}

            {!isAmbient && (
                <span
                    className={`shrink-0 rounded-full px-2 py-0.75 font-mono text-[9px] font-semibold uppercase tracking-[0.09em] ${TONE_CLASS[label.tone]}`}
                >
                    {label.action}
                </span>
            )}

            <span className="w-11.5 shrink-0 text-right font-mono text-[11.5px] font-medium tabular-nums">
                {label.value !== null ? formatChips(label.value) : ''}
            </span>
        </button>
    )
}

export function EventLog({
    groups,
    frame,
    hero,
    onJump,
}: {
    groups: LogGroup[]
    frame: number
    hero: string | null
    onJump: (frame: number) => void
}) {
    const currentRef = useRef<HTMLButtonElement>(null)

    // Sem isto o log é inútil durante o play: o destaque sai da vista em poucos eventos.
    useEffect(() => {
        currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, [frame])

    return (
        <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-8">
            {groups.map((group) => {
                const isFutureGroup = group.startFrame >= frame

                return (
                    <div key={`${group.phase}-${group.startFrame}`}>
                        <div
                            className={`flex items-center gap-2 px-3 pb-2 pt-5 ${isFutureGroup ? 'opacity-30' : ''}`}
                        >
                            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-2">
                                {formatPhase(group.phase)}
                            </span>
                            {group.cards.length > 0 && (
                                <span className="ml-auto flex gap-0.75">
                                    {group.cards.map((card) => (
                                        <PlayingCard key={`${card.rank}${card.suit}`} card={card} size="sm" />
                                    ))}
                                </span>
                            )}
                        </div>

                        {/* A linha vertical é o que transforma a lista numa sequência. */}
                        <div className="ml-4.75 border-l border-hairline-soft pl-0">
                            {group.entries.map((entry) => (
                                <LogRow
                                    key={entry.frame}
                                    entry={entry}
                                    isCurrent={entry.frame === frame}
                                    isFuture={entry.frame > frame}
                                    isHero={describe(entry.event).who === hero}
                                    onJump={onJump}
                                    rowRef={entry.frame === frame ? currentRef : undefined}
                                />
                            ))}
                        </div>

                        <div
                            className={`flex items-center gap-2 py-2 pl-4.75 pr-3 ${isFutureGroup ? 'opacity-30' : ''}`}
                        >
                            <span className="h-px flex-1 bg-hairline-soft" />
                            <span className="font-mono text-[10px] text-ink-3">
                                pote {formatChips(group.potAfter)}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}