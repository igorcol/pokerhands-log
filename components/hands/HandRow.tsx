import { Board, HoleCards } from '@/components/poker/PlayingCard'
import { formatChips, formatNet, formatOutcome, formatTime, outcomeTone } from '@/lib/poker/format'
import type { HandListItem } from '@/lib/poker/handListItem'
import Link from 'next/link'

// Uma linha da lista. Navega pro replay da mão. Posição só ganha cor cheia quando importa (BTN/SB/BB).
// Tom de resultado (win/loss/neutral) vem de outcomeTone, não de isShowdown — showdown
// ganho e perdido não podem parecer iguais, e fold fica neutro de propósito (ver format.ts).

const KEY_POSITIONS = new Set(['BTN', 'SB', 'BB'])
const GRID = 'grid grid-cols-[66px_88px_44px_1fr_92px_108px] items-center gap-4'

const ROW_ACCENT = {
  win: 'shadow-[inset_2px_0_0_var(--color-mint)]',
  loss: 'shadow-[inset_2px_0_0_var(--color-carmine)]',
  neutral: '',
}

const ROW_BG = {
  win: 'bg-mint/5',
  loss: 'bg-carmine/5',
  neutral: '',
}

const OUTCOME_TEXT = {
  win: 'text-mint',
  loss: 'text-carmine-soft',
  neutral: 'text-ink-3',
}

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
  const tone = outcomeTone(item.outcome, item.net)

  return (
    <Link
      href={`/replay/${item.id}`}
      className={`${GRID} cursor-pointer rounded-[11px] border-b border-hairline-soft px-3.5 py-2.5 transition-colors hover:border-transparent hover:bg-surface ${ROW_ACCENT[tone]} ${ROW_BG[tone]}`}
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
        <span className={`ml-3 font-mono text-[10.5px] ${OUTCOME_TEXT[tone]}`}>
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
    </Link>
  )
}