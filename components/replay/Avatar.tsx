import { playerIdentity } from '@/lib/poker/tableVisuals'

// Círculo com gradiente + inicial, cor determinística por nome — o mesmo vilão tem
// sempre a mesma cor na mesa e (mais tarde) no log lateral, dá pra reconhecer sem ler.

const SIZE = { seat: 46, log: 20 } as const

export function Avatar({
  name,
  isHero = false,
  glow = 'none',
  size = 'seat',
}: {
  name: string
  isHero?: boolean
  glow?: 'none' | 'acting' | 'win'
  size?: keyof typeof SIZE
}) {
  const identity = playerIdentity(name, isHero)
  const px = SIZE[size]

  const boxShadow =
    glow === 'acting'
      ? '0 0 0 3px var(--color-base), 0 0 0 5px var(--color-carmine), 0 0 24px rgba(224,49,62,0.5)'
      : glow === 'win'
        ? '0 0 0 3px var(--color-base), 0 0 0 5px var(--color-mint), 0 0 24px rgba(63,207,142,0.5)'
        : '0 0 0 3px var(--color-base), 0 6px 16px rgba(0,0,0,0.6)'

  return (
    <div
      className="relative z-2 flex shrink-0 items-center justify-center rounded-full font-semibold text-white/90"
      style={{
        width: px,
        height: px,
        fontSize: size === 'seat' ? 16 : 9,
        background: `linear-gradient(150deg, ${identity.from}, ${identity.to})`,
        boxShadow,
      }}
    >
      {identity.initial}
    </div>
  )
}