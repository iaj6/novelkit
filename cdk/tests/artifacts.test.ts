import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkArtifactText,
  checkProductionArtifacts,
  formatArtifactFindings,
} from "../src/artifacts.js";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "novelkit-artifacts-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("checkArtifactText — absolute paths", () => {
  it("flags a macOS home path", () => {
    const f = checkArtifactText("build/x.html", "<p>a</p>\n<!-- source: /Users/someone/proj/draft/01.md -->", {
      allowComments: true,
    });
    expect(f).toHaveLength(1);
    expect(f[0].kind).toBe("absolute-path");
    expect(f[0].excerpt).toBe("/Users/someone");
  });

  it("flags linux and windows home paths", () => {
    expect(checkArtifactText("m.md", "/home/ian/x", { allowComments: true })).toHaveLength(1);
    expect(checkArtifactText("m.md", "C:\\Users\\ian\\x", { allowComments: true })).toHaveLength(1);
  });

  it("is flagged even where comments are allowed — the leak has no legitimate form", () => {
    const f = checkArtifactText("manuscript.md", "<!-- source: /Users/ian/a/draft/01.md -->", {
      allowComments: true,
    });
    expect(f.map((x) => x.kind)).toEqual(["absolute-path"]);
  });

  it("does not flag a relative path", () => {
    expect(
      checkArtifactText("manuscript.md", "<!-- source: draft/01-the-thing.md -->", { allowComments: true })
    ).toHaveLength(0);
  });

  it("does not flag ordinary prose containing a slash", () => {
    const prose = "She read the file marked and/or amended, then closed it.";
    expect(checkArtifactText("build/x.html", prose, { allowComments: false })).toHaveLength(0);
  });

  it("reports the line number", () => {
    const f = checkArtifactText("m.md", "one\ntwo\n/Users/ian/x\n", { allowComments: true });
    expect(f[0].line).toBe(3);
  });
});

describe("checkArtifactText — build comments", () => {
  it("flags an HTML comment in a reader-facing artifact", () => {
    const f = checkArtifactText("build/x.html", "<p>a</p><!-- source: draft/01.md -->", {
      allowComments: false,
    });
    expect(f).toHaveLength(1);
    expect(f[0].kind).toBe("build-comment");
  });

  it("EXEMPTS manuscript.md, where the marker is load-bearing for prepare_tts.py", () => {
    // press/prepare_tts.py splits chapters on exactly this marker. Flagging it would make the gate
    // demand a change that breaks the audiobook path.
    const f = checkArtifactText("manuscript.md", "<!-- source: draft/01-a.md -->\n\ntext", {
      allowComments: true,
    });
    expect(f).toHaveLength(0);
  });

  it("flags multiple comments separately", () => {
    const f = checkArtifactText("build/x.html", "<!-- a --><p>x</p><!-- b -->", { allowComments: false });
    expect(f).toHaveLength(2);
  });

  it("handles a multi-line comment", () => {
    const f = checkArtifactText("build/x.html", "<!--\n source:\n draft/01.md\n-->", { allowComments: false });
    expect(f).toHaveLength(1);
  });
});

describe("checkProductionArtifacts — over a project", () => {
  it("returns empty for a clean project", async () => {
    writeFileSync(join(root, "manuscript.md"), "<!-- source: draft/01-a.md -->\n\n# One\n\nProse.\n");
    mkdirSync(join(root, "build"));
    writeFileSync(join(root, "build", "b.html"), "<html><body><p>Prose.</p></body></html>");
    expect(await checkProductionArtifacts(root)).toEqual([]);
  });

  it("catches the real-world regression: an absolute path in both artifacts", async () => {
    writeFileSync(join(root, "manuscript.md"), "<!-- source: /Users/ian/p/draft/01-a.md -->\n");
    mkdirSync(join(root, "build"));
    writeFileSync(join(root, "build", "b.html"), "<!-- source: /Users/ian/p/draft/01-a.md -->");
    const f = await checkProductionArtifacts(root);
    // manuscript: path only (comments exempt). html: path + comment.
    expect(f.filter((x) => x.kind === "absolute-path")).toHaveLength(2);
    expect(f.filter((x) => x.kind === "build-comment")).toHaveLength(1);
  });

  it("tolerates a project with no build directory", async () => {
    writeFileSync(join(root, "manuscript.md"), "clean prose\n");
    expect(await checkProductionArtifacts(root)).toEqual([]);
  });

  it("tolerates a project with nothing shipped at all", async () => {
    expect(await checkProductionArtifacts(root)).toEqual([]);
  });

  it("only scans .html in build/, not epub or pdf binaries", async () => {
    mkdirSync(join(root, "build"));
    writeFileSync(join(root, "build", "b.epub"), "/Users/ian/binary-ish");
    expect(await checkProductionArtifacts(root)).toEqual([]);
  });
});

describe("formatArtifactFindings", () => {
  it("says so when clean", () => {
    expect(formatArtifactFindings([])).toBe("no production artifacts found");
  });

  it("groups by file and truncates loudly", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      kind: "absolute-path" as const,
      file: "build/b.html",
      line: i + 1,
      excerpt: "/Users/ian",
      message: "m",
    }));
    const out = formatArtifactFindings(many);
    expect(out).toContain("build/b.html — 5 findings");
    expect(out).toContain("… and 2 more");
  });
});
