import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WorldSession, deriveDiscourseIndex, phaseToSource } from "../src/world/session.js";
import { readEvents, WORLD_EVENTS_PATH } from "../src/world/store.js";
import { project } from "../src/world/project.js";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "novelkit-session-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("deriveDiscourseIndex / phaseToSource", () => {
  it("derives the discourse index from the NN- prefix", () => {
    expect(deriveDiscourseIndex("07-the-yard")).toBe(7);
    expect(deriveDiscourseIndex("no-number")).toBe(0);
  });
  it("maps phases to provenance sources (default drafter)", () => {
    expect(phaseToSource("architect")).toBe("architect");
    expect(phaseToSource("continuity-fact-audit")).toBe("audit");
    expect(phaseToSource("repair-fact-normalize")).toBe("repair");
    expect(phaseToSource("plotter")).toBe("drafter"); // default
  });
});

describe("WorldSession transaction + writes", () => {
  it("openChapter derives discourse index and makes subsequent writes inherit the chapter", async () => {
    const s = new WorldSession(root, "drafter");
    const { discourseIndex } = await s.openChapter({ chapterId: "07-the-yard", pov: ["reyes"] });
    expect(discourseIndex).toBe(7);
    await s.assertFact({ entity: "field-log", attribute: "notebook.count", value: 6, unit: "notebooks" });

    const { events } = await readEvents(root);
    const fact = events.find((e) => e.type === "fact.assert");
    if (!fact || fact.type !== "fact.assert") throw new Error("no fact");
    expect(fact.provenance.chapter).toBe("07-the-yard"); // inherited from open
    expect(fact.provenance.source).toBe("drafter");
  });

  it("stamps the session's provenance source", async () => {
    const s = new WorldSession(root, "architect");
    await s.openChapter({ chapterId: "canon" });
    await s.assertFact({ entity: "eira", attribute: "age", value: 52, unit: "years", tier: "canon" });
    const facts = await s.queryFacts({ entity: "eira" });
    expect(facts[0].provenance.source).toBe("architect");
    expect(facts[0].tier).toBe("canon");
  });

  it("rejects a numeric fact with no unit (write-boundary invariant)", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "01-x" });
    await expect(s.assertFact({ entity: "eira", attribute: "age", value: 52 })).rejects.toThrow(/unit/);
  });

  it("query_facts returns live facts; a superseding assert retires the old value", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "01-x" });
    const first = await s.assertFact({ entity: "field-log", attribute: "notebook.count", value: 6, unit: "notebooks" });
    // a later chapter changes it, superseding the prior fact id
    await s.openChapter({ chapterId: "11-y" });
    await s.assertFact({ entity: "field-log", attribute: "notebook.count", value: 7, unit: "notebooks", supersedes: first.id });
    const facts = await s.queryFacts({ entity: "field-log" });
    expect(facts).toHaveLength(1);
    expect(facts[0].value).toBe(7);
  });

  it("resolve_entity matches by id / display_name / alias substring", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "01-x" });
    await s.upsertEntity({ id: "eira-bowman", kind: "character", display_name: "Eira Bowman", aliases: ["the harbormaster"] });
    expect((await s.resolveEntity({ query: "harbormaster" })).map((e) => e.id)).toEqual(["eira-bowman"]);
    expect((await s.resolveEntity({ query: "EIRA" })).map((e) => e.id)).toEqual(["eira-bowman"]);
    expect(await s.resolveEntity({ query: "nobody" })).toEqual([]);
  });

  it("who_knows returns a knower's live stances at or before the as-of chapter", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "13-the-yard" });
    await s.learn({ knower: "@reader", proposition: { prop: "creature-intelligent" }, stance: "suspects", basis: "witnessed" });

    // not yet known as of an earlier chapter
    expect(await s.whoKnows({ knower: "@reader", asOfChapter: "10-earlier" })).toHaveLength(0);
    // known as of a later chapter
    const later = await s.whoKnows({ knower: "@reader", asOfChapter: "15-later" });
    expect(later).toHaveLength(1);
    expect(later[0].stance).toBe("suspects");
  });
});

