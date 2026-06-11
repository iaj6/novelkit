import { z } from "zod";

/**
 * The epistemic world-model — event schema (M1 substrate).
 *
 * The store is an append-only JSONL event log; this module defines the event
 * vocabulary and the write-time invariants. Events are PURE DATA: no wall-clock
 * timestamps or other nondeterministic fields, so replaying the same event list
 * always yields byte-identical projected tables (see project.ts). The only
 * sequencing signal is the append order of the log.
 *
 * Every event carries `v` (schema version, default 1). It is the upgrade-on-read
 * hinge: it cannot be cheaply backfilled onto already-committed logs, so it is
 * stamped from day one even though M1 has only version 1. (`v` is an event field,
 * not a projected-table field, so it does not affect projection determinism.)
 *
 * Two layers ride on the same event stream:
 *   - FACTUAL: entities + facts (entity.attribute = value, with provenance,
 *     supersession, and a canon|drafted tier) + relations.
 *   - EPISTEMIC: KnowledgeState (who knows/believes/suspects what, as of which
 *     chapter), with @reader as a reserved knower — the layer a prose log cannot
 *     represent. (@narrator, for unreliable narration, is deferred to a later
 *     milestone and intentionally not modelled in v1.)
 */

export const SOURCES = ["architect", "drafter", "audit", "import", "repair"] as const;
export type Source = (typeof SOURCES)[number];

export const ENTITY_KINDS = [
  "character", "place", "object", "organization", "event", "thread", "concept", "document", "other",
] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const TIERS = ["canon", "drafted"] as const;
export const CONFIDENCES = ["established", "provisional", "inferred"] as const;
export const POLARITIES = ["asserted", "negated"] as const;

/** Kinds of registered canonical record (M7 — verbatim load-bearing documents). */
export const RECORD_KINDS = ["log", "letter", "form", "document", "other"] as const;

/** Epistemic stances a knower can hold toward a proposition. */
export const STANCES = [
  "knows", "believes", "suspects", "wrong_believes", "unaware", "concealing", "wonders",
] as const;
export type Stance = (typeof STANCES)[number];

/** How a knower acquired a belief. `told_by` pairs with `basisEntity`. */
export const BASES = ["witnessed", "told_by", "inferred", "document", "overheard"] as const;

/** Reserved non-entity knower. (@narrator is reserved for a later milestone.) */
export const READER = "@reader";

/**
 * Provenance — every record is attributable. `chapter` is a chapter id, or one
 * of the sentinels "canon" (architect-seeded) / "legacy" (imported from an old
 * markdown-only book).
 */
