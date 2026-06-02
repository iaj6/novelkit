import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { researcherShouldRun } from "../src/conductor.js";
import {
  createResearcherPermissionHandler,
  WEB_TOOL_CAP_PER_RUN,
} from "../src/agentRunner.js";
import type { RunLog } from "../src/runlog.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "novelkit-researcher-"));
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function writeBrief(content: string): void {
  writeFileSync(join(tmpRoot, "brief.md"), content, "utf-8");
}

function writeConfig(json: Record<string, unknown>): void {
  writeFileSync(join(tmpRoot, "cdk.config.json"), JSON.stringify(json), "utf-8");
}

/** Minimal RunLog stub that records calls into an array for assertions. */
function makeLog(): { log: RunLog; events: Array<{ kind: string; payload: Record<string, unknown> }> } {
  const events: Array<{ kind: string; payload: Record<string, unknown> }> = [];
  const log: RunLog = {
    event: (kind, payload = {}) => events.push({ kind, payload }),
    close: async () => {},
  };
  return { log, events };
}

describe("researcherShouldRun (conductor trigger detection)", () => {
  it("returns false when neither brief.md nor cdk.config.json opts in", async () => {
    expect(await researcherShouldRun(tmpRoot)).toBe(false);
  });

  it("returns true when brief.md contains a ## Research scope heading", async () => {
    writeBrief("# Brief\n\n## Premise\nA story.\n\n## Research scope\n\n- thing\n");
    expect(await researcherShouldRun(tmpRoot)).toBe(true);
  });

  it("matches the heading case-insensitively and ignores leading whitespace within the line", async () => {
    writeBrief("# Brief\n\n## research scope\n\n- thing\n");
    expect(await researcherShouldRun(tmpRoot)).toBe(true);
  });

  it("does not match a heading at a different level (### Research scope)", async () => {
    writeBrief("# Brief\n\n### Research scope\n\n- thing\n");
    expect(await researcherShouldRun(tmpRoot)).toBe(false);
  });

  it("does not match a bare mention of 'Research scope' outside a heading", async () => {
    writeBrief("# Brief\n\nThe research scope is large but no heading exists.\n");
    expect(await researcherShouldRun(tmpRoot)).toBe(false);
  });

  it("returns true when cdk.config.json has research:true even with no brief.md", async () => {
    writeConfig({ research: true });
    expect(await researcherShouldRun(tmpRoot)).toBe(true);
  });

  it("returns false when cdk.config.json has research:false and brief.md has no scope", async () => {
    writeConfig({ research: false });
    writeBrief("# Brief\n\n## Premise\nA story.\n");
    expect(await researcherShouldRun(tmpRoot)).toBe(false);
  });

  it("returns true when both triggers are present (no conflict)", async () => {
    writeConfig({ research: true });
    writeBrief("# Brief\n\n## Research scope\n\n- thing\n");
    expect(await researcherShouldRun(tmpRoot)).toBe(true);
  });

  it("treats research as false when the field is missing from config (no implicit opt-in)", async () => {
    writeConfig({ title: "My Book" });
    expect(await researcherShouldRun(tmpRoot)).toBe(false);
  });

  it("treats non-boolean research values as false (truthy strings do NOT trigger)", async () => {
    writeConfig({ research: "yes" });
    expect(await researcherShouldRun(tmpRoot)).toBe(false);
  });
});

