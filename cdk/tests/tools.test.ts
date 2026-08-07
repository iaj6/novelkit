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

/**
 * Tool-output renderers (Bundle A read paths). Extracted pure so the contracts below
 * are pinned by tests rather than living inside a tool closure.
 */
import { formatRelationLine, formatKnowledgeLine } from "../src/tools.js";

describe("formatKnowledgeLine (who_knows rendering)", () => {
  const prop = { prop: "codicil-forged" };

  it("renders the TELLER for a told_by basis — the regression this fixes", () => {
    // basisEntity has always been written and projected; who_knows dropped it, so a
    // propagation chain read back as an anonymous "(told_by)" with no chain in it.
    expect(
      formatKnowledgeLine({ stance: "knows", proposition: prop, basis: "told_by", basisEntity: "josiah" })
    ).toBe("- knows codicil-forged (told_by josiah)");
  });

  it("omits the teller when there is none, without a trailing space", () => {
    expect(formatKnowledgeLine({ stance: "suspects", proposition: prop, basis: "inferred" })).toBe(
      "- suspects codicil-forged (inferred)"
    );
  });

  it("renders a bare stance when there is no basis at all", () => {
    expect(formatKnowledgeLine({ stance: "unaware", proposition: prop })).toBe("- unaware codicil-forged");
  });

  it("keeps the teller when basisEntity is set but basis is NOT — the two fields are independently optional", () => {
    // record_knowledge declares basis and basisEntity as separate optional fields and
    // schema.ts defers the coupling invariant, so this shape reaches the renderer. Gating
    // the teller on `basis` would drop it here — the same class of bug one field over.
    expect(formatKnowledgeLine({ stance: "knows", proposition: prop, basisEntity: "josiah" })).toBe(
      "- knows codicil-forged (josiah)"
    );
  });

  it("renders a factRef proposition as well as a free slug", () => {
    expect(formatKnowledgeLine({ stance: "knows", proposition: { factRef: "fact:01:x:age" } })).toBe(
      "- knows fact:01:x:age"
    );
  });
});

describe("formatRelationLine (query_relations rendering)", () => {
  const base = { from: "a", relType: "knows_of", to: "b", provenance: { chapter: "03-x" } };

  it("marks a NEGATIVE relation so a never-met constraint cannot read as its opposite", () => {
    expect(formatRelationLine({ ...base, value: false })).toBe("- NOT a —knows_of→ b [03-x]");
  });

  it("renders a positive relation unmarked", () => {
    expect(formatRelationLine({ ...base, value: true })).toBe("- a —knows_of→ b [03-x]");
    expect(formatRelationLine(base)).toBe("- a —knows_of→ b [03-x]");
  });

  it("includes chapter scoping when present", () => {
    expect(formatRelationLine({ ...base, since_chapter: "02-y", until_chapter: "09-z" })).toBe(
      "- a —knows_of→ b since 02-y until 09-z [03-x]"
    );
  });
});
