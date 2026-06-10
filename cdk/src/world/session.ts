import { createHash } from "node:crypto";
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
import { latestKnowledge, dramaticIrony, type IronyGap } from "./epistemic.js";

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
 * M6: the store is the SOURCE OF TRUTH for the factual continuity ledger — the
 * drafted-fact view logs/continuity.md is regenerated from these writes (see
 * world/regenerate.ts), not hand-appended. close_chapter still only WARNS on a
 * missing capture (refuse-mode is a follow-up). Fact/relation/knowledge ids are
 * content-derived (deterministic; a re-draft of the same chapter overwrites
 * rather than duplicating).
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

  /**
   * FM4 resolve-first HARD-REJECT: a structured fact must reference a REGISTERED entity so
   * cross-chapter keys agree (the M3.5 probe's #1 key-agreement lever). Resolves a
   * name/alias/id to its canonical id; THROWS if the entity was never upsert_entity'd.
   * Reserved knowers (@...) and the "unattributed" statement sentinel pass through —
   * statements go via assertStatement, not assertFact, so a real fact never legitimately
   * carries an unregistered entity. The error is phrased for agent self-recovery.
   */
  private async resolveKnownEntity(raw: string): Promise<string> {
    if (raw.startsWith("@") || raw === "unattributed") return raw;
    const resolved = (await this.ensureEntityIndex()).get(raw.trim().toLowerCase());
    if (resolved === undefined) {
      throw new Error(
        `Unknown entity "${raw}". Call upsert_entity (a stable slug id, kind, display_name) before asserting facts about it — or resolve_entity to find its existing id — then assert_fact with that id. Consistent entity ids are what let cross-chapter contradictions be detected.`
      );
    }
    return resolved;
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
    const entity = await this.resolveKnownEntity(args.entity);
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

  /**
   * Capture a free-text fact that does NOT atomize into entity.attribute=value, as a
   * `statement` fact (the M3.5 escape hatch; what `append_continuity` writes now that
   * the store is the source of truth). The id is content-derived — chapter + a hash of
   * the text — so re-drafting a chapter overwrites rather than duplicating, while two
   * distinct statements in one chapter never collide (the plain `fact:chapter:entity:
   * attribute` scheme would, since every statement shares entity+attribute).
   */
  async assertStatement(args: { value: string; tier?: "canon" | "drafted"; chapter?: string }): Promise<{ id: string }> {
    const chapter = this.chapterOf(args.chapter);
    const hash = createHash("sha256").update(args.value).digest("hex").slice(0, 12);
    const id = `fact:${chapter}:statement:${hash}`;
    await appendEvent(this.projectRoot, {
      type: "fact.assert",
      id,
      entity: "unattributed",
      attribute: "statement",
      value: args.value,
      tier: args.tier,
      confidence: "inferred",
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

  /** What does `knower` know as of `asOfChapter` — the LATEST live stance per proposition (M5.5). */
  async whoKnows(args: { knower: string; asOfChapter: string }): Promise<ProjectedKnowledge[]> {
    const tables = await this.tables();
    const target = tables.chapters.get(args.asOfChapter)?.discourseIndex ?? deriveDiscourseIndex(args.asOfChapter);
    return latestKnowledge(tables, args.knower, target);
  }

  /** Dramatic-irony gaps as of `asOfChapter`: what the @reader knows/suspects that a character does not. */
  async dramaticIrony(args: { asOfChapter: string }): Promise<IronyGap[]> {
    const tables = await this.tables();
    const target = tables.chapters.get(args.asOfChapter)?.discourseIndex ?? deriveDiscourseIndex(args.asOfChapter);
    return dramaticIrony(tables, target);
  }
}
