import { streetSegments } from "./replayView";
import type { ReplayPhase } from "./replayView";
import { applyEvents } from "./tableState";
import type { ReplayEvent } from "./timeline";
import type { Card, Hand } from "./types";

// Agrupa a timeline por street pro log lateral. Cada entrada carrega o frame que ela
// representa, então clicar numa linha é só um setFrame. O pote de cada grupo é o pote
// ao FIM daquela street — é o número que dá escala pras apostas seguintes.

export interface LogEntry {
  frame: number;
  event: ReplayEvent;
}

export interface LogGroup {
  phase: ReplayPhase;
  cards: Card[];
  entries: LogEntry[];
  potAfter: number;
  startFrame: number;
}

export function buildEventLog(hand: Hand, timeline: ReplayEvent[]): LogGroup[] {
  return streetSegments(timeline).map((segment) => {
    const entries: LogEntry[] = [];
    let cards: Card[] = [];

    for (let index = segment.startFrame; index < segment.endFrame; index++) {
      const event = timeline[index];
      // O evento de street vira o cabeçalho do grupo, não uma linha dentro dele.
      if (event.kind === "street") {
        cards = event.cards;
        continue;
      }
      // deal-hole é sempre o hero recebendo as próprias cartas — ruído no log.
      if (event.kind === "deal-hole") continue;
      // frame é "quantos eventos aplicar", por isso index + 1.
      entries.push({ frame: index + 1, event });
    }

    // O reducer só varre as apostas pro pote quando a street seguinte começa, e esse
    // evento fica fora do slice. Somar os streetBet dá o pote real daquele instante.
    const state = applyEvents(hand, timeline.slice(0, segment.endFrame));
    const onTable = [...state.players.values()].reduce(
      (sum, player) => sum + player.streetBet,
      0,
    );

    return {
      phase: segment.phase,
      cards,
      entries,
      potAfter: state.pot + onTable,
      startFrame: segment.startFrame,
    };
  });
}
