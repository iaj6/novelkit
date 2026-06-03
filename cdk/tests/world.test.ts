import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WorldEventSchema, validateWriteInvariants, READER } from "../src/world/schema.js";
import { appendEvent, readEvents, parseEvents, WORLD_EVENTS_PATH } from "../src/world/store.js";
import { project, tablesToJSON, liveFactsForEntity } from "../src/world/project.js";

// ── helpers ─────────────────────────────────────────────────────────
const ev = (o: unknown) => WorldEventSchema.parse(o);

function factObj(
  id: string,
  entity: string,
  attribute: string,
  value: string | number | boolean,
  unit?: string,
  chapter = "01-x",
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
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
  return o;
}

const GOOD_LINE = JSON.stringify(
  ev(factObj("f-good", "field-log", "notebook.count", 6, "notebooks"))
);

// ── schema ──────────────────────────────────────────────────────────
describe("WorldEventSchema", () => {
  it("parses a valid entity.upsert", () => {
    const e = ev({
      type: "entity.upsert",
      id: "reyes",
      kind: "character",
      display_name: "Dr. Imani Reyes",
      provenance: { chapter: "canon", source: "architect" },
    });
    expect(e.type).toBe("entity.upsert");
  });

  it("applies defaults (polarity=asserted, tier=drafted) on fact.assert", () => {
    const e = ev({
      type: "fact.assert",
      id: "f1",
      entity: "e",
      attribute: "a",
      value: "x",
      provenance: { chapter: "01-x", source: "drafter" },
    });
    if (e.type !== "fact.assert") throw new Error("wrong type");
    expect(e.polarity).toBe("asserted");
    expect(e.tier).toBe("drafted");
  });

  it("rejects an unknown event type (discriminated union)", () => {
    expect(() => ev({ type: "nope", provenance: { chapter: "x", source: "drafter" } })).toThrow();
  });

  it("rejects a record with no provenance.chapter", () => {
    expect(() =>
      ev({ type: "fact.assert", id: "f", entity: "e", attribute: "a", value: "v", provenance: { source: "drafter" } })
    ).toThrow();
  });

  it("rejects an invalid epistemic stance", () => {
    expect(() =>
      ev({
        type: "knowledge.learn",
        id: "k",
        knower: "reyes",
        proposition: { prop: "p" },
        stance: "vibes",
        asOf: { discourseIndex: 1 },
        provenance: { chapter: "01-x", source: "drafter" },
      })
    ).toThrow();
  });

  it("rejects a proposition carrying BOTH factRef and prop (strict union — no silent drop)", () => {
    expect(() =>
      ev({
        type: "knowledge.learn",
        id: "k",
        knower: "reyes",
        proposition: { factRef: "f", prop: "p" },
        stance: "knows",
        asOf: { discourseIndex: 1 },
        provenance: { chapter: "01-x", source: "drafter" },
      })
    ).toThrow();
  });

  it("accepts a single-key proposition (factRef or prop)", () => {
    expect(() =>
      ev({ type: "knowledge.learn", id: "k", knower: READER, proposition: { factRef: "f" }, stance: "knows", asOf: { discourseIndex: 1 }, provenance: { chapter: "01-x", source: "drafter" } })
    ).not.toThrow();
    expect(() =>
      ev({ type: "knowledge.learn", id: "k", knower: "reyes", proposition: { prop: "p" }, stance: "suspects", asOf: { discourseIndex: 1 }, provenance: { chapter: "01-x", source: "drafter" } })
    ).not.toThrow();
  });
});

describe("validateWriteInvariants", () => {
  it("accepts a numeric fact that carries a unit", () => {
    expect(() => validateWriteInvariants(ev(factObj("f", "reyes", "age", 52, "years")))).not.toThrow();
  });

  it("rejects a numeric fact with no unit", () => {
    expect(() => validateWriteInvariants(ev(factObj("f", "reyes", "age", 52)))).toThrow(/unit/);
  });

  it("accepts a string fact with no unit", () => {
    expect(() => validateWriteInvariants(ev(factObj("f", "reyes", "role", "xenobiologist")))).not.toThrow();
  });
});

