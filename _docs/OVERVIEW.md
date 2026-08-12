# PokerHands — Visão Geral

> **Status:** Fase 1 (parser) concluída — 38/38 testes. Ver [`ROADMAP.md`](./ROADMAP.md). Nada de UI ainda.
> **Última atualização:** 2026-08-12

---

## 1. O que é

Aplicação local que lê os hand histories do PokerStars, lista as mãos de forma
navegável e permite revisar cada uma em dois modos:

- **Replay** — mesa de poker reconstruída, ação por ação, com controles de play/pause/passo/velocidade.
- **Resumido** — sequência compacta de cartas e ações destacadas, sem espera. Feito para varrer muitas mãos rápido.

O objetivo é **estudo das próprias mãos**, com os dados completos da mesa disponíveis
(cartas dos vilões no showdown, mucks revelados, stacks, posições).

---

## 2. Fonte de dados

```
C:\Users\igor_\AppData\Local\PokerStars\HandHistory\<conta>\*.txt
```

Uma pasta por conta. Hoje: 1 conta (`ocolombini2`), 1 arquivo, ~11 mãos.

**Escopo atual: apenas cash game.** Torneio tem header próprio (`Tournament #`, `Level`,
antes, eliminação) e **não** é suportado — nem por abstração especulativa. Quando/se entrar,
refatora-se com o caso real em mãos.

---

## 3. As armadilhas do formato

O front é a parte fácil. **O parser é onde este projeto quebra** — e quebra em silêncio,
mostrando dado errado com confiança. Tudo abaixo foi encontrado em um único arquivo de 11 mãos.

| # | Armadilha | Exemplo | Consequência |
|---|---|---|---|
| 1 | **Seats fora de ordem** | Seats 5,6,7 (`is sitting out`) listados antes de 1,2,3,4,8,9 | Ordem do arquivo ≠ ordem da mesa. A ordem de ação tem que ser derivada do botão, nunca da leitura sequencial |
| 2 | **Posts extras / blind morto** | `ms spartan: posts small blind 250` + `vinal33: posts big blind 500` + `o.colombini2: posts big blind 500` na mesma mão | Um terceiro post é entrada na mesa (post-in), não o BB. Matemática de pote ingênua quebra na primeira mão |
| 3 | **Post combinado** | `1948allen: posts small & big blinds 750` | Uma linha, dois valores, um só dos quais é "vivo" |
| 4 | **Semântica inconsistente de valor** | `raises 2500 to 3000` / `calls 2500` / `bets 3500` | Em `raises X to Y`: **X é o tamanho do raise acima da aposta corrente da mesa, não o desembolso do jogador** — Y é sempre o total real. Em `calls X`: X é sempre o incremento somado ao total anterior do próprio jogador (que pode já vir de um blind postado). `bets X`: X é o total, por ser sempre a primeira aposta da street. Resolvido com um mapa de total-por-jogador-por-street, não com regra fixa por verbo |
| 5 | **Ruído no meio das ações** | `is connected`, `joins the table at seat #7`, `leaves the table`, `has timed out` | Aparecem entre ações reais — e até **depois** do showdown. Viram ação fantasma se não forem tratados |
| 6 | **Split pot** | Dois `collected ... from pot` na mesma mão | Um modelo com "um vencedor" já nasce errado |
| 7 | **Mucks revelados no SUMMARY** | Ação diz `mucks hand`; summary diz `Seat 4: joes555 (button) mucked [8h 7h]` | Informação extra de graça — valiosa justamente para estudo |
| 8 | **Nome da pasta ≠ nome do jogador** | pasta `ocolombini2` / jogador `o.colombini2` | Sem normalizar (remover não-alfanuméricos, case-insensitive), não há como identificar o hero |
| 9 | **Street sem ação** | `*** TURN ***` seguido direto de `*** RIVER ***` quando todos estão all-in | O replay precisa de runout automático |
| 10 | **Nomes com espaço, ponto e número** | `ms spartan`, `BESIGNOU 03`, `LA-GreatOne`, `o.colombini2` | Regex de jogador **não pode** ser `\w+`. O separador confiável é o primeiro `: ` da linha |
| 11 | **Uncalled bet** | `Uncalled bet (3500) returned to o.colombini2` | Devolve fichas antes do showdown; afeta stack e pote |
| 12 | **Rake** | `Total pot 11210 \| Rake 617` | Pote total ≠ soma dos `collected` |

