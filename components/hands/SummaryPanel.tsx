import { HoleCards } from '@/components/poker/PlayingCard'
import { formatChips, formatNet, formatTime } from '@/lib/poker/format'
import type { HandsSummary } from '@/lib/poker/summary'
import { StackSparkline } from './StackSparkline'

// Os três blocos do topo. O glow radial é o que dá volume sem virar gradiente decorativo:
// carmim no resultado, menta no destaque — cor com origem no dado, não no moodboard.

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-hairline-soft bg-surface px-5 py-5 ${className}`}
    >
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] uppercase tracking-[0.11em] text-ink-3">{children}</div>
  )
}

export function SummaryPanel({
  summary,
  stackCurve,
  periodLabel,
}: {
  summary: HandsSummary
  stackCurve: number[]
  periodLabel: string
}) {
  const isUp = summary.net >= 0

  return (
    <div className="mb-7 grid grid-cols-[1.75fr_1fr_1.05fr] gap-3.5">
      <Card className="bg-[radial-gradient(90%_130%_at_6%_0%,rgba(224,49,62,0.13)_0%,rgba(224,49,62,0)_58%)]">
        <Label>Resultado · {periodLabel}</Label>
        <div
          className={`my-3 font-mono text-[40px] font-medium leading-none tracking-[-0.045em] ${isUp ? 'text-mint' : 'text-carmine'}`}
        >
          {formatNet(summary.net)}
        </div>
        <div className="font-mono text-xs text-ink-3">
          {formatChips(summary.startingStack)} → {formatChips(summary.endingStack)}
        </div>
        <div className="mt-3">
          <StackSparkline values={stackCurve} />
        </div>
      </Card>

      <Card className="flex flex-col justify-between">
        {[
          { k: 'Mãos jogadas', v: String(summary.handCount) },
          {
            k: 'Ganhas',
            v: String(summary.wonCount),
            hint: summary.handCount
              ? `${Math.round((summary.wonCount / summary.handCount) * 100)}%`
              : undefined,
          },
          {
            k: 'Showdown',
            v: String(summary.showdownCount),
            hint: `${summary.showdownWonCount} ganhos`,
          },
          { k: 'Maior pote', v: formatChips(summary.biggestPot) },
        ].map((row, index) => (
          <div
            key={row.k}
            className={`flex items-baseline justify-between border-hairline-soft py-2.5 ${index === 3 ? '' : 'border-b'} ${index === 0 ? 'pt-0' : ''}`}
          >
            <span className="text-[13px] text-ink-2">{row.k}</span>
            <span className="font-mono text-[17px] font-medium">
              {row.v}
              {row.hint && <i className="ml-1 text-[11px] not-italic text-ink-3">{row.hint}</i>}
            </span>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col bg-[radial-gradient(85%_120%_at_92%_4%,rgba(63,207,142,0.12)_0%,rgba(63,207,142,0)_60%)]">
        <Label>Maior ganho</Label>
        {summary.biggestWin ? (
          <>
            <div className="mb-auto mt-2.5 font-mono text-[27px] font-medium tracking-[-0.03em] text-mint">
              {formatNet(summary.biggestWin.result.net)}
            </div>
            <div className="mt-3.5 flex items-end justify-between">
              <div className="font-mono text-[11.5px] leading-relaxed text-ink-3">
                {summary.biggestWin.result.position} · {formatTime(summary.biggestWin.hand.dateIso)}
              </div>
              <HoleCards cards={summary.biggestWin.result.holeCards} size="lg" />
            </div>
          </>
        ) : (
          <div className="mt-2.5 font-mono text-[27px] text-ink-3">—</div>
        )}
      </Card>
    </div>
  )
}