import { formatChips } from '@/lib/poker/format'
import type { LastAction, SeatSlot } from '@/lib/poker/replayView'
import type { TableState } from '@/lib/poker/tableState'
import type { Hand } from '@/lib/poker/types'
import { ChipStack } from './ChipStack'
import { CommunityBoard } from './CommunityBoard'
import { TableSeat } from './TableSeat'

// As 9 âncoras não são equidistantes: topo e base têm mais largura útil e recebem dois
// assentos lado a lado, as laterais recebem um só. Índice 0 é o hero, na base 
// Os outros seguem no sentido horário -- mesma convenção do cliente do PokerStars: 
// Quem senta à sua esquerda age depois de você.
const SEAT_ANCHORS = [
  { left: 50, top: 91 }, // 0 · hero
  { left: 13, top: 79 },
  { left: 1, top: 45 },
  { left: 13, top: 11 },
  { left: 37, top: 3 },
  { left: 63, top: 3 },
  { left: 87, top: 11 },
  { left: 99, top: 45 },
  { left: 87, top: 79 },
] as const

const CENTER = { left: 50, top: 47 }

// Fichas apostadas ficam entre o assento e o centro. Interpolação em vez de mais 9
// coordenadas fixas pra manter em sincronia com SEAT_ANCHORS + ajuste fino de alguns pixels
function betAnchorFor(seatIndex: number) {
  const seat = SEAT_ANCHORS[seatIndex]
  const factor = 0.42
  return {
    left: seat.left + (CENTER.left - seat.left) * factor,
    top: seat.top + (CENTER.top - seat.top) * factor,
  }
}

export function Table({
  hand,
  state,
  layout,
  activePlayerName,
  lastActions,
  instant,
}: {
  hand: Hand
  state: TableState
  layout: SeatSlot[]
  activePlayerName: string | null
  lastActions: Map<string, LastAction>
  instant: boolean
}) {
  return (
    <div
      className="relative aspect-[16/9.4] w-full max-w-[min(90vw,1200px)]"
      data-instant={instant}
    >
      <div
        className="absolute rounded-full"
        style={{
          inset: '15% 9%',
          background:
            'radial-gradient(80% 60% at 50% -6%, rgba(255,255,255,0.07), transparent 62%), radial-gradient(64% 74% at 50% 44%, #24242E 0%, #191920 46%, #0F0F13 100%)',
          boxShadow:
            'inset 0 0 90px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 13px #0C0C0F, 0 0 0 14px rgba(255,255,255,0.055), 0 40px 90px rgba(0,0,0,0.75)',
        }}
      />

      <div className="absolute left-1/2 top-[47%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4.5">
        <div className="flex items-center gap-2.75 rounded-full bg-black/50 py-2 pl-2 pr-4 backdrop-blur-[3px]">
          <ChipStack amount={state.pot} bigBlind={hand.bigBlind} />
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">Pote</div>
            <div className="font-mono text-lg font-medium tracking-tight">
              {formatChips(state.pot)}
            </div>
          </div>
        </div>
        <CommunityBoard allCards={hand.board} revealedCount={state.board.length} />
      </div>

      {layout.map((slot) => (
        <TableSeat
          key={slot.seatNumber}
          slot={slot}
          anchor={SEAT_ANCHORS[slot.visualIndex]}
          betAnchor={betAnchorFor(slot.visualIndex)}
          hand={hand}
          state={state}
          isActing={slot.player?.playerName === activePlayerName}
          lastAction={slot.player ? lastActions.get(slot.player.playerName) : undefined}
        />
      ))}
    </div>
  )
}