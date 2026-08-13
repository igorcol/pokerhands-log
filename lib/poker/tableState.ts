import type { Card, Hand, Seat, Street, Winner } from "./types";
import type { ReplayEvent } from "./timeline";

// Reduce puro sobre a timeline: dado um Hand (stacks/seats iniciais) e uma lista de
// eventos (ou um prefixo dela), devolve o estado da mesa naquele frame exato.

// Cada chamada recalcula do zero — sem memoização, a mão inteira tem no máximo ~60 eventos.
// Fichas apostadas ficam em `streetBet` (na frente do jogador) até a street fechar,
// só aí viram `pot` — fiel ao que acontece visualmente numa mesa real.

export interface PlayerState {
  player: string;
  stack: number;
  streetBet: number;
  isFolded: boolean;
  isAllIn: boolean;
  holeCards: Card[] | null;
}

export interface TableState {
  street: Street;
  board: Card[];
  pot: number;
  players: Map<string, PlayerState>;
  winners: Winner[];
}

function initialPlayerState(seat: Seat): PlayerState {
  return {
    player: seat.playerName,
    stack: seat.chips,
    streetBet: 0,
    isFolded: seat.isSittingOut,
    isAllIn: false,
    holeCards: null,
  };
}

export function initialTableState(hand: Hand): TableState {
  const players = new Map<string, PlayerState>();
  for (const seat of hand.seats) {
    players.set(seat.playerName, initialPlayerState(seat));
  }
  return { street: "preflop", board: [], pot: 0, players, winners: [] };
}

function sweepStreetBetsIntoPot(state: TableState): void {
  for (const player of state.players.values()) {
    state.pot += player.streetBet;
    player.streetBet = 0;
  }
}

function applyEvent(state: TableState, event: ReplayEvent): void {
  switch (event.kind) {
    case "post": {
      const player = state.players.get(event.player);
      if (!player) return;
      player.stack -= event.amount;
      player.streetBet += event.amount;
      return;
    }
    case "deal-hole": {
      const player = state.players.get(event.player);
      if (!player) return;
      player.holeCards = event.cards;
      return;
    }
    case "action": {
      const player = state.players.get(event.player);
      if (!player) return;
      if (event.type === "fold") {
        player.isFolded = true;
        return;
      }
      if (event.type === "check") return;
      player.stack -= event.amount;
      player.streetBet = event.totalBet;
      player.isAllIn = player.isAllIn || event.isAllIn;
      return;
    }
    case "street": {
      sweepStreetBetsIntoPot(state);
      state.street = event.street;
      state.board = [...state.board, ...event.cards];
      return;
    }
    case "uncalled-return": {
      const player = state.players.get(event.player);
      if (!player) return;
      player.stack += event.amount;
      player.streetBet -= event.amount;
      return;
    }
    case "reveal": {
      const player = state.players.get(event.player);
      if (!player) return;
      player.holeCards = event.cards;
      return;
    }
    case "collect": {
      // Depois da última street não sobra evento 'street' pra varrer o que ficou
      // na mesa — varre aqui. Idempotente: se rodar de novo (split pot), já está zerado.
      sweepStreetBetsIntoPot(state);
      const player = state.players.get(event.player);
      if (player) player.stack += event.amount;
      state.winners = [
        ...state.winners,
        { player: event.player, amount: event.amount, pot: event.pot },
      ];
      return;
    }
    case "ambient":
      return;
  }
}

export function applyEvents(hand: Hand, events: ReplayEvent[]): TableState {
  const state = initialTableState(hand);
  for (const event of events) {
    applyEvent(state, event);
  }
  return state;
}
