import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { RunLog } from "./runlog.js";
import { FindingSchema, writeFindings as persistFindings, appendFindings as persistAppendFindings } from "./findings.js";
import { resolveInProject } from "./paths.js";
import { WorldSession } from "./world/session.js";
import { ENTITY_KINDS, STANCES, BASES, TIERS, CONFIDENCES, POLARITIES, type Source } from "./world/schema.js";

/**
 * Per-chapter capture facets — the contract between drafter, downstream phases, and the canon.
 *
 * The drafter calls a separate tool for each facet at end-of-chapter. Different facets serve
 * different consumers; the separation is deliberate, not redundant. Subsequent drafters and
 * downstream phases (reader, editor-pacing macro mode, continuity-fact-audit) read different
 * subsets of these files depending on what they need.
 *
 * | Facet                | File                    | Writer tool             | Read by                                  |
 * |----------------------|-------------------------|-------------------------|------------------------------------------|
 * | What happened        | logs/story-arc.md       | update_story_arc        | drafter, editor-continuity,              |
 * |                      |                         |                         | editor-pacing, reader, fact-audit        |
 * | What happened (full) | logs/scene-log.md       | record_scene            | drafter (via read_recent_scenes)         |
 * | What is now true     | logs/continuity.md      | append_continuity       | drafter, editor-continuity, fact-audit   |
 * | What is now named    | canon/glossary.md       | append_glossary         | drafter, fact-audit                      |
 * | How it was made      | logs/chapter-craft.md   | record_chapter_craft    | drafter (via read_recent_craft), reader, |
 * |                      |                         |                         | editor-pacing (macro mode)               |
 *
 * Facets that look adjacent but are NOT redundant:
 *   - `record_scene.newFacts` records short-term context for the next drafter's awareness.
 *     `append_continuity` records durable cross-chapter assertions into the WORLD STORE
 *     (M6: logs/continuity.md is REGENERATED from the store, not hand-appended) for the
 *     fact audit and later drafters. Different consumers, different lifecycle — the
 *     drafter calls both intentionally.
 *   - `logs/scene-log.md` is the verbose per-scene record; `logs/story-arc.md` is the
 *     chronological one-liner digest used when reading the full scene log would be wasteful.
 *
 * "How it was made" (chapter-craft) is the newest facet — added after the reader phase began
 * catching cross-chapter pattern problems (ending-mode uniformity, recurring stylistic
 * constructions, opening-texture overlap) that no per-chapter editor pass could detect.
 * Capturing craft choices as the chapter is drafted lets the next drafter break repeating
 * patterns before they accumulate.
 */

export const SERVER_NAME = "cdk";

export type ToolDeps = {
  projectRoot: string;
  log: RunLog;
  /** Provenance source for world-store writes (derived from the phase). Defaults to "drafter". */
  source?: Source;
};

// The file-path jail (resolveInProject) now lives in paths.ts so the world store
// and any other module can share the exact same containment check without pulling
// in the Agent SDK this module imports. Re-exported here for existing callers/tests.
export { resolveInProject };

/**
 * Shape for `record_chapter_craft`. Declared at module scope so the schema and
 * formatting logic are unit-testable; the same shape is passed to the SDK's
 * `tool()` inside buildToolServer.
 */
