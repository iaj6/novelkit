import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WorldEventSchema } from "../src/world/schema.js";
import { project } from "../src/world/project.js";
import { renderCanonContinuity, renderGlossary } from "../src/world/views.js";
import {
  parseCanonContinuity,
  parseDraftedContinuity,
  parseGlossary,
  importLegacyBook,
} from "../src/world/import.js";
import { readEvents } from "../src/world/store.js";

const ev = (o: unknown) => WorldEventSchema.parse(o);
const canonStatement = (id: string, value: string) =>
  ev({ type: "fact.assert", id, entity: "unattributed", attribute: "statement", value, tier: "canon", provenance: { chapter: "canon", source: "import" } });

// extract the numbered hard-facts from a continuity.md (same regex the importer uses)
function numbered(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*\d+\.\s+(.*\S)\s*$/);
    if (m) out.push(m[1]);
  }
  return out;
}

// ── exporters ───────────────────────────────────────────────────────
describe("renderCanonContinuity()", () => {
  it("numbers live canon-tier statement facts; excludes drafted + superseded", () => {
    const tables = project([
      canonStatement("c1", "Fact one."),
      ev({ type: "fact.assert", id: "d1", entity: "unattributed", attribute: "statement", value: "A drafted fact.", tier: "drafted", provenance: { chapter: "legacy", source: "import" } }),
      canonStatement("c2", "Fact two."),
      ev({ type: "fact.assert", id: "c3", entity: "unattributed", attribute: "statement", value: "Old.", tier: "canon", provenance: { chapter: "canon", source: "import" } }),
      ev({ type: "fact.assert", id: "c4", entity: "unattributed", attribute: "statement", value: "New.", tier: "canon", supersedes: "c3", provenance: { chapter: "canon", source: "import" } }),
    ]);
    expect(renderCanonContinuity(tables)).toBe(
      "# Continuity\n\nHard facts that must not break in later drafting. These are binding.\n\n" +
        "1. Fact one.\n2. Fact two.\n3. New.\n"
    );
  });

  it("renders an atomized (non-statement) canon fact as entity — attribute: value+unit", () => {
    const tables = project([
      ev({ type: "fact.assert", id: "f", entity: "eira", attribute: "age", value: 52, unit: "years", tier: "canon", provenance: { chapter: "canon", source: "architect" } }),
    ]);
    expect(renderCanonContinuity(tables)).toContain("1. eira — age: 52 years");
  });

  it("renders a placeholder when there are no canon facts", () => {
    expect(renderCanonContinuity(project([]))).toContain("(none yet)");
  });
});

describe("renderGlossary()", () => {
  it("alphabetizes by display_name and excludes entities with no gloss", () => {
    const tables = project([
      ev({ type: "entity.upsert", id: "beta", kind: "concept", display_name: "Beta", short_gloss: "b def", provenance: { chapter: "canon", source: "import" } }),
      ev({ type: "entity.upsert", id: "alpha", kind: "concept", display_name: "Alpha", short_gloss: "a def", provenance: { chapter: "canon", source: "import" } }),
      ev({ type: "entity.upsert", id: "charlie", kind: "character", display_name: "Charlie", provenance: { chapter: "canon", source: "architect" } }),
    ]);
    expect(renderGlossary(tables)).toBe(
      "# Glossary\n\nAlphabetical. Definitions are brief and specific to this story's usage.\n\n---\n\n" +
        "**Alpha** — a def\n\n**Beta** — b def\n"
    );
  });

  it("dedupes by id (a later upsert wins) — fixing the legacy duplicate-term drift", () => {
    const tables = project([
      ev({ type: "entity.upsert", id: "x", kind: "concept", display_name: "X", short_gloss: "first", provenance: { chapter: "canon", source: "import" } }),
      ev({ type: "entity.upsert", id: "x", kind: "concept", display_name: "X", short_gloss: "second", provenance: { chapter: "05", source: "drafter" } }),
    ]);
    expect(renderGlossary(tables)).toContain("**X** — second");
    expect(renderGlossary(tables)).not.toContain("first");
  });
});

