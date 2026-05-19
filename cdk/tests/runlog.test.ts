import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRunLog, readCostSummary, formatCostSummary } from "../src/runlog.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "novelkit-runlog-"));
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function writeLog(events: object[]): void {
  const text = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
  const dir = join(tmpRoot, "logs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "run.jsonl"), text, "utf-8");
}

describe("openRunLog / event / close", () => {
  it("creates logs/run.jsonl in the project dir", async () => {
    const log = await openRunLog(tmpRoot, "architect");
    log.event("phase_start", { model: "claude-sonnet-4-6", maxTurns: 60 });
    log.event("tool_use", { name: "read_file", input: { path: "brief.md" } });
    await log.close();

    const file = join(tmpRoot, "logs", "run.jsonl");
    expect(existsSync(file)).toBe(true);
  });

  it("appends one JSON object per line, tagged with phase + kind + t", async () => {
    const log = await openRunLog(tmpRoot, "drafter");
    log.event("phase_start", { model: "x" });
    log.event("tool_use", { name: "read_file" });
    await log.close();

    const text = readFileSync(join(tmpRoot, "logs", "run.jsonl"), "utf-8");
    const lines = text.trim().split("\n");
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.phase).toBe("drafter");
    expect(first.kind).toBe("phase_start");
    expect(first.model).toBe("x");
    expect(typeof first.t).toBe("number");
    expect(first.t).toBeGreaterThanOrEqual(0);

    const second = JSON.parse(lines[1]);
    expect(second.kind).toBe("tool_use");
    expect(second.name).toBe("read_file");
  });

  it("event() with no payload still records phase + kind + t", async () => {
    const log = await openRunLog(tmpRoot, "reader");
    log.event("phase_start");
    await log.close();

    const text = readFileSync(join(tmpRoot, "logs", "run.jsonl"), "utf-8");
    const evt = JSON.parse(text.trim());
    expect(evt).toMatchObject({ phase: "reader", kind: "phase_start" });
  });
});

