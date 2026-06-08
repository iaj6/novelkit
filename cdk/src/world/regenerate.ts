import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveInProject } from "../paths.js";
import { readEvents } from "./store.js";
import { project } from "./project.js";
import { renderFactLedger } from "./views.js";

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
 * Safety (augment-never-regress): seeds an empty "(none yet)" ledger for a fresh book,
 * but never overwrites a pre-existing (e.g. legacy hand-written) ledger with an empty
 * render. Full legacy-import backfill is deferred (M8 "backfill importer on cdk run").
 */
export async function regenerateLedgerViews(projectRoot: string): Promise<void> {
  const tables = project((await readEvents(projectRoot)).events);
  const hasDrafted = [...tables.facts.values()].some((f) => f.status === "live" && f.tier === "drafted");
  const file = resolveInProject(projectRoot, "logs/continuity.md");
  if (!hasDrafted) {
    // Fresh book: seed an empty ledger so the drafter's read_file succeeds. Legacy book
    // (file already present, store empty): never overwrite it with an empty render.
    const exists = await fs.access(file).then(() => true).catch(() => false);
    if (exists) return;
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, renderFactLedger(tables), "utf-8");
}
