import { appendEvent, readEvents } from "./store.js";
import {
  project,
  liveFactsForEntity,
  type ProjectedEntity,
  type ProjectedFact,
  type ProjectedKnowledge,
  type WorldTables,
} from "./project.js";
import type { Source, EntityKind, Stance } from "./schema.js";

/** Derive the mechanical discourse index from a chapter id's NN- prefix. */
export function deriveDiscourseIndex(chapterId: string): number {
  const m = chapterId.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

const PHASE_SOURCE: Record<string, Source> = {
  architect: "architect",
  drafter: "drafter",
  "continuity-fact-audit": "audit",
  "repair-fact-normalize": "repair",
};

/** Map a pipeline phase to the world-event provenance source (defaults to "drafter"). */
export function phaseToSource(phase: string): Source {
  return PHASE_SOURCE[phase] ?? "drafter";
}

export interface CloseResult {
  ok: true;
  incomplete: boolean;
  missing: string[];
}

/**
 * Per-run handle on a book's world store. Holds the open-chapter transaction
 * context so writes inherit provenance, runs the completeness gate on close, and
 * answers queries off the projected event stream. The MCP tools in tools.ts are
 * thin wrappers over this; it is SDK-free and unit-testable.
 *
 * M3 = DUAL-WRITE SHADOW: these writes fill the store ALONGSIDE the legacy
 * markdown logs, which remain authoritative. close_chapter only WARNS on a
 * missing capture — it never refuses (refuse-mode is M6, after the M4 recovery
 * path exists). Fact/relation/knowledge ids are content-derived (deterministic;
 * a re-draft of the same chapter overwrites rather than duplicating).
 */
export class WorldSession {
  private openChapterId: string | null = null;
  /** Lazily-built lowercase {id, display_name, alias} -> canonical entity id (resolve-first). */
  private entityIndex: Map<string, string> | null = null;

  constructor(private readonly projectRoot: string, private readonly source: Source = "drafter") {}

  private async tables(): Promise<WorldTables> {
    return project((await readEvents(this.projectRoot)).events);
  }

  private chapterOf(explicit?: string): string {
    return explicit ?? this.openChapterId ?? "unknown";
  }

  private addToIndex(idx: Map<string, string>, id: string, displayName?: string, aliases?: string[]): void {
    idx.set(id.toLowerCase(), id);
    if (displayName) idx.set(displayName.trim().toLowerCase(), id);
    for (const a of aliases ?? []) idx.set(a.trim().toLowerCase(), id);
  }

  private async ensureEntityIndex(): Promise<Map<string, string>> {
    if (this.entityIndex) return this.entityIndex;
    const idx = new Map<string, string>();
    for (const e of (await this.tables()).entities.values()) {
      this.addToIndex(idx, e.id, e.display_name, e.aliases);
    }
    this.entityIndex = idx;
    return idx;
  }

  /**
   * Resolve-first canonicalization (M3.5 canonical-form rule #1): if `raw` matches a
   * known entity's id, display_name, or alias, return that entity's canonical id;
   * otherwise return it unchanged (a genuinely new entity — the drafter is told to
   * upsert_entity first). Reserved knowers (@reader/@narrator) pass through. This is
   * the highest-leverage fix for cross-chapter key agreement (the M3.5 probe's
   * load-bearing weakness): it collapses "Eira", "Eira Bowman", and "eira-bowman"
   * onto one id so a later contradiction actually collides on a key.
   */
  private async canonicalEntity(raw: string): Promise<string> {
    if (raw.startsWith("@")) return raw;
    const idx = await this.ensureEntityIndex();
    return idx.get(raw.trim().toLowerCase()) ?? raw;
  }

  /** Open the chapter transaction — subsequent writes inherit this chapter as provenance. */
  async openChapter(args: {
    chapterId: string;
    discourseIndex?: number;
    pov?: string[];
    storyTimeLabel?: string;
  }): Promise<{ chapterId: string; discourseIndex: number }> {
    const discourseIndex = args.discourseIndex ?? deriveDiscourseIndex(args.chapterId);
    await appendEvent(this.projectRoot, {
      type: "chapter.open",
      chapterId: args.chapterId,
      discourseIndex,
      pov: args.pov,
      storyTimeLabel: args.storyTimeLabel,
      provenance: { chapter: args.chapterId, source: this.source },
    });
    this.openChapterId = args.chapterId;
    return { chapterId: args.chapterId, discourseIndex };
  }

  /**
   * Close the chapter transaction. M3 WARN-mode completeness gate: report whether
   * the chapter captured any facts; flag the close `incomplete` if not, but never
   * refuse (the legacy logs remain authoritative this milestone).
   */
  async closeChapter(args: { chapterId?: string }): Promise<CloseResult> {
    const chapterId = this.chapterOf(args.chapterId);
    const tables = await this.tables();
    const facts = [...tables.facts.values()].filter(
      (f) => f.provenance.chapter === chapterId && f.status === "live"
    );
    const missing: string[] = [];
    if (facts.length === 0) missing.push("no facts captured via assert_fact");
    const incomplete = missing.length > 0;
    await appendEvent(this.projectRoot, {
      type: "chapter.close",
      chapterId,
      incomplete: incomplete ? true : undefined,
      provenance: { chapter: chapterId, source: this.source },
    });
    if (this.openChapterId === chapterId) this.openChapterId = null;
    return { ok: true, incomplete, missing };
  }

  async assertFact(args: {
    entity: string;
    attribute: string;
    value: string | number | boolean;
    unit?: string;
    polarity?: "asserted" | "negated";
    tier?: "canon" | "drafted";
    confidence?: "established" | "provisional" | "inferred";
    supersedes?: string;
    chapter?: string;
  }): Promise<{ id: string }> {
    const chapter = this.chapterOf(args.chapter);
    const entity = await this.canonicalEntity(args.entity);
    const id = `fact:${chapter}:${entity}:${args.attribute}`;
    await appendEvent(this.projectRoot, {
      type: "fact.assert",
      id,
      entity,
      attribute: args.attribute,
      value: args.value,
      unit: args.unit,
      polarity: args.polarity,
      tier: args.tier,
      confidence: args.confidence,
      supersedes: args.supersedes,
      provenance: { chapter, source: this.source },
    });
    return { id };
  }

  async upsertEntity(args: {
    id: string;
    kind: EntityKind;
    display_name: string;
    aliases?: string[];
    short_gloss?: string;
    pov?: boolean;
    props?: Record<string, unknown>;
    chapter?: string;
  }): Promise<{ id: string }> {
    const chapter = this.chapterOf(args.chapter);
    await appendEvent(this.projectRoot, {
      type: "entity.upsert",
      id: args.id,
      kind: args.kind,
      display_name: args.display_name,
      aliases: args.aliases,
      short_gloss: args.short_gloss,
      pov: args.pov,
      props: args.props,
      provenance: { chapter, source: this.source },
    });
    if (this.entityIndex) this.addToIndex(this.entityIndex, args.id, args.display_name, args.aliases);
    return { id: args.id };
  }

  async relate(args: {
    from: string;
    relType: string;
    to: string;
    value?: boolean;
    symmetric?: boolean;
    sinceChapter?: string;
    chapter?: string;
  }): Promise<{ id: string }> {
    const chapter = this.chapterOf(args.chapter);
    const from = await this.canonicalEntity(args.from);
    const to = await this.canonicalEntity(args.to);
    const id = `rel:${chapter}:${from}:${args.relType}:${to}`;
    await appendEvent(this.projectRoot, {
      type: "relation.assert",
      id,
      from,
      relType: args.relType,
      to,
      value: args.value,
      symmetric: args.symmetric,
      since_chapter: args.sinceChapter,
      provenance: { chapter, source: this.source },
    });
    return { id };
  }

  async learn(args: {
    knower: string;
    proposition: { factRef: string } | { prop: string };
    stance: Stance;
    basis?: string;
    basisEntity?: string;
    discourseIndex?: number;
    chapter?: string;
  }): Promise<{ id: string }> {
    const chapter = this.chapterOf(args.chapter);
    const knower = await this.canonicalEntity(args.knower);
    const discourseIndex = args.discourseIndex ?? deriveDiscourseIndex(chapter);
    const propKey = "factRef" in args.proposition ? `f=${args.proposition.factRef}` : `p=${args.proposition.prop}`;
    const id = `know:${chapter}:${knower}:${propKey}`;
    await appendEvent(this.projectRoot, {
      type: "knowledge.learn",
      id,
      knower,
      proposition: args.proposition,
      stance: args.stance,
      asOf: { discourseIndex },
      basis: args.basis,
      basisEntity: args.basisEntity,
      provenance: { chapter, source: this.source },
    });
    return { id };
  }

  // ── queries (read the projected stream) ─────────────────────────────
  async queryFacts(args: { entity: string }): Promise<ProjectedFact[]> {
    return liveFactsForEntity(await this.tables(), args.entity);
  }

  async resolveEntity(args: { query: string }): Promise<ProjectedEntity[]> {
    const q = args.query.trim().toLowerCase();
    return [...(await this.tables()).entities.values()].filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.display_name.toLowerCase().includes(q) ||
        e.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }

  /** What does `knower` know as of `asOfChapter` (live stances at or before its discourse index)? */
  async whoKnows(args: { knower: string; asOfChapter: string }): Promise<ProjectedKnowledge[]> {
    const tables = await this.tables();
    const target = tables.chapters.get(args.asOfChapter)?.discourseIndex ?? deriveDiscourseIndex(args.asOfChapter);
    // MUST-FIX before M5.5: a knower whose stance on one proposition changes across
    // chapters has multiple live states here, so this returns the full history, not
    // the latest stance. The per-proposition latest-wins collapse lands with the
    // epistemic pilot that actually consumes this query — no phase reads who_knows in
    // the M3 shadow milestone, so shipping the raw filter is safe for now.
    return [...tables.knowledge.values()].filter(
      (k) => k.status === "live" && k.knower === args.knower && k.asOf.discourseIndex <= target
    );
  }
}
