// Rail de navegação. Sem ícones de propósito: item ativo se distingue por peso, superfície
// e a barra carmim inset — mesma decisão dos badges, hierarquia por tipografia e não por
// cápsula colorida.

const NAV_ITEMS = [
  { label: 'Mãos', active: true },
  { label: 'Estatísticas', active: false },
  { label: 'Jogadores', active: false },
  { label: 'Ajustes', active: false },
]

export function Sidebar({ account }: { account: string }) {
  return (
    <aside className="flex flex-col border-r border-hairline-soft p-6">
      <div className="mb-9 flex items-center gap-2.5 px-2.5">
        <div className="flex size-6.5 items-center justify-center rounded-[7px] bg-carmine">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M12 0.8C12 0.8 2.4 8.6 2.4 14.5a4.9 4.9 0 0 0 8.4 3.5c.1 2.4-.9 4-2.4 5.2h7.2c-1.5-1.2-2.5-2.8-2.4-5.2a4.9 4.9 0 0 0 8.4-3.5C21.6 8.6 12 0.8 12 0.8Z" />
          </svg>
        </div>
        <b className="font-mono text-sm font-medium tracking-tight">POKERHANDS</b>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <span
            key={item.label}
            className={
              item.active
                ? 'rounded-[9px] bg-surface-2 px-2.5 py-2.5 text-[14.5px] font-medium text-ink shadow-[inset_2px_0_0_var(--color-carmine)]'
                : 'rounded-[9px] px-2.5 py-2.5 text-[14.5px] text-ink-2'
            }
          >
            {item.label}
          </span>
        ))}
      </nav>

      <div className="mt-auto rounded-[11px] border border-hairline-soft bg-surface p-3">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Conta
        </div>
        <div className="font-mono text-[12.5px]">{account}</div>
      </div>
    </aside>
  )
}