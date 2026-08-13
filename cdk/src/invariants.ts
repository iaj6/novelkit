import { resolveManuscript, type ManuscriptChapter } from "./manuscript.js";
import { loadConfig, type InvariantsConfig } from "./config.js";

/**
 * Mechanical checks of a book's stated structural contract.
 *
 * These exist because NOTHING in the pipeline re-checked the brief's contract after
 * a later phase mutated the text. On The Ninth Line the drafter honored a stated
 * 1,900-word floor in all 30 chapters and the editor's compression pass then pushed
 * three of them under it — silently, because no code anywhere knew the floor existed.
 *
 * Invariants are DECLARED in cdk.config.json rather than inferred from the brief's
 * prose. Inferring them would make the check as unreliable as the thing it guards,
 * and a wrong floor is worse than no floor: it would fail runs for imaginary reasons.
 * Absent config means no constraint — never invent one.
 */
export type Violation = {
  kind: "chapter-min-words" | "total-min-words";
  /** Chapter id, or null for whole-manuscript violations. */
  chapter: string | null;
  actual: number;
  required: number;
  message: string;
};

/** Whitespace-delimited token count, ignoring markdown headings and HTML comments. */
export function countWords(markdown: string): number {
  const stripped = markdown.replace(/^#.*$/gm, "").replace(/<!--.*?-->/gs, "");
  return (stripped.match(/\S+/g) ?? []).length;
}

/**
 * Pure over its inputs so a caller can check a hypothetical manuscript (e.g. the
 * post-state of a revision) without touching disk.
 */
export function checkInvariants(
  chapters: ManuscriptChapter[],
  invariants: InvariantsConfig | undefined
): Violation[] {
  if (!invariants) return [];
  const violations: Violation[] = [];

  const min = invariants.minWordsPerChapter;
  if (typeof min === "number" && min > 0) {
    for (const ch of chapters) {
      const actual = countWords(ch.text);
      if (actual < min) {
        violations.push({
          kind: "chapter-min-words",
          chapter: ch.id,
          actual,
          required: min,
          message: `${ch.id} is ${actual} words, below the stated floor of ${min}`,
        });
      }
    }
  }

  const minTotal = invariants.minTotalWords;
  if (typeof minTotal === "number" && minTotal > 0) {
    const total = chapters.reduce((n, ch) => n + countWords(ch.text), 0);
    if (total < minTotal) {
      violations.push({
        kind: "total-min-words",
        chapter: null,
        actual: total,
        required: minTotal,
        message: `manuscript is ${total} words, below the stated total of ${minTotal}`,
      });
    }
  }

  return violations;
}

/** Convenience: resolve the effective manuscript and check it against the book's config. */
export async function checkProjectInvariants(projectRoot: string): Promise<Violation[]> {
  const config = await loadConfig(projectRoot);
  if (!config.invariants) return [];
  const chapters = await resolveManuscript(projectRoot);
  return checkInvariants(chapters, config.invariants);
}
