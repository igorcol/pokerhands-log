import type { ReplayEvent } from "./timeline";
import type { ActionType, Hand, Seat, Street } from "./types";

// Derivações que a mesa precisa e que TableState não fornece: onde cada assento aparece
// na tela, quem está prestes a agir, e como a timeline se divide em streets pro scrub.
// * Tudo puro e testável -- a mesa só posiciona o que sai daqui.

export interface SeatSlot {
  seatNumber: number;
  visualIndex: number;
  player: Seat | null;
  isHero: boolean;
}

const PHASE_LABEL: Record<ReplayPhase, string> = {
  preflop: "pré-flop",
  flop: "flop",
  turn: "turn",
  river: "river",
  showdown: "showdown",
};

// visualIndex 0 é a base da tela (hero), seguindo no sentido horário. Sempre devolve
// maxSeats slots, inclusive os vazios: manter a posição de cada vilão constante entre
// mãos é o que permite reconhecer padrão sem ler nome.
export function seatLayout(hand: Hand): SeatSlot[] {
  const hero = hand.dealtHoleCards?.player ?? null;
  const heroSeat = hero
    ? hand.seats.find((s) => s.playerName === hero)
    : undefined;

  if (hero && !heroSeat) {
    throw new Error(
      `Hero ${hero} was dealt cards but has no seat in hand ${hand.id}`,
    );
  }

  // Sem hero (não acontece em hand history pessoal) o assento 1 vira a base.
  const baseSeat = heroSeat?.seatNumber ?? 1;

  return Array.from({ length: hand.maxSeats }, (_, offset) => {
    const seatNumber = ((baseSeat - 1 + offset) % hand.maxSeats) + 1;
    const player = hand.seats.find((s) => s.seatNumber === seatNumber) ?? null;
    return {
      seatNumber,
      visualIndex: offset,
      player,
      isHero: player?.playerName === hero,
    };
  });
}

// Quem está prestes a agir no frame atual. Para numa virada de street: entre o fim de uma
// street e a próxima carta ninguém está "agindo", e destacar alguém ali seria mentira.
export function activePlayer(
  timeline: ReplayEvent[],
  frame: number,
): string | null {
  for (let index = frame; index < timeline.length; index++) {
    const event = timeline[index];
    if (event.kind === "street") return null;
    if (event.kind === "action") return event.player;
  }
  return null;
}

export type ReplayPhase = Street | "showdown";

export interface StreetSegment {
  phase: ReplayPhase;
  startFrame: number;
  endFrame: number;
  eventCount: number;
}

// Fase de cada evento. reveal/collect marcam o fim da mão independentemente de ter havido
// showdown de verdade — quem decide o rótulo exibido é a UI.
function phaseOfEachEvent(timeline: ReplayEvent[]): ReplayPhase[] {
  let current: ReplayPhase = "preflop";
  return timeline.map((event) => {
    if (event.kind === "street") current = event.street;
    if (event.kind === "reveal" || event.kind === "collect")
      current = "showdown";
    return current;
  });
}

export function streetSegments(timeline: ReplayEvent[]): StreetSegment[] {
  const segments: StreetSegment[] = [];

  phaseOfEachEvent(timeline).forEach((phase, index) => {
    const last = segments[segments.length - 1];
    if (last && last.phase === phase) {
      last.endFrame = index + 1;
      last.eventCount += 1;
      return;
    }
    segments.push({
      phase,
      startFrame: index,
      endFrame: index + 1,
      eventCount: 1,
    });
  });

  return segments;
}

export interface LastAction {
  player: string;
  type: ActionType;
  amount: number;
  isAllIn: boolean;
}

// Ultima ação de cada jogador dentro da street. < Vira badge na placa do assento > - Reseta a cada evento de street
export function lastActionsThisStreet(
  timeline: ReplayEvent[],
  frame: number,
): Map<string, LastAction> {
  const actions = new Map<string, LastAction>();

  for (let index = 0; index < frame; index++) {
    const event = timeline[index];
    if (event.kind === "street") {
      actions.clear();
      continue;
    }
    if (event.kind === "action") {
      actions.set(event.player, {
        player: event.player,
        type: event.type,
        amount: event.amount,
        isAllIn: event.isAllIn,
      });
    }
  }

  return actions;
}

export function formatPhase(phase: ReplayPhase): string {
  return PHASE_LABEL[phase];
}

// Em qual fase um frame específico cai. Frame vai de 0 a timeline.length 
// (é "quantos eventos já foram aplicados", não um índice de evento). 
// Daí o fallback pro último segmento quando frame === timeline.length, fora do range de qualquer endFrame.
export function phaseAtFrame(
  segments: StreetSegment[],
  frame: number,
): ReplayPhase {
  const found = segments.find(
    (s) => frame >= s.startFrame && frame < s.endFrame,
  );
  return found?.phase ?? segments[segments.length - 1]?.phase ?? "preflop";
}
