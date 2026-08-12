import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  parseActions,
  parseAmbientEvents,
  parseBoard,
  parseCard,
  parseDealtHoleCards,
  parseHeader,
  parseMoney,
  parsePosts,
  parseSeats,
  parseTableInfo,
  parseUncalledBets,
  splitHandBlocks,
} from "./parseHandHistory";

const fixture = readFileSync(
  join(__dirname, "__fixtures__/hh-octavia-ii-2026-08-12.txt"),
  "utf-8",
);
const hands = splitHandBlocks(fixture);

describe("parseMoney", () => {
  it("parses integers, scaling to cents", () => {
    expect(parseMoney("500")).toBe(50000);
    expect(parseMoney("0")).toBe(0);
  });

  it("parses decimals for real-money formats", () => {
    expect(parseMoney("0.25")).toBe(25);
    expect(parseMoney("1.5")).toBe(150);
  });

  it("strips $ sign and thousand separators", () => {
    expect(parseMoney("$1,234.56")).toBe(123456);
  });
});

describe("parseCard", () => {
  it("parses rank and suit", () => {
    expect(parseCard("8d")).toEqual({ rank: "8", suit: "d" });
    expect(parseCard("Th")).toEqual({ rank: "T", suit: "h" });
    expect(parseCard("Ac")).toEqual({ rank: "A", suit: "c" });
  });

  it("throws on malformed card", () => {
    expect(() => parseCard("Xz")).toThrow();
  });
});