describe("WorldSession close_chapter warn-gate (M3 shadow — warns, never refuses)", () => {
  it("flags a chapter that captured no facts as incomplete (but still closes)", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "01-x" });
    const r = await s.closeChapter({});
    expect(r.ok).toBe(true);
    expect(r.incomplete).toBe(true);
    expect(r.missing[0]).toMatch(/no facts/);
    // the close event records the incomplete flag
    const { events } = await readEvents(root);
    const close = events.find((e) => e.type === "chapter.close");
    if (!close || close.type !== "chapter.close") throw new Error("no close");
    expect(close.incomplete).toBe(true);
  });

  it("passes the gate when the chapter captured at least one fact", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "01-x" });
    await s.assertFact({ entity: "eira", attribute: "role", value: "harbormaster" });
    const r = await s.closeChapter({});
    expect(r.incomplete).toBe(false);
    expect(r.missing).toEqual([]);
  });
});

describe("chaos / resume: a kill mid-chapter leaves the store recoverable", () => {
  it("recovers a torn final write and leaves the chapter open-but-not-closed (resume re-attempts it)", async () => {
    // simulate the drafter writing chapter 03: open + one good fact...
    const s = new WorldSession(root, "drafter");
    await s.openChapter({ chapterId: "03-the-blow" });
    await s.assertFact({ entity: "breakwater", attribute: "length", value: 400, unit: "feet" });
    // ...then the process is KILLED mid-append of a second fact (a torn JSON line,
    // no newline) and close_chapter never runs.
    appendFileSync(join(root, WORLD_EVENTS_PATH), '{"v":1,"type":"fact.assert","id":"fact:03', "utf-8");

    // resume: the store reads back without throwing, dropping only the torn line
    const { events, skipped } = await readEvents(root);
    expect(skipped).toBe(1);
    const tables = project(events);

    // the good fact survived
    expect([...tables.facts.values()].some((f) => f.entity === "breakwater")).toBe(true);
    // the chapter is open but NOT closed -> a resume knows to re-draft it
    const ch = tables.chapters.get("03-the-blow");
    expect(ch).toBeDefined();
    expect(ch!.closed).toBe(false);

    // a fresh session can re-open + re-assert + close cleanly on resume
    const s2 = new WorldSession(root, "drafter");
    await s2.openChapter({ chapterId: "03-the-blow" });
    await s2.assertFact({ entity: "breakwater", attribute: "length", value: 400, unit: "feet" });
    const r = await s2.closeChapter({});
    expect(r.incomplete).toBe(false);
    const after = project((await readEvents(root)).events);
    expect(after.chapters.get("03-the-blow")!.closed).toBe(true);
  });
});

describe("WorldSession resolve-first canonicalization (M3.5)", () => {
  it("canonicalizes assert_fact entity to a known id via display_name, alias, or the id itself", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "01-x" });
    await s.upsertEntity({ id: "eira-bowman", kind: "character", display_name: "Eira Bowman", aliases: ["the harbormaster"] });
    await s.assertFact({ entity: "Eira Bowman", attribute: "age", value: 52, unit: "years" }); // by display_name
    await s.assertFact({ entity: "the harbormaster", attribute: "role", value: "harbormaster" }); // by alias
    await s.assertFact({ entity: "eira-bowman", attribute: "tenure_since", value: 1936, unit: "year" }); // by id
    // all three collapse onto the one canonical entity (the M3.5 key-agreement fix)
    const facts = await s.queryFacts({ entity: "eira-bowman" });
    expect(facts.map((f) => f.attribute).sort()).toEqual(["age", "role", "tenure_since"]);
  });

  it("leaves a genuinely new (unresolved) entity unchanged", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "01-x" });
    await s.assertFact({ entity: "brand-new-thing", attribute: "color", value: "green" });
    expect(await s.queryFacts({ entity: "brand-new-thing" })).toHaveLength(1);
  });

  it("canonicalizes across sessions (index seeds from the persisted store)", async () => {
    const s1 = new WorldSession(root);
    await s1.openChapter({ chapterId: "01-x" });
    await s1.upsertEntity({ id: "breakwater", kind: "place", display_name: "The Breakwater" });
    // a later session refers to it by name -> resolves to the canonical id
    const s2 = new WorldSession(root);
    await s2.openChapter({ chapterId: "11-y" });
    await s2.assertFact({ entity: "The Breakwater", attribute: "length", value: 400, unit: "feet" });
    expect((await s2.queryFacts({ entity: "breakwater" })).map((f) => f.attribute)).toEqual(["length"]);
  });

  it("does not canonicalize the reserved @reader knower", async () => {
    const s = new WorldSession(root);
    await s.openChapter({ chapterId: "13-x" });
    await s.learn({ knower: "@reader", proposition: { prop: "creature-intelligent" }, stance: "suspects" });
    expect(await s.whoKnows({ knower: "@reader", asOfChapter: "13-x" })).toHaveLength(1);
  });
});
