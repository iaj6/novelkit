import * as fs from "node:fs/promises";
import * as path from "node:path";
import { normalizeWhitespace } from "../coldread/verify.js";
import { checkInvariants, type Violation } from "../invariants.js";
import { resolveManuscript, REVISION_DIR, type ManuscriptChapter } from "../manuscript.js";
import type { InvariantsConfig } from "../config.js";
import type { ProtectedPassage, RevisionItem } from "./schema.js";

/**
 * The pre-state of one chapter, enough to put it back exactly as it was.
 *
 * `revisionText === null` means there was no revision-1/ file before this item ran,
 * so rolling back means DELETING the file rather than restoring content — the case
 * a naive "write the old text back" would get wrong, leaving a spurious override
 * that shadows the draft forever.
 */
export type ChapterSnapshot = {
  chapter: string;
  revisionPath: string;
  revisionText: string | null;
};

export type PostconditionFailure =
  | { kind: "protected-passage-lost"; chapter: string; text: string }
  | { kind: "invariant"; violation: Violation };

export async function snapshotChapters(
  projectRoot: string,
  chapterIds: string[]
): Promise<ChapterSnapshot[]> {
  const out: ChapterSnapshot[] = [];
  for (const id of chapterIds) {
    const rel = path.join(REVISION_DIR, `${id}.md`);
    const abs = path.join(projectRoot, rel);
    const revisionText = await fs.readFile(abs, "utf-8").catch(() => null);
    out.push({ chapter: id, revisionPath: abs, revisionText });
  }
  return out;
}

/**
 * Put the manuscript back exactly as it was before an item ran. Called when any
 * post-condition fails, so a rejected revision never leaves a half-changed book.
 */
export async function rollback(snapshots: ChapterSnapshot[]): Promise<void> {
  for (const s of snapshots) {
    if (s.revisionText === null) {
      await fs.rm(s.revisionPath, { force: true });
    } else {
      await fs.mkdir(path.dirname(s.revisionPath), { recursive: true });
      await fs.writeFile(s.revisionPath, s.revisionText, "utf-8");
    }
  }
}

/** Whitespace-insensitive presence check — line rewrapping is forgiven, nothing else is. */
export function passagePresent(passage: ProtectedPassage, chapters: ManuscriptChapter[]): boolean {
  const ch = chapters.find((c) => c.id === passage.chapter);
  if (!ch) return false;
  return normalizeWhitespace(ch.text).includes(normalizeWhitespace(passage.text));
}

/**
 * Every protected passage that is NOT currently present.
 *
 * Run BEFORE an item as well as after: a passage that was already missing makes the
 * guard vacuous, and silently "protecting" text that isn't there would be worse than
 * having no guard, because it reads as a check that passed.
 */
export function missingPassages(
  passages: ProtectedPassage[],
  chapters: ManuscriptChapter[]
): ProtectedPassage[] {
  return passages.filter((p) => !passagePresent(p, chapters));
}

function violationKey(v: Violation): string {
  return `${v.kind}:${v.chapter ?? "<manuscript>"}`;
}

/**
 * How much an ALREADY-violating measure may drift further before the item is held
 * responsible, as a fraction of the requirement (1% — 19 words against a 1,900-word
 * floor).
 *
 * A tolerance is necessary, not a loophole. Replacing "Strada Crișan" with
 * "Dorobanților" is a correct one-word-shorter fix; applied to a chapter already 18
 * words under its floor it drops the count by one, and a strict "any decrease fails"
 * rule rolled the whole item back. That rule blocks essentially every shortening
 * edit in an already-short chapter, which is most of what revision does. The guard
 * still catches what it exists for: a chapter quietly losing a paragraph.
 */
export const WORSENING_TOLERANCE = 0.01;

/**
 * Violations this item is responsible for: ones that did not exist beforehand, or
 * that existed and got materially worse.
 *
 * Judging against absolute compliance instead would make the feature unusable on any
 * book that already breaks its contract — and books that already break it are
 * exactly the ones needing revision. The Ninth Line has three chapters under its
 * stated floor right now; a revision fixing an unrelated fact must not be rolled
 * back for a violation it inherited.
 */
export function newViolations(baseline: Violation[], current: Violation[]): Violation[] {
  const before = new Map(baseline.map((v) => [violationKey(v), v]));
  return current.filter((v) => {
    const prior = before.get(violationKey(v));
    if (!prior) return true;
    const allowedDrift = Math.max(1, Math.round(v.required * WORSENING_TOLERANCE));
    return v.actual < prior.actual - allowedDrift;
  });
}

/** The invariant violations a manuscript has right now — the baseline to judge against. */
export async function invariantBaseline(
  projectRoot: string,
  invariants: InvariantsConfig | undefined
): Promise<Violation[]> {
  const chapters = await resolveManuscript(projectRoot);
  return checkInvariants(chapters, invariants);
}

/**
 * Check an item's post-state. Returns [] when the revision is acceptable.
 *
 * Invariants are checked over the WHOLE manuscript rather than only the touched
 * chapters: a revision that pushes the book under its total-word floor is a
 * violation even though no single chapter looks wrong, which is exactly how the
 * compression pass slipped past unnoticed. `baseline` scopes that to damage this
 * item actually caused.
 */
export async function checkPostconditions(
  projectRoot: string,
  item: RevisionItem,
  invariants: InvariantsConfig | undefined,
  baseline: Violation[] = []
): Promise<PostconditionFailure[]> {
  const chapters = await resolveManuscript(projectRoot);
  const failures: PostconditionFailure[] = [];

  for (const p of missingPassages(item.protected_passages, chapters)) {
    failures.push({ kind: "protected-passage-lost", chapter: p.chapter, text: p.text });
  }
  for (const v of newViolations(baseline, checkInvariants(chapters, invariants))) {
    failures.push({ kind: "invariant", violation: v });
  }
  return failures;
}

export function describeFailure(f: PostconditionFailure): string {
  if (f.kind === "invariant") return f.violation.message;
  const excerpt = f.text.length > 60 ? `${f.text.slice(0, 57)}…` : f.text;
  return `protected passage lost from ${f.chapter}: "${excerpt}"`;
}
