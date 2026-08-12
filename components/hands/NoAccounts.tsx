import { handHistoryDir } from '@/lib/poker/handHistorySource'

// Estado vazio quando não há pasta de hand history acessível — máquina sem PokerStars,
// pasta renomeada, ou deploy remoto (onde os arquivos simplesmente não existem).

export function NoAccounts() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-10">
      <div className="max-w-lg rounded-2xl border border-hairline-soft bg-surface p-8">
        <h1 className="text-lg font-semibold tracking-tight">Nenhuma conta encontrada</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          Não foi possível ler a pasta de hand history do PokerStars. O app lê os arquivos
          direto do disco, então precisa rodar na mesma máquina onde você joga.
        </p>
        <div className="mt-5 rounded-xl bg-base p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
            Pasta procurada
          </div>
          <div className="mt-1.5 break-all font-mono text-xs text-ink-2">{handHistoryDir()}</div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ink-2">
          Para apontar para outro lugar, defina{' '}
          <code className="font-mono text-xs text-carmine-soft">POKER_HAND_HISTORY_DIR</code> e
          reinicie o servidor.
        </p>
      </div>
    </div>
  )
}