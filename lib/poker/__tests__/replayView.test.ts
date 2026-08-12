import { describe, expect, it } from "vitest";
import { parseHandHistory } from "../parseHandHistory";
import { activePlayer, seatLayout, streetSegments } from "../replayView";
import { buildTimeline, ReplayEvent } from "../timeline";
import { fixture } from "./fixture";

const hands = parseHandHistory(fixture);

// Mão do split pot: hero no assento 3, 6 jogadores ativos, all-in no flop, 26 eventos.
const splitPot = hands[5];
const splitPotTimeline = buildTimeline(splitPot);

describe("seatLayout", () => {
  it("puts the hero at visual index 0 and walks clockwise from there", () => {
    const layout = seatLayout(splitPot);
    expect(layout).toHaveLength(9);
    expect(layout[0]).toMatchObject({
      seatNumber: 3,
      visualIndex: 0,
      isHero: true,
    });
    expect(layout.map((slot) => slot.seatNumber)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 1, 2,
    ]);
  });

  it("keeps empty seats as slots (hand 10 has nobody in seat 7)", () => {
    const layout = seatLayout(hands[9]);
    expect(layout).toHaveLength(9);
    const seat7 = layout.find((slot) => slot.seatNumber === 7);
    expect(seat7?.player).toBeNull();
    expect(layout.filter((slot) => slot.player !== null)).toHaveLength(8);
  });

  it("gives every hand a full 9-slot layout with exactly one hero", () => {
    for (const hand of hands) {
      const layout = seatLayout(hand);
      expect(layout).toHaveLength(9);
      expect(layout.filter((slot) => slot.isHero)).toHaveLength(1);
      expect(layout[0].isHero).toBe(true);
    }
  });
});

describe("activePlayer", () => {
  it("points at whoever acts next (frame 17 = right after the all-in)", () => {
    expect(splitPotTimeline[16]).toMatchObject({
      kind: "action",
      player: "KURFTERRIER",
    });
    expect(activePlayer(splitPotTimeline, 17)).toBe("vinal33");
  });

  it("returns null when a street lands before anyone acts", () => {
    expect(splitPotTimeline[20]).toMatchObject({
      kind: "street",
      street: "turn",
    });
    expect(activePlayer(splitPotTimeline, 20)).toBeNull();
  });

  it("returns null at the end of the hand", () => {
    expect(activePlayer(splitPotTimeline, splitPotTimeline.length)).toBeNull();
  });

  it("skips ambient events instead of stopping on them", () => {
    // Timeline sintética: buildTimeline agrupa ambient no fim da street, então esse
    // arranjo não ocorre no fixture — mas a função não pode depender dessa ordenação.
    const timeline: ReplayEvent[] = [
      { kind: "ambient", player: "vinal33", text: "vinal33 is connected" },
      {
        kind: "action",
        street: "preflop",
        player: "o.colombini2",
        type: "call",
        amount: 50000,
        totalBet: 50000,
        isAllIn: false,
      },
    ];
    expect(activePlayer(timeline, 0)).toBe("o.colombini2");
  });

  it("returns null when the ambient events of a street are the last thing before the flop", () => {
    // Mão 9 tem "leaves the table" e "has timed out" no preflop; ambos caem no fim da
    // street, logo antes do flop — ninguém está agindo ali.
    const timeline = buildTimeline(hands[8]);
    const ambientIndex = timeline.findIndex(
      (event) => event.kind === "ambient",
    );
    expect(ambientIndex).toBeGreaterThan(-1);
    expect(activePlayer(timeline, ambientIndex)).toBeNull();
  });
});

describe("streetSegments", () => {
  it("splits the split-pot hand into its five phases", () => {
    expect(streetSegments(splitPotTimeline)).toEqual([
      { phase: "preflop", startFrame: 0, endFrame: 11, eventCount: 11 },
      { phase: "flop", startFrame: 11, endFrame: 20, eventCount: 9 },
      { phase: "turn", startFrame: 20, endFrame: 21, eventCount: 1 },
      { phase: "river", startFrame: 21, endFrame: 22, eventCount: 1 },
      { phase: "showdown", startFrame: 22, endFrame: 26, eventCount: 4 },
    ]);
  });

  it("covers every frame exactly once, in every hand", () => {
    for (const hand of hands) {
      const timeline = buildTimeline(hand);
      const segments = streetSegments(timeline);
      expect(segments[0].startFrame).toBe(0);
      expect(segments[segments.length - 1].endFrame).toBe(timeline.length);
      expect(segments.reduce((sum, s) => sum + s.eventCount, 0)).toBe(
        timeline.length,
      );
    }
  });

  it("gives a preflop-only hand no flop segment (hand 3)", () => {
    const phases = streetSegments(buildTimeline(hands[2])).map((s) => s.phase);
    expect(phases).not.toContain("flop");
    expect(phases).toContain("preflop");
  });
});
