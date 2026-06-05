import { READER } from "./schema.js";
import type { WorldTables, ProjectedKnowledge } from "./project.js";

/** Stable key for a proposition (a fact ref or a free proposition slug). */
export function propKey(p: { factRef: string } | { prop: string }): string {
  return "factRef" in p ? `f=${p.factRef}` : `p=${p.prop}`;
}

/**
 * Latest LIVE stance per proposition for one knower, at or before a discourse
 * index — "what does X believe RIGHT NOW (as of N)". This is the M5.5 fix for the
 * who_knows latest-wins bug: a knower whose stance changed across chapters resolves
 * to its most-recent stance, not its full history. Deterministic (ties broken by
 * id codepoint, sorted output).
 */
export function latestKnowledge(
  tables: WorldTables,
  knower: string,
  asOfDiscourse: number
): ProjectedKnowledge[] {
  const latest = new Map<string, ProjectedKnowledge>();
  for (const k of tables.knowledge.values()) {
    if (k.status !== "live" || k.knower !== knower || k.asOf.discourseIndex > asOfDiscourse) continue;
    const key = propKey(k.proposition);
    const cur = latest.get(key);
    if (
      !cur ||
      k.asOf.discourseIndex > cur.asOf.discourseIndex ||
      (k.asOf.discourseIndex === cur.asOf.discourseIndex && k.id > cur.id)
    ) {
      latest.set(key, k);
    }
  }
  return [...latest.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export interface IronyGap {
  /** Internal dedup/sort key (propKey form: `p=<slug>` or `f=<factId>`). */
  proposition: string;
  /** Human-readable proposition (the slug or fact id, no `p=`/`f=` prefix) — what the dramatic_irony tool surfaces. */
  readable: string;
  readerStance: string;
  character: string;
  characterStance: string;
}

// Stance sets align with the drafter's reveal menu (phases/drafter.ts): a reader who
// knows / believes / suspects a proposition is "ahead"; a character who is unaware of
// it or actively wrong about it is "behind". (A character "concealing" it KNOWS it, so
// is not behind; a reader who only "wonders" holds no position, so is not ahead.)
const READER_AHEAD = new Set(["knows", "believes", "suspects"]);
const CHARACTER_BEHIND = new Set(["unaware", "wrong_believes"]);

/**
 * Dramatic-irony gaps as of a discourse index: propositions the @reader
 * knows/believes/suspects that a character is unaware of (or wrong about) — the engine of
 * suspense and irony, made queryable. Uses each knower's LATEST stance, so a
 * character who catches up no longer shows a gap. Pure + deterministic. This is
 * the machine-native capability a prose log cannot represent.
 */
export function dramaticIrony(tables: WorldTables, asOfDiscourse: number): IronyGap[] {
  const readerAhead = new Map<string, ProjectedKnowledge>();
  for (const k of latestKnowledge(tables, READER, asOfDiscourse)) {
    if (READER_AHEAD.has(k.stance)) readerAhead.set(propKey(k.proposition), k);
  }
  if (readerAhead.size === 0) return [];

  const characters = new Set<string>();
  for (const k of tables.knowledge.values()) {
    if (k.status === "live" && !k.knower.startsWith("@")) characters.add(k.knower);
  }

  const gaps: IronyGap[] = [];
  for (const c of [...characters].sort()) {
    for (const k of latestKnowledge(tables, c, asOfDiscourse)) {
      const key = propKey(k.proposition);
      const r = readerAhead.get(key);
      if (r && CHARACTER_BEHIND.has(k.stance)) {
        const readable = "factRef" in k.proposition ? k.proposition.factRef : k.proposition.prop;
        gaps.push({ proposition: key, readable, readerStance: r.stance, character: c, characterStance: k.stance });
      }
    }
  }
  return gaps.sort((a, b) =>
    a.proposition !== b.proposition
      ? a.proposition < b.proposition
        ? -1
        : 1
      : a.character < b.character
        ? -1
        : 1
  );
}
