import { Board, HoleCards } from '@/components/poker/PlayingCard'
import { formatChips, formatNet, formatOutcome, formatTime } from '@/lib/poker/format'
import type { HandListItem } from '@/lib/poker/handListItem'

// Uma linha da lista. Ainda não navega — a rota de replay é a Fase 4; o hover já existe
// pra validar a affordance. Posição só ganha cor cheia quando importa (BTN/SB/BB).

const KEY_POSITIONS = new Set(['BTN', 'SB', 'BB'])
const GRID = 'grid grid-cols-[66px_88px_44px_1fr_92px_108px] items-center gap-4'

export function HandRowHeader() {
  return (
    <div
      className={`${GRID} sticky top-0 z-10 bg-base px-3.5 pb-2 pt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3`}
    >
      <div>Hora</div>
      <div>Mão</div>
      <div>Pos</div>
      <div>Board</div>
      <div className="text-right">Pote</div>
      <div className="text-right">Resultado</div>
    </div>
  )
}

export function HandRow({ item }: { item: HandListItem }) {
  return (
    <div
      className={`${GRID} cursor-pointer rounded-[11px] border-b border-hairline-soft px-3.5 py-2.5 transition-colors hover:border-transparent hover:bg-surface`}
    >
      <div className="font-mono text-xs text-ink-3">{formatTime(item.dateIso)}</div>
      <div className="pl-1">
        <HoleCards cards={item.holeCards} />
      </div>
      <div
        className={`font-mono text-[11px] font-medium tracking-[0.07em] ${KEY_POSITIONS.has(item.position) ? 'text-ink' : 'text-ink-3'}`}
      >
        {item.position}
      </div>
      <div className="flex items-center">
        <Board cards={item.board} />
        <span
          className={`ml-3 font-mono text-[10.5px] ${item.isShowdown ? 'text-carmine-soft' : 'text-ink-3'}`}
        >
          {formatOutcome(item.outcome)}
        </span>
      </div>
      <div className="text-right font-mono text-[13px] tabular-nums text-ink-2">
        {formatChips(item.pot)}
      </div>
      <div
        className={`text-right font-mono text-[15px] font-medium tabular-nums tracking-[-0.02em] ${item.net > 0 ? 'text-mint' : item.net < 0 ? 'text-carmine' : 'text-ink-2'}`}
      >
        {formatNet(item.net)}
      </div>
    </div>
  )
}