// ── store + parse ───────────────────────────────────────────────────
describe("store (append/read)", () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "novelkit-world-"));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("appends and reads events back in order, at logs/world/events.jsonl", async () => {
    await appendEvent(root, {
      type: "entity.upsert",
      id: "reyes",
      kind: "character",
      display_name: "Reyes",
      provenance: { chapter: "canon", source: "architect" },
    });
    await appendEvent(root, factObj("f1", "field-log", "notebook.count", 6, "notebooks"));

    const { events, skipped } = await readEvents(root);
    expect(skipped).toBe(0);
    expect(events.map((e) => e.type)).toEqual(["entity.upsert", "fact.assert"]);

    const raw = readFileSync(join(root, WORLD_EVENTS_PATH), "utf-8");
    expect(raw.trim().split("\n")).toHaveLength(2);
  });

  it("returns empty for a book with no event log yet", async () => {
    const r = await readEvents(join(root, "never-run"));
    expect(r).toEqual({ events: [], skipped: 0 });
  });

  it("rejects a numeric fact with no unit at the write boundary", async () => {
    await expect(
      appendEvent(root, { type: "fact.assert", id: "f", entity: "reyes", attribute: "age", value: 52, provenance: { chapter: "canon", source: "architect" } })
    ).rejects.toThrow(/unit/);
  });

  it("persists schema defaults on the written event", async () => {
    const written = await appendEvent(root, factObj("fd", "e", "a", "x"));
    if (written.type !== "fact.assert") throw new Error("wrong type");
    expect(written.polarity).toBe("asserted");
    expect(written.tier).toBe("drafted");
  });

  it("readEvents tolerates a torn final line written to disk (killed mid-append)", async () => {
    await appendEvent(root, factObj("f1", "field-log", "notebook.count", 6, "notebooks"));
    // simulate a process killed mid-append: a partial JSON line with no newline
    appendFileSync(join(root, WORLD_EVENTS_PATH), '{"type":"fact.assert","id":"f2"', "utf-8");
    const { events, skipped } = await readEvents(root);
    expect(events).toHaveLength(1);
    expect(skipped).toBe(1);
  });
});

describe("parseEvents (chaos resilience)", () => {
  it("skips blank lines", () => {
    const r = parseEvents("\n\n" + GOOD_LINE + "\n\n");
    expect(r.events).toHaveLength(1);
    expect(r.skipped).toBe(0);
  });

  it("tolerates a torn final line (killed mid-append)", () => {
    const r = parseEvents(GOOD_LINE + "\n" + '{"type":"fact.assert","id":"f2"');
    expect(r.events).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });

  it("tolerates an invalid-but-parseable final line at EOF", () => {
    const r = parseEvents(GOOD_LINE + "\n" + '{"type":"fact.assert"}');
    expect(r.events).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });

  it("throws on corruption that is NOT at EOF (real damage)", () => {
    expect(() => parseEvents("garbage{\n" + GOOD_LINE)).toThrow(/line 1/);
  });
});