// ── pure parsers ────────────────────────────────────────────────────
describe("legacy parsers", () => {
  it("parseCanonContinuity: numbered lines -> canon-tier inferred statements", () => {
    const events = parseCanonContinuity("# Continuity\n\nPreamble.\n\n1. Alpha.\n2. Beta.\n");
    expect(events).toHaveLength(2);
    const f = events[0];
    if (f.type !== "fact.assert") throw new Error("wrong type");
    expect(f.tier).toBe("canon");
    expect(f.confidence).toBe("inferred");
    expect(f.value).toBe("Alpha.");
    expect(f.provenance.chapter).toBe("canon");
  });

  it("parseDraftedContinuity: `- ` bullets -> drafted-tier statements with legacy provenance", () => {
    const events = parseDraftedContinuity("\n## 2026-01-01T00:00:00.000Z\n- One.\n- Two.\n");
    expect(events).toHaveLength(2);
    const f = events[1];
    if (f.type !== "fact.assert") throw new Error("wrong type");
    expect(f.tier).toBe("drafted");
    expect(f.provenance.chapter).toBe("legacy");
  });

  it("parseGlossary: `**term** — def` -> deduped, slugged entities", () => {
    const events = parseGlossary("# Glossary\n\n---\n\n**Term A** — def a.\n\n**Term B** — def b.\n");
    expect(events).toHaveLength(2);
    const e = events[0];
    if (e.type !== "entity.upsert") throw new Error("wrong type");
    expect(e.id).toBe("term-a");
    expect(e.display_name).toBe("Term A");
    expect(e.short_gloss).toBe("def a.");
  });
});

// ── importer fidelity (silent-data-loss fixes from the M2 review) ────
describe("importer fidelity", () => {
  it("tolerates an inter-term annotation and preserves it in the gloss (vilcabamba '(deceased)' case)", () => {
    const events = parseGlossary("**Carrow, Reverend Thomas** (deceased) — A dead reverend of the expedition.\n");
    expect(events).toHaveLength(1);
    const e = events[0];
    if (e.type !== "entity.upsert") throw new Error("wrong type");
    expect(e.display_name).toBe("Carrow, Reverend Thomas"); // annotation NOT folded into the term
    expect(e.short_gloss).toContain("(deceased)");
    expect(e.short_gloss).toContain("A dead reverend");
  });

  it("tolerates a bracket annotation ([V5/V6])", () => {
    const events = parseGlossary("**Gus Pereira** [V5/V6] — A mill hand.\n");
    expect(events).toHaveLength(1);
    if (events[0].type !== "entity.upsert") throw new Error("wrong type");
    expect(events[0].display_name).toBe("Gus Pereira");
    expect(events[0].short_gloss).toContain("[V5/V6]");
  });

  it("assigns collision-safe ids so distinct terms that slug alike never merge (Rolf x3 case)", () => {
    const events = parseGlossary("**Rolf** — first.\n\n**rolf** — second.\n\n**ROLF** — third.\n");
    const ids = events.map((e) => (e.type === "entity.upsert" ? e.id : "")).sort();
    expect(ids).toEqual(["rolf", "rolf-2", "rolf-3"]);
    const rendered = renderGlossary(project(events));
    // all three distinct definitions survive into the view (no last-wins merge)
    expect(rendered).toContain("first.");
    expect(rendered).toContain("second.");
    expect(rendered).toContain("third.");
  });

  it("accumulates a multi-line numbered fact — sub-points are not dropped (vilcabamba fact-11 case)", () => {
    const events = parseCanonContinuity("1. The route has three legs:\n   (a) the river.\n   (b) the ridge.\n2. Next fact.\n");
    expect(events).toHaveLength(2);
    if (events[0].type !== "fact.assert") throw new Error("wrong type");
    expect(String(events[0].value)).toContain("(a) the river.");
    expect(String(events[0].value)).toContain("(b) the ridge.");
  });

  it("accumulates a wrapped glossary definition", () => {
    const events = parseGlossary("**Term** — line one\nline two of the definition.\n");
    expect(events).toHaveLength(1);
    if (events[0].type !== "entity.upsert") throw new Error("wrong type");
    expect(events[0].short_gloss).toContain("line one");
    expect(events[0].short_gloss).toContain("line two");
  });
});

