'use client'

import { useState } from 'react'
import type { FilterKey, HandListItem, PeriodKey } from '@/lib/poker/handListItem'
import { filterByPeriod, filterHandListItems, nextPeriodWithHands } from '@/lib/poker/handListItem'
import { buildStackCurve, summarizeHandListItems } from '@/lib/poker/summary'
import { HandRow, HandRowHeader } from './HandRow'
import { SummaryPanel } from './SummaryPanel'
import { EmptyHands } from './EmptyHands'

// Fronteira cliente/servidor: a página lê disco e parseia no servidor; aqui só filtramos
// o que já veio pronto. Período recalcula resumo e sparkline; a aba de categoria só
// decide quais linhas aparecem — o número grande do topo nunca muda com ela, pra não
// virar um "total de mãos ganhas" disfarçado de resultado do período.

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: 'month', label: 'Mês' },
  { key: 'all', label: 'Tudo' },
]

const PERIOD_SUMMARY_LABEL: Record<PeriodKey, string> = {
  today: 'hoje',
  '7d': 'últimos 7 dias',
  month: 'este mês',
  all: 'tudo',
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'won', label: 'Ganhas' },
  { key: 'lost', label: 'Perdidas' },
  { key: 'showdown', label: 'Showdown' },
  { key: 'biggest-pots', label: 'Maiores potes' },
]

export function HandsExplorer({
  items,
  tableName,
  stakes,
}: {
  items: HandListItem[]
  tableName: string | null
  stakes: string | null
}) {
  const [period, setPeriod] = useState<PeriodKey>('today')
  const [filter, setFilter] = useState<FilterKey>('all')

  const periodItems = filterByPeriod(items, period, new Date())
  const summary = summarizeHandListItems(periodItems)
  const stackCurve = buildStackCurve(periodItems)

  const filteredItems = filterHandListItems(periodItems, filter)
  // A lista mostra a mão mais recente no topo; resumo e sparkline continuam em ordem
  // ascendente (senão o cálculo do stack acumulado inverteria junto).
  const visibleItems = filter === 'biggest-pots' ? filteredItems : [...filteredItems].reverse()

  const now = new Date()
  const suggestion = nextPeriodWithHands(items, period, now)

  return (
    <>
      <div className="shrink-0 px-6 pt-6">
        <div className="mb-4.5 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Mãos</h1>
            {tableName && (
              <div className="mt-0.5 text-[13px] text-ink-2">
                {tableName}
                {stakes && (
                  <>
                    {' '}
                    &nbsp;·&nbsp;
                    <b className="font-mono text-[12.5px] font-medium text-ink">{stakes}</b>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-0.5 rounded-[10px] border border-hairline-soft bg-surface p-0.75">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`cursor-pointer rounded-[7px] px-3.5 py-1.5 text-[13px] ${period === p.key ? 'bg-surface-3 font-medium text-ink' : 'text-ink-2'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <SummaryPanel
          summary={summary}
          stackCurve={stackCurve}
          periodLabel={PERIOD_SUMMARY_LABEL[period]}
        />

        <div className="flex items-center gap-5 border-b border-hairline-soft">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`-mb-px cursor-pointer border-b-2 pb-3 text-sm ${filter === f.key ? 'border-carmine font-medium text-ink' : 'border-transparent text-ink-2'
                }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto pb-3 font-mono text-xs text-ink-3">
            {visibleItems.length} mãos
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {visibleItems.length > 0 && <HandRowHeader />}
        {visibleItems.map((item) => (
          <HandRow key={item.id} item={item} />
        ))}

        {/* Dois vazios diferentes: o período não tem mão nenhuma, ou tem mas a aba
            de categoria filtrou todas. Cada um pede um atalho diferente. */}
        {visibleItems.length === 0 && periodItems.length === 0 && (
          <EmptyHands
            title={`Nenhuma mão ${PERIOD_SUMMARY_LABEL[period]}`}
            description={
              suggestion
                ? `Você tem ${suggestion.count} ${suggestion.count === 1 ? 'mão' : 'mãos'} em ${PERIOD_SUMMARY_LABEL[suggestion.period]}.`
                : 'Nenhuma mão encontrada no histórico.'
            }
            actionLabel={
              suggestion
                ? `Ver ${PERIOD_SUMMARY_LABEL[suggestion.period]}`
                : undefined
            }
            onAction={suggestion ? () => setPeriod(suggestion.period) : undefined}
          />
        )}

        {visibleItems.length === 0 && periodItems.length > 0 && (
          <EmptyHands
            title="Nenhuma mão neste filtro"
            description={`Você tem ${periodItems.length} ${periodItems.length === 1 ? 'mão' : 'mãos'} ${PERIOD_SUMMARY_LABEL[period]}, mas nenhuma se encaixa aqui.`}
            actionLabel="Ver todas"
            onAction={() => setFilter('all')}
          />
        )}
      </div>
    </>
  )
}