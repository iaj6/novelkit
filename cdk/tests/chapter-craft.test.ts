import { describe, it, expect } from "vitest";
import {
  ChapterCraftSchema,
  formatChapterCraftEntry,
  extractRecentCraftEntries,
  type ChapterCraftArgs,
} from "../src/tools.js";

/** Minimum valid input — useful as a baseline that tests can extend or mutate. */
function validArgs(overrides: Partial<ChapterCraftArgs> = {}): ChapterCraftArgs {
  return {
    chapterId: "01-the-opening",
    ending_mode: "literary-fade",
    opening_texture: "routine-procedure",
    heavy_stylistic_moves: [
      "short declaratives clustered in the action paragraph",
      "free indirect interiority through the POV's professional vocabulary",
    ],
    recurring_constructions: [],
    pov_register: [
      {
        character: "PROTAGONIST",
        register_note: "POV's interior stayed close-action throughout, no abstract reflection.",
      },
    ],
    craft_notes:
      "Opened on routine work to anchor the reader before the inciting incident. Held interior tight; one short dialogue exchange at the midpoint.",
    ...overrides,
  };
}

describe("ChapterCraftSchema (zod validation)", () => {
  it("accepts a fully valid record_chapter_craft input", () => {
    expect(() => ChapterCraftSchema.parse(validArgs())).not.toThrow();
  });

  it("rejects fewer than 2 heavy_stylistic_moves", () => {
    expect(() =>
      ChapterCraftSchema.parse(validArgs({ heavy_stylistic_moves: ["only one"] }))
    ).toThrow();
    expect(() =>
      ChapterCraftSchema.parse(validArgs({ heavy_stylistic_moves: [] }))
    ).toThrow();
  });

  it("rejects more than 7 heavy_stylistic_moves", () => {
    expect(() =>
      ChapterCraftSchema.parse(
        validArgs({ heavy_stylistic_moves: ["a", "b", "c", "d", "e", "f", "g", "h"] })
      )
    ).toThrow();
  });

  it("accepts an empty recurring_constructions array", () => {
    expect(() =>
      ChapterCraftSchema.parse(validArgs({ recurring_constructions: [] }))
    ).not.toThrow();
  });

  it("rejects more than 5 recurring_constructions", () => {
    expect(() =>
      ChapterCraftSchema.parse(
        validArgs({ recurring_constructions: ["a", "b", "c", "d", "e", "f"] })
      )
    ).toThrow();
  });

  it("requires at least one pov_register entry", () => {
    expect(() => ChapterCraftSchema.parse(validArgs({ pov_register: [] }))).toThrow();
  });

  it("rejects opening_texture values outside the closed vocabulary", () => {
    expect(() =>
      // @ts-expect-error — intentionally bad value for runtime validation
      ChapterCraftSchema.parse(validArgs({ opening_texture: "made-up-category" }))
    ).toThrow();
  });

  it("accepts every documented opening_texture value", () => {
    const validTextures = [
      "routine-procedure",
      "drill-or-practice",
      "transit",
      "observation",
      "dialogue",
      "interior",
      "set-piece",
      "arrival",
      "summons",
      "atmosphere",
      "other",
    ] as const;
    for (const opening_texture of validTextures) {
      expect(() => ChapterCraftSchema.parse(validArgs({ opening_texture }))).not.toThrow();
    }
  });

  it("rejects empty craft_notes and per-pov register_note (the min(1) string fields)", () => {
    expect(() => ChapterCraftSchema.parse(validArgs({ craft_notes: "" }))).toThrow();
    expect(() =>
      ChapterCraftSchema.parse(
        validArgs({
          pov_register: [{ character: "X", register_note: "" }],
        })
      )
    ).toThrow();
  });

  it("rejects ending_mode values outside the closed vocabulary", () => {
    expect(() =>
      // @ts-expect-error — intentionally bad value for runtime validation
      ChapterCraftSchema.parse(validArgs({ ending_mode: "literary fade on a quiet image" }))
    ).toThrow();
    expect(() =>
      // @ts-expect-error — intentionally bad value for runtime validation
      ChapterCraftSchema.parse(validArgs({ ending_mode: "" }))
    ).toThrow();
  });

  it("accepts every documented ending_mode value", () => {
    const validEndings = [
      "cliffhanger",
      "mid-action-cut",
      "literary-fade",
      "resolved-beat",
      "turn",
      "coda",
      "declarative-close",
      "elliptical",
      "other",
    ] as const;
    for (const ending_mode of validEndings) {
      expect(() => ChapterCraftSchema.parse(validArgs({ ending_mode }))).not.toThrow();
    }
  });
});

