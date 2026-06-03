import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { appendEvent, readEvents } from "./store.js";
import { WorldEventSchema, type WorldEvent } from "./schema.js";

/**
 * One-time, idempotent import of an existing markdown-only book's world-state
 * into the event store, so an old book can be re-run on the new substrate.
 *
 * M2 scope: canon/continuity.md (canon-tier statements), logs/continuity.md
 * (drafted-tier statements), canon/glossary.md (entities). The story-arc /
 * scene-log / chapter-craft logs are DEFERRED to M3 — they need event types not
 * in the M1 vocabulary.
 *
 * Imports are FAITHFUL and TEXT-PRESERVING, not an atomization: each fact is
 * stored whole under the "statement" attribute with confidence:"inferred",
 * source:"import". Turning prose into clean entity.attribute=value triples is the
 * drafter's job in later milestones (and the subject of the M3.5 atomization
 * probe) — the importer must not fabricate structure the source never had.
 *
 * Multi-line entries are accumulated (a wrapped fact / definition keeps its
 * continuation lines), entry ids are collision-safe (two distinct terms never
 * merge), and any glossary line that still fails to parse is counted and surfaced
 * — silent loss into the append-only, git-committed log is the thing this guards.
 */

const pad = (n: number): string => String(n).padStart(3, "0");

const slug = (s: string): string =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "term";

const isHeadingOrRule = (line: string): boolean => /^\s*#/.test(line) || /^\s*---\s*$/.test(line);

/**
 * Parse architect-authored canon/continuity.md (a numbered hard-facts list).
 * A fact may wrap across lines (e.g. sub-points (a)/(b)/(c)); continuation lines
 * are kept so nothing is dropped. Pure.
 */
export function parseCanonContinuity(text: string): WorldEvent[] {
  const out: WorldEvent[] = [];
  let i = 0;
  let value: string | null = null;
  const flush = (): void => {
    if (value === null) return;
    i++;
    out.push(
      WorldEventSchema.parse({
        type: "fact.assert",
        id: `canon-continuity-${pad(i)}`,
        entity: "unattributed",
        attribute: "statement",
        value,
        tier: "canon",
        confidence: "inferred",
        provenance: { chapter: "canon", source: "import" },
      })
    );
    value = null;
  };
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*\d+\.\s+(.*\S)\s*$/);
    if (m) {
      flush();
      value = m[1];
    } else if (line.trim() === "" || isHeadingOrRule(line)) {
      flush();
    } else if (value !== null) {
      value += "\n" + line.replace(/\s+$/, ""); // continuation of the current fact
    }
    // else: preamble before the first numbered fact — ignore
  }
  flush();
  return out;
}

/** Parse drafter-accreted logs/continuity.md (timestamp blocks of column-0 `- ` bullets). Pure. */
export function parseDraftedContinuity(text: string): WorldEvent[] {
  const out: WorldEvent[] = [];
  let i = 0;
  for (const line of text.split("\n")) {
    const m = line.match(/^-\s+(.*\S)\s*$/); // column-0 bullets only (the writer never indents these)
    if (!m) continue;
    i++;
    out.push(
      WorldEventSchema.parse({
        type: "fact.assert",
        id: `legacy-continuity-${pad(i)}`,
        entity: "unattributed",
        attribute: "statement",
        value: m[1],
        tier: "drafted",
        confidence: "inferred",
        // chapter is unknown for legacy bullets; the "legacy" sentinel satisfies
        // the non-null provenance invariant without inventing a chapter.
        provenance: { chapter: "legacy", source: "import" },
      })
    );
  }
  return out;
}

/**
 * Parse canon/glossary.md (`**term** [annotation] — definition` entries) into
 * entities. Tolerates an optional inter-term annotation (e.g. `[V5]`,
 * `(deceased)`) — preserved in the gloss, NOT folded into the canonical term —
 * accumulates wrapped definitions, and assigns collision-safe ids so two
 * distinct terms that slug to the same base never merge. Pure.
 */
export function parseGlossary(text: string): WorldEvent[] {
  const out: WorldEvent[] = [];
  const seen = new Map<string, number>();
  let cur: { id: string; display: string; gloss: string } | null = null;
  const flush = (): void => {
    if (cur === null) return;
    out.push(
      WorldEventSchema.parse({
        type: "entity.upsert",
        id: cur.id,
        kind: "concept",
        display_name: cur.display,
        short_gloss: cur.gloss,
        provenance: { chapter: "canon", source: "import" },
      })
    );
    cur = null;
  };
  for (const line of text.split("\n")) {
    const m = line.match(/^\*\*(.+?)\*\*\s*([^—]*?)\s*—\s+(.*\S)\s*$/);
    if (m) {
      flush();
      const term = m[1].trim();
      const annotation = m[2].trim();
      const def = m[3].trim();
      const base = slug(term);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      cur = {
        id: n === 1 ? base : `${base}-${n}`,
        display: term,
        gloss: annotation ? `${annotation} — ${def}` : def,
      };
    } else if (line.trim() === "" || isHeadingOrRule(line) || /^\s*\*\*/.test(line)) {
      // blank / heading / rule / a bold line that didn't match the entry shape:
      // all are entry boundaries (an unmatched bold line is counted as skipped
      // by importLegacyBook so the loss is loud, not silent).
      flush();
    } else if (cur !== null) {
      cur.gloss += " " + line.trim(); // continuation of the current definition
    }
  }
  flush();
  return out;
}

async function readOrEmpty(path: string): Promise<string> {
  try {
    return await readFile(path, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw err;
  }
}

export interface ImportResult {
  written: number;
  skipped: boolean;
  /** Glossary `**...**` lines that failed to parse (surfaced so the loss isn't silent). */
  unparsedGlossaryLines: number;
}

/**
 * Read a book's legacy markdown and append the imported events to its store.
 * Idempotent: if the store already has any events, this is a no-op (skipped),
 * so re-running `cdk run` on an old book imports exactly once.
 */
export async function importLegacyBook(projectRoot: string): Promise<ImportResult> {
  const existing = await readEvents(projectRoot);
  if (existing.events.length > 0) return { written: 0, skipped: true, unparsedGlossaryLines: 0 };

  const glossaryText = await readOrEmpty(join(projectRoot, "canon", "glossary.md"));
  const glossaryEvents = parseGlossary(glossaryText);
  const boldLines = (glossaryText.match(/^\*\*/gm) ?? []).length;
  const unparsedGlossaryLines = Math.max(0, boldLines - glossaryEvents.length);
  if (unparsedGlossaryLines > 0) {
    console.warn(
      `[world import] ${unparsedGlossaryLines} glossary line(s) in canon/glossary.md did not parse and were skipped`
    );
  }

  const events = [
    ...glossaryEvents,
    ...parseCanonContinuity(await readOrEmpty(join(projectRoot, "canon", "continuity.md"))),
    ...parseDraftedContinuity(await readOrEmpty(join(projectRoot, "logs", "continuity.md"))),
  ];
  for (const ev of events) await appendEvent(projectRoot, ev);
  return { written: events.length, skipped: false, unparsedGlossaryLines };
}
