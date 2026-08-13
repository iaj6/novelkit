import { describe, it, expect } from "vitest";
import { DEFAULT_LENSES, resolveLenses, UnknownLensError } from "../src/coldread/lenses.js";
import { ColdReadSchema } from "../src/coldread/schema.js";

describe("write_cold_read contract", () => {
  it("exposes each review field as a top-level tool parameter", () => {
    // Regression: when the tool took one opaque `review` param, the model serialized
    // the whole review to a JSON string and every call failed validation (15
    // consecutive rejections on the first live run). The flat shape is the fix, so
    // assert it rather than let a refactor quietly reintroduce the opaque form.
    expect(Object.keys(ColdReadSchema.shape).sort()).toEqual(
      [
        "lens",
        "put_down_points",
        "quotes",
        "score_out_of_10",
        "strongest",
        "verdict",
        "weakest",
        "who_is_this_for",
        "would_finish",
      ].sort()
    );
  });

  it("rejects a stringified review payload", () => {
    const valid = {
      lens: "airport",
      score_out_of_10: 7,
      would_finish: "skimmed",
      verdict: "v",
      strongest: [
        { chapters: ["01-a"], claim: "c" },
        { chapters: ["02-b"], claim: "d" },
        { chapters: ["03-c"], claim: "e" },
      ],
      weakest: [
        { chapters: ["01-a", "02-b"], claim: "spans two chapters" },
        { chapters: ["02-b"], claim: "d" },
        { chapters: ["03-c"], claim: "e" },
      ],
      quotes: [],
      put_down_points: [],
      who_is_this_for: "x",
    };
    expect(ColdReadSchema.safeParse(valid).success).toBe(true);
    expect(ColdReadSchema.safeParse(JSON.stringify(valid)).success).toBe(false);
  });

  it("requires at least three strengths and three weaknesses", () => {
    // Regression: with a floor of 1, a reviewer who liked the book stopped at a single
    // high-level reservation and the concrete defects (an anachronism, a template
    // placeholder left in the prose) went unreported by all six lenses. The floor is
    // what makes a reviewer keep digging.
    const one = [{ chapters: ["01-a"], claim: "c" }];
    const three = [
      { chapters: ["01-a"], claim: "c" },
      { chapters: ["02-b"], claim: "d" },
      { chapters: ["03-c"], claim: "e" },
    ];
    const base = {
      lens: "airport",
      score_out_of_10: 7,
      would_finish: "yes",
      verdict: "v",
      quotes: [],
      put_down_points: [],
      who_is_this_for: "x",
    };
    expect(ColdReadSchema.safeParse({ ...base, strongest: three, weakest: three }).success).toBe(true);
    expect(ColdReadSchema.safeParse({ ...base, strongest: three, weakest: one }).success).toBe(false);
    expect(ColdReadSchema.safeParse({ ...base, strongest: one, weakest: three }).success).toBe(false);
  });

  it("accepts a claim spanning several chapters", () => {
    // Both defects the harness most needed to surface were cross-chapter; a single
    // anchor made them awkward to express.
    const spanning = [
      { chapters: ["24-a", "26-b", "27-c", "28-d", "29-e"], claim: "anachronism across five" },
      { chapters: ["02-b"], claim: "d" },
      { chapters: ["03-c"], claim: "e" },
    ];
    const r = ColdReadSchema.safeParse({
      lens: "airport",
      score_out_of_10: 7,
      would_finish: "yes",
      verdict: "v",
      strongest: spanning,
      weakest: spanning,
      quotes: [],
      put_down_points: [],
      who_is_this_for: "x",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an out-of-range score and an unknown finish verdict", () => {
    const base = {
      lens: "airport",
      score_out_of_10: 11,
      would_finish: "skimmed",
      verdict: "v",
      strongest: [
        { chapters: ["01-a"], claim: "c" },
        { chapters: ["02-b"], claim: "d" },
        { chapters: ["03-c"], claim: "e" },
      ],
      weakest: [
        { chapters: ["01-a", "02-b"], claim: "spans two chapters" },
        { chapters: ["02-b"], claim: "d" },
        { chapters: ["03-c"], claim: "e" },
      ],
      quotes: [],
      put_down_points: [],
      who_is_this_for: "x",
    };
    expect(ColdReadSchema.safeParse(base).success).toBe(false);
    expect(
      ColdReadSchema.safeParse({ ...base, score_out_of_10: 7, would_finish: "maybe" }).success
    ).toBe(false);
  });
});

describe("DEFAULT_LENSES", () => {
  it("has unique ids and non-empty prompt sections", () => {
    const ids = DEFAULT_LENSES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of DEFAULT_LENSES) {
      expect(l.label.length).toBeGreaterThan(0);
      expect(l.promptSection.trim().length).toBeGreaterThan(50);
    }
  });

  it("is large enough for disagreement to be measurable", () => {
    expect(DEFAULT_LENSES.length).toBeGreaterThanOrEqual(3);
  });

  it("assumes no particular genre — the roster must work on any novel", () => {
    // Regression: an earlier roster had a "thriller" lens that asked about clocks and
    // reversals, which is meaningless for a mosaic or a quiet domestic novel. Lenses
    // must derive their frame from the book instead of presuming one.
    const genreWords = /\bthriller\b|\bwhodunn?it\b|\bromance novel\b|\bsci-?fi\b|\bfantasy novel\b/i;
    for (const l of DEFAULT_LENSES) {
      expect(
        genreWords.test(l.promptSection),
        `lens '${l.id}' presumes a genre`
      ).toBe(false);
    }
  });

  it("includes a lens that checks the book against its own reference frame", () => {
    // The generalized form of "period plausibility": whatever the book claims fidelity
    // to — a period, a place, a profession, or only its own invented rules.
    const v = DEFAULT_LENSES.find((l) => l.id === "verisimilitude");
    expect(v).toBeDefined();
    expect(v!.promptSection).toMatch(/invented world|rules the book itself/i);
  });
});

describe("resolveLenses", () => {
  it("defaults to the full roster", () => {
    expect(resolveLenses(undefined, undefined)).toEqual(DEFAULT_LENSES);
  });

  it("treats empty arrays as unset rather than an empty panel", () => {
    expect(resolveLenses([], [])).toEqual(DEFAULT_LENSES);
  });

  it("applies a config override", () => {
    const r = resolveLenses(["airport", "literary"], undefined);
    expect(r.map((l) => l.id)).toEqual(["airport", "literary"]);
  });

  it("lets the CLI override the config", () => {
    const r = resolveLenses(["airport"], ["propulsion", "ordinary"]);
    expect(r.map((l) => l.id)).toEqual(["propulsion", "ordinary"]);
  });

  it("preserves the requested order", () => {
    const r = resolveLenses(undefined, ["ordinary", "airport", "literary"]);
    expect(r.map((l) => l.id)).toEqual(["ordinary", "airport", "literary"]);
  });

  it("throws on an unknown id rather than silently shrinking the panel", () => {
    // A quietly smaller panel would make two runs incomparable with nothing saying so.
    expect(() => resolveLenses(undefined, ["airport", "nope"])).toThrow(UnknownLensError);
    expect(() => resolveLenses(undefined, ["nope"])).toThrow(/nope/);
  });
});
