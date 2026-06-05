import { describe, it, expect } from "vitest";
import { WorldEventSchema } from "../src/world/schema.js";
import { project } from "../src/world/project.js";
import { findContradictions, worldStoreStats, CANONICAL_ATTRIBUTES } from "../src/world/audit.js";

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
  it("flags two live facts on the same entity.attribute with different values", () => {
    const t = project([
      fact("f1", "eira", "age", 52, "years", "02-a"),
      fact("f2", "eira", "age", 54, "years", "11-b"),
    ]);
    const found = findContradictions(t);
    expect(found).toHaveLength(1);
    expect(found[0].category).toBe("continuity-fact");
    expect(found[0].severity).toBe("high");
    expect(found[0].evidence.map((e) => e.fact_id).sort()).toEqual(["f1", "f2"]);
  });

  it("does NOT flag a restatement (same normalized value)", () => {
    const t = project([
      fact("f1", "eira", "age", 52, "years", "02-a"),
      fact("f2", "eira", "age", 52, "years", "11-b"),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("does NOT flag when one fact supersedes the other (only one live)", () => {
    const t = project([
      fact("f1", "eira", "age", 52, "years", "02-a"),
      fact("f2", "eira", "age", 54, "years", "11-b", { supersedes: "f1" }),
    ]);
    expect(findContradictions(t)).toEqual([]);
  });

  it("normalizes string case/whitespace (no false conflict) but still catches real differences", () => {
    const same = project([
      fact("f1", "eira", "role", "Harbormaster", undefined, "02-a"),
      fact("f2", "eira", "role", "harbormaster ", undefined, "11-b"),
    ]);
    expect(findContradictions(same)).toEqual([]);

    const diff = project([
      fact("f1", "eira", "role", "harbormaster", undefined, "02-a"),
      fact("f2", "eira", "role", "lighthouse keeper", undefined, "11-b"),
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
      fact("f1", "eira", "age", 52, "years", "02-a"),
      fact("f2", "eira", "age", 54, "years", "11-b"),
      fact("f3", "marcus", "age", 47, "years", "04-c"),
      fact("f4", "marcus", "age", 50, "years", "09-d"),
    ];
    const a = findContradictions(project(events)).map((f) => f.id);
    const b = findContradictions(project(events)).map((f) => f.id);
    expect(a).toEqual(b);
    expect(a).toEqual([...a].sort());
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
      fact("f1", "eira", "age", 52, "years", "02-a"),
      fact("f2", "eira", "age", "52", undefined, "11-b"),
    ]);
    expect(findContradictions(same)).toEqual([]);
    // a real numeric difference still flags
    const diff = project([
      fact("f1", "eira", "age", 52, "years", "02-a"),
      fact("f2", "eira", "age", "54", undefined, "11-b"),
    ]);
    expect(findContradictions(diff)).toHaveLength(1);
  });

  it("resolves boolean polarity: alive=true vs alive=false(negated) is NOT a conflict (both mean alive)", () => {
    const same = project([
      fact("f1", "eira", "alive", true, undefined, "02-a"),
      fact("f2", "eira", "alive", false, undefined, "20-z", { polarity: "negated" }),
    ]);
    expect(findContradictions(same)).toEqual([]);
    // a genuine boolean disagreement still flags
    const conflict = project([
      fact("f1", "eira", "alive", true, undefined, "02-a"),
      fact("f2", "eira", "alive", false, undefined, "20-z"),
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
