import { Board, HoleCards, PlayingCard } from '@/components/poker/PlayingCard'
import type { Card } from '@/lib/poker/types'

const c = (raw: string): Card => ({ rank: raw[0], suit: raw[1] } as Card)

export default function Page() {
  return (
    <main className="flex flex-col gap-10 p-12">
      <section className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-3">Naipes · lg</p>
        <div className="flex gap-2">
          {['As', 'Kh', 'Qd', 'Jc'].map((raw) => (
            <PlayingCard key={raw} card={c(raw)} size="lg" />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-3">Hole cards · md</p>
        <div className="flex gap-8">
          <HoleCards cards={[c('Jh'), c('Jc')]} />
          <HoleCards cards={[c('Qc'), c('5c')]} />
          <HoleCards cards={[c('8d'), c('2h')]} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-3">Board · sm</p>
        <div className="flex flex-col gap-3">
          <Board cards={['7s', '2c', 'Ks', '6d', '9d'].map(c)} />
          <Board cards={['Ad', '4h', 'Jh'].map(c)} />
          <Board cards={[]} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-3">Tamanhos</p>
        <div className="flex items-end gap-3">
          <PlayingCard card={c('Ah')} size="sm" />
          <PlayingCard card={c('Ah')} size="md" />
          <PlayingCard card={c('Ah')} size="lg" />
        </div>
      </section>
    </main>
  )
}