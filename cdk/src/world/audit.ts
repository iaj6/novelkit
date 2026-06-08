import type { WorldTables, ProjectedFact } from "./project.js";
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
};

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
  for (const facts of groups.values()) {
    if (facts.length < 2) continue;
    if (new Set(facts.map(valueKey)).size < 2) continue; // all live values agree -> restatement
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
