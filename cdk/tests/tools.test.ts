import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { resolveInProject } from "../src/tools.js";

// resolveInProject is the file-path jail that every agent tool callback routes
// through — the only thing stopping a brief/agent-controlled path from escaping
// the book directory. These assertions pin that contract so a refactor that
// drops the containment check fails loudly instead of silently re-opening
// arbitrary reads/writes.

const ROOT = path.resolve("/tmp/novelkit-jail-test");

describe("resolveInProject (agent file-path jail)", () => {
  it("resolves a simple in-tree relative path under the root", () => {
    expect(resolveInProject(ROOT, "brief.md")).toBe(path.join(ROOT, "brief.md"));
  });

  it("resolves a nested in-tree path", () => {
    expect(resolveInProject(ROOT, "canon/world.md")).toBe(
      path.join(ROOT, "canon", "world.md")
    );
  });

  it("treats '.' as the project root itself", () => {
    expect(resolveInProject(ROOT, ".")).toBe(ROOT);
  });

  it("allows interior traversal that stays within the root", () => {
    expect(resolveInProject(ROOT, "canon/../draft/01.md")).toBe(
      path.join(ROOT, "draft", "01.md")
    );
  });

  it("accepts an absolute path that is itself inside the root", () => {
    const inside = path.join(ROOT, "logs", "findings.json");
    expect(resolveInProject(ROOT, inside)).toBe(inside);
  });

  it("throws on a parent-escaping relative path", () => {
    expect(() => resolveInProject(ROOT, "../etc/passwd")).toThrow(/escapes project root/);
  });

  it("throws on an absolute path outside the root", () => {
    expect(() => resolveInProject(ROOT, "/etc/passwd")).toThrow(/escapes project root/);
  });

  it("throws when traversal escapes after first descending", () => {
    expect(() => resolveInProject(ROOT, "a/../../b")).toThrow(/escapes project root/);
  });

  it("throws on a deep parent-escape chain", () => {
    expect(() => resolveInProject(ROOT, "canon/../../../../tmp/evil")).toThrow(
      /escapes project root/
    );
  });
});
