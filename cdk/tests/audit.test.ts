import { describe, it, expect } from "vitest";
import { WorldEventSchema } from "../src/world/schema.js";
import { project } from "../src/world/project.js";
import { findContradictions, findRecordDivergences, findRelationConflicts, worldStoreStats, CANONICAL_ATTRIBUTES } from "../src/world/audit.js";

const ev = (o: unknown) => WorldEventSchema.parse(o);

function fact(
  id: string,
  entity: string,
  attribute: string,
  value: string | number | boolean,
  unit?: string,
  chapter = "01-x",
  extra: Record<string, unknown> = {}
) {
  const o: Record<string, unknown> = {
    type: "fact.assert",
    id,
    entity,
    attribute,
    value,
    provenance: { chapter, source: "drafter" },
    ...extra,
  };
  if (unit !== undefined) o.unit = unit;
  return ev(o);
}

describe("findContradictions", () => {
  // NOTE: these generic-mechanism tests use INVARIANT attributes (birth_year, native_language) as the
  // numeric/string stand-ins. `age`/`role`/`alive` are TIME_VARYING under M8 — a cross-chapter change is
  // succession, not a conflict — so they are exercised in the dedicated M8 block below, not here.
  it("flags two live facts on the same entity.attribute with different values", () => {
    const t = project([
      fact("f1", "eira", "birth_year", 1918, undefined, "02-a"),
      fact("f2", "eira", "birth_year", 1920, undefined, "11-b"),
    ]);
    const found = findContradictions(t);
    expect(found).toHaveLength(1);
    expect(found[0].category).toBe("continuity-fact");
    expect(found[0].severity).toBe("high");
    expect(found[0].evidence.map((e) => e.fact_id).sort()).toEqual(["f1", "f2"]);
  });

  it("does NOT flag a restatement (same normalized value)", () => {
    const t = project([
      fact("f1", "eira", "birth_year", 1918, undefined, "02-a"),
      fact("f2", "eira", "birth_year", 1918, undefined, "11-b"),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("does NOT flag when one fact supersedes the other (only one live)", () => {
    const t = project([
      fact("f1", "eira", "birth_year", 1918, undefined, "02-a"),
      fact("f2", "eira", "birth_year", 1920, undefined, "11-b", { supersedes: "f1" }),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("normalizes string case/whitespace (no false conflict) but still catches real differences", () => {
    const same = project([
      fact("f1", "eira", "native_language", "German", undefined, "02-a"),
      fact("f2", "eira", "native_language", "german ", undefined, "11-b"),
    ]);
    expect(findContradictions(same)).toEqual([]);

    const diff = project([
      fact("f1", "eira", "native_language", "german", undefined, "02-a"),
      fact("f2", "eira", "native_language", "english", undefined, "11-b"),
    ]);
    expect(findContradictions(diff)).toHaveLength(1);
  });

  it("flags a dangling supersedes (points at no known fact)", () => {
    const t = project([fact("f1", "eira", "age", 52, "years", "02-a", { supersedes: "ghost" })]);
    const found = findContradictions(t);
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("low");
    expect(found[0].title).toMatch(/supersedes/i);
  });

  it("is deterministic (stable id-sorted output)", () => {
    const events = [
      fact("f1", "eira", "birth_year", 1918, undefined, "02-a"),
      fact("f2", "eira", "birth_year", 1920, undefined, "11-b"),
      fact("f3", "marcus", "birth_year", 1947, undefined, "04-c"),
      fact("f4", "marcus", "birth_year", 1950, undefined, "09-d"),
    ];
    const a = findContradictions(project(events)).map((f) => f.id);
    const b = findContradictions(project(events)).map((f) => f.id);
    expect(a).toEqual(b);
    expect(a).toEqual([...a].sort());
  });
});

describe("M8 time-indexed attributes — cross-chapter change is succession, not a contradiction", () => {
  it("does NOT flag a TIME_VARYING numeric attr changing across chapters (the m7 age 17→18 FP)", () => {
    // Hannah ages over a story spanning years; two live `age` values in different chapters is correct.
    const t = project([
      fact("f1", "hannah", "age", 17, "years", "03-a"),
      fact("f2", "hannah", "age", 18, "years", "20-b"),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("does NOT flag a TIME_VARYING string attr (role) re-registering across chapters (the m7 role FP)", () => {
    const t = project([
      fact("f1", "eira", "role", "harbormaster", undefined, "02-a"),
      fact("f2", "eira", "role", "lighthouse keeper", undefined, "18-b"),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("does NOT flag `alive` going true→false across chapters (a character dies)", () => {
    const t = project([
      fact("f1", "marcus", "alive", true, undefined, "02-a"),
      fact("f2", "marcus", "alive", false, undefined, "26-z"),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("STILL flags an INVARIANT attr (birth_year) changing across chapters — recall preserved", () => {
    const t = project([
      fact("f1", "hannah", "birth_year", 1918, undefined, "03-a"),
      fact("f2", "hannah", "birth_year", 1920, undefined, "20-b"),
    ]);
    expect(findContradictions(t)).toHaveLength(1);
  });

  it("flags a TIME_VARYING attr only on a SAME-chapter clash (two distinct values in one chapter)", () => {
    // Forge two live age facts in one chapter with distinct ids (the assert path overwrites per-chapter,
    // but a future non-overwriting source could produce this — the FP-0 floor must still catch it).
    const t = project([
      fact("f1", "hannah", "age", 17, "years", "07-a"),
      fact("f2", "hannah", "age", 40, "years", "07-a", { id: "fact:07-a:hannah:age:b" }),
    ]);
    const found = findContradictions(t);
    expect(found).toHaveLength(1);
    expect(found[0].evidence.every((e) => e.chapter === "07-a")).toBe(true);
  });

  it("scopes the same-chapter-clash evidence to ONLY the clashing chapter, skipping earlier clean succession chapters", () => {
    // Succession (17→18 across clean chapters 03-a, 05-a) coexists with a real same-chapter clash in the
    // LATER chapter 07-a. The finding's evidence must include ONLY the two 07-a facts — not the innocent
    // succession values — AND the loop must continue PAST the clean chapters to reach 07-a. (Guards the
    // sameChapterClash `return chFacts` (not the whole group) + the lexicographic continue branch.)
    const t = project([
      fact("c0", "hannah", "age", 17, "years", "03-a"), // clean chapter (single value)
      fact("c1", "hannah", "age", 18, "years", "05-a"), // clean chapter (single value)
      fact("c2", "hannah", "age", 17, "years", "07-a"),
      fact("c3", "hannah", "age", 40, "years", "07-a"), // distinct id -> same-chapter clash in 07-a
    ]);
    const found = findContradictions(t);
    expect(found).toHaveLength(1);
    expect(found[0].evidence.map((e) => e.fact_id).sort()).toEqual(["c2", "c3"]);
    expect(found[0].evidence.every((e) => e.chapter === "07-a")).toBe(true);
  });

  it("does NOT flag `marital_status` changing across chapters (time-varying succession)", () => {
    const t = project([
      fact("f1", "eira", "marital_status", "single", undefined, "02-a"),
      fact("f2", "eira", "marital_status", "married", undefined, "18-b"),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("treats a place-FACT `located_in` as INVARIANT — the design distinction from the time-varying RELATION", () => {
    // `located_in` is NOT in TIME_VARYING_ATTRIBUTES: a town's containing county does not move, so two
    // distinct fact-values across chapters STILL flag. (Guards the load-bearing fact-vs-relation split:
    // if someone later adds `located_in` to the time-varying set "to match relations", this fails.)
    const t = project([
      fact("f1", "coldwater", "located_in", "Erie County", undefined, "02-a"),
      fact("f2", "coldwater", "located_in", "Niagara County", undefined, "18-b"),
    ]);
    expect(findContradictions(t)).toHaveLength(1);
  });
});

describe("find_contradictions excludes free-text statements", () => {
  it("never flags distinct unattributed.statement facts as a contradiction (M6: append_continuity writes these)", () => {
    const t = project([
      fact("s1", "unattributed", "statement", "The harbor froze in 1891.", undefined, "01-a"),
      fact("s2", "unattributed", "statement", "Eira keeps a brass key.", undefined, "02-b"),
      fact("s3", "unattributed", "statement", "The lighthouse went dark in winter.", undefined, "03-c"),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });
});

describe("M7 anchor-fact win — verbatim-document drift caught via anchor facts (the m6 evidence)", () => {
  it("flags the real coldwater-reach m6 harbor-log divergence (ch01 vs ch29) as a contradiction", () => {
    // The harbor log is re-improvised across chapters; once its load-bearing values are
    // captured as facts on ONE document entity, the existing findContradictions (Tier 1,
    // zero new audit code) catches the drift the verbatim-text audit can't (the drafter
    // never reproduced a canonical string to diff against).
    const t = project([
      fact("h1", "harbor-log-oct12", "discovery_time", "0615", undefined, "01-the-breakwater"),
      fact("h2", "harbor-log-oct12", "wind", "NW 15kts", undefined, "01-the-breakwater"),
      fact("h3", "harbor-log-oct12", "discovery_time", "0610", undefined, "29-the-harbor-log"),
      fact("h4", "harbor-log-oct12", "wind", "NW 30", undefined, "29-the-harbor-log"),
    ]);
    const found = findContradictions(t);
    expect(found).toHaveLength(2); // discovery_time (0615≠0610) + wind ("NW 15kts"≠"NW 30")
    expect(found.some((f) => f.title.includes("discovery_time"))).toBe(true);
    expect(found.some((f) => f.title.includes("wind"))).toBe(true);
    expect(found.every((f) => f.severity === "high")).toBe(true);
  });
});

describe("findRecordDivergences (M7 registration-drift)", () => {
  const rec = (id: string, recordId: string, text: string, chapter = "01-x", extra: Record<string, unknown> = {}) =>
    ev({ type: "record.upsert", id, recordId, label: recordId, text, provenance: { chapter, source: "drafter" }, ...extra });

  it("flags one recordId registered with conflicting canonical text across chapters", () => {
    const t = project([
      rec("r1", "harbor-log", "0615 discovery, NW 15kts", "01-the-breakwater"),
      rec("r2", "harbor-log", "0610 discovery, NW 30 gusting", "29-the-harbor-log"),
    ]);
    const found = findRecordDivergences(t);
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
    expect(found[0].title).toContain("harbor-log");
  });

  it("does NOT flag a single registration, identical re-registration, or distinct documents", () => {
    const t = project([
      rec("r1", "harbor-log", "0615 discovery", "01-x"),
      rec("r1", "harbor-log", "0615 discovery", "29-y"), // same id -> overwrites; one live text
      rec("r3", "letter", "Dear Albrecht", "05-z"),
    ]);
    expect(findRecordDivergences(t)).toEqual([]);
  });

  it("compares only LIVE texts — a superseded prior body is not a conflict", () => {
    const t = project([
      rec("r1", "harbor-log", "draft text", "01-x"),
      rec("r2", "harbor-log", "final text", "02-y", { supersedes: "r1" }),
    ]);
    expect(findRecordDivergences(t)).toEqual([]);
  });
});

describe("worldStoreStats", () => {
  it("reports clean-slot rate, off-vocab, and unresolved-entity counts", () => {
    const t = project([
      ev({ type: "entity.upsert", id: "eira", kind: "character", display_name: "Eira", provenance: { chapter: "canon", source: "architect" } }),
      fact("f1", "eira", "age", 52, "years", "02-a"), // canonical character attr
      fact("f2", "eira", "years_old", 52, "years", "02-a"), // off-vocab synonym
      fact("f3", "eira", "statement", "Eira keeps the harbor log.", undefined, "02-a"), // free-text
      fact("f4", "ghost-entity", "color", "green", undefined, "03-z"), // unresolved entity
    ]);
    const s = worldStoreStats(t);
    expect(s.liveFacts).toBe(4);
    expect(s.statements).toBe(1);
    expect(s.cleanSlotRate).toBeCloseTo(0.75, 5);
    expect(s.offVocabAttributes).toBe(1); // years_old
    expect(s.unresolvedEntityRefs).toBe(1); // ghost-entity
  });
});

describe("CANONICAL_ATTRIBUTES", () => {
  it("lists per-kind canonical keys", () => {
    expect(CANONICAL_ATTRIBUTES.character.has("age")).toBe(true);
    expect(CANONICAL_ATTRIBUTES.place.has("located_in")).toBe(true);
  });
});

describe("findContradictions precision (M5 review fixes — FP-0)", () => {
  it("does NOT false-conflict a number and a numeric string of the same value", () => {
    const same = project([
      fact("f1", "eira", "birth_year", 1918, undefined, "02-a"),
      fact("f2", "eira", "birth_year", "1918", undefined, "11-b"),
    ]);
    expect(findContradictions(same)).toEqual([]);
    // a real numeric difference still flags
    const diff = project([
      fact("f1", "eira", "birth_year", 1918, undefined, "02-a"),
      fact("f2", "eira", "birth_year", "1920", undefined, "11-b"),
    ]);
    expect(findContradictions(diff)).toHaveLength(1);
  });

  it("resolves boolean polarity on an INVARIANT attr: fictional=true vs fictional=false(negated) is NOT a conflict", () => {
    const same = project([
      fact("f1", "brennan-isle", "fictional", true, undefined, "02-a"),
      fact("f2", "brennan-isle", "fictional", false, undefined, "20-z", { polarity: "negated" }),
    ]);
    expect(findContradictions(same)).toEqual([]);
    // a genuine boolean disagreement on an invariant attr still flags
    const conflict = project([
      fact("f1", "brennan-isle", "fictional", true, undefined, "02-a"),
      fact("f2", "brennan-isle", "fictional", false, undefined, "20-z"),
    ]);
    expect(findContradictions(conflict)).toHaveLength(1);
  });

  it("group key (JSON array) never merges distinct (entity, attribute) pairs", () => {
    const t = project([
      fact("f1", "a b", "c", 1, undefined, "02-a"),
      fact("f2", "a", "b c", 2, undefined, "11-b"),
    ]);
    expect(findContradictions(t)).toEqual([]); // distinct groups, not one false conflict
  });

  it("finding ids stay unique when entity/attribute contain a colon (encodeURIComponent)", () => {
    const t = project([
      fact("f1", "x:y", "z", 1, undefined, "02-a"),
      fact("f2", "x:y", "z", 2, undefined, "11-b"),
      fact("f3", "x", "y:z", 1, undefined, "02-a"),
      fact("f4", "x", "y:z", 2, undefined, "11-b"),
    ]);
    const found = findContradictions(t);
    expect(found).toHaveLength(2);
    expect(new Set(found.map((f) => f.id)).size).toBe(2); // a colon-join would collapse these to 1
  });
});

describe("findRelationConflicts (functional spatial relations)", () => {
  const rel = (
    id: string,
    from: string,
    relType: string,
    to: string,
    chapter = "01-x",
    extra: Record<string, unknown> = {}
  ) => ev({ type: "relation.assert", id, from, relType, to, provenance: { chapter, source: "drafter" }, ...extra });

  it("flags two live located_in targets WITHIN one chapter (same-moment clash), flag-only", () => {
    const t = project([
      rel("r1", "mabel", "located_in", "house-north", "07-a"),
      rel("r2", "mabel", "located_in", "house-south", "07-a"),
    ]);
    const found = findRelationConflicts(t);
    expect(found).toHaveLength(1);
    expect(found[0].category).toBe("continuity-fact");
    expect(found[0].severity).toBe("medium");
    expect(found[0].repair_agent).toBeNull();
    expect(found[0].auto_repair_safe).toBe(false);
    expect(found[0].description).toMatch(/relocation/i);
    expect(found[0].evidence.map((e) => e.fact_id).sort()).toEqual(["r1", "r2"]);
  });

  it("M8: does NOT flag two located_in targets in DIFFERENT chapters (a legitimate relocation)", () => {
    const t = project([
      rel("r1", "mabel", "located_in", "house-north", "07-a"),
      rel("r2", "mabel", "located_in", "house-south", "13-b"),
    ]);
    expect(findRelationConflicts(t)).toEqual([]);
  });

  it("does NOT flag a single target, or two relations to the SAME place", () => {
    expect(findRelationConflicts(project([rel("r1", "x", "lives_at", "a", "01")]))).toEqual([]);
    expect(
      findRelationConflicts(
        project([rel("r1", "x", "lives_at", "a", "01"), rel("r2", "x", "lives_at", "a", "05")])
      )
    ).toEqual([]);
  });

  it("does NOT flag many-valued relation types (knows_of, holds_adjacency_to are off the allow-list)", () => {
    const t = project([
      rel("r1", "x", "knows_of", "a", "01"),
      rel("r2", "x", "knows_of", "b", "02"),
      rel("r3", "x", "holds_adjacency_to", "p", "01"),
      rel("r4", "x", "holds_adjacency_to", "q", "02"),
    ]);
    expect(findRelationConflicts(t)).toEqual([]);
  });

  it("does NOT flag when one relation supersedes the other (only one live)", () => {
    const t = project([
      rel("r1", "x", "located_in", "a", "01"),
      rel("r2", "x", "located_in", "b", "05", { supersedes: "r1" }),
    ]);
    expect(findRelationConflicts(t)).toEqual([]);
  });

  it("FP-0: a positive + a negative claim to DIFFERENT places (in A, not in B) is consistent — no flag", () => {
    const t = project([
      rel("r1", "x", "located_in", "a", "01"), // in A
      rel("r2", "x", "located_in", "b", "05", { value: false }), // not in B
    ]);
    expect(findRelationConflicts(t)).toEqual([]);
  });

  it("FP-0: two NEGATIVE claims (not A, not B) never flag", () => {
    const t = project([
      rel("r1", "x", "located_in", "a", "01", { value: false }),
      rel("r2", "x", "located_in", "b", "05", { value: false }),
    ]);
    expect(findRelationConflicts(t)).toEqual([]);
  });

  it("flags a place asserted both present and absent WITHIN one chapter (lives_at A AND not lives_at A)", () => {
    const t = project([
      rel("r1", "x", "lives_at", "a", "07"), // lives at A
      rel("r2", "x", "lives_at", "a", "07", { value: false }), // does not live at A (same chapter)
    ]);
    const found = findRelationConflicts(t);
    expect(found).toHaveLength(1);
    expect(found[0].description).toMatch(/not a/i);
  });

  it("M8: present-then-absent across DIFFERENT chapters is a move-out, not a contradiction", () => {
    const t = project([
      rel("r1", "x", "lives_at", "a", "01"), // lives at A
      rel("r2", "x", "lives_at", "a", "07", { value: false }), // no longer at A, later
    ]);
    expect(findRelationConflicts(t)).toEqual([]);
  });

  it("M8: skips a clean earlier chapter and flags a multi-place clash in a LATER chapter, scoped to it", () => {
    // ch01 is clean (single place); the clash is in the later ch07. The per-chapter loop must CONTINUE
    // past the clean chapter and emit one finding scoped to ch07 (evidence b,c — not the innocent ch01 a).
    const t = project([
      rel("r1", "mabel", "located_in", "house-a", "01"), // clean, earlier
      rel("r2", "mabel", "located_in", "house-b", "07"),
      rel("r3", "mabel", "located_in", "house-c", "07"), // multi-place clash in 07
    ]);
    const found = findRelationConflicts(t);
    expect(found).toHaveLength(1);
    expect(found[0].evidence.map((e) => e.fact_id).sort()).toEqual(["r2", "r3"]);
    expect(found[0].evidence.every((e) => e.chapter === "07")).toBe(true);
  });

  it("is deterministic (stable id-sorted output)", () => {
    const events = [
      rel("r1", "x", "located_in", "a", "01"),
      rel("r2", "x", "located_in", "b", "01"),
      rel("r3", "y", "lives_at", "c", "01"),
      rel("r4", "y", "lives_at", "d", "01"),
    ];
    const a = findRelationConflicts(project(events)).map((f) => f.id);
    const b = findRelationConflicts(project(events)).map((f) => f.id);
    expect(a).toEqual(b);
    expect(a).toEqual([...a].sort());
    expect(a).toHaveLength(2);
  });
});
