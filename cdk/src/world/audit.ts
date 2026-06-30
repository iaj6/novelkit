import type { WorldTables, ProjectedFact, ProjectedRelation } from "./project.js";
import type { Finding } from "../findings.js";

/**
 * Deterministic contradiction detection over the world store (M5 AUGMENT).
 *
 * Pure; runs ALONGSIDE the LLM re-read continuity-fact-audit, which stays
 * AUTHORITATIVE. The M3.5 probe found this pass is precision-perfect (zero false
 * positives) but recall-incomplete, so it can only help: it catches the cheap
 * exact-key contradictions instantly and noise-free; everything it cannot see
 * (free-text facts, key disagreements, relation/epistemic clashes) the re-read
 * still covers. Cutting the re-read is gated on a re-probe (see M6).
 */

/**
 * Per-EntityKind canonical attribute vocabulary (M3.5 canonical-form rule #2).
 * Off-vocab use is REPORTED (worldStoreStats), not enforced — suggest now, warn
 * via the audit, hard-reject at M6. Keep an "other"/free escape; a missing key is
 * logged so the vocab grows from real demand.
 */
export const CANONICAL_ATTRIBUTES: Record<string, ReadonlySet<string>> = {
  character: new Set(["age", "birth_year", "role", "origin_place", "native_language", "alive", "marital_status"]),
  place: new Set(["located_in", "fictional", "construction"]),
  event: new Set(["date", "location"]),
  document: new Set([
    "date", "author", "recipient", "subject",
    "discovery_time", "notified_time", "arrived_time", "removed_time", "wind",
  ]),
};

/**
 * M8 (time-indexed attributes) — attributes that may legitimately hold DIFFERENT values in
 * different chapters because they change over narrative time. A cross-chapter value change on
 * one of these is SUCCESSION, not a contradiction (Hannah is 17 then 18; Eira's role re-registers);
 * findContradictions flags them ONLY on a same-chapter clash. Every other attribute is INVARIANT —
 * a change is a real continuity bug, kept at full pre-M8 strength (birth_year, origin_place,
 * native_language, an event/document date, a recorded measurement, …).
 *
 * Classified by attribute NAME so the semantics travel with the key (a character's `located_in` as a
 * RELATION is time-varying too — see findRelationConflicts — but the place-FACT `located_in`, "this
 * town sits in this county", does not move and stays invariant). Default is INVARIANT so the
 * relaxation is SURGICAL: only the attributes reasoned about here lose strictness (no silent recall
 * regression on the off-vocab tail), and the set grows from real demand like the vocab above.
 *
 * Posture: SAFE (same-chapter only). The one-way checks a monotonic model would add — age never
 * decreases, the dead do not revive — are deliberately NOT done, because they assume manuscript
 * order == chronology and would false-positive on a non-linear (flashback) narrative. FP-0 first.
 */
export const TIME_VARYING_ATTRIBUTES: ReadonlySet<string> = new Set([
  "age", // increases as narrative time passes
  "role", // a title/occupation can change (and re-registers at different specificity)
  "marital_status", // can change over the story
  "alive", // a character can die — true→false is the commonest legitimate transition
]);

/**
 * Comparison key for a fact's value: same key = consistent, different = conflict.
 * Normalizes case/whitespace and folds polarity, but preserves the discriminating
 * component (the number) — so 52 and "52" agree while 52 vs 54 still clash. A clean
 * numeric-literal string is treated as a number (FP-0: number-vs-string of the same
 * value must NOT false-conflict); the unit is dropped from the numeric key since a
 * numeric string never carries one and the numeric-requires-unit invariant already
 * guarantees a real number has it (rare unit-only clashes fall to the LLM re-read —
 * an augment may MISS, it must not false-positive). Deliberately NOT a value-
 * equivalence oracle (the M3.5 probe warns over-normalization manufactures false
 * negatives).
 */
function valueKey(f: ProjectedFact): string {
  const negated = f.polarity === "negated";
  const neg = negated ? "!" : "";
  const asNum =
    typeof f.value === "number"
      ? f.value
      : typeof f.value === "string" && /^-?\d+(\.\d+)?$/.test(f.value.trim())
        ? Number(f.value.trim())
        : undefined;
  if (asNum !== undefined) return `n:${neg}${asNum}`;
  // Resolve a negated boolean into its effective truth (alive=false negated == alive),
  // so a double-negation is not flagged as a contradiction.
  if (typeof f.value === "boolean") return `b:${negated ? !f.value : f.value}`;
  return `s:${neg}${String(f.value).trim().toLowerCase()}`;
}

