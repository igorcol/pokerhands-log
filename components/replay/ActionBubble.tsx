import { formatChips } from '@/lib/poker/format'
import type { LastAction } from '@/lib/poker/replayView'
import { ChipStack } from './ChipStack'

// A ação e as fichas no mesmo lugar, entre o jogador e o centro. Antes o selo ficava na
// placa e só aparecia quando havia valor — check e fold sumiam, e você não via metade do
// que acontecia. Como lastAction reseta a cada street, a bolha some sozinha na virada.

const TONE: Record<string, string> = {
  fold: 'text-ink-3',
  check: 'text-ink-2',
  call: 'text-ink',
  bet: 'text-carmine-soft',
  raise: 'text-carmine-soft',
}

export function ActionBubble({
  action,
  streetBet,
  bigBlind,
  isFolded,
}: {
  action: LastAction | undefined
  streetBet: number
  bigBlind: number
  isFolded: boolean
}) {
  if (!action && streetBet === 0) return null

  // Quem foldou não tem mais fichas na frente — elas já foram pro pote.
  const showChips = streetBet > 0 && !isFolded
  const isAllIn = action?.isAllIn ?? false
  const label = isAllIn ? 'all in' : action?.type

  return (
    <div
      className={`flex items-center gap-2 rounded-full py-1 backdrop-blur-[3px] ${
        showChips ? 'pl-1 pr-3.5' : 'px-3.5'
      } ${isAllIn ? 'bg-carmine shadow-[0_0_18px_rgba(224,49,62,0.45)]' : 'bg-black/70'}`}
    >
      {showChips && <ChipStack amount={streetBet} bigBlind={bigBlind} />}

      <div className="flex flex-col items-start leading-none">
        {label && (
          <span
            className={`font-mono text-[9px] font-semibold uppercase tracking-[0.11em] ${
              isAllIn ? 'text-white' : (TONE[label] ?? 'text-ink-2')
            }`}
          >
            {label}
          </span>
        )}
        {showChips && (
          <span
            className={`mt-1 font-mono text-[12.5px] font-medium tabular-nums ${
              isAllIn ? 'text-white' : 'text-ink'
            }`}
          >
            {formatChips(streetBet)}
          </span>
        )}
      </div>
    </div>
  )
}