import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { WorldEventSchema } from "../src/world/schema.js";
import { appendEvent } from "../src/world/store.js";
import { regenerateLedgerViews } from "../src/world/regenerate.js";

const tmpProject = () => fs.mkdtemp(path.join(os.tmpdir(), "nk-regen-"));
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
    const md = await fs.readFile(path.join(dir, "logs/continuity.md"), "utf-8");
    expect(md).toContain("## 01-a");
    expect(md).toContain("eira — role: harbormaster");
    expect(md).toContain("eira — age: 52 years");
  });

  it("is idempotent (same store -> byte-identical file)", async () => {
    const dir = await tmpProject();
    await appendEvent(dir, fact("f1", "a", "role", "lead", "02-x"));
    await regenerateLedgerViews(dir);
    const first = await fs.readFile(path.join(dir, "logs/continuity.md"), "utf-8");
    await regenerateLedgerViews(dir);
    const second = await fs.readFile(path.join(dir, "logs/continuity.md"), "utf-8");
    expect(second).toBe(first);
  });

  it("seeds a (none yet) ledger for a fresh book (no file, empty store)", async () => {
    const dir = await tmpProject();
    await regenerateLedgerViews(dir);
    const md = await fs.readFile(path.join(dir, "logs/continuity.md"), "utf-8");
    expect(md).toContain("(none yet)");
  });

  it("does NOT overwrite a pre-existing ledger when the store has no drafted facts", async () => {
    const dir = await tmpProject();
    await fs.mkdir(path.join(dir, "logs"), { recursive: true });
    await fs.writeFile(path.join(dir, "logs/continuity.md"), "legacy hand-written ledger\n", "utf-8");
    await regenerateLedgerViews(dir); // empty store -> must not wipe
    const md = await fs.readFile(path.join(dir, "logs/continuity.md"), "utf-8");
    expect(md).toBe("legacy hand-written ledger\n");
  });
});
