import { chipTier } from '@/lib/poker/tableVisuals'

// Só a pilha visual. Cor por faixa de valor relativa ao big blind, altura por magnitude.
// Sem rótulo aqui: aposta de jogador e pote têm layouts diferentes pro número, então
// quem chama decide como mostrar o valor (ver BetChips).

export function ChipStack({ amount, bigBlind }: { amount: number; bigBlind: number }) {
  const tier = chipTier(amount, bigBlind)

  return (
    <div className="relative w-6.5" style={{ height: 20 + tier.stackHeight * 5 }}>
      {Array.from({ length: tier.stackHeight }, (_, index) => (
        <svg
          key={index}
          width="26"
          height="26"
          viewBox="0 0 24 24"
          className="absolute left-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]"
          style={{ top: (tier.stackHeight - 1 - index) * 5 }}
        >
          <circle
            cx="12"
            cy="12"
            r="11"
            fill={index === tier.stackHeight - 1 ? tier.color : tier.shade}
          />
          <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth="2.6" />
        </svg>
      ))}
    </div>
  )
}