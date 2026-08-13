import Link from 'next/link'

// Header do replay. Por ora o caminho de volta e o toggle do log — cartas do hero,
// resultado da mão e navegação entre mãos entram aqui depois.

export function ReplayHeader({
  isLogOpen,
  onToggleLog,
}: {
  isLogOpen: boolean
  onToggleLog: () => void
}) {
  return (
    <header className="flex h-15.5 shrink-0 items-center gap-5 px-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full bg-white/3 px-3.5 py-1.5 text-[13.5px] text-ink-2 transition-colors hover:bg-white/[0.07] hover:text-ink"
      >
        ‹ Mãos
      </Link>

      <button
        type="button"
        onClick={onToggleLog}
        aria-label={isLogOpen ? 'Ocultar sequência' : 'Mostrar sequência'}
        className="ml-auto rounded-full bg-white/3 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-2 transition-colors hover:bg-white/[0.07] hover:text-ink"
      >
        Sequência {isLogOpen ? '›' : '‹'}
      </button>
    </header>
  )
}