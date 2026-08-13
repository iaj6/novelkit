import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * A chapter as the cold-read panel sees it. `relPath` is what a lens must pass to
 * read_file, so it already reflects the revision-1 override.
 */
export type ManuscriptChapter = {
  /** Chapter file basename without extension, e.g. "09-the-bracket". */
  id: string;
  /** Project-relative path the readers and the verifier both use. */
  relPath: string;
  text: string;
};

export const DRAFT_DIR = "draft";
export const REVISION_DIR = "revision-1";

/** Chapter files are the NN-slug.md ones; anything else in draft/ is not a chapter. */
function isChapterFile(name: string): boolean {
  return name.endsWith(".md") && /^\d{2}-/.test(name);
}

/**
 * Resolve "what the book currently is": every chapter in order, preferring the
 * repaired `revision-1/<name>` over `draft/<name>` when one exists.
 *
 * This is the single source of truth for the cold-read harness. Lenses are told to
 * read exactly these paths and the deterministic verifier checks quotes against
 * exactly these texts — if the two disagreed, a repaired line would read as a
 * fabricated quote. Callers must not re-derive the chapter list independently.
 */
export async function resolveManuscript(projectRoot: string): Promise<ManuscriptChapter[]> {
  const draftDir = path.join(projectRoot, DRAFT_DIR);
  const names = (await fs.readdir(draftDir).catch(() => [] as string[]))
    .filter(isChapterFile)
    .sort();

  const chapters: ManuscriptChapter[] = [];
  for (const name of names) {
    const revPath = path.join(projectRoot, REVISION_DIR, name);
    const revText = await fs.readFile(revPath, "utf-8").catch(() => null);
    const relPath = revText === null ? `${DRAFT_DIR}/${name}` : `${REVISION_DIR}/${name}`;
    const text = revText ?? (await fs.readFile(path.join(draftDir, name), "utf-8"));
    chapters.push({ id: name.replace(/\.md$/, ""), relPath, text });
  }
  return chapters;
}
