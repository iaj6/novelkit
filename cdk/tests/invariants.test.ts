import { describe, it, expect } from "vitest";
import { checkInvariants, countWords } from "../src/invariants.js";
import type { ManuscriptChapter } from "../src/manuscript.js";

function ch(id: string, words: number): ManuscriptChapter {
  return { id, relPath: `draft/${id}.md`, text: Array(words).fill("word").join(" ") };
}

describe("countWords", () => {
  it("ignores markdown headings and HTML comments", () => {
    expect(countWords("# Chapter One\n\nword word\n\n<!-- a note -->")).toBe(2);
  });
});

describe("checkInvariants", () => {
  it("imposes nothing when no invariants are configured", () => {
    // Absent config must never invent a floor — a wrong floor fails runs for
    // imaginary reasons, which is worse than no check at all.
    expect(checkInvariants([ch("01-a", 5)], undefined)).toEqual([]);
    expect(checkInvariants([ch("01-a", 5)], {})).toEqual([]);
  });

  it("flags each chapter under the per-chapter floor, and only those", () => {
    const v = checkInvariants(
      [ch("01-a", 2000), ch("02-b", 1873), ch("03-c", 1887)],
      { minWordsPerChapter: 1900 }
    );
    expect(v.map((x) => x.chapter)).toEqual(["02-b", "03-c"]);
    expect(v[0]).toMatchObject({ kind: "chapter-min-words", actual: 1873, required: 1900 });
  });

  it("flags a total below the manuscript floor with a null chapter", () => {
    const v = checkInvariants([ch("01-a", 100), ch("02-b", 100)], { minTotalWords: 500 });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "total-min-words", chapter: null, actual: 200 });
  });

  it("can report both kinds at once", () => {
    const v = checkInvariants([ch("01-a", 10)], { minWordsPerChapter: 50, minTotalWords: 100 });
    expect(v.map((x) => x.kind).sort()).toEqual(["chapter-min-words", "total-min-words"]);
  });

  it("treats zero or negative thresholds as no constraint", () => {
    expect(checkInvariants([ch("01-a", 1)], { minWordsPerChapter: 0 })).toEqual([]);
  });
});