const chapterCraftShape = {
  chapterId: z.string().describe("Chapter identifier matching the outline file slug, e.g. '01-the-opening'."),
  ending_mode: z.enum([
    "cliffhanger",
    "mid-action-cut",
    "literary-fade",
    "resolved-beat",
    "turn",
    "coda",
    "declarative-close",
    "elliptical",
    "other",
  ]).describe(
    "Closed-vocabulary classification of the chapter's ending shape. Cross-chapter pattern " +
    "detection depends on string equality, so use 'other' rather than stretching a category. " +
    "Definitions: " +
    "cliffhanger = unresolved tension or imminent peril at chapter close; " +
    "mid-action-cut = chapter ends inside an action sequence without resolving it; " +
    "literary-fade = quiet image, atmosphere, weather, or sensory close with no action resolution; " +
    "resolved-beat = the chapter's central question, pressure, or sub-arc resolves on the page; " +
    "turn = sudden reveal, pivot, or new information that recontextualizes; " +
    "coda = brief aftermath or reflective beat after the main close; " +
    "declarative-close = chapter ends on a flat factual statement or pronouncement; " +
    "elliptical = deliberate ambiguity, open question, or unfinished gesture. " +
    "If the chapter does something hybrid that no single category fits, use 'other' and " +
    "describe the hybrid in craft_notes."
  ),
  opening_texture: z.enum([
    "routine-procedure",
    "drill-or-practice",
    "transit",
    "observation",
    "dialogue",
    "interior",
    "set-piece",
    "arrival",
    "summons",
    "atmosphere",
    "other",
  ]).describe(
    "Closed-vocabulary classification of the opening scene type. Cross-chapter pattern matching " +
    "depends on string equality, so use 'other' rather than stretching a category. Definitions: " +
    "routine-procedure = familiar work/task; drill-or-practice = training, rehearsal, repetition; " +
    "transit = movement between places; observation = watching/witnessing without acting; " +
    "dialogue = conversation-led; interior = POV thought with no immediate sensory anchor; " +
    "set-piece = staged action beat; arrival = entering a new place; summons = being called, " +
    "ordered, or woken; atmosphere = sensory mood without action."
  ),
  heavy_stylistic_moves: z.array(z.string()).min(2).max(7).describe(
    "Named craft techniques the chapter leaned on heavily. Concrete and specific to THIS chapter's " +
    "work — not generic labels that could describe any chapter. Good entries name the technique AND " +
    "where it landed, e.g., 'short declaratives clustered in the action paragraph', " +
    "'free indirect interiority through the POV's professional vocabulary', " +
    "'sensory anchor before dialogue throughout the middle section'. Bad entries are generic, e.g., " +
    "'descriptive prose', 'third-person limited', 'good pacing' — these do not differentiate."
  ),
  recurring_constructions: z.array(z.string()).max(5).describe(
    "Verbatim 3-8 word patterns the chapter used more than once. These are the micro-tics that, " +
    "when repeated across chapters, become stylistic-tic findings at the reader phase. Examples of " +
    "the SHAPE (not the content) of valid entries: 'thought it but did not say', 'knew without " +
    "knowing', 'wondered if it was'. Empty array if the chapter has no repeated verbatim patterns."
  ),
  pov_register: z.array(z.object({
    character: z.string().min(1).describe("POV character name as used in canon/characters.md."),
    register_note: z.string().min(1).describe(
      "One sentence on the specific register decisions made for this POV in this chapter — " +
      "what was kept tight, what was loosened, what was avoided. e.g., 'POV's interior stayed " +
      "professional/technical throughout, no abstract reflection' or 'POV admitted one moment of " +
      "extended interiority at the chapter's midpoint, otherwise close-action.'"
    ),
  })).min(1).describe(
    "One entry per POV character present in this chapter (most books have 1–3). Used by " +
    "subsequent drafters and by the reader phase to detect voice-drift across chapters for the " +
    "same POV."
  ),
  craft_notes: z.string().min(1).describe(
    "2-4 sentences of free-text on craft choices not captured above. Anything the next drafter " +
    "should know about to avoid pattern repetition or to extend a deliberate thread. Be specific " +
    "to THIS chapter's choices, not the book's general register."
  ),
};

/** Z.object form of the chapter-craft shape — exported for schema-validation tests. */
export const ChapterCraftSchema = z.object(chapterCraftShape);
export type ChapterCraftArgs = z.infer<typeof ChapterCraftSchema>;