describe("readCostSummary", () => {
  it("returns zeros for a missing log file", async () => {
    const summary = await readCostSummary(tmpRoot);
    expect(summary).toEqual({
      totalUsd: 0,
      totalCalls: 0,
      totalDurationMs: 0,
      byPhase: {},
    });
  });

  it("aggregates cost events by phase, ignoring non-cost events", async () => {
    writeLog([
      { t: 0, phase: "architect", kind: "phase_start" }, // ignored — not a cost event
      {
        t: 100,
        phase: "architect",
        kind: "cost",
        usd: 1.0,
        inputTokens: 1000,
        outputTokens: 200,
        cacheRead: 500,
        cacheCreation: 100,
        durationMs: 30_000,
      },
      {
        t: 200,
        phase: "drafter",
        kind: "cost",
        usd: 0.5,
        inputTokens: 800,
        outputTokens: 400,
        cacheRead: 200,
        cacheCreation: 0,
        durationMs: 20_000,
      },
      {
        t: 300,
        phase: "drafter",
        kind: "cost",
        usd: 0.6,
        inputTokens: 900,
        outputTokens: 350,
        cacheRead: 250,
        cacheCreation: 50,
        durationMs: 25_000,
      },
    ]);

    const summary = await readCostSummary(tmpRoot);

    expect(summary.totalCalls).toBe(3);
    expect(summary.totalUsd).toBeCloseTo(2.1, 6);
    expect(summary.totalDurationMs).toBe(75_000);
    expect(Object.keys(summary.byPhase).sort()).toEqual(["architect", "drafter"]);

    expect(summary.byPhase.architect).toMatchObject({
      calls: 1,
      usd: 1.0,
      inputTokens: 1000,
      outputTokens: 200,
      cacheRead: 500,
      cacheCreation: 100,
      durationMs: 30_000,
    });
    expect(summary.byPhase.drafter).toMatchObject({
      calls: 2,
      usd: 1.1,
      inputTokens: 1700,
      outputTokens: 750,
      cacheRead: 450,
      cacheCreation: 50,
      durationMs: 45_000,
    });
  });

  it("survives malformed lines and missing numeric fields", async () => {
    writeLog([
      { phase: "x", kind: "cost", usd: 0.5, durationMs: 1000 },
    ]);
    // Append a malformed line.
    const file = join(tmpRoot, "logs", "run.jsonl");
    writeFileSync(file, readFileSync(file, "utf-8") + "this is not json\n", "utf-8");

    const summary = await readCostSummary(tmpRoot);
    expect(summary.totalCalls).toBe(1);
    expect(summary.totalUsd).toBe(0.5);
    expect(summary.byPhase.x).toMatchObject({
      calls: 1,
      usd: 0.5,
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it("buckets events with no phase under 'unknown'", async () => {
    writeLog([{ kind: "cost", usd: 0.25, durationMs: 5000 }]);
    const summary = await readCostSummary(tmpRoot);
    expect(summary.byPhase.unknown.calls).toBe(1);
    expect(summary.byPhase.unknown.usd).toBe(0.25);
  });
});

describe("formatCostSummary", () => {
  it("renders an empty summary as a header-only table", () => {
    const out = formatCostSummary({
      totalUsd: 0,
      totalCalls: 0,
      totalDurationMs: 0,
      byPhase: {},
    });
    expect(out).toContain("phase");
    expect(out).toContain("TOTAL");
    expect(out).toContain("$0.0000");
  });

  it("formats tokens with k / M suffixes", () => {
    const out = formatCostSummary({
      totalUsd: 1.5,
      totalCalls: 2,
      totalDurationMs: 70_000,
      byPhase: {
        architect: {
          calls: 1,
          usd: 0.5,
          inputTokens: 1500,
          outputTokens: 250,
          cacheRead: 2_500_000,
          cacheCreation: 0,
          durationMs: 30_000,
        },
        drafter: {
          calls: 1,
          usd: 1.0,
          inputTokens: 800,
          outputTokens: 12_000,
          cacheRead: 0,
          cacheCreation: 0,
          durationMs: 40_000,
        },
      },
    });

    expect(out).toContain("architect");
    expect(out).toContain("drafter");
    expect(out).toContain("$0.5000");
    expect(out).toContain("$1.0000");
    expect(out).toContain("1.5k"); // 1500 input tokens
    expect(out).toContain("2.50M"); // cache_read 2.5M
    expect(out).toContain("12.0k"); // 12000 output tokens
    expect(out).toContain("TOTAL");
    expect(out).toContain("$1.5000");
  });

  it("formats duration in m+s for ≥ 1 minute, raw seconds otherwise", () => {
    const out = formatCostSummary({
      totalUsd: 0.5,
      totalCalls: 2,
      totalDurationMs: 125_000, // 2m5s
      byPhase: {
        a: { calls: 1, usd: 0.25, inputTokens: 1, outputTokens: 1, cacheRead: 0, cacheCreation: 0, durationMs: 30_000 }, // 30s
        b: { calls: 1, usd: 0.25, inputTokens: 1, outputTokens: 1, cacheRead: 0, cacheCreation: 0, durationMs: 95_000 }, // 1m35s
      },
    });
    expect(out).toMatch(/30\.0s/);
    expect(out).toMatch(/1m35s/);
    expect(out).toMatch(/2m5s/);
  });

  it("phases are listed alphabetically", () => {
    const out = formatCostSummary({
      totalUsd: 0,
      totalCalls: 0,
      totalDurationMs: 0,
      byPhase: {
        zebra: { calls: 1, usd: 0, inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheCreation: 0, durationMs: 0 },
        apple: { calls: 1, usd: 0, inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheCreation: 0, durationMs: 0 },
        mango: { calls: 1, usd: 0, inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheCreation: 0, durationMs: 0 },
      },
    });
    const appleIdx = out.indexOf("apple");
    const mangoIdx = out.indexOf("mango");
    const zebraIdx = out.indexOf("zebra");
    expect(appleIdx).toBeLessThan(mangoIdx);
    expect(mangoIdx).toBeLessThan(zebraIdx);
  });
});
