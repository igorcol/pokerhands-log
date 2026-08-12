import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { ReplayStage } from '@/components/replay/ReplayStage'
import { listAccounts, readAccountHands } from '@/lib/poker/handHistorySource'

function findHand(id: string) {
  for (const account of listAccounts()) {
    const hand = readAccountHands(account).hands.find((h) => h.id === id)
    if (hand) return hand
  }
  return null
}

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id } = await params
  const hand = findHand(id)
  if (!hand) notFound()

  return <ReplayStage hand={hand} />
}