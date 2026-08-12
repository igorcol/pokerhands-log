import { describe, expect, it } from "vitest";
import { withResults } from "../handResult";
import { toHandListItem } from "../handListItem";
import { parseHandHistory } from "../parseHandHistory";
import { buildStackCurve, summarizeHandListItems } from "../summary";
import { fixture } from "./fixture";

const items = withResults(parseHandHistory(fixture)).map(toHandListItem);
const summary = summarizeHandListItems(items);

describe("summarizeHandListItems", () => {
  it("aggregates the whole fixture", () => {
    expect(summary.handCount).toBe(11);
    expect(summary.net).toBe(147400);
    expect(summary.wonCount).toBe(4);
    expect(summary.showdownCount).toBe(3);
    expect(summary.showdownWonCount).toBe(2);
    expect(summary.biggestPot).toBe(4728600);
  });

  it("tracks the stack from the first hand through the net result", () => {
    expect(summary.startingStack).toBe(5000000);
    expect(summary.endingStack).toBe(5147400);
  });

  it("picks the biggest win", () => {
    expect(summary.biggestWin?.net).toBe(997200);
    expect(summary.biggestWin?.id).toBe("261728025415");
  });

  it("returns a neutral summary for an empty slice", () => {
    expect(summarizeHandListItems([])).toMatchObject({
      handCount: 0,
      net: 0,
      biggestWin: null,
    });
  });
});

describe("buildStackCurve", () => {
  it("starts at the first hand starting stack and ends at the final stack", () => {
    const curve = buildStackCurve(items);
    expect(curve[0]).toBe(5000000);
    expect(curve[curve.length - 1]).toBe(5147400);
    expect(curve).toHaveLength(12);
  });
});
