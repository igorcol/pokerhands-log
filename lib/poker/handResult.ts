import { derivePositions } from "./positions";
import { applyEvents } from "./tableState";
import { buildTimeline } from "./timeline";
import type { Card, Hand, PositionName, Street } from "./types";

// Extrai o recorte hero-cêntrico de uma Hand: quanto o dono do arquivo ganhou ou perdeu,
// em que posição estava e como a mão terminou pra ele. É o que alimenta a lista de mãos.
// O net vem do reducer (stack final − inicial), não de soma manual de apostas — soma manual
// erraria com blind morto e uncalled bet, e esse número já foi validado na Fase 2 contra o
// stack inicial da mão seguinte.

export type HandOutcome =
  | { kind: "folded"; street: Street }
  | { kind: "won-without-showdown"; street: Street }
  | { kind: "showdown-won" }
  | { kind: "showdown-split" }
  | { kind: "showdown-lost" };

export interface HandResult {
  hero: string;
  holeCards: Card[];
  position: PositionName;
  net: number;
  collected: number;
  outcome: HandOutcome;
}

export interface HandWithResult {
  hand: Hand;
  result: HandResult;
}

export function withResults(hands: Hand[]): HandWithResult[] {
  return hands.flatMap((hand) => {
    const result = deriveHandResult(hand);
    return result ? [{ hand, result }] : [];
  });
}

function finalStreet(board: Card[]): Street {
  if (board.length >= 5) return "river";
  if (board.length === 4) return "turn";
  if (board.length === 3) return "flop";
  return "preflop";
}

// winners.length > 1 é tratado como pote dividido. Com side pot real (main + side,
// valores diferentes) isso classifica errado — não tem esse caso no fixture, então
// é o gatilho pra revisar em vez de adivinhar a regra agora.
function deriveOutcome(hand: Hand, hero: string): HandOutcome {
  const folded = hand.actions.find(
    (action) => action.player === hero && action.type === "fold",
  );
  if (folded) return { kind: "folded", street: folded.street };

  const showedDown = hand.reveals.some(
    (r) => r.player === hero && r.source === "showdown",
  );
  if (!showedDown)
    return { kind: "won-without-showdown", street: finalStreet(hand.board) };

  const heroWins = hand.winners.filter((w) => w.player === hero);
  if (heroWins.length === 0) return { kind: "showdown-lost" };

  // Split é dois jogadores rachando o MESMO pote. Com side pot, cada um leva um pote
  // diferente — dois vencedores na mão, mas nenhum deles dividiu nada.
  const sharedWithSomeone = heroWins.some((heroWin) =>
    hand.winners.some((w) => w.pot === heroWin.pot && w.player !== hero),
  );
  return sharedWithSomeone
    ? { kind: "showdown-split" }
    : { kind: "showdown-won" };
}

// null quando o hero não participou da mão — não acontece em hand history pessoal,
// mas o tipo não garante isso.
export function deriveHandResult(hand: Hand): HandResult | null {
  const dealt = hand.dealtHoleCards;
  if (!dealt) return null;

  const hero = dealt.player;
  const seat = hand.seats.find((s) => s.playerName === hero);
  if (!seat) {
    throw new Error(
      `Hero ${hero} was dealt cards but has no seat in hand ${hand.id}`,
    );
  }

  const position = derivePositions(hand).get(hero);
  if (!position) {
    throw new Error(
      `Hero ${hero} has no derivable position in hand ${hand.id}`,
    );
  }

  const finalState = applyEvents(hand, buildTimeline(hand));
  const finalStack = finalState.players.get(hero)?.stack ?? seat.chips;

  return {
    hero,
    holeCards: dealt.cards,
    position,
    net: finalStack - seat.chips,
    collected: hand.winners
      .filter((w) => w.player === hero)
      .reduce((sum, w) => sum + w.amount, 0),
    outcome: deriveOutcome(hand, hero),
  };
}
