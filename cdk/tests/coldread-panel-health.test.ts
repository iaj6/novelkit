import { describe, it, expect } from "vitest";
import {
  computePanelHealth,
  MIN_HEALTHY_SPREAD,
  MIN_USEFUL_LENSES,
} from "../src/coldread/verify.js";
import type { ColdRead } from "../src/coldread/schema.js";

/**
 * Panel health is the BOOK-INDEPENDENT half of the harness's self-evaluation. These
 * metrics must be computable for any manuscript — nothing here may depend on knowing
 * which defects a particular book contains.
 */
function read(lens: string, score: number, over: Partial<ColdRead> = {}): ColdRead {
  const claims = [
    { chapters: ["01-a"], claim: "a" },
    { chapters: ["02-b"], claim: "b" },
    { chapters: ["03-c"], claim: "c" },
  ];
  return {
    lens,
    score_out_of_10: score,
    would_finish: "yes",
    verdict: "v",
    strongest: claims,
    weakest: claims,
    quotes: [],
    put_down_points: [],
    who_is_this_for: "x",
    ...over,
  };
}

const clean = { exact: 10, near: 0, misattributed: 0, absent: 0 };

describe("computePanelHealth", () => {
  it("summarizes scores, finish verdicts and claim volume", () => {
    const h = computePanelHealth(
      [
        read("a", 5),
        read("b", 8, { would_finish: "skimmed" }),
        read("c", 6.5),
        read("d", 7),
      ],
      clean
    );
    expect(h.lenses).toBe(4);
    expect(h.scores).toEqual({ min: 5, max: 8, mean: 6.63, spread: 3 });
    expect(h.finish).toEqual({ yes: 3, skimmed: 1 });
    expect(h.claims.weakest).toBe(12);
    expect(h.claims.fewestWeaknessesOnALens).toBe(3);
    expect(h.quotes).toEqual({ total: 10, fabricationRate: 0 });
    expect(h.flags).toEqual([]);
  });

  it("flags a narrow score spread as possible convergence", () => {
    // Six lenses with incompatible priorities returning nearly one number is the
    // signal that they are not reading independently.
    const h = computePanelHealth([read("a", 7), read("b", 7.2), read("c", 7.5)], clean);
    expect(h.scores.spread).toBeLessThan(MIN_HEALTHY_SPREAD);
    expect(h.flags.some((f) => f.includes("narrow"))).toBe(true);
  });

  it("does not flag a healthy spread", () => {
    const h = computePanelHealth([read("a", 5), read("b", 7), read("c", 8)], clean);
    expect(h.flags).toEqual([]);
  });

  it("flags a panel too small for agreement to mean anything", () => {
    const h = computePanelHealth([read("a", 7)], clean);
    expect(h.lenses).toBeLessThan(MIN_USEFUL_LENSES);
    expect(h.flags.some((f) => f.includes("too few"))).toBe(true);
    // The small-panel warning replaces the spread warning; one score has no spread.
    expect(h.flags.some((f) => f.includes("narrow"))).toBe(false);
  });

  it("flags fabricated and misattributed quotes with a rate", () => {
    const h = computePanelHealth([read("a", 5), read("b", 7), read("c", 8)], {
      exact: 6,
      near: 1,
      misattributed: 2,
      absent: 1,
    });
    expect(h.quotes.total).toBe(10);
    expect(h.quotes.fabricationRate).toBe(0.1);
    expect(h.flags.some((f) => f.includes("fabricated"))).toBe(true);
    expect(h.flags.some((f) => f.includes("misattributed"))).toBe(true);
  });

  it("flags a panel that cited nothing checkable", () => {
    const h = computePanelHealth([read("a", 5), read("b", 7), read("c", 8)], {
      exact: 0,
      near: 0,
      misattributed: 0,
      absent: 0,
    });
    expect(h.flags.some((f) => f.includes("nothing in this panel is mechanically checkable"))).toBe(
      true
    );
  });

  it("handles an empty panel without dividing by zero", () => {
    const h = computePanelHealth([], { exact: 0, near: 0, misattributed: 0, absent: 0 });
    expect(h.scores).toEqual({ min: 0, max: 0, mean: 0, spread: 0 });
    expect(h.quotes.fabricationRate).toBe(0);
  });
});