describe("createResearcherPermissionHandler (web tool cap enforcement)", () => {
  it("allows WebSearch calls up to the cap, then denies the next", async () => {
    const { log } = makeLog();
    const handler = createResearcherPermissionHandler(log);

    for (let i = 0; i < WEB_TOOL_CAP_PER_RUN; i++) {
      const result = await handler(
        "WebSearch",
        { query: `query ${i}` },
        { signal: new AbortController().signal }
      );
      expect(result.behavior).toBe("allow");
    }

    const overCap = await handler(
      "WebSearch",
      { query: "one too many" },
      { signal: new AbortController().signal }
    );
    expect(overCap.behavior).toBe("deny");
    if (overCap.behavior === "deny") {
      expect(overCap.message).toMatch(/cap of \d+ reached/i);
    }
  });

  it("allows WebFetch calls up to the cap, then denies the next", async () => {
    const { log } = makeLog();
    const handler = createResearcherPermissionHandler(log);

    for (let i = 0; i < WEB_TOOL_CAP_PER_RUN; i++) {
      const result = await handler(
        "WebFetch",
        { url: `https://example.com/${i}`, prompt: "summarize" },
        { signal: new AbortController().signal }
      );
      expect(result.behavior).toBe("allow");
    }

    const overCap = await handler(
      "WebFetch",
      { url: "https://example.com/over", prompt: "summarize" },
      { signal: new AbortController().signal }
    );
    expect(overCap.behavior).toBe("deny");
  });

  it("tracks WebSearch and WebFetch independently — exhausting one does not affect the other", async () => {
    const { log } = makeLog();
    const handler = createResearcherPermissionHandler(log);

    for (let i = 0; i < WEB_TOOL_CAP_PER_RUN; i++) {
      const r = await handler(
        "WebSearch",
        { query: `q ${i}` },
        { signal: new AbortController().signal }
      );
      expect(r.behavior).toBe("allow");
    }
    const searchOver = await handler(
      "WebSearch",
      { query: "over" },
      { signal: new AbortController().signal }
    );
    expect(searchOver.behavior).toBe("deny");

    // Cap on WebSearch should NOT affect WebFetch.
    const fetchFirst = await handler(
      "WebFetch",
      { url: "https://example.com/", prompt: "p" },
      { signal: new AbortController().signal }
    );
    expect(fetchFirst.behavior).toBe("allow");
  });

  it("allows all non-web tools unconditionally", async () => {
    const { log } = makeLog();
    const handler = createResearcherPermissionHandler(log);

    for (const tool of [
      "mcp__cdk__read_file",
      "mcp__cdk__write_file",
      "mcp__cdk__project_state",
      "SomeOtherTool",
    ]) {
      // Call a lot of times — non-web tools must never be capped.
      for (let i = 0; i < 100; i++) {
        const r = await handler(tool, {}, { signal: new AbortController().signal });
        expect(r.behavior).toBe("allow");
      }
    }
  });

  it("logs cap-hit events to the run log for observability", async () => {
    const { log, events } = makeLog();
    const handler = createResearcherPermissionHandler(log);

    for (let i = 0; i < WEB_TOOL_CAP_PER_RUN; i++) {
      await handler(
        "WebSearch",
        { query: `q ${i}` },
        { signal: new AbortController().signal }
      );
    }
    await handler(
      "WebSearch",
      { query: "over" },
      { signal: new AbortController().signal }
    );

    const capHit = events.find((e) => e.kind === "web_tool_cap_hit");
    expect(capHit).toBeDefined();
    expect(capHit?.payload.tool).toBe("WebSearch");
    expect(capHit?.payload.cap).toBe(WEB_TOOL_CAP_PER_RUN);
  });

  it("each new handler instance has independent counters (no shared state across runs)", async () => {
    const { log: log1 } = makeLog();
    const handler1 = createResearcherPermissionHandler(log1);
    for (let i = 0; i < WEB_TOOL_CAP_PER_RUN; i++) {
      await handler1("WebSearch", { query: "x" }, { signal: new AbortController().signal });
    }
    const over1 = await handler1("WebSearch", { query: "x" }, { signal: new AbortController().signal });
    expect(over1.behavior).toBe("deny");

    // Fresh handler must start from zero.
    const { log: log2 } = makeLog();
    const handler2 = createResearcherPermissionHandler(log2);
    const first = await handler2("WebSearch", { query: "x" }, { signal: new AbortController().signal });
    expect(first.behavior).toBe("allow");
  });
});