describe("splitHandBlocks", () => {
  it("splits the fixture into 11 hands", () => {
    expect(hands).toHaveLength(11);
  });

  it("keeps the header as the first line of each block", () => {
    for (const hand of hands) {
      expect(hand.split("\n")[0]).toMatch(/^PokerStars Hand #\d+:/);
    }
  });
});

describe("parseHeader", () => {
  it("parses id, timestamp and blinds from hand 1", () => {
    expect(parseHeader(hands[0])).toEqual({
      id: "261727959310",
      dateIso: "2026-08-12T16:20:22.000Z",
      smallBlind: 25000,
      bigBlind: 50000,
    });
  });

  it("throws on an unrecognized header", () => {
    expect(() => parseHeader("not a real hand history")).toThrow();
  });
});

describe("parseTableInfo", () => {
  it("parses table name, max seats and button from hand 1", () => {
    expect(parseTableInfo(hands[0])).toEqual({
      tableName: "Octavia II",
      maxSeats: 9,
      buttonSeat: 4,
    });
  });
});

describe("parseSeats", () => {
  it("preserves file order instead of sorting by seat number (armadilha #1)", () => {
    const seats = parseSeats(hands[0]);
    expect(seats.map((s) => s.seatNumber)).toEqual([5, 6, 7, 1, 2, 3, 4, 8, 9]);
  });

  it("flags sitting-out seats correctly", () => {
    const seats = parseSeats(hands[0]);
    const sittingOut = seats
      .filter((s) => s.isSittingOut)
      .map((s) => s.playerName);
    expect(sittingOut).toEqual(["1948allen", "achladokampo", "KURFTERRIER"]);
  });

  it("handles a busted player with 0 chips (hand 9)", () => {
    const seats = parseSeats(hands[8]);
    expect(seats.find((s) => s.playerName === "KURFTERRIER")).toEqual({
      seatNumber: 7,
      playerName: "KURFTERRIER",
      chips: 0,
      isSittingOut: true,
    });
  });
});

describe("parsePosts", () => {
  it("captures all 3 posts in hand 1, including the extra big blind (armadilha #2)", () => {
    expect(parsePosts(hands[0])).toEqual([
      { player: "ms spartan", type: "sb", amount: 25000 },
      { player: "vinal33", type: "bb", amount: 50000 },
      { player: "o.colombini2", type: "bb", amount: 50000 },
    ]);
  });

  it("parses a combined small & big blind post as sb+bb (armadilha #3, hand 8)", () => {
    expect(parsePosts(hands[7])).toEqual([
      { player: "ms spartan", type: "sb", amount: 25000 },
      { player: "vinal33", type: "bb", amount: 50000 },
      { player: "1948allen", type: "sb+bb", amount: 75000 },
    ]);
  });
});

describe("parseDealtHoleCards", () => {
  it("identifies the hero from the Dealt to line", () => {
    expect(parseDealtHoleCards(hands[0])).toEqual({
      player: "o.colombini2",
      cards: [
        { rank: "8", suit: "d" },
        { rank: "2", suit: "h" },
      ],
    });
  });
});

describe("parseBoard", () => {
  it("returns the full 5-card board when the hand reaches showdown (hand 1)", () => {
    expect(parseBoard(hands[0])).toEqual([
      { rank: "7", suit: "s" },
      { rank: "2", suit: "c" },
      { rank: "K", suit: "s" },
      { rank: "6", suit: "d" },
      { rank: "9", suit: "d" },
    ]);
  });

  it("returns an empty board when the hand ends preflop (hand 3)", () => {
    expect(parseBoard(hands[2])).toEqual([]);
  });

  it("returns 4 cards when the hand ends on the turn (hand 11)", () => {
    expect(parseBoard(hands[10])).toEqual([
      { rank: "3", suit: "h" },
      { rank: "6", suit: "h" },
      { rank: "7", suit: "s" },
      { rank: "4", suit: "s" },
    ]);
  });
});

describe("parseActions", () => {
  it('resolves "raises X to Y" from the running total, not from X (hand 3)', () => {
    // ms spartan raises com 0 investido na street: amount == Y, coincidência.
    // o.colombini2 já tinha fold preservando o totalBet do raise anterior dele.
    expect(parseActions(hands[2])).toEqual([
      {
        street: "preflop",
        player: "o.colombini2",
        type: "raise",
        amount: 300000,
        totalBet: 300000,
        isAllIn: false,
      },
      {
        street: "preflop",
        player: "joes555",
        type: "fold",
        amount: 0,
        totalBet: 0,
        isAllIn: false,
      },
      {
        street: "preflop",
        player: "KURFTERRIER",
        type: "raise",
        amount: 1990600,
        totalBet: 1990600,
        isAllIn: true,
      },
      {
        street: "preflop",
        player: "ms spartan",
        type: "fold",
        amount: 0,
        totalBet: 0,
        isAllIn: false,
      },
      {
        street: "preflop",
        player: "vinal33",
        type: "fold",
        amount: 0,
        totalBet: 0,
        isAllIn: false,
      },
      {
        street: "preflop",
        player: "hoboexpress",
        type: "fold",
        amount: 0,
        totalBet: 25000,
        isAllIn: false,
      },
      {
        street: "preflop",
        player: "LA-GreatOne",
        type: "fold",
        amount: 0,
        totalBet: 50000,
        isAllIn: false,
      },
      {
        street: "preflop",
        player: "o.colombini2",
        type: "fold",
        amount: 0,
        totalBet: 300000,
        isAllIn: false,
      },
    ]);
  });

  it('resolves "calls X" as increment on top of a prior blind post (hand 5, armadilha #4)', () => {
    const actions = parseActions(hands[4]);
    // o.colombini2 pagou sb (250) e depois "calls 2250" — não pode virar totalBet=2250
    const heroCall = actions.find(
      (a) => a.player === "o.colombini2" && a.type === "call",
    );
    expect(heroCall).toEqual({
      street: "preflop",
      player: "o.colombini2",
      type: "call",
      amount: 225000,
      totalBet: 250000,
      isAllIn: false,
    });
    // KURFTERRIER age duas vezes (call 500, depois call 2000) — o que importa
    // é o ÚLTIMO totalBet de cada jogador, não todo valor intermediário.
    const lastTotalByPlayer = new Map<string, number>();
    for (const action of actions.filter((a) => a.street === "preflop")) {
      lastTotalByPlayer.set(action.player, action.totalBet);
    }
    for (const player of [
      "KURFTERRIER",
      "ms spartan",
      "vinal33",
      "o.colombini2",
      "joes555",
    ]) {
      expect(lastTotalByPlayer.get(player)).toBe(250000);
    }
  });

  it("produces no actions on turn/river when everyone is already all-in (hand 6)", () => {
    const actions = parseActions(hands[5]);
    expect(
      actions.filter((a) => a.street === "turn" || a.street === "river"),
    ).toEqual([]);
  });
});

describe("parseUncalledBets", () => {
  it("parses the uncalled bet returned to the raiser (hand 2)", () => {
    expect(parseUncalledBets(hands[1])).toEqual([
      { player: "o.colombini2", amount: 350000 },
    ]);
  });
});

describe("parseAmbientEvents", () => {
  it("captures timeout and leave events without turning them into actions (hand 9)", () => {
    expect(parseAmbientEvents(hands[8])).toEqual([
      {
        player: "KURFTERRIER",
        section: "preflop",
        text: "KURFTERRIER leaves the table",
      },
      {
        player: "achladokampo",
        section: "preflop",
        text: "achladokampo has timed out",
      },
    ]);
  });

  it("captures join/leave but stops before the post-showdown join (hand 10)", () => {
    // O segundo "BESIGNOU 03 joins the table" ocorre depois do *** SHOW DOWN ***
    // — fora do escopo desta função de propósito (fica pra Parte 5).
    expect(parseAmbientEvents(hands[9])).toEqual([
      {
        player: "BESIGNOU 03",
        section: "preflop",
        text: "BESIGNOU 03 joins the table at seat #7",
      },
      {
        player: "BESIGNOU 03",
        section: "preflop",
        text: "BESIGNOU 03 leaves the table",
      },
    ]);
  });
});

describe("scanActionStream coverage", () => {
  it("recognizes every line in the action stream across all 11 hands", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const hand of hands) {
      parseActions(hand);
    }
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
