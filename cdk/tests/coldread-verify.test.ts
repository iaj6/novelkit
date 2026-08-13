import { describe, it, expect } from "vitest";
import {
  classifyQuote,
  normalizeWhitespace,
  normalizeTypography,
  resolveChapterRef,
  verifyChapterRefs,
  verifyPanel,
} from "../src/coldread/verify.js";
import type { ManuscriptChapter } from "../src/coldread/manuscript.js";
import type { ColdRead } from "../src/coldread/schema.js";

const chapters: ManuscriptChapter[] = [
  {
    id: "01-the-ledger-spine",
    relPath: "draft/01-the-ledger-spine.md",
    text: "She is on the last two lines of the October column\nwhen the knock comes. The figure was right.",
  },
  {
    id: "09-the-bracket",
    relPath: "revision-1/09-the-bracket.md",
    text: 'He said, “The error is in the being careful” — and then nothing else…',
  },
];

function review(over: Partial<ColdRead> = {}): ColdRead {
  return {
    lens: "literary",
    score_out_of_10: 7,
    would_finish: "yes",
    verdict: "v",
    strongest: [
      { chapters: ["01-the-ledger-spine"], claim: "strong open" },
      { chapters: ["09-the-bracket"], claim: "b" },
      { chapters: ["01-the-ledger-spine"], claim: "c" },
    ],
    weakest: [
      { chapters: ["09-the-bracket"], claim: "thesis stated aloud" },
      { chapters: ["01-the-ledger-spine"], claim: "b" },
      { chapters: ["09-the-bracket"], claim: "c" },
    ],
    quotes: [],
    put_down_points: [],
    who_is_this_for: "readers of X",
    ...over,
  };
}

describe("normalization", () => {
  it("collapses whitespace runs including newlines", () => {
    expect(normalizeWhitespace("a  b\n\tc ")).toBe("a b c");
  });

  it("folds curly quotes, dashes and ellipses only at the typography tier", () => {
    expect(normalizeTypography("“a” — b…")).toBe('"a" - b...');
    // The whitespace tier must NOT fold typography, or `near` could never be distinguished.
    expect(normalizeWhitespace("“a”")).toBe("“a”");
  });
});

describe("resolveChapterRef", () => {
  // Regression: reviewers are handed PATHS to read and cite what they were given,
  // while ids are bare slugs. Comparing the forms directly marked 24 of 29 correctly
  // attributed quotes as misattributed on the first full panel run.
  it("accepts the path form the reviewers are actually given", () => {
    expect(resolveChapterRef("draft/01-the-ledger-spine.md", chapters)?.id).toBe(
      "01-the-ledger-spine"
    );
    expect(resolveChapterRef("revision-1/09-the-bracket.md", chapters)?.id).toBe("09-the-bracket");
  });

  it("accepts bare ids, filenames and mixed case", () => {
    expect(resolveChapterRef("09-the-bracket", chapters)?.id).toBe("09-the-bracket");
    expect(resolveChapterRef("09-the-bracket.md", chapters)?.id).toBe("09-the-bracket");
    expect(resolveChapterRef("09-The-Bracket", chapters)?.id).toBe("09-the-bracket");
  });

  it("accepts a chapter number when it identifies exactly one chapter", () => {
    expect(resolveChapterRef("9", chapters)?.id).toBe("09-the-bracket");
    expect(resolveChapterRef("Chapter 09", chapters)?.id).toBe("09-the-bracket");
  });

  it("returns undefined for a reference that names no chapter", () => {
    expect(resolveChapterRef("99-nope", chapters)).toBeUndefined();
    expect(resolveChapterRef("", chapters)).toBeUndefined();
  });
});

