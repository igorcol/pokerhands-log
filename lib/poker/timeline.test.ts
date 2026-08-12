import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseHandHistory } from "./parseHandHistory";
import { buildTimeline } from "./timeline";
import type { ReplayEvent } from "./timeline";

const fixture = readFileSync(
  join(__dirname, "__fixtures__/hh-octavia-ii-2026-08-12.txt"),
  "utf-8",
);
const hands = parseHandHistory(fixture);

describe("buildTimeline", () => {
  it("preserves every event from the Hand, for all 11 hands (conservation)", () => {
    for (const hand of hands) {
      const timeline = buildTimeline(hand);
      const countBy = (kind: ReplayEvent["kind"]) =>
        timeline.filter((e) => e.kind === kind).length;

      expect(countBy("post")).toBe(hand.posts.length);
      expect(countBy("deal-hole")).toBe(hand.dealtHoleCards ? 1 : 0);
      expect(countBy("action")).toBe(hand.actions.length);
      expect(countBy("uncalled-return")).toBe(hand.uncalledBets.length);
      expect(countBy("reveal")).toBe(hand.reveals.length);
      expect(countBy("collect")).toBe(hand.winners.length);
      expect(countBy("ambient")).toBe(hand.ambientEvents.length);
    }
  });

  it("starts with posts, then deal-hole, for hand 1", () => {
    const timeline = buildTimeline(hands[0]);
    expect(timeline.slice(0, 4).map((e) => e.kind)).toEqual([
      "post",
      "post",
      "post",
      "deal-hole",
    ]);
  });

  it("emits no street events for a hand that folds preflop (hand 3)", () => {
    const timeline = buildTimeline(hands[2]);
    expect(timeline.filter((e) => e.kind === "street")).toEqual([]);
  });

  it("emits street events with the correct incremental cards (hand 1)", () => {
    const timeline = buildTimeline(hands[0]);
    const streetEvents = timeline.filter(
      (e): e is Extract<ReplayEvent, { kind: "street" }> => e.kind === "street",
    );
    expect(streetEvents).toEqual([
      {
        kind: "street",
        street: "flop",
        cards: [
          { rank: "7", suit: "s" },
          { rank: "2", suit: "c" },
          { rank: "K", suit: "s" },
        ],
      },
      { kind: "street", street: "turn", cards: [{ rank: "6", suit: "d" }] },
      { kind: "street", street: "river", cards: [{ rank: "9", suit: "d" }] },
    ]);
  });

  it("places uncalled-return after the actions, before collect (hand 2)", () => {
    const timeline = buildTimeline(hands[1]);
    const kinds = timeline.map((e) => e.kind);
    const uncalledIndex = kinds.indexOf("uncalled-return");
    const collectIndex = kinds.indexOf("collect");
    expect(uncalledIndex).toBeGreaterThan(-1);
    expect(uncalledIndex).toBeLessThan(collectIndex);
  });

  it("emits two collect events for the split pot (hand 6)", () => {
    const timeline = buildTimeline(hands[5]);
    expect(timeline.filter((e) => e.kind === "collect")).toHaveLength(2);
  });

  it("places the post-showdown ambient event as the very last event (hand 10)", () => {
    const timeline = buildTimeline(hands[9]);
    expect(timeline[timeline.length - 1]).toEqual({
      kind: "ambient",
      player: "BESIGNOU 03",
      text: "BESIGNOU 03 joins the table at seat #7",
    });
  });

  it("places the uncalled-return on the street it happened, before the automatic runout continues (hand 6)", () => {
    const timeline = buildTimeline(hands[5]);
    const uncalledIndex = timeline.findIndex(
      (e) => e.kind === "uncalled-return",
    );
    const turnStreetIndex = timeline.findIndex(
      (e) => e.kind === "street" && e.street === "turn",
    );
    expect(uncalledIndex).toBeGreaterThan(-1);
    expect(uncalledIndex).toBeLessThan(turnStreetIndex);
  });
});