// ── projector ───────────────────────────────────────────────────────
describe("project()", () => {
  it("merges repeated entity.upserts (last display_name wins, props merge)", () => {
    const t = project([
      ev({ type: "entity.upsert", id: "reyes", kind: "character", display_name: "Reyes", props: { age: 52 }, provenance: { chapter: "canon", source: "architect" } }),
      ev({ type: "entity.upsert", id: "reyes", kind: "character", display_name: "Dr. Imani Reyes", props: { role: "xenobiologist" }, provenance: { chapter: "01-x", source: "drafter" } }),
    ]);
    const e = t.entities.get("reyes");
    expect(e?.display_name).toBe("Dr. Imani Reyes");
    expect(e?.props).toEqual({ age: 52, role: "xenobiologist" });
  });

  it("resolves fact supersession: old retired, new live, one live per lineage", () => {
    const t = project([
      ev(factObj("f1", "field-log", "notebook.count", 6, "notebooks", "01-x")),
      ev(factObj("f2", "field-log", "notebook.count", 7, "notebooks", "11-y", { supersedes: "f1" })),
    ]);
    expect(t.facts.get("f1")?.status).toBe("superseded");
    expect(t.facts.get("f1")?.supersededBy).toBe("f2");
    expect(t.facts.get("f2")?.status).toBe("live");
    expect(liveFactsForEntity(t, "field-log").map((f) => f.id)).toEqual(["f2"]);
  });

  it("preserves negated polarity", () => {
    const t = project([ev(factObj("fn", "creature", "dead", true, undefined, "01-x", { polarity: "negated" }))]);
    expect(t.facts.get("fn")?.polarity).toBe("negated");
  });

  it("projects relations incl. a negative (knows_of=false), with supersession", () => {
    const t = project([
      ev({ type: "relation.assert", id: "r1", from: "reyes", relType: "knows_of", to: "brandt", value: false, symmetric: true, provenance: { chapter: "canon", source: "architect" } }),
      ev({ type: "relation.assert", id: "r2", from: "reyes", relType: "knows_of", to: "brandt", value: true, supersedes: "r1", provenance: { chapter: "14-x", source: "drafter" } }),
    ]);
    expect(t.relations.get("r1")?.status).toBe("superseded");
    expect(t.relations.get("r2")?.value).toBe(true);
    expect(t.relations.get("r2")?.status).toBe("live");
  });

  it("resolves a supersession chain A<-B<-C (only the tip stays live)", () => {
    const t = project([
      ev(factObj("f1", "e", "a", "1", undefined, "01")),
      ev(factObj("f2", "e", "a", "2", undefined, "02", { supersedes: "f1" })),
      ev(factObj("f3", "e", "a", "3", undefined, "03", { supersedes: "f2" })),
    ]);
    expect(t.facts.get("f1")?.status).toBe("superseded");
    expect(t.facts.get("f2")?.status).toBe("superseded");
    expect(t.facts.get("f3")?.status).toBe("live");
    expect(liveFactsForEntity(t, "e").map((f) => f.id)).toEqual(["f3"]);
  });

  it("retracts a single record (record scope)", () => {
    const t = project([
      ev(factObj("f2", "field-log", "notebook.count", 7, "notebooks")),
      ev({ type: "retract", target: "f2", provenance: { chapter: "11-y", source: "repair" } }),
    ]);
    expect(t.facts.get("f2")?.status).toBe("retracted");
  });

  it("rolls a whole chapter back (chapter scope): records retracted, chapter row dropped", () => {
    const t = project([
      ev({ type: "chapter.open", chapterId: "03-z", discourseIndex: 3, provenance: { chapter: "03-z", source: "drafter" } }),
      ev(factObj("f3", "x", "a", "v", undefined, "03-z")),
      ev({ type: "retract", target: "03-z", scope: "chapter", provenance: { chapter: "03-z", source: "repair" } }),
    ]);
    expect(t.chapters.has("03-z")).toBe(false);
    expect(t.facts.get("f3")?.status).toBe("retracted");
  });

  it("tracks epistemic knowledge incl. @reader, with supersession", () => {
    const t = project([
      ev({ type: "knowledge.learn", id: "k1", knower: "reyes", proposition: { prop: "creature-intelligent" }, stance: "wonders", asOf: { discourseIndex: 13 }, provenance: { chapter: "13", source: "drafter" } }),
      ev({ type: "knowledge.learn", id: "k2", knower: "reyes", proposition: { prop: "creature-intelligent" }, stance: "believes", asOf: { discourseIndex: 15 }, supersedes: "k1", provenance: { chapter: "15", source: "drafter" } }),
      ev({ type: "knowledge.learn", id: "k3", knower: READER, proposition: { factRef: "f-voc" }, stance: "knows", asOf: { discourseIndex: 13 }, basis: "witnessed", provenance: { chapter: "13", source: "drafter" } }),
    ]);
    expect(t.knowledge.get("k1")?.status).toBe("superseded");
    expect(t.knowledge.get("k2")?.status).toBe("live");
    expect(t.knowledge.get("k3")?.knower).toBe("@reader");
  });

  it("opens then closes a chapter; carries the incomplete flag", () => {
    const t = project([
      ev({ type: "chapter.open", chapterId: "01-x", discourseIndex: 1, pov: ["reyes"], provenance: { chapter: "01-x", source: "drafter" } }),
      ev({ type: "chapter.close", chapterId: "01-x", incomplete: true, provenance: { chapter: "01-x", source: "drafter" } }),
    ]);
    const c = t.chapters.get("01-x");
    expect(c?.closed).toBe(true);
    expect(c?.incomplete).toBe(true);
    expect(c?.pov).toEqual(["reyes"]);
  });

  it("records a close-without-open as a closed stub", () => {
    const t = project([ev({ type: "chapter.close", chapterId: "99-q", provenance: { chapter: "99-q", source: "drafter" } })]);
    expect(t.chapters.get("99-q")?.closed).toBe(true);
    expect(t.chapters.get("99-q")?.discourseIndex).toBe(-1);
  });

  it("orders tablesToJSON by codepoint (locale-independent), not collation", () => {
    // ids chosen so locale collation and codepoint order DIVERGE — this pins the
    // cross-machine determinism guarantee (localeCompare would reorder these).
    const ids = ["Field-Log", "field-log", "ångström-probe", "reséndez", "01-x"];
    const t = project(
      ids.map((id) =>
        ev({ type: "entity.upsert", id, kind: "object", display_name: id, provenance: { chapter: "canon", source: "architect" } })
      )
    );
    expect((tablesToJSON(t).entities as Array<{ id: string }>).map((e) => e.id)).toEqual([
      "01-x", "Field-Log", "field-log", "reséndez", "ångström-probe",
    ]);
  });

  it("is deterministic: same events -> byte-identical serialization", () => {
    const events = [
      ev({ type: "chapter.open", chapterId: "01-x", discourseIndex: 1, pov: ["reyes"], provenance: { chapter: "01-x", source: "drafter" } }),
      ev({ type: "entity.upsert", id: "reyes", kind: "character", display_name: "Reyes", provenance: { chapter: "canon", source: "architect" } }),
      ev(factObj("f1", "field-log", "notebook.count", 6, "notebooks", "01-x")),
      ev(factObj("f2", "field-log", "notebook.count", 7, "notebooks", "11-y", { supersedes: "f1" })),
      ev({ type: "knowledge.learn", id: "k1", knower: READER, proposition: { factRef: "f1" }, stance: "knows", asOf: { discourseIndex: 1 }, provenance: { chapter: "01-x", source: "drafter" } }),
      ev({ type: "chapter.close", chapterId: "01-x", provenance: { chapter: "01-x", source: "drafter" } }),
    ];
    expect(JSON.stringify(tablesToJSON(project(events)))).toBe(
      JSON.stringify(tablesToJSON(project(events)))
    );
  });

  it("returns immutable snapshots: mutating a projection does not corrupt re-projection", () => {
    const events = [
      ev({ type: "chapter.open", chapterId: "01-x", discourseIndex: 1, pov: ["reyes"], provenance: { chapter: "01-x", source: "drafter" } }),
    ];
    const first = project(events);
    first.chapters.get("01-x")!.pov.push("intruder");
    const second = project(events);
    expect(second.chapters.get("01-x")!.pov).toEqual(["reyes"]);
  });

  it("prefix replay is consistent: projecting 0..k matches the head of 0..n for those records", () => {
    const events = [
      ev(factObj("f1", "e", "a", "1", undefined, "01-x")),
      ev(factObj("f2", "e", "b", "2", undefined, "01-x")),
      ev(factObj("f3", "e", "c", "3", undefined, "02-y")),
    ];
    const prefix = project(events.slice(0, 2));
    const full = project(events);
    expect(tablesToJSON(prefix).facts).toEqual(
      tablesToJSON(full).facts.filter((f) => ["f1", "f2"].includes((f as { id: string }).id))
    );
  });
});