export const ProvenanceSchema = z.object({
  chapter: z.string().min(1),
  scene: z.string().optional(),
  line: z.number().int().optional(),
  source: z.enum(SOURCES),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

const FactValueSchema = z.union([z.string(), z.number(), z.boolean()]);

/** Fields shared by every event. `v` is the upgrade-on-read schema version. */
const baseEvent = { v: z.number().int().default(1) };

const EntityUpsert = z.object({
  ...baseEvent,
  type: z.literal("entity.upsert"),
  id: z.string().min(1),
  kind: z.enum(ENTITY_KINDS),
  display_name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  short_gloss: z.string().optional(),
  pov: z.boolean().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  provenance: ProvenanceSchema,
});

const FactAssert = z.object({
  ...baseEvent,
  type: z.literal("fact.assert"),
  id: z.string().min(1),
  entity: z.string().min(1),
  attribute: z.string().min(1),
  value: FactValueSchema,
  unit: z.string().optional(),
  polarity: z.enum(POLARITIES).default("asserted"),
  tier: z.enum(TIERS).default("drafted"),
  confidence: z.enum(CONFIDENCES).optional(),
  supersedes: z.string().nullable().optional(),
  provenance: ProvenanceSchema,
});

const RelationAssert = z.object({
  ...baseEvent,
  type: z.literal("relation.assert"),
  id: z.string().min(1),
  from: z.string().min(1),
  relType: z.string().min(1),
  to: z.string().min(1),
  value: z.boolean().optional(),
  symmetric: z.boolean().optional(),
  since_chapter: z.string().optional(),
  until_chapter: z.string().optional(),
  confidence: z.enum(CONFIDENCES).optional(),
  supersedes: z.string().nullable().optional(),
  provenance: ProvenanceSchema,
});

// Strict on both branches so a both-keys object ({factRef, prop}) — a likely
// drafter/LLM error — is REJECTED at the write boundary instead of silently
// coercing to factRef-only and dropping `prop` into the append-only log forever.
const PropositionRefSchema = z.union([
  z.object({ factRef: z.string().min(1) }).strict(),
  z.object({ prop: z.string().min(1) }).strict(),
]);
export type PropositionRef = z.infer<typeof PropositionRefSchema>;

const KnowledgeLearn = z.object({
  ...baseEvent,
  type: z.literal("knowledge.learn"),
  id: z.string().min(1),
  knower: z.string().min(1), // an entity id, or @reader
  proposition: PropositionRefSchema,
  stance: z.enum(STANCES),
  asOf: z.object({
    discourseIndex: z.number().int(),
    storyTime: z.string().optional(),
  }),
  basis: z.enum(BASES).optional(),
  basisEntity: z.string().optional(), // the teller, when basis === "told_by"
  since_chapter: z.string().optional(),
  supersedes: z.string().nullable().optional(),
  provenance: ProvenanceSchema,
});

const ChapterOpen = z.object({
  ...baseEvent,
  type: z.literal("chapter.open"),
  chapterId: z.string().min(1),
  discourseIndex: z.number().int(), // mechanical: the NN- filename prefix
  pov: z.array(z.string()).optional(),
  storyTimeLabel: z.string().optional(), // opt-in; only set for non-linear briefs
  provenance: ProvenanceSchema,
});

const ChapterClose = z.object({
  ...baseEvent,
  type: z.literal("chapter.close"),
  chapterId: z.string().min(1),
  incomplete: z.boolean().optional(), // a forced close that skipped the completeness gate
  provenance: ProvenanceSchema,
});

const Retract = z.object({
  ...baseEvent,
  type: z.literal("retract"),
  target: z.string().min(1), // a record id (record scope) or a chapterId (chapter scope)
  scope: z.enum(["record", "chapter"]).default("record"),
  reason: z.string().optional(),
  provenance: ProvenanceSchema,
});

/**
 * M7 — a CANONICAL RECORD: the verbatim text of a load-bearing document (a log
 * entry, a letter, a form) that a later chapter may re-quote. Distinct from a fact
 * (which is normalized/atomized): a record is byte-exact, so re-quotation drift is an
 * exact-string mismatch, not a fuzzy comparison. `recordId` is a stable human slug
 * (e.g. "harbor-log-oct12"); `id` is content-derived (record:<slug>:<text-hash>).
 */
const RecordUpsert = z.object({
  ...baseEvent,
  type: z.literal("record.upsert"),
  id: z.string().min(1),
  recordId: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(1),
  kind: z.enum(RECORD_KINDS).default("document"),
  tier: z.enum(TIERS).default("drafted"),
  supersedes: z.string().nullable().optional(),
  provenance: ProvenanceSchema,
});

export const WorldEventSchema = z.discriminatedUnion("type", [
  EntityUpsert,
  FactAssert,
  RelationAssert,
  KnowledgeLearn,
  ChapterOpen,
  ChapterClose,
  Retract,
  RecordUpsert,
]);
export type WorldEvent = z.infer<typeof WorldEventSchema>;
export type FactAssertEvent = z.infer<typeof FactAssert>;
export type RecordUpsertEvent = z.infer<typeof RecordUpsert>;

/**
 * Write-time invariants the bare schema can't express (discriminatedUnion
 * members can't carry refinements). The store calls this before appending, so a
 * malformed write is rejected at the boundary rather than corrupting the store.
 *
 * M1 enforces only the numeric-fact-needs-a-unit rule. Other duals the docstring
 * might imply (unit-on-non-numeric, basis<->basisEntity coupling, canonical-form
 * for boolean/state facts) are deferred to the M3.5 atomization probe / M5
 * canonical-form decision — they are purely additive (no committed writer exists
 * yet) and need no migration when added later.
 */
export function validateWriteInvariants(event: WorldEvent): void {
  if (event.type === "fact.assert" && typeof event.value === "number") {
    if (event.unit === undefined || event.unit === "") {
      throw new Error(
        `fact.assert for ${event.entity}.${event.attribute}: a numeric value requires a unit`
      );
    }
  }
  // M7: a registered record holds the verbatim text of a load-bearing DOCUMENT (a log
  // entry, a letter, a form) — not a chapter. Cap the canonical text so an oversized
  // registration (a capture error) is rejected at the boundary.
  if (event.type === "record.upsert" && event.text.length > 8192) {
    throw new Error(
      `record.upsert ${event.recordId}: canonical text exceeds 8KB (a record is a document, not a chapter)`
    );
  }
}