/**
 * Format a validated chapter-craft entry as the markdown chunk that gets
 * appended to `logs/chapter-craft.md`. Pure function — no filesystem.
 * The output begins with a leading newline so it appends cleanly to an
 * existing file without needing the file to end in a newline.
 */
export function formatChapterCraftEntry(args: ChapterCraftArgs): string {
  const movesList = args.heavy_stylistic_moves.map((m) => `- ${m}`).join("\n");
  const constructionsList = args.recurring_constructions.length
    ? args.recurring_constructions.map((c) => `- \`${c}\``).join("\n")
    : "- (none)";
  const povList = args.pov_register
    .map((p) => `- **${p.character}:** ${p.register_note}`)
    .join("\n");
  return [
    `\n## ${args.chapterId}`,
    `**Ending mode:** ${args.ending_mode}`,
    `**Opening texture:** ${args.opening_texture}`,
    `**Heavy stylistic moves:**\n${movesList}`,
    `**Recurring constructions:**\n${constructionsList}`,
    `**POV register:**\n${povList}`,
    `**Craft notes:** ${args.craft_notes}`,
  ].join("\n") + "\n";
}

/**
 * Extract the most recent N entries from chapter-craft file contents.
 * Splits on chapter heading boundaries (`## ...`) and returns the tail N
 * joined back together. Returns `"(empty)"` if the file content has no
 * recognizable entries. Pure function — no filesystem.
 */
