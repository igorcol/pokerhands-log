import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  handHistoryDir,
  listAccounts,
  readAccountHands,
} from "../handHistorySource";

// A pasta real do PokerStars não existe em CI nem na máquina de outra pessoa —
// esses testes se auto-pulam em vez de falhar por ausência de dado do usuário.
const hasRealFolder = existsSync(handHistoryDir());
const describeReal = hasRealFolder ? describe : describe.skip;

describeReal("handHistorySource (pasta real)", () => {
  it("lists at least one account", () => {
    expect(listAccounts().length).toBeGreaterThan(0);
  });

  it("reads hands for the first account, with no duplicate ids", () => {
    const [account] = listAccounts();
    const { hands, skipped } = readAccountHands(account);

    expect(hands.length).toBeGreaterThan(0);
    expect(skipped).toEqual([]);
    expect(new Set(hands.map((h) => h.id)).size).toBe(hands.length);
  });

  it("returns hands sorted chronologically", () => {
    const [account] = listAccounts();
    const { hands } = readAccountHands(account);
    const dates = hands.map((h) => h.dateIso);
    expect(dates).toEqual([...dates].sort());
  });

  it("serves the second read from cache (same object identity)", () => {
    const [account] = listAccounts();
    expect(readAccountHands(account).hands[0]).toBe(
      readAccountHands(account).hands[0],
    );
  });
});

describe("handHistoryDir", () => {
  it("honours the env override", () => {
    const original = process.env.POKER_HAND_HISTORY_DIR;
    process.env.POKER_HAND_HISTORY_DIR = join("C:", "tmp", "hh");
    expect(handHistoryDir()).toBe(join("C:", "tmp", "hh"));
    process.env.POKER_HAND_HISTORY_DIR = original;
  });
});
