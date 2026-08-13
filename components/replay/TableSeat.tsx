import { formatChips } from '@/lib/poker/format'
import type { LastAction, SeatSlot } from '@/lib/poker/replayView'
import type { TableState } from '@/lib/poker/tableState'
import type { Hand } from '@/lib/poker/types'
import { FlippableCard } from '@/components/poker/FlippableCard'
import { HoleCards } from '@/components/poker/PlayingCard'
import { Avatar } from './Avatar'
import { ActionBubble } from './ActionBubble'
import { EnterTransition } from './EnterTransition'

// Três camadas sobrepostas: cartas atrás, avatar no meio, placa embaixo. As cartas
// nunca desmontam (só trocam de opacidade) — é o que permite o fold animar suavemente
// sem precisar de truque de saída.
export function TableSeat({
    slot,
    anchor,
    betAnchor,
    hand,
    state,
    isActing,
    lastAction,
}: {
    slot: SeatSlot
    anchor: { left: number; top: number }
    betAnchor: { left: number; top: number }
    hand: Hand
    state: TableState
    isActing: boolean
    lastAction: LastAction | undefined
}) {
    if (!slot.player) {
        return (
            <div
                className="absolute w-32.5 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${anchor.left}%`, top: `${anchor.top}%` }}
            />
        )
    }

    const seat = slot.player
    const playerState = state.players.get(seat.playerName)
    const isFolded = playerState?.isFolded && !seat.isSittingOut
    const streetBet = playerState?.streetBet ?? 0
    const holeCards = playerState?.holeCards ?? null
    // A frente do vilão vem de hand.reveals (dado estático), pra existir no DOM antes do
    // showdown chegar. holeCards só é preenchido quando o evento de reveal roda.
    const revealedCards = hand.reveals.find((r) => r.player === seat.playerName)?.cards ?? null
    const isRevealed = holeCards !== null
    const isDimmed = seat.isSittingOut || isFolded


    return (
        <>
            <div
                className={`absolute flex w-32.5 -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-opacity duration-300 ${seat.isSittingOut ? 'opacity-20' : isFolded ? 'opacity-30' : 'opacity-100'
                    }`}
                style={{ left: `${anchor.left}%`, top: `${anchor.top}%` }}
            >
                <div
                    className={`z-0 -mb-6 flex transition-opacity duration-300 ${isDimmed ? 'opacity-0' : 'opacity-100'
                        }`}
                >
                    {slot.isHero && holeCards ? (
                        // As suas ficam sempre viradas — o flip é reservado pra informação nova.
                        <HoleCards cards={holeCards} size="table" />
                    ) : (
                        <>
                            <div className="-rotate-6">
                                <FlippableCard
                                    card={revealedCards?.[0] ?? null}
                                    faceUp={isRevealed}
                                    size="table"
                                />
                            </div>
                            <div className="-ml-4 rotate-6">
                                <FlippableCard
                                    card={revealedCards?.[1] ?? null}
                                    faceUp={isRevealed}
                                    size="table"
                                    delayMs={90}
                                />
                            </div>
                        </>
                    )}
                </div>

                <Avatar name={seat.playerName} isHero={slot.isHero} glow={isActing ? 'acting' : 'none'} />

                <div
                    className="relative -mt-2 w-full rounded-2xl px-3 pb-1.5 pt-3 text-center shadow-[0_8px_22px_rgba(0,0,0,0.5)]"
                    style={{ background: slot.isHero ? 'rgba(30,30,36,0.96)' : 'rgba(20,20,24,0.94)' }}
                >
                    <div
                        className={`truncate text-[11.5px] font-medium ${slot.isHero ? 'text-ink' : 'text-ink-2'}`}
                    >
                        {seat.playerName}
                    </div>
                    <div className="mt-px font-mono text-sm font-medium tracking-tight">
                        {formatChips(playerState?.stack ?? seat.chips)}
                    </div>
                </div>
            </div>

            {!seat.isSittingOut && (
                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${betAnchor.left}%`, top: `${betAnchor.top}%` }}
                >
                    <EnterTransition key={`${lastAction?.type}-${lastAction?.amount}-${streetBet}`}>
                        <ActionBubble
                            action={lastAction}
                            streetBet={streetBet}
                            bigBlind={hand.bigBlind}
                            isFolded={Boolean(isFolded)}
                        />
                    </EnterTransition>
                </div>
            )}
        </>
    )
}