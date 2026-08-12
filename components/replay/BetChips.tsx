import { formatChips } from '@/lib/poker/format'
import { ChipStack } from './ChipStack'

// Ficha + valor, para o que um jogador tem apostado na frente dele. 
// O pote usa ChipStack puro porque tem layout de número maior, separado, não este componente.

export function BetChips({ amount, bigBlind }: { amount: number; bigBlind: number }) {
  return (
    <div className="flex items-center gap-2">
      <ChipStack amount={amount} bigBlind={bigBlind} />
      <span className="whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 font-mono text-xs backdrop-blur-[3px]">
        {formatChips(amount)}
      </span>
    </div>
  )
}