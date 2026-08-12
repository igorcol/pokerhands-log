import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseHandHistory } from "../lib/poker/parseHandHistory"; 
import { derivePositions } from "../lib/poker/positions";
import { applyEvents } from "../lib/poker/tableState";
import { buildTimeline } from "../lib/poker/timeline";
import type { ReplayEvent } from "../lib/poker/timeline";

// Script de diagnóstico: lê a pasta real do PokerStars, roda parser + timeline +
// reducer e imprime um resumo no terminal. Não faz parte do app — é só pra
// inspecionar visualmente se as Fases 1 e 2 produzem dado correto antes da UI.
// * npx tsx lib/preview-hands.ts

const ACCOUNT = "ocolombini2";
const HAND_HISTORY_DIR = `C:\\Users\\igor_\\AppData\\Local\\PokerStars\\HandHistory\\${ACCOUNT}`;

const files = readdirSync(HAND_HISTORY_DIR).filter((name) =>
  name.endsWith(".txt"),
);
const hands = files.flatMap((file) => {
  const text = readFileSync(join(HAND_HISTORY_DIR, file), "utf-8");
  return parseHandHistory(text);
});

const money = (cents: number) => (cents / 100).toFixed(2);
const cardsToStr = (cards: { rank: string; suit: string }[]) =>
  cards.map((c) => c.rank + c.suit).join("");

console.log(
  `\n${hands.length} mãos parseadas de ${files.length} arquivo(s) - User ${ACCOUNT}\n`,
);

for (const hand of hands) {
  const hero = hand.dealtHoleCards;
  if (!hero) {
    console.log(`#${hand.id}  hero não recebeu cartas nessa mão`);
    continue;
  }
  const position = derivePositions(hand).get(hero.player) ?? "?";
  const heroWinner = hand.winners.find((w) => w.player === hero.player);
  const result = heroWinner ? `+${money(heroWinner.amount)}` : "-";

  console.log(
    `#${hand.id}  ${position.padEnd(3)}  ${cardsToStr(hero.cards).padEnd(4)}  pot ${money(hand.totalPot).padStart(9)}  ${result}`,
  );
}


// * ---- Replay textual de uma mão específica, pra provar timeline + reducer também ----
const sample = hands.find((h) => h.id === '261727989562') ?? hands[0]
console.log(`\n--- Replay textual da mão #${sample.id} ---\n`)

const timeline = buildTimeline(sample)
for (let i = 1; i <= timeline.length; i++) {
  const state = applyEvents(sample, timeline.slice(0, i))
  console.log(`[${String(i).padStart(2)}] ${describeEvent(timeline[i - 1])}  (pot ${money(state.pot)})`)
}

function describeEvent(event: ReplayEvent): string {
  switch (event.kind) {

    case 'post':
      return `${event.player} posts ${event.postType} ${money(event.amount)}`

    case 'deal-hole':
      return `${event.player} dealt ${cardsToStr(event.cards)}`

    case 'action':
      return `${event.player} ${event.type} ${money(event.amount)}${event.isAllIn ? ' (all-in)' : ''}`

    case 'street':
      return `*** ${event.street.toUpperCase()} *** ${cardsToStr(event.cards)}`

    case 'uncalled-return':
      return `${event.player} gets back ${money(event.amount)}`

    case 'reveal':
      return `${event.player} ${event.source === 'showdown' ? 'shows' : 'mucked'} ${cardsToStr(event.cards)}${event.description ? ` (${event.description})` : ''}`
    
    case 'collect':
      return `${event.player} collects ${money(event.amount)}`

    case 'ambient':
      return `[${event.text}]`
  }
}