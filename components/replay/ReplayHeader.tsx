import Link from 'next/link'


export function ReplayHeader() {
  return (
    <header className="flex h-15.5 shrink-0 items-center gap-5 px-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full bg-white/3 px-3.5 py-1.5 text-[13.5px] text-ink-2 transition-colors hover:bg-white/[0.07] hover:text-ink"
      >
        ‹ Mãos
      </Link>
    </header>
  )
}