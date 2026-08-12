import { describe, expect, it } from "vitest";
import { chipTier, playerIdentity } from "../tableVisuals";

const BIG_BLIND = 50000; // 500 em centavos

describe("playerIdentity", () => {
  it("is stable for the same name", () => {
    expect(playerIdentity("vinal33")).toEqual(playerIdentity("vinal33"));
  });

  it("takes the first alphanumeric character as the initial", () => {
    expect(playerIdentity("o.colombini2").initial).toBe("O");
    expect(playerIdentity("ms spartan").initial).toBe("M");
    expect(playerIdentity("1948allen").initial).toBe("1");
    expect(playerIdentity("BESIGNOU 03").initial).toBe("B");
  });

  it("gives the hero the carmine palette regardless of name", () => {
    expect(playerIdentity("o.colombini2", true).from).toBe("#E0313E");
    expect(playerIdentity("vinal33", true).from).toBe("#E0313E");
  });

  it("spreads the fixture players across more than one colour", () => {
    const names = [
      "vinal33",
      "KURFTERRIER",
      "ms spartan",
      "joes555",
      "LA-GreatOne",
    ];
    const colours = new Set(names.map((name) => playerIdentity(name).from));
    expect(colours.size).toBeGreaterThan(1);
  });
});

describe("chipTier", () => {
  it("scales by big blinds, not by absolute value", () => {
    // 5 BB cai no mesmo tier tanto em 250/500 quanto em 1/2.
    expect(chipTier(250000, BIG_BLIND).index).toBe(chipTier(1000, 200).index);
  });

  it("separates the real values of the split-pot hand", () => {
    expect(chipTier(50000, BIG_BLIND).index).toBe(0); // 500 = 1 BB
    expect(chipTier(558700, BIG_BLIND).index).toBe(2); // 5.587 ≈ 11 BB
    expect(chipTier(4728600, BIG_BLIND).index).toBe(4); // 47.286 ≈ 95 BB
  });

  it("caps the stack height at 4 chips", () => {
    expect(chipTier(999999999, BIG_BLIND).stackHeight).toBe(4);
    expect(chipTier(0, BIG_BLIND).stackHeight).toBe(1);
  });

  it("falls back to the lowest tier when big blind is missing", () => {
    expect(chipTier(50000, 0).index).toBe(0);
  });
});
