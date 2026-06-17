import type { Provenance, WorldEvent, PropositionRef } from "./schema.js";

/**
 * The pure projector: events[] -> in-memory tables. PURE and DETERMINISTIC —
 * replaying the same event list always yields equal tables (no wall-clock, no
 * randomness, no I/O, no locale-dependent ordering). This is what lets resume
 * fingerprint the stream and tests pin behaviour. Supersession and retraction
 * resolve here on read; the log itself is never mutated (retiring a fact is just
 * another appended event).
 *
 * Returned records are independent SNAPSHOTS: every carried-through container
 * (arrays, provenance, proposition, asOf, props) is copied, so mutating a
 * projection can never alias back into events[] and corrupt a re-projection.
 */

export type RecordStatus = "live" | "superseded" | "retracted";

export interface ProjectedEntity {
  id: string;
  kind: string;
  display_name: string;
  aliases: string[];
  short_gloss?: string;
  pov: boolean;
  props: Record<string, unknown>;
  provenance: Provenance;
}

export interface ProjectedFact {
  id: string;
  entity: string;
  attribute: string;
  value: string | number | boolean;
  unit?: string;
  polarity: "asserted" | "negated";
  tier: "canon" | "drafted";
  confidence?: string;
  supersedes: string | null;
  status: RecordStatus;
  supersededBy?: string;
  provenance: Provenance;
}

export interface ProjectedRelation {
  id: string;
  from: string;
  relType: string;
  to: string;
  value?: boolean;
  symmetric?: boolean;
  since_chapter?: string;
  until_chapter?: string;
  status: RecordStatus;
  supersededBy?: string;
  provenance: Provenance;
}

export interface ProjectedKnowledge {
  id: string;
  knower: string;
  proposition: PropositionRef;
  stance: string;
  asOf: { discourseIndex: number; storyTime?: string };
  basis?: string;
  basisEntity?: string;
  since_chapter?: string;
  status: RecordStatus;
  supersededBy?: string;
  provenance: Provenance;
}

export interface ProjectedChapter {
  chapterId: string;
  discourseIndex: number;
  pov: string[];
  storyTimeLabel?: string;
  closed: boolean;
  incomplete?: boolean;
  provenance: Provenance;
}

export interface ProjectedRecord {
  id: string;
  /** Monotonic append index among record.upsert events — for "latest by event order"
   * (re-registering an existing content-id keeps its Map slot, so iteration order is unreliable). */
  seq: number;
  recordId: string;
  label: string;
  text: string;
  kind: string;
  tier: "canon" | "drafted";
  supersedes: string | null;
  status: RecordStatus;
  supersededBy?: string;
  provenance: Provenance;
}

export interface WorldTables {
  entities: Map<string, ProjectedEntity>;
  facts: Map<string, ProjectedFact>;
  relations: Map<string, ProjectedRelation>;
  knowledge: Map<string, ProjectedKnowledge>;
  chapters: Map<string, ProjectedChapter>;
  records: Map<string, ProjectedRecord>;
}

/** Retire a record (fact/relation/knowledge) that a newer one supersedes. */
function retire(rec: { status: RecordStatus; supersededBy?: string } | undefined, byId: string): void {
  if (rec && rec.status === "live") {
    rec.status = "superseded";
    rec.supersededBy = byId;
  }
}

