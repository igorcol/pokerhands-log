import { describe, expect, it } from "vitest";
import { formatChips, formatNet, formatOutcome, outcomeTone } from "../format";

describe("formatChips", () => {
  it("omits decimals for whole values (play money)", () => {
    expect(formatChips(50000)).toBe("500");
    expect(formatChips(4728600)).toBe("47.286");
  });

  it("keeps decimals for fractional values (real money)", () => {
    expect(formatChips(25)).toBe("0,25");
    expect(formatChips(150)).toBe("1,50");
  });
});

describe("formatNet", () => {
  it("prefixes an explicit sign, using U+2212 for negatives", () => {
    expect(formatNet(997200)).toBe("+9.972");
    expect(formatNet(-550000)).toBe("−5.500");
    expect(formatNet(0)).toBe("0");
  });
});

describe("formatOutcome", () => {
  it("describes each outcome in pt-BR", () => {
    expect(formatOutcome({ kind: "folded", street: "preflop" })).toBe(
      "fold no pré-flop",
    );
    expect(
      formatOutcome({ kind: "won-without-showdown", street: "turn" }),
    ).toBe("venceu no turn");
    expect(formatOutcome({ kind: "showdown-split" })).toBe(
      "showdown · pote dividido",
    );
  });
});

describe("outcomeTone", () => {
  it("is neutral for a fold, even though net is negative", () => {
    expect(outcomeTone({ kind: "folded", street: "flop" }, -250000)).toBe(
      "neutral",
    );
  });

  it("is win for any non-fold outcome with positive net", () => {
    expect(
      outcomeTone({ kind: "won-without-showdown", street: "flop" }, 337900),
    ).toBe("win");
    expect(outcomeTone({ kind: "showdown-won" }, 314200)).toBe("win");
    expect(outcomeTone({ kind: "showdown-split" }, 248100)).toBe("win");
  });

  it("is loss for a showdown loss", () => {
    expect(outcomeTone({ kind: "showdown-lost" }, -550000)).toBe("loss");
  });
});
