import Link from 'next/link'
import { HoleCards } from '@/components/poker/PlayingCard'
import { formatChips, formatNet, formatOutcome, formatTime } from '@/lib/poker/format'
import type { HandResult } from '@/lib/poker/handResult'
import type { Hand } from '@/lib/poker/types'

// Header do replay: identidade da mão à esquerda, desfecho à direita. O resultado é a
// única coisa aqui com cor de destaque — é o que você procura ao abrir a mão.
// Navegação entre mãos (‹ ›) entra depois.

export function ReplayHeader({
  hand,
  result,
  isLogOpen,
  onToggleLog,
}: {
  hand: Hand
  result: HandResult | null
  isLogOpen: boolean
  onToggleLog: () => void
}) {
  const isWin = (result?.net ?? 0) > 0
  const isLoss = (result?.net ?? 0) < 0

  return (
    <header className="flex h-15.5 shrink-0 items-center gap-4 px-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full bg-white/3 px-3.5 py-1.5 text-[13.5px] text-ink-2 transition-colors hover:bg-white/[0.07] hover:text-ink"
      >
        ‹ Mãos
      </Link>

      {result && (
        <div className="flex items-center gap-2.5 rounded-full bg-white/3 py-1.5 pl-2 pr-4">
          <HoleCards cards={result.holeCards} size="sm" />
          <div className="font-mono leading-tight">
            <div className="text-[11.5px] font-medium tracking-[0.08em]">{result.position}</div>
            <div className="text-[10px] text-ink-3">{formatTime(hand.dateIso)}</div>
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-5">
        <div className="text-right">
          <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-ink-3">
            Pote final
          </div>
          <div className="font-mono text-[15px] font-medium tracking-tight text-ink-2">
            {formatChips(hand.totalPot)}
          </div>
        </div>

        {result && (
          <div
            className={`rounded-xl px-3.5 py-1.5 text-right ${
              isWin ? 'bg-mint/10' : isLoss ? 'bg-carmine/10' : 'bg-white/4'
            }`}
          >
            <div
              className={`font-mono text-lg font-medium leading-none tracking-[-0.03em] ${
                isWin ? 'text-mint' : isLoss ? 'text-carmine' : 'text-ink-2'
              }`}
            >
              {formatNet(result.net)}
            </div>
            <div className="mt-1 font-mono text-[9.5px] text-ink-3">
              {formatOutcome(result.outcome)}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleLog}
          aria-label={isLogOpen ? 'Ocultar sequência' : 'Mostrar sequência'}
          className="rounded-full bg-white/3 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-2 transition-colors hover:bg-white/[0.07] hover:text-ink"
        >
          Sequência {isLogOpen ? '›' : '‹'}
        </button>
      </div>
    </header>
  )
}