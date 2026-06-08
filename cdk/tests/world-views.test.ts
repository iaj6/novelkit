import { describe, it, expect } from "vitest";
import { WorldEventSchema } from "../src/world/schema.js";
import { project } from "../src/world/project.js";
import { renderFactLedger } from "../src/world/views.js";

const ev = (o: unknown) => WorldEventSchema.parse(o);
function fact(
  id: string,
  entity: string,
  attribute: string,
  value: string | number | boolean,
  chapter: string,
  extra: Record<string, unknown> = {}
) {
  return ev({ type: "fact.assert", id, entity, attribute, value, provenance: { chapter, source: "drafter" }, ...extra });
}

describe("renderFactLedger (drafted-tier store-derived logs/continuity.md)", () => {
  it("groups live drafted facts by chapter in reading order; excludes canon + superseded", () => {
    const t = project([
      fact("f1", "eira", "age", 52, "02-a", { unit: "years" }),
      fact("f1b", "eira", "origin_place", "Vale", "02-a"), // keeps 02-a present after f1 is superseded
      fact("c1", "harbor", "statement", "The harbor freezes in winter.", "canon", { tier: "canon" }),
      fact("f2", "marcus", "statement", "Marcus keeps a brass key.", "11-b"),
      fact("f0", "eira", "role", "harbormaster", "01-z"),
      fact("f3", "eira", "age", 53, "20-c", { supersedes: "f1", unit: "years" }),
    ]);
    const md = renderFactLedger(t);
    expect(md).not.toContain("harbor freezes"); // canon-tier excluded
    expect(md).not.toContain("age: 52"); // superseded f1 excluded
    expect(md).toContain("eira — age: 53 years"); // live superseding fact present
    expect(md).toContain("- Marcus keeps a brass key."); // statement rendered whole
    // grouped by chapter in reading order (01 < 02 < 11 < 20)
    const order = ["## 01-z", "## 02-a", "## 11-b", "## 20-c"].map((c) => md.indexOf(c));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("renders a placeholder when no drafted facts, and is deterministic", () => {
    const canonOnly = project([fact("c1", "x", "statement", "canon only", "canon", { tier: "canon" })]);
    expect(renderFactLedger(canonOnly)).toContain("(none yet)");
    const mk = () => project([fact("f1", "a", "role", "lead", "03-x"), fact("f2", "a", "origin_place", "Vale", "05-y")]);
    expect(renderFactLedger(mk())).toBe(renderFactLedger(mk())); // same tables -> identical markdown
  });
});