### Decisões de parser que decorrem disso

- **Whitelist, não blacklist.** Reconhecer verbos de ação conhecidos explicitamente.
  Linha não reconhecida → aviso em dev, nunca descarte silencioso. Blacklist de ruído
  falha no primeiro evento novo que a PokerStars inventar.
- **Não recalcular side pots.** É lógica genuinamente complexa e **o arquivo já informa
  quem coletou quanto**. As linhas `collected` são a fonte da verdade dos pagamentos.
- **Fatiar por header, não por linha em branco.** O separador confiável é `PokerStars Hand #`.
- **O parser não filtra nada.** Guarda os 9 jogadores, todas as ações, todos os stacks,
  todas as cartas reveladas. O viés hero-centric é decisão de **apresentação**, não de modelo.

---

## 4. Arquitetura

```
arquivos .txt  →  [parser puro]  →  Hand[]  →  [buildTimeline]  →  ReplayEvent[]
                                                                        ↓
                                                        [applyEvents] → TableState (puro)
                                                                        ↓
                                                                     UI burra
```

### 4.1 Decisão central: replay é `reduce` puro

O caminho intuitivo — encadear `setTimeout` para revelar flop, aposta, turn — funciona
até você querer **voltar um passo**. Depois disso vira máquina de estado imperativa impossível
de manter.

Em vez disso: a mão vira uma **lista plana de eventos** (~40–60 por mão). O estado da mesa no
frame `i` é `applyEvents(events.slice(0, i))` — função pura. O player é um `number` mais um timer.

O que isso entrega de graça:

- Scrub, voltar, velocidade 0.5x/2x, pular para o showdown → tudo é mexer no índice
- Testável sem renderizar nada
- **O modo Resumido não é uma segunda implementação** — é a mesma timeline filtrada
  (apenas eventos relevantes: entrada do hero, streets, apostas grandes, showdown).
  Duplicar essa lógica seria o primeiro over-engineering do projeto.

Refoldar do zero a cada frame custa nada nessa escala. **Sem memoização até haver medição.**

### 4.2 Fronteira de I/O

O parser nasce como:

```ts
parseHandHistory(text: string): Hand[]
```

**Puro. Sem `fs`, sem `path`, sem nada de Node dentro.** Todo I/O fica numa camada fina do
lado de fora: hoje `readLocalFolder()` lendo o AppData; amanhã um upload chamando exatamente
a mesma função.

Essa fronteira sozinha é a diferença entre "subir é um sábado" e "subir é reescrever o núcleo".
Custo de mantê-la agora: zero.

### 4.3 Dinheiro em inteiro

O arquivo atual é `(Play Money)` com valores inteiros (`500`, `2500`). Cash com dinheiro real
vem `$0.25`, `$1.50` — **com decimal**. Somar floats num pote produz `10.299999999999999`.

**Todo valor monetário é parseado como decimal e armazenado em centavos (inteiro).**
Formatação apenas na exibição. Custo hoje: zero. Sem isso, migrar para real money é
retrabalho no núcleo.

---

## 5. Modelo de dados

Implementado em [`lib/poker/types.ts`](../lib/poker/types.ts):

```ts
export type Suit = 'h' | 'd' | 'c' | 's'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  rank: Rank
  suit: Suit
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river'
export type PostType = 'sb' | 'bb' | 'sb+bb'
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise'

export interface Seat {
  seatNumber: number
  playerName: string
  chips: number
  isSittingOut: boolean
}

export interface Post {
  player: string
  type: PostType
  amount: number
}

export interface Action {
  street: Street
  player: string
  type: ActionType
  amount: number
  totalBet: number
  isAllIn: boolean
}

export interface UncalledBetReturn {
  player: string
  amount: number
}

export interface Reveal {
  player: string
  cards: Card[]
  description: string | null
  source: 'showdown' | 'summary-muck'
}

export interface Winner {
  player: string
  amount: number
}

export interface AmbientEvent {
  player: string | null
  section: Street | 'summary'
  text: string
}

export interface Hand {
  id: string
  dateIso: string
  tableName: string
  maxSeats: number
  smallBlind: number
  bigBlind: number
  buttonSeat: number
  seats: Seat[]
  posts: Post[]
  dealtHoleCards: { player: string; cards: Card[] } | null
  actions: Action[]
  board: Card[]
  uncalledBets: UncalledBetReturn[]
  reveals: Reveal[]
  winners: Winner[]
  ambientEvents: AmbientEvent[]
  totalPot: number
  rake: number
}
```

