import { z } from "zod";

/**
 * What kind of change an item makes. This selects the applier and bounds the risk:
 *
 *   in-chapter          — rewriting inside one chapter (compress, cash a planted
 *                         setup, dramatize a decision, cut an over-articulation)
 *   cross-chapter-fact  — one fact reconciled to a canonical value across many
 *                         chapters (an address, a time, a name). Judgment lives in
 *                         choosing the canonical value; the edits themselves are
 *                         verbatim substitutions.
 *
 * Structural cut/merge/reorder is deliberately absent — the world store keys facts
 * and records to chapter ids, so removing or renumbering a chapter orphans them.
 */
export const REVISION_CLASSES = ["in-chapter", "cross-chapter-fact"] as const;
export type RevisionClass = (typeof REVISION_CLASSES)[number];

/**
 * A verbatim passage that must survive the revision, checked in code before and
 * after the item runs.
 *
 * Both panels that reviewed a manuscript produced a "what not to touch" list, and it
 * mattered: an agent handed a long fix list will otherwise sand down the very
 * chapters the book is carried by. A prose instruction not to spoil them is not
 * enforcement; a substring check is.
 */
export const ProtectedPassageSchema = z.object({
  chapter: z.string().describe("Chapter id the passage lives in."),
  text: z.string().min(1).describe("Verbatim text that must still be present afterwards."),
  why: z.string().optional(),
});
export type ProtectedPassage = z.infer<typeof ProtectedPassageSchema>;

export const EditSchema = z.object({
  chapter: z.string(),
  wrong_text: z.string().min(1),
  correct_text: z.string(),
});

export const RevisionItemSchema = z.object({
  id: z.string().describe("Stable identifier, e.g. 'rev-001'."),
  title: z.string(),
  rationale: z.string().describe("Why this change is worth making."),
  /**
   * Findings this item answers. Required and non-empty: revision must be traceable
   * to a diagnosis, never freelance rewriting of prose an agent simply disliked.
   */
  source_findings: z
    .array(z.string())
    .min(1)
    .describe("Finding ids from logs/findings.json, or cold-read lens references."),
  class: z.enum(REVISION_CLASSES),
  chapters: z.array(z.string()).min(1).describe("Declared blast radius."),
  instruction: z.string().describe("What the reviser must do."),
  acceptance: z.string().describe("How to tell it worked."),
  protected_passages: z.array(ProtectedPassageSchema).default([]),
  /** Required for cross-chapter-fact items: the substitutions to apply. */
  edits: z.array(EditSchema).optional(),
  /** The human gate. Items are inert until this is flipped. */
  approved: z.boolean().default(false),
});
export type RevisionItem = z.infer<typeof RevisionItemSchema>;

export const RevisionPlanSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string(),
  items: z.array(RevisionItemSchema),
});
export type RevisionPlan = z.infer<typeof RevisionPlanSchema>;

export const REVISION_PLAN_PATH = "logs/revision-plan.json";

/** Items the operator has approved. Everything else is inert by construction. */
export function approvedItems(plan: RevisionPlan): RevisionItem[] {
  return plan.items.filter((i) => i.approved);
}

/**
 * Structural problems that make an item unsafe to run, independent of the book.
 * Returned rather than thrown so the caller can report every bad item at once.
 */
export function validateItem(item: RevisionItem): string[] {
  const problems: string[] = [];
  if (item.class === "cross-chapter-fact" && (!item.edits || item.edits.length === 0)) {
    problems.push(`${item.id}: cross-chapter-fact item has no edits`);
  }
  if (item.edits?.length) {
    for (const e of item.edits) {
      if (!item.chapters.includes(e.chapter)) {
        // An edit outside the declared radius means the blast radius is a lie, and
        // the radius is what the operator approved.
        problems.push(`${item.id}: edit targets ${e.chapter}, outside declared chapters`);
      }
    }
  }
  for (const p of item.protected_passages) {
    if (!item.chapters.includes(p.chapter)) {
      problems.push(
        `${item.id}: protected passage cites ${p.chapter}, outside declared chapters`
      );
    }
  }
  return problems;
}
