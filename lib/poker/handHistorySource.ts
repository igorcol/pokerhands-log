import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseHandHistory } from './parseHandHistory'
import type { Hand } from './types'

// Fronteira de I/O do projeto: a única camada que sabe que hand history mora em disco.
// Lê a pasta do PokerStars (uma subpasta por conta), delega o texto pro parser puro e
// cacheia por arquivo usando mtime. Roda só no servidor — importa node:fs.

const DEFAULT_DIR = 'C:\\Users\\igor_\\AppData\\Local\\PokerStars\\HandHistory'

export function handHistoryDir(): string {
  return process.env.POKER_HAND_HISTORY_DIR ?? DEFAULT_DIR
}

export interface SkippedFile {
  file: string
  reason: string
}

export interface AccountHands {
  account: string
  hands: Hand[]
  skipped: SkippedFile[]
}

interface CacheEntry {
  mtimeMs: number
  hands: Hand[]
}

const cache = new Map<string, CacheEntry>()

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function listAccounts(): string[] {
  const root = handHistoryDir()
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  } catch (error) {
    throw new Error(`Failed to list accounts in "${root}": ${getErrorMessage(error)}`)
  }
}

function readFileHands(filePath: string): Hand[] {
  const { mtimeMs } = statSync(filePath)
  const cached = cache.get(filePath)
  if (cached && cached.mtimeMs === mtimeMs) return cached.hands

  const hands = parseHandHistory(readFileSync(filePath, 'utf-8'))
  cache.set(filePath, { mtimeMs, hands })
  return hands
}

export function readAccountHands(account: string): AccountHands {
  const dir = join(handHistoryDir(), account)
  const files = readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.txt'))

  const hands: Hand[] = []
  const skipped: SkippedFile[] = []

  for (const file of files) {
    try {
      hands.push(...readFileHands(join(dir, file)))
    } catch (error) {
      // Um arquivo de torneio (ou corrompido) não pode derrubar a leitura inteira —
      // registra e segue, pra UI poder avisar sem perder as mãos que deram certo.
      skipped.push({ file, reason: getErrorMessage(error) })
    }
  }

  // Mesma mão pode aparecer em dois arquivos se a mesa for reaberta no mesmo dia.
  const byId = new Map<string, Hand>()
  for (const hand of hands) byId.set(hand.id, hand)

  const unique = [...byId.values()].sort((a, b) =>
    a.dateIso === b.dateIso ? a.id.localeCompare(b.id) : a.dateIso.localeCompare(b.dateIso),
  )

  return { account, hands: unique, skipped }
}