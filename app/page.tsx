import { connection } from 'next/server'
import { HandsExplorer } from '@/components/hands/HandsExplorer'
import { Sidebar } from '@/components/layout/Sidebar'
import { formatChips } from '@/lib/poker/format'
import { toHandListItem } from '@/lib/poker/handListItem'
import { withResults } from '@/lib/poker/handResult'
import { listAccounts, readAccountHands } from '@/lib/poker/handHistorySource'
import { NoAccounts } from '@/components/hands/NoAccounts'

export default async function Page() {
  // readFileSync completaria durante o prerender e congelaria a lista no build —
  // connection() garante que a pasta é lida a cada request.
  await connection()

  const accounts = listAccounts()
  const account = accounts[0]

  // Fallback de erro de caminho da pasta
  if (!account) return <NoAccounts />

  const { hands, skipped } = readAccountHands(account)
  const items = withResults(hands).map(toHandListItem)
  const table = hands[0]

  return (
    <div className="grid h-screen grid-cols-[214px_1fr] overflow-hidden">
      <Sidebar account={account} />

      <main className="flex min-h-0 flex-col overflow-hidden">
        {skipped.length > 0 && (
          <div className="mx-6 mt-6 shrink-0 rounded-[11px] border border-hairline-soft bg-surface px-4 py-3 text-[13px] text-ink-2">
            {skipped.length} arquivo(s) não puderam ser lidos:{' '}
            <span className="font-mono text-[12px] text-carmine-soft">
              {skipped.map((s) => s.file).join(', ')}
            </span>
          </div>
        )}

        <HandsExplorer
          items={items}
          tableName={table?.tableName ?? null}
          stakes={
            table ? `${formatChips(table.smallBlind)}/${formatChips(table.bigBlind)}` : null
          }
        />
      </main>
    </div>
  )
}