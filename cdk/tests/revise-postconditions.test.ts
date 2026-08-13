import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  snapshotChapters,
  rollback,
  passagePresent,
  missingPassages,
  checkPostconditions,
  newViolations,
} from "../src/revise/postconditions.js";
import type { ManuscriptChapter } from "../src/manuscript.js";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "novelkit-revise-"));
  mkdirSync(join(root, "draft"), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function draft(name: string, text: string) {
  writeFileSync(join(root, "draft", name), text, "utf-8");
}
function revision(name: string, text: string) {
  mkdirSync(join(root, "revision-1"), { recursive: true });
  writeFileSync(join(root, "revision-1", name), text, "utf-8");
}
function revisionPath(name: string) {
  return join(root, "revision-1", name);
}

const chapters: ManuscriptChapter[] = [
  { id: "01-a", relPath: "draft/01-a.md", text: "She wrote a 9.\nThe column was wrong." },
];

describe("passagePresent / missingPassages", () => {
  it("forgives line rewrapping but nothing else", () => {
    expect(passagePresent({ chapter: "01-a", text: "She wrote a 9. The column was wrong." }, chapters)).toBe(true);
    expect(passagePresent({ chapter: "01-a", text: "She wrote a nine." }, chapters)).toBe(false);
  });

  it("treats a passage in an unknown chapter as missing", () => {
    expect(passagePresent({ chapter: "99-x", text: "She wrote a 9." }, chapters)).toBe(false);
  });

  it("reports every absent passage so a vacuous guard can be caught up front", () => {
    const missing = missingPassages(
      [
        { chapter: "01-a", text: "She wrote a 9." },
        { chapter: "01-a", text: "never written" },
      ],
      chapters
    );
    expect(missing).toHaveLength(1);
    expect(missing[0].text).toBe("never written");
  });
});

describe("rollback", () => {
  it("restores previous revision text exactly", async () => {
    draft("01-a.md", "draft text");
    revision("01-a.md", "original revision");

    const snaps = await snapshotChapters(root, ["01-a"]);
    writeFileSync(revisionPath("01-a.md"), "AGENT CLOBBERED THIS", "utf-8");
    await rollback(snaps);

    expect(readFileSync(revisionPath("01-a.md"), "utf-8")).toBe("original revision");
  });

  it("DELETES a revision file that did not exist before", async () => {
    // The case a naive "write the old text back" gets wrong: restoring "" would
    // leave an empty override permanently shadowing the draft.
    draft("01-a.md", "draft text");
    expect(existsSync(revisionPath("01-a.md"))).toBe(false);

    const snaps = await snapshotChapters(root, ["01-a"]);
    revision("01-a.md", "agent wrote this");
    expect(existsSync(revisionPath("01-a.md"))).toBe(true);

    await rollback(snaps);
    expect(existsSync(revisionPath("01-a.md"))).toBe(false);
  });

  it("restores every chapter in a multi-chapter item", async () => {
    draft("01-a.md", "a");
    draft("02-b.md", "b");
    revision("02-b.md", "b-revised");

    const snaps = await snapshotChapters(root, ["01-a", "02-b"]);
    revision("01-a.md", "a-clobbered");
    revision("02-b.md", "b-clobbered");
    await rollback(snaps);

    expect(existsSync(revisionPath("01-a.md"))).toBe(false);
    expect(readFileSync(revisionPath("02-b.md"), "utf-8")).toBe("b-revised");
  });
});

describe("newViolations", () => {
  const v = (chapter: string, actual: number) => ({
    kind: "chapter-min-words" as const,
    chapter,
    actual,
    required: 1900,
    message: `${chapter} is ${actual}`,
  });

  it("ignores a violation that already existed unchanged", () => {
    // Books that already break their contract are exactly the ones needing revision;
    // judging against absolute compliance would make every item fail on inherited debt.
    expect(newViolations([v("02-b", 1873)], [v("02-b", 1873)])).toEqual([]);
  });

  it("reports a violation the item introduced", () => {
    expect(newViolations([], [v("02-b", 1800)])).toHaveLength(1);
    expect(newViolations([v("02-b", 1873)], [v("02-b", 1873), v("03-c", 1500)])).toHaveLength(1);
  });

  it("reports an existing violation the item made materially worse", () => {
    expect(newViolations([v("02-b", 1873)], [v("02-b", 1700)])).toHaveLength(1);
  });

  it("tolerates a trivial drift on an already-violating chapter", () => {
    // The real case: replacing "Strada Crișan" with "Dorobanților" is one word
    // shorter. A strict any-decrease rule rolled back an otherwise correct fix, which
    // would block nearly every shortening edit in an already-short chapter.
    expect(newViolations([v("02-b", 1882)], [v("02-b", 1881)])).toEqual([]);
    // ...but not a chapter quietly shedding a paragraph (>1% of a 1900 floor = 19).
    expect(newViolations([v("02-b", 1882)], [v("02-b", 1840)])).toHaveLength(1);
  });

  it("does not report an existing violation the item improved", () => {
    expect(newViolations([v("02-b", 1700)], [v("02-b", 1880)])).toEqual([]);
  });
});

describe("checkPostconditions", () => {
  const item = {
    id: "rev-001",
    title: "t",
    rationale: "r",
    source_findings: ["f1"],
    class: "in-chapter" as const,
    chapters: ["01-a"],
    instruction: "i",
    acceptance: "a",
    protected_passages: [{ chapter: "01-a", text: "the best sentence" }],
    approved: true,
  };

  it("passes when the protected passage survives and no invariants are set", async () => {
    draft("01-a.md", "intro. the best sentence. outro.");
    expect(await checkPostconditions(root, item, undefined)).toEqual([]);
  });

  it("fails when the protected passage was lost", async () => {
    draft("01-a.md", "intro. outro.");
    const failures = await checkPostconditions(root, item, undefined);
    expect(failures).toHaveLength(1);
    expect(failures[0].kind).toBe("protected-passage-lost");
  });

  it("fails on an invariant violation even when the passage survived", async () => {
    draft("01-a.md", "the best sentence.");
    const failures = await checkPostconditions(root, item, { minWordsPerChapter: 50 }, []);
    expect(failures).toHaveLength(1);
    expect(failures[0].kind).toBe("invariant");
  });

  it("checks invariants across the WHOLE manuscript, not just the touched chapter", async () => {
    // A revision can push the book under a total floor without any single chapter
    // looking wrong — the shape of the failure that slipped past unnoticed before.
    draft("01-a.md", "the best sentence.");
    draft("02-b.md", "short.");
    const failures = await checkPostconditions(root, item, { minTotalWords: 100 }, []);
    expect(failures.some((f) => f.kind === "invariant")).toBe(true);
  });
});
