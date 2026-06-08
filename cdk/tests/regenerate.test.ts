import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { WorldEventSchema } from "../src/world/schema.js";
import { appendEvent } from "../src/world/store.js";
import { regenerateLedgerViews } from "../src/world/regenerate.js";
import { LEDGER_SENTINEL } from "../src/world/views.js";

const tmpProject = () => fs.mkdtemp(path.join(os.tmpdir(), "nk-regen-"));
const ledgerPath = (dir: string) => path.join(dir, "logs/continuity.md");
const fact = (
  id: string,
  entity: string,
  attribute: string,
  value: string | number,
  chapter: string,
  extra: Record<string, unknown> = {}
) =>
  WorldEventSchema.parse({
    type: "fact.assert",
    id,
    entity,
    attribute,
    value,
    provenance: { chapter, source: "drafter" },
    ...extra,
  });

describe("regenerateLedgerViews", () => {
  it("writes store-derived logs/continuity.md from drafted facts", async () => {
    const dir = await tmpProject();
    await appendEvent(dir, fact("f1", "eira", "role", "harbormaster", "01-a"));
    await appendEvent(dir, fact("f2", "eira", "age", 52, "03-b", { unit: "years" }));
    await regenerateLedgerViews(dir);
    const md = await fs.readFile(ledgerPath(dir), "utf-8");
    expect(md).toContain("## 01-a");
    expect(md).toContain("eira — role: harbormaster");
    expect(md).toContain("eira — age: 52 years");
    expect(md).toContain(LEDGER_SENTINEL); // store-authored marker
  });

  it("is idempotent (same store -> byte-identical file)", async () => {
    const dir = await tmpProject();
    await appendEvent(dir, fact("f1", "a", "role", "lead", "02-x"));
    await regenerateLedgerViews(dir);
    const first = await fs.readFile(ledgerPath(dir), "utf-8");
    await regenerateLedgerViews(dir);
    const second = await fs.readFile(ledgerPath(dir), "utf-8");
    expect(second).toBe(first);
  });

  it("seeds a (none yet) ledger for a fresh book (no file, empty store)", async () => {
    const dir = await tmpProject();
    await regenerateLedgerViews(dir);
    const md = await fs.readFile(ledgerPath(dir), "utf-8");
    expect(md).toContain("(none yet)");
    expect(md).toContain(LEDGER_SENTINEL);
  });

  it("preserves a legacy (non-sentinel) ledger even when the store HAS drafted facts", async () => {
    // The augment-never-regress fix: gate on the sentinel, not on hasDrafted, so a sparse
    // store can never clobber a richer legacy hand-written ledger.
    const dir = await tmpProject();
    await fs.mkdir(path.join(dir, "logs"), { recursive: true });
    const legacy = "## 2024-01-01T00:00:00.000Z\n- The harbor froze in 1891.\n- Eira is 52.\n";
    await fs.writeFile(ledgerPath(dir), legacy, "utf-8");
    await appendEvent(dir, fact("f1", "eira", "age", 53, "01-a", { unit: "years" }));
    await regenerateLedgerViews(dir);
    expect(await fs.readFile(ledgerPath(dir), "utf-8")).toBe(legacy); // untouched
  });

  it("does NOT overwrite a non-store-authored ledger when the store is empty", async () => {
    const dir = await tmpProject();
    await fs.mkdir(path.join(dir, "logs"), { recursive: true });
    await fs.writeFile(ledgerPath(dir), "legacy hand-written ledger\n", "utf-8");
    await regenerateLedgerViews(dir);
    expect(await fs.readFile(ledgerPath(dir), "utf-8")).toBe("legacy hand-written ledger\n");
  });

  it("DOES update a prior store-authored ledger (sentinel present) with current facts", async () => {
    const dir = await tmpProject();
    await appendEvent(dir, fact("f1", "eira", "role", "harbormaster", "01-a"));
    await regenerateLedgerViews(dir); // creates a sentinel-bearing ledger
    await appendEvent(dir, fact("f2", "eira", "age", 52, "02-b", { unit: "years" }));
    await regenerateLedgerViews(dir); // store-authored -> update in place
    const md = await fs.readFile(ledgerPath(dir), "utf-8");
    expect(md).toContain("eira — age: 52 years");
    expect(md).toContain(LEDGER_SENTINEL);
  });
});
