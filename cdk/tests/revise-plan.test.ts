import { describe, it, expect } from "vitest";
import {
  RevisionItemSchema,
  RevisionPlanSchema,
  approvedItems,
  validateItem,
} from "../src/revise/schema.js";

const base = {
  id: "rev-001",
  title: "t",
  rationale: "r",
  source_findings: ["continuity-fact-audit-002"],
  class: "in-chapter" as const,
  chapters: ["09-the-bracket"],
  instruction: "i",
  acceptance: "a",
};

describe("RevisionItemSchema", () => {
  it("defaults approved to false — planning is inert until a human acts", () => {
    const parsed = RevisionItemSchema.parse(base);
    expect(parsed.approved).toBe(false);
    expect(parsed.protected_passages).toEqual([]);
  });

  it("rejects an item that traces to no finding", () => {
    // Revision must answer a diagnosis; without this an agent can rewrite prose it
    // merely disliked and call it a revision.
    expect(RevisionItemSchema.safeParse({ ...base, source_findings: [] }).success).toBe(false);
  });

  it("rejects an unknown class, so structural edits cannot sneak in", () => {
    expect(RevisionItemSchema.safeParse({ ...base, class: "cut-chapter" }).success).toBe(false);
  });

  it("requires at least one chapter in the blast radius", () => {
    expect(RevisionItemSchema.safeParse({ ...base, chapters: [] }).success).toBe(false);
  });
});

describe("validateItem", () => {
  it("accepts a well-formed in-chapter item", () => {
    expect(validateItem(RevisionItemSchema.parse(base))).toEqual([]);
  });

  it("rejects a cross-chapter-fact item with no edits", () => {
    const item = RevisionItemSchema.parse({ ...base, class: "cross-chapter-fact" });
    expect(validateItem(item)[0]).toMatch(/no edits/);
  });

  it("rejects an edit outside the declared blast radius", () => {
    // The radius is what a human approved; an edit beyond it is unapproved work.
    const item = RevisionItemSchema.parse({
      ...base,
      class: "cross-chapter-fact",
      chapters: ["09-the-bracket"],
      edits: [{ chapter: "20-seven-copies", wrong_text: "a", correct_text: "b" }],
    });
    expect(validateItem(item)[0]).toMatch(/outside declared chapters/);
  });

  it("rejects a protected passage outside the declared radius", () => {
    const item = RevisionItemSchema.parse({
      ...base,
      protected_passages: [{ chapter: "30-elsewhere", text: "x" }],
    });
    expect(validateItem(item)[0]).toMatch(/outside declared chapters/);
  });
});

describe("approvedItems", () => {
  it("selects only approved items", () => {
    const plan = RevisionPlanSchema.parse({
      schema_version: 1,
      generated_at: "2026-01-01T00:00:00.000Z",
      items: [
        { ...base, id: "rev-001", approved: true },
        { ...base, id: "rev-002" },
        { ...base, id: "rev-003", approved: true },
      ],
    });
    expect(approvedItems(plan).map((i) => i.id)).toEqual(["rev-001", "rev-003"]);
  });
});
