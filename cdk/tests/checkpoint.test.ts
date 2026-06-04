import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { verifyChapter, rollbackChapter, hashFile, hashFiles } from "../src/world/checkpoint.js";
import { appendEvent, readEvents } from "../src/world/store.js";
import { project } from "../src/world/project.js";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "novelkit-checkpoint-"));
  mkdirSync(join(root, "draft"), { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

function writeDraft(chapterId: string, content: string): void {
  writeFileSync(join(root, "draft", `${chapterId}.md`), content, "utf-8");
}
const sha = (s: string) => createHash("sha256").update(Buffer.from(s, "utf-8")).digest("hex");

describe("hashFile / hashFiles", () => {
  it("hashes an existing file and returns null for a missing one", async () => {
    writeDraft("01-x", "hello");
    expect(await hashFile(join(root, "draft/01-x.md"))).toBe(sha("hello"));
    expect(await hashFile(join(root, "draft/nope.md"))).toBeNull();
  });

  it("hashFiles maps present files and omits missing ones", async () => {
    writeDraft("01-x", "a");
    expect(await hashFiles(root, ["draft/01-x.md", "draft/missing.md"])).toEqual({ "draft/01-x.md": sha("a") });
  });
});

describe("verifyChapter (M4 resume integrity)", () => {
  it("passes when the draft file is present and its recorded hash matches", async () => {
    writeDraft("01-x", "chapter prose");
    const v = await verifyChapter(root, "01-x", { hashes: { "draft/01-x.md": sha("chapter prose") } });
    expect(v.ok).toBe(true);
    expect(v.missing).toEqual([]);
  });

  it("fails when the draft file is missing (the silent-incomplete case)", async () => {
    const v = await verifyChapter(root, "99-gone");
    expect(v.ok).toBe(false);
    expect(v.missing.join()).toMatch(/missing/);
  });

  it("treats a hash change on a non-empty file as ADVISORY (downstream editor rewrite), never a re-draft", async () => {
    // the editor passes rewrite draft/<id>.md in place; that must NOT trigger a re-draft
    writeDraft("01-x", "the editor-revised chapter");
    const v = await verifyChapter(root, "01-x", { hashes: { "draft/01-x.md": sha("the original draft") } });
    expect(v.ok).toBe(true);
    expect(v.advisories.join()).toMatch(/changed/);
    expect(v.missing).toEqual([]);
  });

  it("fails when the draft file is empty", async () => {
    writeDraft("01-x", "");
    const v = await verifyChapter(root, "01-x");
    expect(v.ok).toBe(false);
    expect(v.missing.join()).toMatch(/empty/);
  });

  it("passes a legacy entry (no recorded hash) on a present non-empty file", async () => {
    writeDraft("01-x", "prose");
    expect((await verifyChapter(root, "01-x")).ok).toBe(true);
  });

  it("reports world-store coverage as ADVISORY only — never gates (store is shadow)", async () => {
    writeDraft("01-x", "prose"); // file good; store empty
    const v = await verifyChapter(root, "01-x", { hashes: { "draft/01-x.md": sha("prose") } });
    expect(v.ok).toBe(true); // not blocked by missing store coverage
    expect(v.advisories.length).toBeGreaterThan(0);
  });
});

describe("rollbackChapter", () => {
  it("retracts a chapter's store records and drops its chapter row", async () => {
    await appendEvent(root, { type: "chapter.open", chapterId: "03-z", discourseIndex: 3, provenance: { chapter: "03-z", source: "drafter" } });
    await appendEvent(root, { type: "fact.assert", id: "f1", entity: "x", attribute: "a", value: "v", provenance: { chapter: "03-z", source: "drafter" } });
    await rollbackChapter(root, "03-z");
    const tables = project((await readEvents(root)).events);
    expect(tables.chapters.has("03-z")).toBe(false);
    expect(tables.facts.get("f1")?.status).toBe("retracted");
  });
});