export function extractRecentCraftEntries(text: string, n: number): string {
  const entries = text.split(/\n(?=## )/).filter((e) => e.trim());
  const recent = entries.slice(-n).join("\n").trim();
  return recent || "(empty)";
}

export function buildToolServer(deps: ToolDeps) {
  const { projectRoot, log } = deps;
  // World-store session (M3 dual-write shadow). The new structured tools below
  // are thin wrappers over this; the legacy markdown tools remain authoritative.
  const session = new WorldSession(projectRoot, deps.source ?? "drafter");

  const readFile = tool(
    "read_file",
    "Read a file within the project. Path is relative to the project root (e.g. 'brief.md', 'canon/world.md').",
    { path: z.string() },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      const content = await fs.readFile(abs, "utf-8");
      log.event("tool", { name: "read_file", path: args.path, bytes: content.length });
      return { content: [{ type: "text", text: content }] };
    }
  );

  const listFiles = tool(
    "list_files",
    "List files in a project subdirectory. Path is relative to the project root. Use '.' for the root.",
    { path: z.string() },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      let entries: string[] = [];
      try {
        entries = await fs.readdir(abs);
      } catch {
        // directory does not exist; report as empty
      }
      const text = entries.length ? entries.sort().join("\n") : "(empty)";
      log.event("tool", { name: "list_files", path: args.path, count: entries.length });
      return { content: [{ type: "text", text }] };
    }
  );

  const writeFile = tool(
    "write_file",
    "Create or overwrite a file in the project. Path is relative to the project root. Parent directories are created as needed.",
    {
      path: z.string(),
      content: z.string(),
    },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, args.content, "utf-8");
      log.event("tool", { name: "write_file", path: args.path, bytes: args.content.length });
      return { content: [{ type: "text", text: `wrote ${args.path} (${args.content.length} bytes)` }] };
    }
  );

  const appendToFile = tool(
    "append_to_file",
    "Append content to a file (create if missing). Use this to accumulate notes across multiple per-chapter passes — for example, when a per-chapter editor pass needs to add a section to a global logs/editor-X.md file without rewriting the whole file.",
    {
      path: z.string(),
      content: z.string(),
    },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.appendFile(abs, args.content, "utf-8");
      log.event("tool", { name: "append_to_file", path: args.path, bytes: args.content.length });
      return { content: [{ type: "text", text: `appended ${args.content.length} bytes to ${args.path}` }] };
    }
  );

  const appendContinuity = tool(
    "append_continuity",
    "Record durable free-text facts into the world store as `statement` facts — for facts later drafting must not break that don't cleanly atomize into assert_fact's entity.attribute=value form. Writes the same store as assert_fact; logs/continuity.md is regenerated from the store, never hand-edited.",
    {
      facts: z.array(z.string()).min(1).describe("One or more standalone factual statements."),
    },
    async (args) => {
      // The architect has no open chapter; bucket its facts under the "canon" chapter so
      // they still render in the regenerated ledger (drafted tier — the canon tier had no
      // live consumer and orphaned them from every reader path). The drafter inherits its
      // open chapter.
      const chapter = deps.source === "architect" ? "canon" : undefined;
      for (const f of args.facts) await session.assertStatement({ value: f, chapter });
      log.event("tool", { name: "append_continuity", count: args.facts.length, source: deps.source });
      return { content: [{ type: "text", text: `recorded ${args.facts.length} fact(s) to the world store` }] };
    }
  );

  const appendGlossary = tool(
    "append_glossary",
    "Append entries to canon/glossary.md. Use for new names, places, terms, objects.",
    {
      entries: z.array(z.object({ term: z.string(), definition: z.string() })).min(1),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "canon/glossary.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      const block = "\n" + args.entries.map((e) => `**${e.term}** — ${e.definition}`).join("\n\n") + "\n";
      await fs.appendFile(file, block, "utf-8");
      log.event("tool", { name: "append_glossary", count: args.entries.length });
      return { content: [{ type: "text", text: `appended ${args.entries.length} glossary entries` }] };
    }
  );

  const recordScene = tool(
    "record_scene",
    "Record a scene entry in logs/scene-log.md. Call this after drafting a scene or chapter.",
    {
      sceneId: z.string().describe("e.g. 'ch01' or '03-the-prize'"),
      summary: z.string(),
      newFacts: z.array(z.string()),
      looseThreads: z.array(z.string()),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/scene-log.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      const parts = [
        `\n## ${args.sceneId}`,
        `**Summary:** ${args.summary}`,
      ];
      if (args.newFacts.length) {
        parts.push(`**New facts:**\n${args.newFacts.map((f) => `- ${f}`).join("\n")}`);
      }
      if (args.looseThreads.length) {
        parts.push(`**Loose threads:**\n${args.looseThreads.map((t) => `- ${t}`).join("\n")}`);
      }
      await fs.appendFile(file, parts.join("\n") + "\n", "utf-8");
      log.event("tool", { name: "record_scene", sceneId: args.sceneId });
      return { content: [{ type: "text", text: `recorded scene ${args.sceneId}` }] };
    }
  );

  const recordChapterCraft = tool(
    "record_chapter_craft",
    "Record craft choices for the just-drafted chapter in logs/chapter-craft.md. Call this after record_scene and BEFORE append_continuity / append_glossary — the order matters because agents tend to drop last items in long checklists. The recorded craft data is read by subsequent drafters (via read_recent_craft) to detect cross-chapter pattern-pressure, and by the reader and editor-pacing macro pass to surface cross-chapter pattern problems efficiently.",
    chapterCraftShape,
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/chapter-craft.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.appendFile(file, formatChapterCraftEntry(args), "utf-8");
      log.event("tool", { name: "record_chapter_craft", chapterId: args.chapterId });
      return { content: [{ type: "text", text: `recorded chapter craft for ${args.chapterId}` }] };
    }
  );

  const projectState = tool(
    "project_state",
    "Summarize what files exist in canon/, outline/, draft/. Use as a 'where am I' check.",
    {},
    async () => {
      const dirs = ["canon", "outline", "draft"];
      const out: string[] = [];
      for (const d of dirs) {
        const abs = resolveInProject(projectRoot, d);
        let entries: string[] = [];
        try {
          entries = (await fs.readdir(abs)).filter((e) => !e.startsWith("."));
        } catch {}
        out.push(`${d}/ (${entries.length} files): ${entries.sort().join(", ") || "(empty)"}`);
      }
      log.event("tool", { name: "project_state" });
      return { content: [{ type: "text", text: out.join("\n") }] };
    }
  );

  const updateStoryArc = tool(
    "update_story_arc",
    "Append a one-line summary of a freshly-drafted chapter to logs/story-arc.md. Call this once after writing a chapter, before record_scene. The arc file is a chronological digest later chapters use instead of re-reading the full scene log.",
    {
      chapterId: z.string().describe("e.g. '01-the-finding'"),
      oneLine: z.string().describe("One sentence (≤ 30 words) summarizing what changed in this chapter."),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/story-arc.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      const exists = await fs.access(file).then(() => true).catch(() => false);
      if (!exists) {
        await fs.writeFile(
          file,
          "# Story Arc\n\nOne tight line per drafted chapter, in chronological order.\n\n",
          "utf-8"
        );
      }
      await fs.appendFile(file, `- **${args.chapterId}** — ${args.oneLine}\n`, "utf-8");
      log.event("tool", { name: "update_story_arc", chapterId: args.chapterId });
      return { content: [{ type: "text", text: `appended story-arc line for ${args.chapterId}` }] };
    }
  );

  const writeFindings = tool(
    "write_findings",
    "Write the complete structured findings file (logs/findings.json) for a developmental review. Replaces any prior findings file. Call exactly once per review, AFTER you have finished writing the prose letter. Each finding is a single concrete issue with severity, category, evidence, and (when applicable) a repair_agent + repair_params that downstream repair phases will consume. Findings must be CATEGORICAL — describe the kind of issue and cite specific evidence — not bespoke to a single named tic. The same finding category may appear many times for different instances.",
    {
      findings: z.array(FindingSchema),
    },
    async (args) => {
      const relpath = await persistFindings(projectRoot, args.findings);
      log.event("tool", {
        name: "write_findings",
        count: args.findings.length,
        bySeverity: args.findings.reduce<Record<string, number>>((acc, f) => {
          acc[f.severity] = (acc[f.severity] ?? 0) + 1;
          return acc;
        }, {}),
      });
      return {
        content: [
          {
            type: "text",
            text: `wrote ${args.findings.length} findings to ${relpath}`,
          },
        ],
      };
    }
  );

  const appendFindings = tool(
    "append_findings",
    "Append findings to the existing logs/findings.json (creating it if missing). Unlike write_findings, this preserves any findings other agents already produced. Dedupes by `id` — if a finding with the same id exists, the new version replaces it. Use this when adding findings to a shared findings file alongside other review-style phases.",
    {
      findings: z.array(FindingSchema),
    },
    async (args) => {
      const relpath = await persistAppendFindings(projectRoot, args.findings);
      log.event("tool", {
        name: "append_findings",
        count: args.findings.length,
        bySeverity: args.findings.reduce<Record<string, number>>((acc, f) => {
          acc[f.severity] = (acc[f.severity] ?? 0) + 1;
          return acc;
        }, {}),
      });
      return {
        content: [
          {
            type: "text",
            text: `appended ${args.findings.length} findings to ${relpath}`,
          },
        ],
      };
    }
  );

  const readRecentScenes = tool(
    "read_recent_scenes",
    "Return only the most recent N entries from logs/scene-log.md. Use this when drafting a later chapter — it gives you the immediate-context entries without dragging in the full accumulated log.",
    {
      n: z.number().int().min(1).max(20).describe("How many of the most recent scene-log entries to return (3 is the usual choice for drafting)."),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/scene-log.md");
      let text = "";
      try {
        text = await fs.readFile(file, "utf-8");
      } catch {
        return { content: [{ type: "text", text: "(no scene log yet)" }] };
      }
      const entries = text.split(/\n(?=## )/).filter((e) => e.trim());
      const recent = entries.slice(-args.n).join("\n").trim();
      log.event("tool", { name: "read_recent_scenes", n: args.n, returned: Math.min(args.n, entries.length) });
      return { content: [{ type: "text", text: recent || "(empty)" }] };
    }
  );

  const readRecentCraft = tool(
    "read_recent_craft",
    "Return only the most recent N entries from logs/chapter-craft.md. Call this when drafting a later chapter to see craft choices made in recent chapters — used to detect cross-chapter pattern-pressure (e.g., to notice if recent chapters keep ending in the same mode, opening with the same texture, or reusing a recurring construction). Mirrors read_recent_scenes; do not read the full chapter-craft.md directly. Returns '(no chapter-craft log yet)' if the file is missing.",
    {
      n: z.number().int().min(1).max(20).describe("How many of the most recent chapter-craft entries to return (3 is the usual choice for drafting)."),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/chapter-craft.md");
      let text = "";
      try {
        text = await fs.readFile(file, "utf-8");
      } catch {
        return { content: [{ type: "text", text: "(no chapter-craft log yet)" }] };
      }
      const recent = extractRecentCraftEntries(text, args.n);
      log.event("tool", { name: "read_recent_craft", n: args.n });
      return { content: [{ type: "text", text: recent }] };
    }
  );

  // ── World-store tools (M3 dual-write shadow) ──────────────────────
  // Additive: these populate logs/world/events.jsonl alongside the legacy
  // markdown logs (which remain authoritative). close_chapter only WARNS.

  const openChapter = tool(
    "open_chapter",
    "Open the world-store transaction for the chapter you are about to draft. Call this FIRST. Subsequent assert_fact / upsert_entity / record_relation / record_knowledge calls inherit this chapter as their provenance.",
    {
      chapterId: z.string().describe("Chapter id matching the outline/draft slug, e.g. '01-the-opening'."),
      discourseIndex: z.number().int().optional().describe("Reading-order index; defaults to the NN- prefix of chapterId."),
      pov: z.array(z.string()).optional().describe("POV character entity ids present in this chapter."),
      storyTimeLabel: z.string().optional().describe("Optional in-world time label (only for non-linear/braided briefs)."),
    },
    async (args) => {
      const r = await session.openChapter(args);
      log.event("tool", { name: "open_chapter", chapterId: r.chapterId });
      return { content: [{ type: "text", text: `opened chapter ${r.chapterId} (discourse #${r.discourseIndex})` }] };
    }
  );

  const closeChapter = tool(
    "close_chapter",
    "Close the world-store transaction for the chapter. Call this LAST, after all capture calls. Reports whether the chapter captured structured facts; a missing capture is a WARNING only this milestone (never blocks).",
    { chapterId: z.string().optional().describe("Defaults to the currently open chapter.") },
    async (args) => {
      const r = await session.closeChapter(args);
      log.event("tool", { name: "close_chapter", incomplete: r.incomplete, missing: r.missing });
      const note = r.incomplete ? ` (warning: ${r.missing.join("; ")})` : "";
      return { content: [{ type: "text", text: `closed chapter${note}` }] };
    }
  );

  const assertFact = tool(
    "assert_fact",
    "Capture a durable fact into the world store as entity.attribute = value (the structured form; for a fact that doesn't atomize cleanly, use append_continuity instead). A numeric value REQUIRES a unit. Pass a RESOLVED entity id (from resolve_entity/upsert_entity), not a free-typed name, and reuse canonical dotted attribute keys (age, birth_year, role, date, location, ...) — consistent ids + keys are what let cross-chapter contradictions be detected. One fact per call (decompose compound sentences). Re-asserting within the same chapter overwrites the prior assertion; across chapters a new assertion is recorded. When deliberately changing an established value, pass `supersedes` (the prior fact id, from query_facts) to retire the old one.",
    {
      entity: z.string().describe("Stable entity id/slug, e.g. 'eira-bowman', 'breakwater'."),
      attribute: z.string().describe("Dotted attribute key, e.g. 'age', 'hearing.left_ear', 'notebook.count'."),
      value: z.union([z.string(), z.number(), z.boolean()]),
      unit: z.string().optional().describe("REQUIRED when value is numeric, e.g. 'years', 'notebooks'."),
      polarity: z.enum(POLARITIES).optional(),
      tier: z.enum(TIERS).optional().describe("'canon' for architect-seeded spine facts; defaults to 'drafted'."),
      confidence: z.enum(CONFIDENCES).optional(),
      supersedes: z.string().optional().describe("A prior fact id this assertion retires."),
    },
    async (args) => {
      const r = await session.assertFact(args);
      log.event("tool", { name: "assert_fact", id: r.id });
      return { content: [{ type: "text", text: `asserted ${r.id}` }] };
    }
  );

  const upsertEntity = tool(
    "upsert_entity",
    "Register or update a named entity in the world store, IN ADDITION to append_glossary. Use a stable slug id so later chapters reference the same entity.",
    {
      id: z.string().describe("Stable slug, e.g. 'eira-bowman'."),
      kind: z.enum(ENTITY_KINDS),
      display_name: z.string(),
      aliases: z.array(z.string()).optional(),
      short_gloss: z.string().optional(),
      pov: z.boolean().optional(),
    },
    async (args) => {
      const r = await session.upsertEntity(args);
      log.event("tool", { name: "upsert_entity", id: r.id });
      return { content: [{ type: "text", text: `upserted entity ${r.id}` }] };
    }
  );

  const recordRelation = tool(
    "record_relation",
    "Record a relationship between two entities (e.g. located_in, member_of, possesses, knows_of). Use value:false for a negative relation such as a never-meet constraint (knows_of=false).",
    {
      from: z.string(),
      relType: z.string().describe("e.g. 'located_in', 'member_of', 'possesses', 'knows_of'."),
      to: z.string(),
      value: z.boolean().optional().describe("false for a negative relation (e.g. knows_of=false)."),
      symmetric: z.boolean().optional(),
      sinceChapter: z.string().optional(),
    },
    async (args) => {
      const r = await session.relate(args);
      log.event("tool", { name: "record_relation", id: r.id });
      return { content: [{ type: "text", text: `related ${r.id}` }] };
    }
  );

  const recordKnowledge = tool(
    "record_knowledge",
    "Record an epistemic state: who knows/believes/suspects what, as of this chapter. The knower is an entity id OR the reserved reader '@reader'. The proposition references either a fact id (factRef) or a free proposition slug (prop). This is what makes dramatic irony and reveal-order queryable.",
    {
      knower: z.string().describe("An entity id, or '@reader'."),
      proposition: z.union([z.object({ factRef: z.string() }), z.object({ prop: z.string() })]),
      stance: z.enum(STANCES),
      basis: z.enum(BASES).optional(),
      basisEntity: z.string().optional().describe("The teller, when basis is 'told_by'."),
      discourseIndex: z.number().int().optional().describe("Defaults to the open chapter's discourse index."),
    },
    async (args) => {
      const r = await session.learn(args);
      log.event("tool", { name: "record_knowledge", id: r.id });
      return { content: [{ type: "text", text: `recorded knowledge ${r.id}` }] };
    }
  );

  const queryFacts = tool(
    "query_facts",
    "Return the live facts the world store holds for an entity (value+unit, tier, source chapter). Use this before committing a number/date/attribute for an established entity, instead of re-reading the whole continuity ledger.",
    { entity: z.string() },
    async (args) => {
      const facts = await session.queryFacts(args);
      log.event("tool", { name: "query_facts", entity: args.entity, count: facts.length });
      const text = facts.length
        ? facts.map((f) => `- ${f.attribute} = ${String(f.value)}${f.unit ? " " + f.unit : ""} [${f.tier}, ${f.provenance.chapter}] (id: ${f.id})`).join("\n")
        : `(no facts recorded for ${args.entity})`;
      return { content: [{ type: "text", text }] };
    }
  );

  const resolveEntity = tool(
    "resolve_entity",
    "Look up entities by name/alias/id substring. Use to find the stable id for a name before asserting facts about it.",
    { query: z.string() },
    async (args) => {
      const ents = await session.resolveEntity(args);
      log.event("tool", { name: "resolve_entity", query: args.query, count: ents.length });
      const text = ents.length
        ? ents.map((e) => `- ${e.id} (${e.kind}) — ${e.display_name}${e.short_gloss ? ": " + e.short_gloss : ""}`).join("\n")
        : `(no entity matches "${args.query}")`;
      return { content: [{ type: "text", text }] };
    }
  );

  const whoKnows = tool(
    "who_knows",
    "Return what a knower (an entity id, or '@reader') knows/believes/suspects as of a given chapter — the live epistemic stances at or before that chapter's reading-order index. Use to keep a POV chapter honest about what the character (or the reader) knows yet.",
    { knower: z.string(), asOfChapter: z.string() },
    async (args) => {
      const states = await session.whoKnows(args);
      log.event("tool", { name: "who_knows", knower: args.knower, count: states.length });
      const text = states.length
        ? states
            .map((k) => {
              const p = "factRef" in k.proposition ? k.proposition.factRef : k.proposition.prop;
              return `- ${k.stance} ${p}${k.basis ? " (" + k.basis + ")" : ""}`;
            })
            .join("\n")
        : `(${args.knower} has no recorded knowledge as of ${args.asOfChapter})`;
      return { content: [{ type: "text", text }] };
    }
  );

  const dramaticIronyTool = tool(
    "dramatic_irony",
    "Return the live dramatic-irony gaps as of a chapter: propositions the @reader knows, believes, or suspects that a character is unaware of (or actively wrong about), using each knower's latest stance. Use to verify the irony you intend actually lands, and to keep a POV chapter honest about the gap between reader and character knowledge.",
    { asOfChapter: z.string() },
    async (args) => {
      const gaps = await session.dramaticIrony(args);
      log.event("tool", { name: "dramatic_irony", asOfChapter: args.asOfChapter, count: gaps.length });
      const text = gaps.length
        ? gaps
            .map((g) => `- reader ${g.readerStance} "${g.readable}" but ${g.character} ${g.characterStance}`)
            .join("\n")
        : `(no dramatic-irony gaps as of ${args.asOfChapter})`;
      return { content: [{ type: "text", text }] };
    }
  );

  const server = createSdkMcpServer({
    name: SERVER_NAME,
    version: "0.1.0",
    tools: [
      readFile,
      listFiles,
      writeFile,
      appendToFile,
      appendContinuity,
      appendGlossary,
      recordScene,
      recordChapterCraft,
      projectState,
      updateStoryArc,
      readRecentScenes,
      readRecentCraft,
      writeFindings,
      appendFindings,
      openChapter,
      closeChapter,
      assertFact,
      upsertEntity,
      recordRelation,
      recordKnowledge,
      queryFacts,
      resolveEntity,
      whoKnows,
      dramaticIronyTool,
    ],
  });

  const toolNames = [
    "read_file",
    "list_files",
    "write_file",
    "append_to_file",
    "append_continuity",
    "append_glossary",
    "record_scene",
    "record_chapter_craft",
    "project_state",
    "update_story_arc",
    "read_recent_scenes",
    "read_recent_craft",
    "write_findings",
    "append_findings",
    "open_chapter",
    "close_chapter",
    "assert_fact",
    "upsert_entity",
    "record_relation",
    "record_knowledge",
    "query_facts",
    "resolve_entity",
    "who_knows",
    "dramatic_irony",
  ];

  return {
    server,
    serverName: SERVER_NAME,
    allowedToolIds: toolNames.map((n) => `mcp__${SERVER_NAME}__${n}`),
  };
}
