import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Production-artifact checks — machinery that leaked into the reader's copy.
 *
 * This gate exists because a build-provenance comment carrying an ABSOLUTE path shipped to the
 * deployed site 178 times, across all 11 published books, and nothing was looking. It came from
 * one line in press/concat_chapters.sh and survived the drafter, four editor passes, the reader,
 * the fact audit, and eleven publishes.
 *
 * WHY THIS IS WORTH GATING, in the project's own units: the same class of defect was measured. A
 * publisher's back-catalogue left in the final chapter of a test manuscript cost 0.86 points on the
 * blind cold-read panel (5.43 -> 6.29 with it removed, would-finish 5/7 -> 7/7) — larger than the
 * ENTIRE between-book score spread of the 11-book corpus (0.64), and larger than any measured
 * editor-pass effect. Non-story text in the artifact is the most expensive defect yet quantified.
 *
 * WHY IT IS DETERMINISTIC AND NOT A SCORE. A quality threshold cannot gate anything here: the panel
 * puts 11 books inside 7.07-7.71 and moves 0.33 when re-run on an UNCHANGED manuscript. Every rule
 * below is a substring or regex match on text that is unambiguously not prose, so a finding is a
 * defect by definition rather than by judgement.
 *
 * WHAT WAS EVALUATED AND DELIBERATELY EXCLUDED — duplicated scenes. An evidence pass over all 21
 * books found 6 candidate duplicate paragraphs and ALL SIX were false positives: every one was a
 * registered document being deliberately re-quoted, which is the record layer's designed behaviour
 * (the earlier claim of "duplicated scenes in 2 of 11 published books" was the same false positive).
 * With record re-quotes excluded the corpus contains ZERO duplicated scenes. A gate for a defect
 * that has never occurred is how this codebase grew 19 phases, so it is not included. Restore it
 * only against a real instance.
 */
export type ArtifactFinding = {
  kind: "absolute-path" | "build-comment";
  /** Project-relative file the leak was found in. */
  file: string;
  /** 1-indexed line, when resolvable. */
  line: number;
  /** The offending text, trimmed for display. */
  excerpt: string;
  message: string;
};

/** Home-directory paths on every platform this could plausibly build on. */
const ABSOLUTE_PATH = /(?:\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+|[A-Za-z]:\\Users\\[A-Za-z0-9._-]+)/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

function lineOf(text: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === "\n") n++;
  return n;
}

/**
 * Pure over its inputs so a caller can check a hypothetical artifact without touching disk.
 *
 * `allowComments` exempts manuscript.md, where `<!-- source: draft/NN-slug.md -->` is LOAD-BEARING:
 * press/prepare_tts.py splits chapters on exactly that marker. Absolute paths are never allowed
 * anywhere — that is the leak this gate was built for, and it has no legitimate form.
 */
export function checkArtifactText(
  relPath: string,
  text: string,
  opts: { allowComments: boolean }
): ArtifactFinding[] {
  const out: ArtifactFinding[] = [];

  for (const m of text.matchAll(ABSOLUTE_PATH)) {
    out.push({
      kind: "absolute-path",
      file: relPath,
      line: lineOf(text, m.index ?? 0),
      excerpt: m[0],
      message: `absolute filesystem path in a shipped artifact (${m[0]}) — leaks the build machine's directory layout`,
    });
  }

  if (!opts.allowComments) {
    for (const m of text.matchAll(HTML_COMMENT)) {
      out.push({
        kind: "build-comment",
        file: relPath,
        line: lineOf(text, m.index ?? 0),
        excerpt: m[0].slice(0, 80).replace(/\s+/g, " "),
        message: "build comment in a reader-facing artifact — pandoc --strip-comments should have removed it",
      });
    }
  }

  return out;
}

/** The files a reader can actually reach: the concatenated manuscript and every built edition. */
async function shippedFiles(projectRoot: string): Promise<{ rel: string; allowComments: boolean }[]> {
  const out: { rel: string; allowComments: boolean }[] = [];
  const ms = path.join(projectRoot, "manuscript.md");
  if (await fs.access(ms).then(() => true, () => false)) {
    out.push({ rel: "manuscript.md", allowComments: true });
  }
  const buildDir = path.join(projectRoot, "build");
  const entries = await fs.readdir(buildDir).catch(() => [] as string[]);
  for (const e of entries.sort()) {
    if (e.endsWith(".html")) out.push({ rel: path.join("build", e), allowComments: false });
  }
  return out;
}

/** Scan a project's shipped artifacts. Empty array means clean. */
export async function checkProductionArtifacts(projectRoot: string): Promise<ArtifactFinding[]> {
  const findings: ArtifactFinding[] = [];
  for (const { rel, allowComments } of await shippedFiles(projectRoot)) {
    const text = await fs.readFile(path.join(projectRoot, rel), "utf-8").catch(() => null);
    if (text === null) continue;
    findings.push(...checkArtifactText(rel, text, { allowComments }));
  }
  return findings;
}

/** Human-readable summary. Caller decides whether to warn or exit. */
export function formatArtifactFindings(findings: ArtifactFinding[]): string {
  if (findings.length === 0) return "no production artifacts found";
  const byFile = new Map<string, ArtifactFinding[]>();
  for (const f of findings) {
    const list = byFile.get(f.file) ?? [];
    list.push(f);
    byFile.set(f.file, list);
  }
  const lines: string[] = [];
  for (const [file, list] of byFile) {
    lines.push(`  ${file} — ${list.length} finding${list.length === 1 ? "" : "s"}`);
    for (const f of list.slice(0, 3)) {
      lines.push(`    line ${f.line}: ${f.excerpt}`);
    }
    if (list.length > 3) lines.push(`    … and ${list.length - 3} more`);
  }
  return lines.join("\n");
}