describe("classifyQuote", () => {
  it("credits a correct quote cited by path (the first-run regression)", () => {
    const r = classifyQuote("The figure was right.", "draft/01-the-ledger-spine.md", chapters);
    expect(r.verdict).toBe("exact");
  });

  it("matches across a line break in the source (exact)", () => {
    const r = classifyQuote(
      "the last two lines of the October column when the knock comes",
      "01-the-ledger-spine",
      chapters
    );
    expect(r.verdict).toBe("exact");
  });

  it("treats retyped punctuation as near, not exact", () => {
    const r = classifyQuote(
      'He said, "The error is in the being careful" - and then nothing else...',
      "09-the-bracket",
      chapters
    );
    expect(r.verdict).toBe("near");
  });

  it("flags a real quote attributed to the wrong chapter as misattributed", () => {
    const r = classifyQuote("The figure was right.", "09-the-bracket", chapters);
    expect(r.verdict).toBe("misattributed");
    expect(r.foundIn).toBe("01-the-ledger-spine");
  });

  it("flags an invented quote as absent", () => {
    const r = classifyQuote(
      "She wept openly on the platform.",
      "01-the-ledger-spine",
      chapters
    );
    expect(r.verdict).toBe("absent");
    expect(r.foundIn).toBeUndefined();
  });

  it("does not credit a quote whose cited chapter does not exist", () => {
    const r = classifyQuote("The figure was right.", "99-nope", chapters);
    // Present in the book, but not where claimed — the same failure as misattribution.
    expect(r.verdict).toBe("misattributed");
  });

  it("treats an empty quote as absent rather than matching everything", () => {
    // A naive substring check would call "" a match against every chapter.
    expect(classifyQuote("   ", "01-the-ledger-spine", chapters).verdict).toBe("absent");
  });
});

describe("verifyChapterRefs", () => {
  it("returns only refs that name no real chapter", () => {
    const r = review({
      strongest: [{ chapters: ["01-the-ledger-spine"], claim: "ok" }],
      weakest: [{ chapters: ["42-invented"], claim: "bad ref" }],
    });
    expect(verifyChapterRefs(r, chapters)).toEqual(["42-invented"]);
  });

  it("dedupes repeated bad refs", () => {
    const r = review({
      strongest: [{ chapters: ["42-invented"], claim: "a" }],
      weakest: [{ chapters: ["42-invented", "01-the-ledger-spine"], claim: "b" }],
    });
    expect(verifyChapterRefs(r, chapters)).toEqual(["42-invented"]);
  });
});

describe("verifyPanel", () => {
  it("tallies per lens and collects every non-exact quote as a problem", () => {
    const reads: ColdRead[] = [
      review({
        lens: "literary",
        quotes: [
          { chapter: "01-the-ledger-spine", text: "The figure was right.", why: "w" },
          { chapter: "01-the-ledger-spine", text: "She wept openly.", why: "w" },
        ],
      }),
      review({
        lens: "airport",
        quotes: [{ chapter: "09-the-bracket", text: "The figure was right.", why: "w" }],
      }),
    ];

    const report = verifyPanel(reads, chapters, "2026-01-01T00:00:00.000Z");

    expect(report.per_lens).toEqual([
      {
        lens: "literary",
        exact: 1,
        near: 0,
        misattributed: 0,
        absent: 1,
        badChapterRefs: [],
      },
      {
        lens: "airport",
        exact: 0,
        near: 0,
        misattributed: 1,
        absent: 0,
        badChapterRefs: [],
      },
    ]);
    expect(report.totals).toEqual({ exact: 1, near: 0, misattributed: 1, absent: 1 });
    expect(report.problems).toHaveLength(2);
    expect(report.problems.every((p) => p.verdict !== "exact")).toBe(true);
    expect(report.generated_at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("produces an empty problem list when every quote checks out", () => {
    const reads = [
      review({ quotes: [{ chapter: "01-the-ledger-spine", text: "The figure was right.", why: "w" }] }),
    ];
    const report = verifyPanel(reads, chapters, "t");
    expect(report.problems).toEqual([]);
    expect(report.totals.exact).toBe(1);
  });
});
