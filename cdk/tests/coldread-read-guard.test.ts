import { describe, it, expect } from "vitest";
import { isReadAllowed, COLD_READ_ALLOW_PREFIXES } from "../src/tools.js";

describe("isReadAllowed", () => {
  it("allows everything when no allowlist is set (the normal pipeline surface)", () => {
    expect(isReadAllowed("brief.md", undefined)).toBe(true);
    expect(isReadAllowed("canon/world.md", [])).toBe(true);
  });

  it("admits the manuscript directories under the cold-read allowlist", () => {
    expect(isReadAllowed("draft/01-a.md", COLD_READ_ALLOW_PREFIXES)).toBe(true);
    expect(isReadAllowed("revision-1/09-b.md", COLD_READ_ALLOW_PREFIXES)).toBe(true);
    expect(isReadAllowed("draft", COLD_READ_ALLOW_PREFIXES)).toBe(true);
  });

  it("refuses the files that would destroy a cold read's independence", () => {
    // These are the whole point of the guard: a reviewer that can read the brief is
    // grading conformance to intent, not the artifact.
    expect(isReadAllowed("brief.md", COLD_READ_ALLOW_PREFIXES)).toBe(false);
    expect(isReadAllowed("canon/style.md", COLD_READ_ALLOW_PREFIXES)).toBe(false);
    expect(isReadAllowed("outline/01-a.md", COLD_READ_ALLOW_PREFIXES)).toBe(false);
    expect(isReadAllowed("logs/reader-letter.md", COLD_READ_ALLOW_PREFIXES)).toBe(false);
    // Lens isolation is structural, not requested: one lens cannot read another's report.
    expect(isReadAllowed("logs/cold-read/literary.json", COLD_READ_ALLOW_PREFIXES)).toBe(false);
  });

  it("is segment-aware so a prefix cannot be spoofed by a sibling name", () => {
    expect(isReadAllowed("draft-notes/secret.md", COLD_READ_ALLOW_PREFIXES)).toBe(false);
    expect(isReadAllowed("revision-1-old/09.md", COLD_READ_ALLOW_PREFIXES)).toBe(false);
  });

  it("normalizes a leading ./ so it cannot be used to slip past the check", () => {
    expect(isReadAllowed("./draft/01-a.md", COLD_READ_ALLOW_PREFIXES)).toBe(true);
    expect(isReadAllowed("./brief.md", COLD_READ_ALLOW_PREFIXES)).toBe(false);
  });

  it("admits the report directory for the synthesis/audit scopes", () => {
    expect(isReadAllowed("logs/cold-read/panel.md", ["logs/cold-read"])).toBe(true);
    expect(isReadAllowed("logs/findings.json", ["logs/cold-read"])).toBe(false);
  });
});
