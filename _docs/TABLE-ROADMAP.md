# PokerHands — Roadmap da mesa e replay (Fase 4)

> **Status:** mockup visual aprovado. Nada implementado.
> **Última atualização:** 2026-08-12
> Contexto geral em [`OVERVIEW.md`](./OVERVIEW.md) · fases anteriores em [`ROADMAP.md`](./ROADMAP.md)

---

## Decisões tomadas

Fechadas antes de escrever código, com o mockup na mão:

| # | Decisão | Escolha |
|---|---|---|
| 1 | Log lateral de sequência | **Entra**, colapsável |
| 2 | Resultado da mão | **Visível desde o início** — você já viveu a mão, esconder é gamificação falsa |
| 3 | Fichas | **Coloridas** por faixa de valor, com o número em mono ao lado |
| 4 | Cor da mesa | **Paleta atual (carvão)**, sem verde-feltro |

---

## Arquitetura

O replay precisa de timer, estado e teclado → **Client Component**.

`Hand` é inteiramente plano (arrays de objetos, sem `Map`, sem `Date`, sem função), então
serializa direto pela fronteira servidor/cliente. O servidor busca a mão; o cliente roda
`buildTimeline` e `applyEvents` localmente a cada frame.

**Isso é o oposto da lista, de propósito.** Lá eu montei um view model enxuto porque a lista
usa uma fatia pequena do dado. Aqui o replay usa **tudo** que a `Hand` tem, e reprocessar no
cliente é justamente o que torna o scrub instantâneo — sem round-trip por frame. Uma mão tem
~60 eventos; refoldar do zero custa nada.

**Rota:** `/mao/[id]`. O id é o número da mão do PokerStars, único globalmente — não precisa
carregar conta no path.

---

## Geometria da mesa

O único problema genuinamente difícil desta fase.

**Sempre 9 assentos, mesmo com 6 jogadores.** Vazios ficam apagados (~22% de opacidade).
Duas razões: é fiel à mesa 9-max real, e — a que mais importa pro uso — **mantém a posição
espacial de cada vilão constante entre mãos**. Se `vinal33` está sempre no mesmo canto, o
reconhecimento de padrão acontece sem ler nome. Recalcular layout por número de jogadores
destruiria isso.

**Hero sempre na base.** Os assentos rotacionam para que o dele caia em 6h.

**Ordem no sentido horário a partir da base.** O próximo a agir depois do hero aparece à
esquerda-baixo, sobe pela esquerda, cruza o topo, desce pela direita. Não é arbitrário: numa
mesa vista de cima, com você na base olhando pro centro, sua mão esquerda aponta pra esquerda
da tela — e "o jogador à sua esquerda" é quem age depois de você. Mesma convenção do cliente
do PokerStars, então não briga com o olho já treinado.

**As 9 âncoras não são equidistantes.** Topo e base têm mais largura útil e recebem dois
assentos lado a lado; as laterais recebem um só. Distribuição uniforme por ângulo colaria os
laterais e espalharia os de topo.

```
            [5]     [6]
      [4]                 [7]
   [3]                       [8]
      [2]                 [9]
            [ HERO ]
```

---

## Anatomia do assento

**Três camadas sobrepostas**, cada uma invadindo a anterior com margem negativa — é a
sobreposição que faz a mesa ler como fluida em vez de formulário:

1. **Cartas** atrás, rotacionadas, saindo por trás do avatar
2. **Avatar circular** no meio, com anel da cor do fundo (recorte, não contorno)
3. **Placa de info** embaixo (nome + stack), superfície semi-transparente com sombra

**Quase nenhum `border`.** Superfícies são preenchimento + sombra projetada; pills usam
`background`. Contorno desenhado é o que dava o aspecto formal na primeira tentativa.

### Estados

| Estado | Tratamento |
|---|---|
| Agindo agora | **Glow** carmim ao redor do avatar (não borda) |
| Ativo | Normal |
| Foldou | ~30% de opacidade, cartas somem |
| All-in | Pill `ALL IN` carmim sólido com glow, fixa (não some como badge de ação) |
| Sitting out | ~22% de opacidade, sem cartas |
| Vencedor | Glow mint no avatar + pote viajando até ele |