function fmt(f: ProjectedFact): string {
  const u = f.unit ? ` ${f.unit}` : "";
  const neg = f.polarity === "negated" ? "not " : "";
  return `${neg}${String(f.value)}${u} (${f.provenance.chapter})`;
}

function pushTo<T>(m: Map<string, T[]>, k: string, v: T): void {
  const a = m.get(k);
  if (a) a.push(v);
  else m.set(k, [v]);
}

function addToSet(m: Map<string, Set<string>>, k: string, v: string): void {
  const s = m.get(k);
  if (s) s.add(v);
  else m.set(k, new Set([v]));
}

/**
 * M8 helper — for a TIME_VARYING attribute group (all the same entity+attribute), returns the facts
 * of the first chapter (lexicographically, for stable output) that holds >=2 distinct live values:
 * a same-narrative-moment contradiction. Returns null when every chapter is internally consistent
 * (the distinct values are spread across chapters = legitimate succession over narrative time). With
 * the per-chapter fact id (fact:chapter:entity:attribute) a same-chapter re-assert OVERWRITES, so for
 * drafter facts this rarely fires — it is the FP-0 floor that stays correct if same-chapter distinct
 * values ever arrive from another source (e.g. a backfill importer).
 */
function sameChapterClash(facts: ProjectedFact[]): ProjectedFact[] | null {
  const byChapter = new Map<string, ProjectedFact[]>();
  for (const f of facts) pushTo(byChapter, f.provenance.chapter, f);
  for (const ch of [...byChapter.keys()].sort()) {
    const chFacts = byChapter.get(ch)!;
    if (chFacts.length >= 2 && new Set(chFacts.map(valueKey)).size >= 2) return chFacts;
  }
  return null;
}

/**
 * Detects, deterministically:
 *  - fact-conflict: >=2 LIVE facts on the same (entity, attribute) whose
 *    normalized values disagree (no supersedes link, or they'd not both be live).
 *  - broken-supersession: a fact whose `supersedes` points at no known fact (the
 *    intended retirement silently did nothing).
 * Returns FindingSchema-shaped findings, sorted by id for stable output.
 */
export function findContradictions(tables: WorldTables): Finding[] {
  const findings: Finding[] = [];

  // 1. live/live fact conflicts
  const groups = new Map<string, ProjectedFact[]>();
  for (const f of tables.facts.values()) {
    if (f.status !== "live") continue;
    // Free-text statements all share entity="unattributed", attribute="statement" — they
    // are NOT comparable value-slots, so skip them here (the LLM re-read covers free text).
    // Without this, two distinct statements would be flagged as a spurious contradiction.
    if (f.attribute === "statement") continue;
    // JSON-array key: unambiguous for any entity/attribute content (no magic separator).
    pushTo(groups, JSON.stringify([f.entity, f.attribute]), f);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    if (new Set(group.map(valueKey)).size < 2) continue; // all live values agree -> restatement
    // M8 (time-indexed): a TIME_VARYING attribute may hold different values in different chapters —
    // succession over narrative time, not a contradiction — so it clashes only when >=2 distinct
    // values land in ONE chapter. An INVARIANT attribute clashes on any distinct live values (pre-M8).
    const facts = TIME_VARYING_ATTRIBUTES.has(group[0].attribute) ? sameChapterClash(group) : group;
    if (!facts) continue;
    const ex = facts[0];
    findings.push({
      id: `det-fact-conflict:${encodeURIComponent(ex.entity)}:${encodeURIComponent(ex.attribute)}`,
      category: "continuity-fact",
      severity: "high",
      title: `Contradictory ${ex.attribute} for ${ex.entity}`,
      description: `The world store holds conflicting live values for ${ex.entity}.${ex.attribute}: ${facts.map(fmt).join(" vs ")}.`,
      evidence: facts.map((f) => ({
        file: `draft/${f.provenance.chapter}.md`,
        text: `${ex.attribute} = ${fmt(f)}`,
        fact_id: f.id,
        chapter: f.provenance.chapter,
      })),
      suggested_action: "Reconcile the values; supersede the incorrect assertion (or fix the prose so they agree).",
      auto_repair_safe: false,
      repair_agent: null,
    });
  }

  // 2. broken supersession
  for (const f of tables.facts.values()) {
    if (f.supersedes && !tables.facts.has(f.supersedes)) {
      findings.push({
        id: `det-broken-supersedes:${encodeURIComponent(f.id)}`,
        category: "continuity-fact",
        severity: "low",
        title: `Dangling supersedes on ${f.entity}.${f.attribute}`,
        description: `Fact ${f.id} supersedes "${f.supersedes}", which is not in the store — the intended retirement was a no-op.`,
        evidence: [{ file: `draft/${f.provenance.chapter}.md`, text: `${f.entity}.${f.attribute}`, fact_id: f.id, chapter: f.provenance.chapter }],
        suggested_action: "Re-assert with the correct prior fact id, or drop the supersedes.",
        auto_repair_safe: false,
        repair_agent: null,
      });
    }
  }

  return findings.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * M7 — registration-drift over canonical records (AUGMENT, like findContradictions).
 * Exact comparison, FP-0: if one recordId carries >=2 distinct live canonical texts, the
 * document was registered with conflicting bodies across chapters (re-improvised instead of
 * read_record + reproduce). Re-quote drift in PROSE that is never re-registered is deliberately
 * NOT chased here — a drifted single-line re-quote shares no anchor to locate deterministically;
 * that falls to the document's anchor facts (find_contradictions) and the LLM re-read (handed the
 * records manifest). The win M7 leans on is PREVENTION: read-before-re-quote, not fuzzy detection.
 */
