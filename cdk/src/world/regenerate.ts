import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveInProject } from "../paths.js";
import { readEvents } from "./store.js";
import { project } from "./project.js";
import { renderFactLedger, LEDGER_SENTINEL } from "./views.js";

/**
 * Regenerate the store-derived markdown views (M6 robustness core). Currently the
 * drafted-tier ledger `logs/continuity.md`, rendered from the world store — the
 * store is the source of truth and this is the view the drafter reads while writing
 * later chapters. This is deterministic HOST code (not an agent tool), called from
 * the phase loop, so it cannot be skipped by a model dropping a checklist item.
 *
 * `canon/continuity.md` stays architect-hand-authored (press-critical) and is NOT
 * regenerated here — only the high-churn drafted ledger flips to store-authoritative.
 *
 * Safety (augment-never-regress): gates the overwrite on a store-owned SENTINEL in the
 * existing file, NOT on "the store has any fact". A legacy / hand-written
 * logs/continuity.md lacks the sentinel, so it is preserved untouched — a sparse store
 * must never clobber a richer legacy ledger. A fresh book (no file) is seeded; a file we
 * previously authored (sentinel present) is updated. There is no legacy-import backfill:
 * the one-time markdown importer was dropped in M9 as an un-run migration (never wired into
 * `cdk run`, never executed on a real book), so a legacy book's `logs/continuity.md` stays
 * markdown-only — this clobber-guard is what keeps a sparse store from overwriting it.
 */
export async function regenerateLedgerViews(projectRoot: string): Promise<void> {
  const file = resolveInProject(projectRoot, "logs/continuity.md");
  const existing = await fs.readFile(file, "utf-8").catch(() => null);
  // Never clobber a ledger this function did not author (no sentinel => legacy/hand-written).
  if (existing !== null && !existing.includes(LEDGER_SENTINEL)) return;
  const tables = project((await readEvents(projectRoot)).events);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, renderFactLedger(tables), "utf-8");
}