export function project(events: WorldEvent[]): WorldTables {
  const entities = new Map<string, ProjectedEntity>();
  const facts = new Map<string, ProjectedFact>();
  const relations = new Map<string, ProjectedRelation>();
  const knowledge = new Map<string, ProjectedKnowledge>();
  const chapters = new Map<string, ProjectedChapter>();
  const records = new Map<string, ProjectedRecord>();
  let recordSeq = 0;

  for (const ev of events) {
    switch (ev.type) {
      case "entity.upsert": {
        const prev = entities.get(ev.id);
        entities.set(ev.id, {
          id: ev.id,
          kind: ev.kind,
          display_name: ev.display_name,
          aliases: [...(ev.aliases ?? prev?.aliases ?? [])],
          short_gloss: ev.short_gloss ?? prev?.short_gloss,
          pov: ev.pov ?? prev?.pov ?? false,
          props: structuredClone({ ...(prev?.props ?? {}), ...(ev.props ?? {}) }),
          provenance: { ...ev.provenance },
        });
        break;
      }
      case "fact.assert": {
        if (ev.supersedes) retire(facts.get(ev.supersedes), ev.id);
        facts.set(ev.id, {
          id: ev.id,
          entity: ev.entity,
          attribute: ev.attribute,
          value: ev.value,
          unit: ev.unit,
          polarity: ev.polarity,
          tier: ev.tier,
          confidence: ev.confidence,
          supersedes: ev.supersedes ?? null,
          status: "live",
          provenance: { ...ev.provenance },
        });
        break;
      }
      case "relation.assert": {
        if (ev.supersedes) retire(relations.get(ev.supersedes), ev.id);
        relations.set(ev.id, {
          id: ev.id,
          from: ev.from,
          relType: ev.relType,
          to: ev.to,
          value: ev.value,
          symmetric: ev.symmetric,
          since_chapter: ev.since_chapter,
          until_chapter: ev.until_chapter,
          status: "live",
          provenance: { ...ev.provenance },
        });
        break;
      }
      case "knowledge.learn": {
        if (ev.supersedes) retire(knowledge.get(ev.supersedes), ev.id);
        knowledge.set(ev.id, {
          id: ev.id,
          knower: ev.knower,
          proposition: { ...ev.proposition },
          stance: ev.stance,
          asOf: { ...ev.asOf },
          basis: ev.basis,
          basisEntity: ev.basisEntity,
          since_chapter: ev.since_chapter,
          status: "live",
          provenance: { ...ev.provenance },
        });
        break;
      }
      case "chapter.open": {
        const prev = chapters.get(ev.chapterId);
        chapters.set(ev.chapterId, {
          chapterId: ev.chapterId,
          discourseIndex: ev.discourseIndex,
          pov: [...(ev.pov ?? prev?.pov ?? [])],
          storyTimeLabel: ev.storyTimeLabel ?? prev?.storyTimeLabel,
          closed: prev?.closed ?? false,
          incomplete: prev?.incomplete,
          provenance: { ...ev.provenance },
        });
        break;
      }
      case "chapter.close": {
        const prev = chapters.get(ev.chapterId);
        if (prev) {
          prev.closed = true;
          if (ev.incomplete !== undefined) prev.incomplete = ev.incomplete;
        } else {
          // close without a prior open — record a stub so resume can see it.
          chapters.set(ev.chapterId, {
            chapterId: ev.chapterId,
            discourseIndex: -1,
            pov: [],
            closed: true,
            incomplete: ev.incomplete,
            provenance: { ...ev.provenance },
          });
        }
        break;
      }
      case "retract": {
        if (ev.scope === "chapter") {
          // Roll a whole chapter back to "as if never drafted": retract every
          // record asserted in it and drop the chapter row. Entities are left
          // (they may be shared); a re-draft re-asserts the chapter's records.
          // NOTE: `supersedes` is expected to point at a live tip; reviving a
          // superseded predecessor on retract is an M4/M5 repair decision, not M1.
          for (const f of facts.values()) {
            if (f.provenance.chapter === ev.target) f.status = "retracted";
          }
          for (const r of relations.values()) {
            if (r.provenance.chapter === ev.target) r.status = "retracted";
          }
          for (const k of knowledge.values()) {
            if (k.provenance.chapter === ev.target) k.status = "retracted";
          }
          for (const rec of records.values()) {
            if (rec.provenance.chapter === ev.target) rec.status = "retracted";
          }
          chapters.delete(ev.target);
        } else {
          const f = facts.get(ev.target);
          if (f) f.status = "retracted";
          const r = relations.get(ev.target);
          if (r) r.status = "retracted";
          const k = knowledge.get(ev.target);
          if (k) k.status = "retracted";
          const rec = records.get(ev.target);
          if (rec) rec.status = "retracted";
          entities.delete(ev.target);
        }
        break;
      }
      case "record.upsert": {
        if (ev.supersedes) retire(records.get(ev.supersedes), ev.id);
        records.set(ev.id, {
          id: ev.id,
          seq: recordSeq++,
          recordId: ev.recordId,
          label: ev.label,
          text: ev.text,
          kind: ev.kind,
          tier: ev.tier,
          supersedes: ev.supersedes ?? null,
          status: "live",
          provenance: { ...ev.provenance },
        });
        break;
      }
    }
  }

  return { entities, facts, relations, knowledge, chapters, records };
}

export function liveFacts(tables: WorldTables): ProjectedFact[] {
  return [...tables.facts.values()].filter((f) => f.status === "live");
}

export function liveFactsForEntity(tables: WorldTables, entity: string): ProjectedFact[] {
  return liveFacts(tables).filter((f) => f.entity === entity);
}

export function liveRecords(tables: WorldTables): ProjectedRecord[] {
  return [...tables.records.values()].filter((r) => r.status === "live");
}

/**
 * Deterministic, order-independent serialization for comparison/tests/fingerprints:
 * Map values flattened into arrays sorted by id. Sorts by UTF-16 CODEPOINT (plain
 * `<`/`>`), NOT localeCompare — codepoint order is fixed across every machine,
 * locale, and ICU build, which the cross-machine determinism mandate requires.
 */
export function tablesToJSON(tables: WorldTables): Record<string, unknown[]> {
  const sortBy = <T>(arr: T[], key: keyof T): T[] =>
    [...arr].sort((a, b) => {
      const x = String(a[key]);
      const y = String(b[key]);
      return x < y ? -1 : x > y ? 1 : 0;
    });
  return {
    entities: sortBy([...tables.entities.values()], "id"),
    facts: sortBy([...tables.facts.values()], "id"),
    relations: sortBy([...tables.relations.values()], "id"),
    knowledge: sortBy([...tables.knowledge.values()], "id"),
    chapters: sortBy([...tables.chapters.values()], "chapterId"),
    records: sortBy([...tables.records.values()], "id"),
  };
}
