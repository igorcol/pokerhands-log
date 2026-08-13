import { describe, expect, it } from "vitest";
import { buildEventLog } from "../eventLog";
import { parseHandHistory } from "../parseHandHistory";
import { buildTimeline } from "../timeline";
import { fixture } from "./fixture";

const hands = parseHandHistory(fixture);
const splitPot = hands[5];
// A mesma instância nos dois lados: buildTimeline cria objetos novos a cada chamada,
// e os testes abaixo comparam por referência.
const splitPotTimeline = buildTimeline(splitPot);
const groups = buildEventLog(splitPot, splitPotTimeline);

describe("buildEventLog", () => {
  it("groups the split-pot hand into its played phases", () => {
    expect(groups.map((g) => g.phase)).toEqual([
      "preflop",
      "flop",
      "turn",
      "river",
      "showdown",
    ]);
  });

  it("puts the board cards on the group header, not in the entries", () => {
    const flop = groups[1];
    expect(flop.cards).toHaveLength(3);
    expect(flop.entries.every((e) => e.event.kind !== "street")).toBe(true);
  });

  it("carries the pot as it stood at the end of each street", () => {
    expect(groups[0].potAfter).toBe(1225000);
    expect(groups[groups.length - 1].potAfter).toBe(splitPot.totalPot);
  });

  it("maps every entry to a frame that lands on that same event", () => {
    for (const group of groups) {
      for (const entry of group.entries) {
        expect(splitPotTimeline[entry.frame - 1]).toBe(entry.event);
      }
    }
  });

  it("drops deal-hole but keeps every other event", () => {
    const logged = groups.flatMap((g) => g.entries).length;
    const skipped = splitPotTimeline.filter(
      (e) => e.kind === "street" || e.kind === "deal-hole",
    ).length;
    expect(logged + skipped).toBe(splitPotTimeline.length);
  });

  it("omits streets the hand never reached (hand 3 dies preflop)", () => {
    const preflopOnly = buildEventLog(hands[2], buildTimeline(hands[2]));
    expect(preflopOnly.map((g) => g.phase)).not.toContain("flop");
  });
});
