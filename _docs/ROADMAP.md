# PokerHands — Roadmap

> **Status:** Fases 1 e 2 concluídas (58/58 testes). Fase 3 não iniciada.
> **Última atualização:** 2026-08-12
> Contexto e decisões de arquitetura em [`OVERVIEW.md`](./OVERVIEW.md).

---

## Protocolo

**Uma fase por vez.** Cada fase é entregue, testada e aprovada antes da próxima começar.
Nada de duas fases em paralelo.

As Fases 1 e 2 não têm **nenhuma** linha de UI. Isso é proposital: se o parser estiver
errado, toda a camada visual em cima dele exibe dado errado com confiança — e o erro
só aparece meses depois, num replay que parece plausível.

---

## Fase 0 — Scaffold ✅

`create-next-app` com Next 16.3.0, React 19.2.8, Tailwind 4, TypeScript, App Router.
Um commit (`d1aafb0`). Node 24.

---

## Fase 1 — Parser + testes ✅

**Objetivo:** transformar texto bruto em dado confiável.

**Entrega**
- Modelo de dados (`Hand`, `Seat`, `Post`, `Action`, `Card`, `Street`, `PostType`, `Reveal`, `Winner`, `AmbientEvent`)
- `parseHandHistory(text: string): Hand[]` — puro, sem `fs`, sem `path`
- Valores monetários em centavos (inteiro)
- Suite Vitest usando o arquivo real como fixture (38 testes)
- Whitelist de verbos: linha não reconhecida gera aviso em dev, nunca descarte silencioso

**Mãos-critério do fixture** (`HH20260812 Octavia II - 250-500`, 11 mãos):

| Mão | O que ela prova |
|---|---|
| `261727959310` | seats fora de ordem · post extra de BB · muck revelado no SUMMARY |
| `261727965280` | segundo post de BB (post-in) · uncalled bet returned · `doesn't show hand` |
| `261727970032` | raise all-in pré-flop · rake 0 |
| `261727989562` | **split pot** (dois `collected`) · call all-in · turn e river sem ação |
| `261728001848` | `posts small & big blinds 750` · dois all-ins na mesma street |
| `261728006087` | `has timed out` · `leaves the table` no meio das ações |
| `261728017570` | `joins the table` e `leaves the table` entre ações — e um `joins` **depois** do showdown |
| `261728025415` | vitória sem showdown · board de 4 cartas (mão parou no turn) |

**Pronto quando**
- [x] 11/11 mãos parseadas sem erro
- [x] Para toda mão: `soma dos collected + rake == Total pot` da linha de SUMMARY
- [x] Hero identificado em todas via `dealtHoleCards.player` — não precisa da pasta
- [x] `261727989562` retorna **dois** vencedores
- [x] Todas as linhas de ruído classificadas como `ambient` — nenhuma vira ação
- [x] Zero linhas desconhecidas no log (`scanActionStream coverage` cobre as 11 mãos)

**Não entra:** UI, leitura de diretório, torneio, side pot calculado (usa-se os `collected`).

## Fase 2 — Timeline + reducer ✅

**Objetivo:** o motor do replay, ainda sem pixel algum.

**Entrega**
- `buildTimeline(hand: Hand): ReplayEvent[]` — timeline plana de 8 tipos de evento
- `applyEvents(hand, events): TableState` — pura, 56 testes no total
- Derivação de posições (BTN, SB, BB, UTG, MP, CO) a partir do botão e dos jogadores ativos
- Runout automático em streets sem ação (board revela normalmente mesmo sem `action` naquela street)

**Pronto quando**
- [x] Aplicar a timeline **completa** reproduz o stack inicial da *próxima* mão pra
      todo jogador presente nas duas (o SUMMARY não lista stacks — essa é a validação real)
- [x] `applyEvents(events.slice(0, i))` é determinístico para todo `i`
- [x] Posições conferem contra `Seat N: nome (button/small blind/big blind)` do SUMMARY, nas 11 mãos
- [x] Testado sem renderizar nada

**Não entra:** React, animação, componentes.

## Fase 3 — Lista

**Objetivo:** navegar as mãos.

**Entrega**
- `readLocalFolder()` — camada de I/O fina, separada do parser
- Cache em memória com invalidação por `mtime`
- Grid denso: cartas do hero, posição, resultado colorido, pote, street final, showdown
- Filtros: ganhas/perdidas, só showdown, posição, par de cartas, pote acima de X
- Ordenação por maior pote e maior perda

**Pronto quando**
- [ ] As 11 mãos aparecem com resultado correto
- [ ] Salvar um arquivo novo na pasta reflete sem reiniciar o servidor
- [ ] Filtros combinam entre si

**Não entra:** upload, autenticação, banco, multiusuário.

---

## Fase 4 — Mesa + replay

**Objetivo:** a parte visual pesada.

**Entrega**
- Mesa oval, 9 seats, **hero rotacionado para a base**
- Cartas em SVG componentizado
- Botão do dealer, stacks, fichas indo ao pote, flip de cartas
- Badge de ação por jogador · highlight de quem age
- Controles: play/pause, passo a passo, velocidade, scrub
- **Atalhos de teclado (setas + espaço)**

**Pronto quando**
- [ ] Replay completo das 11 mãos, sem estado travado
- [ ] Voltar passo a passo funciona de qualquer ponto, inclusive do fim
- [ ] Split pot (`261727989562`) exibe os dois vencedores
- [ ] Revisar 10 mãos só pelo teclado, sem tocar no mouse
- [ ] Animação com CSS transitions / view transitions — **sem lib de animação**

**Não entra:** som, temas, export de vídeo.

---

## Fase 5 — Modo resumido

**Objetivo:** varrer muitas mãos rápido.

**Entrega**
- Filtro de relevância sobre a timeline **já existente** — sem reimplementar lógica
- Layout horizontal: cartas → ação → street → runout → resultado
- Alternância replay ⇄ resumido preservando a mão aberta

**Pronto quando**
- [ ] Nenhuma regra de poker duplicada entre os dois modos
- [ ] Passar por 30 mãos em ~2 minutos é confortável

---

## Fase 6 — Stats e polimento

**Objetivo:** transformar histórico em leitura.

**Entrega**
- VPIP, PFR, agressão — hero e vilões
- Gráfico de banca ao longo do tempo
- Stats de vilão por jogador (o modelo já guarda a mesa toda desde a Fase 1)
- Seletor de conta (a estrutura de pastas já é multi-conta)

**Não entra:** notas por jogador, HUD ao vivo, importação de outros sites.

---

## Débito técnico consciente

Registrado de propósito, com gatilho de revisão. Nada aqui é esquecimento.

| Débito | Gatilho para revisitar |
|---|---|
| Sem banco — parse completo + cache em memória por `mtime` | acima de ~50k mãos, ou startup passando de ~2s |
| Sem memoização no reducer (refold do zero a cada frame) | quando houver medição mostrando travamento, não antes |
| Side pots vêm dos `collected`, não são calculados | só se aparecer hand history com `collected` ausente ou inconsistente |
| Sem suporte a torneio | quando o primeiro arquivo de torneio existir — refatorar com o caso real |
| Sem suporte a dinheiro real | o parser já guarda centavos; falta validar decimal (`$0.25`) e formatação |
| I/O só local | quando "subir" sair do papel: o parser é puro, só a camada de leitura muda |

---

## Fora de escopo (por decisão, não por esquecimento)

- Torneios, Sit & Go, Zoom
- HUD em tempo real durante o jogo
- Importação de PartyPoker, GGPoker, 888
- Solver, análise de equity, ranges
- Compartilhamento público de mãos