// ── importLegacyBook (fs, idempotent) ───────────────────────────────
describe("importLegacyBook()", () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "novelkit-import-"));
    mkdirSync(join(root, "canon"), { recursive: true });
    mkdirSync(join(root, "logs"), { recursive: true });
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("imports continuity + glossary + drafted continuity once, then is a no-op", async () => {
    writeFileSync(join(root, "canon", "continuity.md"), "# Continuity\n\nP.\n\n1. Alpha fact.\n2. Beta fact.\n");
    writeFileSync(join(root, "canon", "glossary.md"), "# Glossary\n\n---\n\n**Term A** — def a.\n\n**Term B** — def b.\n");
    writeFileSync(join(root, "logs", "continuity.md"), "\n## 2026-01-01T00:00:00.000Z\n- Drafted one.\n");

    const first = await importLegacyBook(root);
    expect(first).toEqual({ written: 5, skipped: false, unparsedGlossaryLines: 0 }); // 2 canon + 2 entities + 1 drafted

    const { events } = await readEvents(root);
    expect(events).toHaveLength(5);

    const rendered = renderCanonContinuity(project(events));
    expect(rendered).toContain("1. Alpha fact.");
    expect(rendered).toContain("2. Beta fact.");

    // second run is idempotent
    const second = await importLegacyBook(root);
    expect(second).toEqual({ written: 0, skipped: true, unparsedGlossaryLines: 0 });
    expect((await readEvents(root)).events).toHaveLength(5);
  });

  it("tolerates a book missing some logs", async () => {
    writeFileSync(join(root, "canon", "continuity.md"), "# Continuity\n\n1. Only canon.\n");
    const r = await importLegacyBook(root);
    expect(r.written).toBe(1);
  });
});

// ── round-trip parity against a real committed book (press guarantee) ─
describe("press-parity round-trip", () => {
  it("import -> project -> renderCanonContinuity preserves the source's hard-facts list", () => {
    const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    const file = join(repo, "library", "coldwater-reach", "canon", "continuity.md");
    if (!existsSync(file)) return; // committed fixture absent (shouldn't happen in CI) — skip
    const raw = readFileSync(file, "utf-8");
    const sourceFacts = numbered(raw);
    expect(sourceFacts.length).toBeGreaterThan(0);

    const rendered = renderCanonContinuity(project(parseCanonContinuity(raw)));
    // content-agnostic: the rendered numbered facts must equal the source's, in order
    expect(numbered(rendered)).toEqual(sourceFacts);
  });

  it("glossary import is lossless on real committed books: one entity per bold line, no merges, no drops", () => {
    const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    // mix of clean / annotated / slug-colliding committed glossaries
    const books = ["coldwater-reach", "vilcabamba-expedition", "coldwater-reach-v031"];
    let checked = 0;
    for (const book of books) {
      const file = join(repo, "library", book, "canon", "glossary.md");
      if (!existsSync(file)) continue;
      const raw = readFileSync(file, "utf-8");
      const boldLines = (raw.match(/^\*\*/gm) ?? []).length;
      if (boldLines === 0) continue;
      checked++;
      const events = parseGlossary(raw);
      // annotation tolerance: every bold entry line parses (no silent drop)
      expect(events).toHaveLength(boldLines);
      // collision-safe: ids are unique, so project() keeps every entry
      const ids = events.map((e) => (e.type === "entity.upsert" ? e.id : ""));
      expect(new Set(ids).size).toBe(ids.length);
      // the rendered view keeps every entry (no last-wins merge)
      const renderedBold = (renderGlossary(project(events)).match(/^\*\*/gm) ?? []).length;
      expect(renderedBold).toBe(boldLines);
    }
    expect(checked).toBeGreaterThan(0); // at least one committed fixture must be exercised
  });
});
