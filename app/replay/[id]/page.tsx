import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Table } from '@/components/replay/Table'
import { listAccounts, readAccountHands } from '@/lib/poker/handHistorySource'
import { activePlayer, lastActionsThisStreet, seatLayout } from '@/lib/poker/replayView'
import { applyEvents } from '@/lib/poker/tableState'
import { buildTimeline } from '@/lib/poker/timeline'

// * EM CONSTRUÇÃO...
// Fase 4b: mesa estática, um frame fixo escolhido por query string (?frame=N). 
// Sem timer, sem teclado, sem animação. Isso entra na Fase 4c. O objetivo aqui é só provar que o
// layout bate com o mockup aprovado, alimentado pelo dado real.

function findHand(id: string) {
  for (const account of listAccounts()) {
    const hand = readAccountHands(account).hands.find((h) => h.id === id)
    if (hand) return hand
  }
  return null
}

export default async function ReplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ frame?: string }>
}) {
  await connection()

  const { id } = await params
  const hand = findHand(id)
  if (!hand) notFound()

  const timeline = buildTimeline(hand)
  const { frame: frameParam } = await searchParams
  const frame = Math.min(Math.max(Number(frameParam) || timeline.length, 0), timeline.length)

  const state = applyEvents(hand, timeline.slice(0, frame))
  const layout = seatLayout(hand)
  const activePlayerName = activePlayer(timeline, frame)
  const lastActions = lastActionsThisStreet(timeline, frame)

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-10">
      <Table
        hand={hand}
        state={state}
        layout={layout}
        activePlayerName={activePlayerName}
        lastActions={lastActions}
      />
    </div>
  )
}