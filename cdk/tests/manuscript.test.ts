import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveManuscript } from "../src/manuscript.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "novelkit-manuscript-"));
  mkdirSync(join(tmpRoot, "draft"), { recursive: true });
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function draft(name: string, text: string) {
  writeFileSync(join(tmpRoot, "draft", name), text, "utf-8");
}

function revision(name: string, text: string) {
  mkdirSync(join(tmpRoot, "revision-1"), { recursive: true });
  writeFileSync(join(tmpRoot, "revision-1", name), text, "utf-8");
}

describe("resolveManuscript", () => {
  it("returns chapters in numeric order", async () => {
    draft("02-b.md", "b");
    draft("01-a.md", "a");
    draft("10-j.md", "j");
    const m = await resolveManuscript(tmpRoot);
    expect(m.map((c) => c.id)).toEqual(["01-a", "02-b", "10-j"]);
  });

  it("prefers revision-1 over draft per chapter, leaving others on draft", async () => {
    draft("01-a.md", "draft text a");
    draft("02-b.md", "draft text b");
    revision("02-b.md", "repaired text b");

    const m = await resolveManuscript(tmpRoot);

    expect(m[0].relPath).toBe("draft/01-a.md");
    expect(m[0].text).toBe("draft text a");
    // The repaired chapter must win, or the verifier would score a corrected line
    // as a fabricated quote.
    expect(m[1].relPath).toBe("revision-1/02-b.md");
    expect(m[1].text).toBe("repaired text b");
  });

  it("ignores non-chapter files in draft/", async () => {
    draft("01-a.md", "a");
    draft("notes.md", "not a chapter");
    draft("README.txt", "nope");
    const m = await resolveManuscript(tmpRoot);
    expect(m.map((c) => c.id)).toEqual(["01-a"]);
  });

  it("ignores a revision-1 file with no corresponding draft chapter", async () => {
    draft("01-a.md", "a");
    revision("07-orphan.md", "orphan");
    const m = await resolveManuscript(tmpRoot);
    expect(m.map((c) => c.id)).toEqual(["01-a"]);
  });

  it("returns empty when there are no drafts", async () => {
    expect(await resolveManuscript(tmpRoot)).toEqual([]);
  });
});