**Não existe campo `heroName`.** A descoberta da Fase 1: hand history pessoal do
PokerStars só revela cartas de largada (`Dealt to X [...]`) do dono do arquivo —
nunca de um vilão. Então `dealtHoleCards.player` **já é** o hero, sem precisar
normalizar o nome da pasta contra os jogadores da mesa. Quem decide tratar isso
como "o hero" é a camada de apresentação (Fase 3+), não o parser — mantém o
princípio de que o parser não filtra nada, só descreve o que o arquivo diz.

## 6. Telas

**Lista** — grid denso e escaneável. Por linha: cartas do hero (SVG mini), posição
(BTN/SB/BB/CO/…), resultado colorido (`+17.460` / `−2.500`), pote, street onde terminou,
se houve showdown. Filtros: ganhas/perdidas, só showdown, por posição, por par de cartas,
pote acima de X. Ordenação por maior pote e maior perda — é assim que se estuda mão.

**Replay** — mesa oval, 9 seats, **hero sempre rotacionado para a base**. Botão do dealer,
stacks, fichas indo ao pote, flip de cartas, badge de ação por jogador (`RAISE 3.000`),
highlight de quem age. Controles: play/pause, passo a passo, velocidade, scrub.
**Atalhos de teclado (setas + espaço) não são polimento** — sem eles, revisar 50 mãos é tortura.

**Resumido** — timeline filtrada na horizontal:
`AsQh` → `raise 3.000` → **flop** `Ad 4h Jh` → `bet 3.500` → `todos foldam` → `+6.379`.
Sem mesa, sem espera. Modo para passar por 30 mãos em 2 minutos.

---

## 7. Stack

### Entra

| O quê | Por quê |
|---|---|
| Next 16 + App Router, Server Component lendo o FS | roda local, zero fricção |
| Vitest, **só no parser** | única peça que quebra em silêncio |
| Cartas em SVG componentizado | nítidas em qualquer tamanho, tematizáveis, zero dependência |
| `useReducer` + context | um único player; não precisa de mais |

### Barrado por ora

| O quê | Por quê | Quando revisitar |
|---|---|---|
| Banco / SQLite / Prisma | 11 mãos. Ler a pasta, parsear, cachear em memória com invalidação por `mtime` | acima de ~50k mãos, ou quando o startup passar de ~2s |
| Zustand / Redux | um player não justifica store global | se surgir estado compartilhado entre telas |
| shadcn/ui | para "visual incrível" atrapalha: componente genérico puxa estética genérica | — |
| Motion (ex-Framer Motion) | v1 tenta CSS transitions + view transitions do Next 16 primeiro | quando bater em limite real de animação, não por antecipação |

---

## 8. Convenções

- **Código em inglês** (variáveis, funções, tipos, interfaces). Documentação e comentários em PT-BR.
- **TypeScript estrito.** Sem `any`. `unknown` quando o tipo é realmente incerto.
- **Comentário só onde a decisão não é óbvia.** Comentário que repete o código não existe.
- **Conventional commits**, atômicos: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- **Erros tipados.** Sem `catch` vazio; sem `catch (e: any)`.

### Next 16

O `AGENTS.md` deste projeto avisa que esta versão tem breaking changes em relação ao
conhecimento treinado dos modelos. **Consultar `node_modules/next/dist/docs/` antes de
escrever App Router** — não escrever de memória.

---

## 9. Documentos relacionados

- [`ROADMAP.md`](./ROADMAP.md) — fases, escopo e critérios de pronto