### Identidade visual do jogador

Cada jogador tem **cor própria**, derivada deterministicamente do nome: gradiente
dessaturado + inicial. Hero sempre carmim.

Isso resolve um problema real de estudo: identificar quem é sem ler o nome. E a mesma cor
reaparece no log lateral — `vinal33` é sempre azul, `KURFTERRIER` sempre âmbar.

---

## Fichas

**Cor por faixa de valor**, não por denominação exata. Quebrar valor em denominações reais
é lógica complexa que ninguém vai conferir; a faixa entrega a leitura rápida que importa.

**Altura da pilha** (1–4 fichas com offset vertical) por magnitude relativa ao pote.

**Valor exato sempre em mono ao lado.** A ficha dá a leitura instantânea de "aposta pequena
vs monstro"; o número nunca mente.

O pote fica no centro com a própria pilha. Quando a street fecha, as fichas de cada jogador
viajam até ele.

---

## Animações

**A regra que evita um inferno de manutenção: anima apenas quando o frame avança exatamente
1, para a frente.** Scrub, salto, voltar ou pular pro showdown → estado aplicado direto, sem
transição.

Com reducer puro, pular do frame 5 pro 40 significa 35 mudanças simultâneas — animar isso
produz caos visual e bugs de estado intermediário. A regra transforma um problema difícil
num `if`.

Implementação: uma classe no container desliga as transitions quando o salto não é unitário.
As transitions em si são CSS puro, **sem lib de animação**.

| Evento | Animação |
|---|---|
| Aposta | Fichas surgem na frente do jogador, escala 0.8→1 |
| Fecha street | Fichas viajam até o pote (translate + fade) |
| Carta comunitária | Flip 3D, escalonado ~80ms entre cartas do flop |
| Reveal no showdown | Flip da carta do vilão |
| Badge de ação | Fade in, sustenta, fade out |
| Coleta do pote | Fichas viajam do centro até o vencedor |
| Uncalled bet | Fichas voltam do centro pro jogador |
| Stack mudando | **Sem contador animado** — troca direta (número correndo atrapalha leitura) |

**Velocidade não é constante entre frames.** Fold merece menos tempo que a virada do river.
Pesos por tipo de evento (`ambient` quase instantâneo, `street` com pausa maior),
multiplicados pelo controle global de velocidade.

---

## Controles

**Barra inferior:** ⏮ início · ◀ passo · ▶/⏸ · passo ▶ · ⏭ fim · posição (`18 / 26 · flop`) ·
velocidade (0.5×/1×/2×).

**O scrub é segmentado por street**, não um `<input range>` genérico: preflop, flop, turn,
river, showdown como blocos proporcionais ao número de eventos de cada um. Assim você vê
*onde* está na mão, não só "40% do caminho". Clicar num segmento pula pro início da street.

### Atalhos

Não são polimento — sem eles, revisar 50 mãos é tortura.

| Tecla | Ação |
|---|---|
| `Espaço` | play/pause |
| `←` `→` | passo |
| `Home` `End` | início / fim |
| `1`–`4` | pular pra preflop/flop/turn/river |
| `J` `K` | mão anterior / próxima |
| `Esc` | voltar pra lista |

---

## Log lateral

Coluna à direita, colapsável. A mesa mostra o **agora**; o log mostra a **sequência** — e
estudar mão é justamente entender a sequência.

Sai praticamente de graça: a timeline já existe desde a Fase 2.

**Quatro camadas de leitura por evento:**

1. **Avatar colorido** — mesma cor do assento, reconhecimento instantâneo
2. **Pill de ação** com cor por tipo: fold apagado, check neutro, call sólido, bet/raise
   carmim, all-in carmim cheio
3. **Valor** em mono tabular, coluna alinhada à direita
4. **Estado**: futuro a ~32% de opacidade, atual com fundo destacado

