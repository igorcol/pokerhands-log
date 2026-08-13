import { describe, expect, it, vi } from "vitest";
import { deriveHandResult } from "../handResult";
import { parseActions, parseHandHistory, splitHandBlocks } from "../parseHandHistory";
import { fantasiaFixture } from "./fixture";

// Cobre as variações de formato que só apareceram quando outras mesas entraram no
// histórico. Cada caso aqui derrubava ou corrompia o parser silenciosamente antes.

const hands = parseHandHistory(fantasiaFixture);

describe("BOM e header", () => {
  it("parses all four hands despite the UTF-8 BOM at the start of the file", () => {
    expect(fantasiaFixture.charCodeAt(0)).toBe(0xfeff);
    expect(hands).toHaveLength(4);
  });

  it("accepts an hour without a leading zero (2:52:33)", () => {
    expect(hands[0].dateIso).toBe("2026-08-13T02:52:33.000Z");
  });
});

describe("side pots", () => {
  it("records which pot each payout came from", () => {
    expect(hands[2].winners).toEqual([
      { player: "o.colombini2", amount: 1032500, pot: "side" },
      { player: "LORENA 19788", amount: 1092600, pot: "main" },
    ]);
  });

  it("reconciles main + side against the total pot line", () => {
    const collected = hands[2].winners.reduce((sum, w) => sum + w.amount, 0);
    expect(hands[2].totalPot).toBe(2248800);
    expect(collected + hands[2].rake).toBe(hands[2].totalPot);
  });

  it("two winners on DIFFERENT pots is not a split pot", () => {
    expect(deriveHandResult(hands[2])?.outcome).toEqual({ kind: "showdown-won" });
  });

  it("the same player collecting main and side is a single win", () => {
    const winners = hands[3].winners;
    expect(winners.map((w) => w.pot)).toEqual(["side", "main"]);
    expect(new Set(winners.map((w) => w.player)).size).toBe(1);
  });
});

describe("fold expondo as cartas", () => {
  it("still registers the fold when the player shows their hand (folds [8c 7h])", () => {
    const folds = hands[1].actions.filter((a) => a.type === "fold");
    expect(folds.map((f) => f.player)).toContain("Tireur26");
  });
});

describe("eventos de desconexão", () => {
  it("classifies disconnect noise as ambient, never as an action", () => {
    const texts = hands[0].ambientEvents.map((e) => e.text);
    expect(texts).toContain("rona17 has timed out while disconnected");
    expect(texts).toContain("rona17: is sitting out");
    expect(texts).toContain("rona17 is disconnected");
    expect(hands[0].actions.some((a) => a.player === "rona17")).toBe(false);
  });
});

describe("cobertura de formato", () => {
  it("recognizes every line across the four hands", () => {
    // parseActions opera no texto bruto do bloco, não na Hand já parseada — é ele que
    // emite o warning de linha desconhecida que queremos verificar aqui.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const block of splitHandBlocks(fantasiaFixture)) parseActions(block);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("reconciles winners + rake against the total pot in every hand", () => {
    for (const hand of hands) {
      const collected = hand.winners.reduce((sum, w) => sum + w.amount, 0);
      expect(collected + hand.rake).toBe(hand.totalPot);
    }
  });
});