export function findRecordDivergences(tables: WorldTables): Finding[] {
  const texts = new Map<string, Set<string>>();
  const chapters = new Map<string, Set<string>>();
  for (const r of tables.records.values()) {
    if (r.status !== "live") continue;
    addToSet(texts, r.recordId, r.text);
    addToSet(chapters, r.recordId, r.provenance.chapter);
  }
  const findings: Finding[] = [];
  for (const [recordId, set] of texts) {
    if (set.size < 2) continue;
    const chs = [...(chapters.get(recordId) ?? [])].sort();
    findings.push({
      id: `det-record-drift:${encodeURIComponent(recordId)}`,
      category: "continuity-fact",
      severity: "high",
      title: `Conflicting canonical text registered for "${recordId}"`,
      description: `The document "${recordId}" was registered with ${set.size} different canonical texts (chapters ${chs.join(", ")}). A load-bearing document's text must be registered once and re-quoted verbatim (read_record), not re-improvised.`,
      evidence: chs.map((ch) => ({ file: `draft/${ch}.md`, chapter: ch, text: recordId })),
      suggested_action: "Register the document once; in later chapters call read_record and reproduce it verbatim.",
      auto_repair_safe: false,
      repair_agent: null,
    });
  }
  return findings.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * FUNCTIONAL spatial relation types: an entity holds exactly ONE of these at a time
 * (you live / are located / board at ONE place). Hardcoded allow-list so high-cardinality
 * or multi-valued relations never trip the conflict check — FP-0 is the priority. The
 * proposal's `holds_adjacency_to` is deliberately EXCLUDED: adjacency is many-valued (a
 * thing is adjacent to several others), so two distinct `to` from one entity is normal,
 * not a conflict. `knows_of` and other social webs are excluded for the same reason.
 */
const FUNCTIONAL_RELATION_TYPES: ReadonlySet<string> = new Set([
  "lives_at",
  "located_in",
  "boards_at",
]);

/**
 * Relation augment — flags a FUNCTIONAL spatial slot that resolves to more than one place, which
 * findContradictions cannot see (it iterates only `tables.facts`, never `tables.relations`). Same
 * AUGMENT posture as findContradictions: pure, FP-0 by the hardcoded allow-list, appended alongside
 * the LLM re-read.
 *
 * A relation's `value` is its polarity: `value === false` means "X is NOT <relType> <to>" (a negative
 * claim — `record_relation` documents `value:false`). Only POSITIVE claims place the entity somewhere,
 * so the slot is contradictory only when (a) the entity is positively in >=2 distinct places, or
 * (b) one place is asserted both present and absent. A negative-to-a-different-place ("in A, not in B")
 * is consistent and must NOT flag — the FP-0 guarantee.
 *
 * M8 (time-indexed): every functional spatial slot is TIME-VARYING — a character relocates, so two
 * positive `located_in` in DIFFERENT chapters is succession, not a contradiction (the M7 false
 * positive). The conflict is therefore evaluated PER CHAPTER: only a slot resolving to >=2 places (or
 * both present and absent) WITHIN one chapter is a same-moment clash. A chapter can still span a move,
 * so it stays `severity: medium` + flag-only (`repair_agent: null`) for a human to check the timeline.
 */
