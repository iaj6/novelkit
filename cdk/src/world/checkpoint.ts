import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { readEvents, appendEvent } from "./store.js";
import { project, type WorldTables } from "./project.js";
import type { CompletedEntry } from "../state.js";

export interface VerifyResult {
  /** Whether the unit passes the GATING checks (resume may skip it). */
  ok: boolean;
  /** Gating failures (artifact missing/empty/changed). A non-empty list means re-run. */
  missing: string[];
  /** Non-gating observations (world-store coverage, which is shadow this milestone). */
  advisories: string[];
}

async function readFileOrNull(absPath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(absPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** sha256 of a file, or null if it does not exist. */
export async function hashFile(absPath: string): Promise<string | null> {
  const buf = await readFileOrNull(absPath);
  return buf === null ? null : createHash("sha256").update(buf).digest("hex");
}

/** Hash a set of project-relative files; omits any that don't exist. */
export async function hashFiles(projectRoot: string, relPaths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const rel of relPaths) {
    const h = await hashFile(path.join(projectRoot, rel));
    if (h !== null) out[rel] = h;
  }
  return out;
}

/**
 * Verify a completed drafter chapter on resume — the M4 fix for "completed=good".
 *
 * GATING (reliable, drives skip-vs-redraft): the chapter's draft file exists, is
 * non-empty, and — if a hash was recorded at completion — still matches. This
 * catches the silent-incomplete case: a key marked complete whose artifact is
 * missing, truncated, or changed (e.g. the agent errored after markComplete, or a
 * partial write).
 *
 * ADVISORY (non-gating in the M3 shadow): whether the world store holds a closed
 * chapter with >=1 fact. The store is not yet reliably populated, so its absence
 * is reported, never a reason to re-draft a good chapter. This becomes gating at M6.
 */
export async function verifyChapter(
  projectRoot: string,
  chapterId: string,
  entry?: CompletedEntry,
  /** Pre-projected tables for the advisory — pass once per resume to avoid O(chapters × events). */
  tables?: WorldTables
): Promise<VerifyResult> {
  const missing: string[] = [];
  const advisories: string[] = [];

  const rel = `draft/${chapterId}.md`;
  const abs = path.join(projectRoot, rel);
  const buf = await readFileOrNull(abs); // single read — no TOCTOU second stat
  if (buf === null) {
    missing.push(`${rel} is missing`);
  } else if (buf.length === 0) {
    missing.push(`${rel} is empty`);
  } else {
    // A present, non-empty draft whose hash changed is the EXPECTED downstream-editor
    // case (the editor passes rewrite draft/<id>.md in place) — advisory, NEVER a
    // re-draft. Only a missing or empty artifact gates (the silent-incomplete case).
    const recorded = entry?.hashes?.[rel];
    if (recorded && recorded !== createHash("sha256").update(buf).digest("hex")) {
      advisories.push(`${rel} changed since completion (likely a downstream edit)`);
    }
  }

  try {
    const t = tables ?? project((await readEvents(projectRoot)).events);
    const ch = t.chapters.get(chapterId);
    const facts = [...t.facts.values()].filter(
      (f) => f.provenance.chapter === chapterId && f.status === "live"
    );
    if (!ch || !ch.closed) advisories.push("world store: chapter not closed");
    if (facts.length === 0) advisories.push("world store: no facts captured");
  } catch {
    advisories.push("world store: unreadable");
  }

  return { ok: missing.length === 0, missing, advisories };
}

/**
 * Roll a chapter back to "as if never drafted" in the world store: append a
 * chapter-scoped retract event (the projector retracts the chapter's facts/
 * relations/knowledge and drops its chapter row). Append-only — the retraction is
 * itself an event, preserving the diff-friendly log. Used before a resume re-draft
 * so the re-draft does not leave stale records from the failed attempt.
 */
export async function rollbackChapter(
  projectRoot: string,
  chapterId: string,
  source: "repair" | "drafter" = "repair"
): Promise<void> {
  await appendEvent(projectRoot, {
    type: "retract",
    target: chapterId,
    scope: "chapter",
    reason: "resume re-draft",
    provenance: { chapter: chapterId, source },
  });
}
