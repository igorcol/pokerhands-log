import { connection } from 'next/server'
import { HandRow, HandRowHeader } from '@/components/hands/HandRow'
import { SummaryPanel } from '@/components/hands/SummaryPanel'
import { Sidebar } from '@/components/layout/Sidebar'
import { formatTime } from '@/lib/poker/format'
import { listAccounts, readAccountHands } from '@/lib/poker/handHistorySource'
import { summarizeHands, withResults } from '@/lib/poker/summary'

const FILTERS = ['Todas', 'Ganhas', 'Perdidas', 'Showdown', 'Maiores potes']
const PERIODS = ['Hoje', '7 dias', 'Mês', 'Tudo']

export default async function Page() {
  // readFileSync completaria durante o prerender e congelaria a lista no build —
  // connection() garante que a pasta é lida a cada request.
  await connection()

  const accounts = listAccounts()
  const account = accounts[0]
  const { hands, skipped } = readAccountHands(account)
  const entries = withResults(hands)
  const summary = summarizeHands(entries)

  const stackCurve = entries.reduce<number[]>(
    (curve, entry) => [...curve, curve[curve.length - 1] + entry.result.net],
    [summary.startingStack],
  )

  const table = hands[0]

    return (
    <div className="grid h-screen grid-cols-[214px_1fr] overflow-hidden">
      <Sidebar account={account} />

      <main className="flex min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 px-6 pt-6">
          <div className="mb-4.5 flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">Mãos</h1>
              {table && (
                <div className="mt-0.5 text-[13px] text-ink-2">
                  {table.tableName} &nbsp;·&nbsp;
                  <b className="font-mono text-[12.5px] font-medium text-ink">
                    {table.smallBlind / 100}/{table.bigBlind / 100}
                  </b>
                </div>
              )}
            </div>

            <div className="flex gap-0.5 rounded-[10px] border border-hairline-soft bg-surface p-0.75">
              {PERIODS.map((period, index) => (
                <span
                  key={period}
                  className={`rounded-[7px] px-3.5 py-1.5 text-[13px] ${index === 3 ? 'bg-surface-3 font-medium text-ink' : 'text-ink-2'}`}
                >
                  {period}
                </span>
              ))}
            </div>
          </div>

          {skipped.length > 0 && (
            <div className="mb-4 rounded-[11px] border border-hairline-soft bg-surface px-4 py-3 text-[13px] text-ink-2">
              {skipped.length} arquivo(s) não puderam ser lidos:{' '}
              <span className="font-mono text-[12px] text-carmine-soft">
                {skipped.map((s) => s.file).join(', ')}
              </span>
            </div>
          )}

          <SummaryPanel summary={summary} stackCurve={stackCurve} periodLabel="tudo" />

          <div className="flex items-center gap-5 border-b border-hairline-soft">
            {FILTERS.map((filter, index) => (
              <span
                key={filter}
                className={`-mb-px pb-3 text-sm ${index === 0 ? 'border-b-2 border-carmine font-medium text-ink' : 'text-ink-2'}`}
              >
                {filter}
              </span>
            ))}
            <span className="ml-auto pb-3 font-mono text-xs text-ink-3">{entries.length} mãos</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <HandRowHeader />
          {entries.map((entry) => (
            <HandRow key={entry.hand.id} entry={entry} time={formatTime(entry.hand.dateIso)} />
          ))}
        </div>
      </main>
    </div>
  )
}