**Marcos de street mostram as cartas do board renderizadas ali mesmo** — você vê o flop
chegando na timeline, não só a palavra "FLOP". Turn/River/Showdown aparecem apagados como
marcos futuros, dando noção de quanto falta.

Clicar num evento pula pra ele. É onde os `ambientEvents` (`fulano estourou o tempo`) fazem
sentido, sem poluir a mesa.

---

## Contexto e navegação

**Topo:** cartas do hero, posição, hora, pote final, resultado. Setas de mão anterior/próxima
— sair pra lista e voltar a cada mão quebraria o fluxo de revisão.

Sem sidebar principal nesta tela: `‹ Mãos` no canto volta pra lista. Maximiza espaço da mesa.

---

## O que não existe nos dados ainda

Quatro peças de lógica pura que a Fase 2 não produziu. Todas testáveis, todas nascem antes de
qualquer pixel — mesmo padrão das fases anteriores.

| Peça | O que faz |
|---|---|
| `activePlayer(timeline, frame)` | Quem age agora. Deriva do **próximo** evento `action` a partir do frame — `TableState` não tem esse campo |
| `seatLayout(hand)` | Mapeia número do assento → índice visual (0–8), rotacionado pro hero ficar na base |
| `streetSegments(timeline)` | Quantos eventos por street, pro scrub segmentado |
| `chipTier(value)` | Faixa de cor e altura de pilha para um valor |
| `playerIdentity(name)` | Cor + inicial determinísticas a partir do nome |

---

## Estrutura de arquivos prevista

```
app/mao/[id]/page.tsx              Server Component — busca a Hand
components/replay/ReplayStage.tsx  Client — orquestra frame, timer, teclado
components/replay/Table.tsx        Feltro + posicionamento dos assentos
components/replay/Seat.tsx         As três camadas do assento
components/replay/Avatar.tsx       Círculo com gradiente + inicial
components/replay/ChipStack.tsx    Pilha de fichas
components/replay/Pot.tsx          Pote central
components/replay/CommunityBoard.tsx
components/replay/Controls.tsx     Botões + velocidade
components/replay/StreetTrack.tsx  Scrub segmentado
components/replay/EventLog.tsx     Log lateral
lib/poker/replayView.ts            activePlayer, seatLayout, streetSegments
lib/poker/playerIdentity.ts        Cor + inicial por nome
lib/poker/chips.ts                 chipTier
```

---

## Sub-fases

| | Escopo | Pronto quando |
|---|---|---|
| **4a** | Lógica pura: `activePlayer`, `seatLayout`, `streetSegments`, `chipTier`, `playerIdentity` | Testes Vitest passando nas 11 mãos do fixture |
| **4b** | Mesa estática renderizando **um** frame fixo | O frame 18 da mão `261727989562` bate com o mockup |
| **4c** | Controle de frames + teclado, **sem animação** | Replay completo das 11 mãos, ida e volta, sem estado travado |
| **4d** | Animações | Play em 1× lê natural; scrub não anima |
| **4e** | Log lateral + navegação entre mãos | Revisar 10 mãos só pelo teclado, sem tocar no mouse |

### Critérios de aceite da fase

- [ ] Replay completo das 11 mãos, sem estado travado
- [ ] Voltar passo a passo funciona de qualquer ponto, inclusive do fim
- [ ] Split pot (`261727989562`) exibe os dois vencedores
- [ ] Mão com runout automático (`261728001848`) roda turn e river sem ação
- [ ] Uncalled bet devolve fichas visualmente antes do runout continuar
- [ ] Mucks revelados no summary aparecem marcados como muck, não como show
- [ ] Revisar 10 mãos só pelo teclado
- [ ] Animação com CSS transitions — sem lib

---

## Fora de escopo

Registrado para não virar escopo por osmose: som, avatar de imagem, 3D/perspectiva, mesa
arrastável ou redimensionável, tema alternativo de mesa, export de vídeo/GIF, indicador de
equity, análise de acerto da jogada.