export function findRelationConflicts(tables: WorldTables): Finding[] {
  const groups = new Map<string, ProjectedRelation[]>();
  for (const r of tables.relations.values()) {
    if (r.status !== "live") continue;
    if (!FUNCTIONAL_RELATION_TYPES.has(r.relType)) continue;
    pushTo(groups, JSON.stringify([r.from, r.relType]), r);
  }
  const findings: Finding[] = [];
  for (const rels of groups.values()) {
    // M8: a functional spatial slot is time-varying — evaluate the conflict PER CHAPTER so a
    // cross-chapter relocation does NOT flag; only a within-chapter multi-place (or present+absent)
    // slot is a same-moment contradiction. First conflicting chapter (lexicographic) wins, for stable output.
    // NOTE: `until_chapter` end-bounding is intentionally NOT consulted — it has no producer (record_relation
    // exposes only `sinceChapter`), so no live relation is end-bounded; a genuine within-chapter relocation
    // is surfaced by design (medium, flag-only) rather than suppressed.
    const byChapter = new Map<string, ProjectedRelation[]>();
    for (const r of rels) pushTo(byChapter, r.provenance.chapter, r);
    let conflict: ProjectedRelation[] | null = null;
    for (const ch of [...byChapter.keys()].sort()) {
      const chRels = byChapter.get(ch)!;
      const present = new Set<string>(); // places asserted positively (value true or undefined)
      const absent = new Set<string>(); // places asserted negatively (value === false)
      for (const r of chRels) {
        if (r.value === false) absent.add(r.to);
        else present.add(r.to);
      }
      if (present.size >= 2 || [...present].some((p) => absent.has(p))) {
        conflict = chRels;
        break;
      }
    }
    if (!conflict) continue;
    const ex = conflict[0];
    const ch = ex.provenance.chapter;
    const claims = [...new Set(conflict.map((r) => (r.value === false ? `not ${r.to}` : r.to)))].sort();
    findings.push({
      id: `det-relation-conflict:${encodeURIComponent(ex.from)}:${encodeURIComponent(ex.relType)}`,
      category: "continuity-fact",
      // medium, not high: a chapter can span a move, so a within-chapter multi-place slot is
      // "likely a contradiction OR an intra-chapter relocation" — under-claim rather than over-alarm.
      severity: "medium",
      title: `Conflicting ${ex.relType} for ${ex.from}`,
      description:
        `${ex.from} holds conflicting live ${ex.relType} claims within ${ch}: ${claims.join(", ")}. ` +
        `A functional ${ex.relType} resolves to one place at a single narrative moment — verify against ` +
        `the timeline (a within-chapter relocation is possible).`,
      evidence: conflict.map((r) => ({
        file: `draft/${r.provenance.chapter}.md`,
        text: `${r.from} ${r.value === false ? "NOT " : ""}${r.relType} ${r.to}`,
        fact_id: r.id,
        chapter: r.provenance.chapter,
      })),
      suggested_action: `Confirm ${ex.from} holds one ${ex.relType} within ${ch}; if the prose intends a move, stage it so the slot is single-valued per moment.`,
      auto_repair_safe: false,
      repair_agent: null,
    });
  }
  return findings.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export interface WorldStoreStats {
  liveFacts: number;
  statements: number;
  cleanSlotRate: number;
  entities: number;
  offVocabAttributes: number;
  unresolvedEntityRefs: number;
}

/**
 * Store instrumentation for the next M3.5 re-probe (observability, never gating):
 * clean-slot rate (atomized vs free-text "statement"), off-vocab attribute count,
 * and unresolved-entity references.
 */
export function worldStoreStats(tables: WorldTables): WorldStoreStats {
  const live = [...tables.facts.values()].filter((f) => f.status === "live");
  let statements = 0;
  let offVocab = 0;
  let unresolved = 0;
  for (const f of live) {
    if (f.attribute === "statement") statements++;
    if (!tables.entities.has(f.entity)) unresolved++;
    const kind = tables.entities.get(f.entity)?.kind;
    const vocab = kind ? CANONICAL_ATTRIBUTES[kind] : undefined;
    if (vocab && f.attribute !== "statement" && !vocab.has(f.attribute)) offVocab++;
  }
  return {
    liveFacts: live.length,
    statements,
    cleanSlotRate: live.length ? (live.length - statements) / live.length : 1,
    entities: tables.entities.size,
    offVocabAttributes: offVocab,
    unresolvedEntityRefs: unresolved,
  };
}
