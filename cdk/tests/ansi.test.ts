import { describe, it, expect } from "vitest";
import * as c from "../src/ansi.js";

// The ansi module decides whether to emit escape codes based on TTY state
// and env vars at import time. In a vitest run, stdout is generally a TTY
// inherited from the parent; behavior may vary. The tests assert *shape*
// (output contains expected escape patterns when enabled, or plain text
// when disabled) without depending on a specific enabled-state.

describe("ansi", () => {
  it("phase() always returns a string containing the phase name", () => {
    for (const name of [
      "architect",
      "plotter",
      "threads",
      "drafter",
      "editor-continuity",
      "editor-compression",
      "editor-pacing",
      "editor-voice",
      "reader",
      "continuity-fact-audit",
      "repair-fact-normalize",
    ]) {
      const out = c.phase(name);
      expect(out).toContain(name);
      expect(out).toContain("[");
      expect(out).toContain("]");
    }
  });

  it("phase() handles unknown names by returning the bracketed name unstyled", () => {
    const out = c.phase("unknown-phase");
    expect(out).toContain("unknown-phase");
    // Whether or not colors are on, this falls through to the default branch
    // which returns plain `[name]`.
    expect(out).toBe("[unknown-phase]");
  });

  it("cost() formats USD with default 4 digits", () => {
    expect(c.cost(1)).toContain("$1.0000");
    expect(c.cost(0.1234)).toContain("$0.1234");
  });

  it("cost() honors custom digit count", () => {
    expect(c.cost(1.234, 2)).toContain("$1.23");
    expect(c.cost(1, 0)).toContain("$1");
  });

  it("style wrappers do not lose the input text", () => {
    expect(c.bold("hello")).toContain("hello");
    expect(c.dim("hello")).toContain("hello");
    expect(c.italic("hello")).toContain("hello");
    expect(c.red("hello")).toContain("hello");
    expect(c.green("hello")).toContain("hello");
    expect(c.yellow("hello")).toContain("hello");
    expect(c.blue("hello")).toContain("hello");
    expect(c.magenta("hello")).toContain("hello");
    expect(c.cyan("hello")).toContain("hello");
    expect(c.gray("hello")).toContain("hello");
    expect(c.brightRed("hello")).toContain("hello");
    expect(c.brightGreen("hello")).toContain("hello");
    expect(c.brightYellow("hello")).toContain("hello");
    expect(c.brightBlue("hello")).toContain("hello");
    expect(c.brightCyan("hello")).toContain("hello");
  });

  it("style wrappers either emit ANSI escapes or pass text through unchanged", () => {
    // Whichever mode is active, the wrapped output should be either the
    // original text (color off) or original-text-surrounded-by-escapes.
    const wrapped = c.red("X");
    expect(wrapped === "X" || /\x1b\[\d+(?:;\d+)*m/.test(wrapped)).toBe(true);
  });

  it("colorEnabled is a boolean", () => {
    expect(typeof c.colorEnabled).toBe("boolean");
  });
});