describe("formatChapterCraftEntry (pure markdown formatter)", () => {
  it("produces a leading newline so the entry appends cleanly to an existing file", () => {
    const out = formatChapterCraftEntry(validArgs());
    expect(out.startsWith("\n## ")).toBe(true);
  });

  it("includes every structured section in the documented order", () => {
    const out = formatChapterCraftEntry(validArgs({ chapterId: "07-mid-book" }));
    const expectedSections = [
      "## 07-mid-book",
      "**Ending mode:**",
      "**Opening texture:**",
      "**Heavy stylistic moves:**",
      "**Recurring constructions:**",
      "**POV register:**",
      "**Craft notes:**",
    ];
    let cursor = 0;
    for (const section of expectedSections) {
      const idx = out.indexOf(section, cursor);
      expect(idx).toBeGreaterThanOrEqual(0);
      cursor = idx + section.length;
    }
  });

  it("renders '- (none)' when recurring_constructions is empty", () => {
    const out = formatChapterCraftEntry(validArgs({ recurring_constructions: [] }));
    expect(out).toContain("**Recurring constructions:**\n- (none)");
  });

  it("wraps recurring_constructions entries in backticks for verbatim emphasis", () => {
    const out = formatChapterCraftEntry(
      validArgs({ recurring_constructions: ["thought it but did not say"] })
    );
    expect(out).toContain("- `thought it but did not say`");
  });

  it("renders each pov_register entry on its own line with bold character name", () => {
    const out = formatChapterCraftEntry(
      validArgs({
        pov_register: [
          { character: "ALPHA", register_note: "register A description" },
          { character: "BETA", register_note: "register B description" },
        ],
      })
    );
    expect(out).toContain("- **ALPHA:** register A description");
    expect(out).toContain("- **BETA:** register B description");
  });

  it("renders heavy_stylistic_moves as a bullet list", () => {
    const out = formatChapterCraftEntry(
      validArgs({
        heavy_stylistic_moves: [
          "move-one with where it lands",
          "move-two with where it lands",
        ],
      })
    );
    expect(out).toContain("- move-one with where it lands");
    expect(out).toContain("- move-two with where it lands");
  });
});

describe("extractRecentCraftEntries (pure parser)", () => {
  function buildLog(...chapterIds: string[]): string {
    return chapterIds
      .map((id) =>
        formatChapterCraftEntry(validArgs({ chapterId: id }))
      )
      .join("");
  }

  it("returns '(empty)' for empty input", () => {
    expect(extractRecentCraftEntries("", 3)).toBe("(empty)");
  });

  it("returns '(empty)' for whitespace-only input", () => {
    expect(extractRecentCraftEntries("   \n\n  \n", 3)).toBe("(empty)");
  });

  it("returns the only entry when n >= 1 and one entry exists", () => {
    const log = buildLog("01-only");
    const out = extractRecentCraftEntries(log, 3);
    expect(out).toContain("## 01-only");
    expect(out.split("## ").length).toBe(2); // one empty pre-split + one entry
  });

  it("returns the last N entries when more exist", () => {
    const log = buildLog("01-a", "02-b", "03-c", "04-d", "05-e");
    const out = extractRecentCraftEntries(log, 3);
    expect(out).toContain("## 03-c");
    expect(out).toContain("## 04-d");
    expect(out).toContain("## 05-e");
    expect(out).not.toContain("## 01-a");
    expect(out).not.toContain("## 02-b");
  });

  it("returns all entries when n exceeds available count", () => {
    const log = buildLog("01-a", "02-b");
    const out = extractRecentCraftEntries(log, 10);
    expect(out).toContain("## 01-a");
    expect(out).toContain("## 02-b");
  });

  it("preserves entry ordering (oldest of the returned slice first)", () => {
    const log = buildLog("01-a", "02-b", "03-c", "04-d");
    const out = extractRecentCraftEntries(log, 2);
    const idxC = out.indexOf("## 03-c");
    const idxD = out.indexOf("## 04-d");
    expect(idxC).toBeGreaterThanOrEqual(0);
    expect(idxD).toBeGreaterThan(idxC);
  });
});
