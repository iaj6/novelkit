import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { estimateRun, formatDurationRange } from "../src/estimate.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "novelkit-estimate-"));
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function makeProject(opts: {
  model?: string;
  outlineChapters?: number;
  brief?: string;
}): void {
  // cdk.config.json is read by loadConfig — write a minimal one.
  const config = {
    title: "Test Book",
    model: opts.model ?? "claude-sonnet-4-6",
    modelByPhase: {},
    maxTurnsPerPhase: {},
  };
  writeFileSync(join(tmpRoot, "cdk.config.json"), JSON.stringify(config), "utf-8");

  if (opts.outlineChapters && opts.outlineChapters > 0) {
    const outlineDir = join(tmpRoot, "outline");
    mkdirSync(outlineDir, { recursive: true });
    // 00-chapter-map.md is ignored by the chapter-inference filter.
    writeFileSync(join(outlineDir, "00-chapter-map.md"), "# map\n", "utf-8");
    for (let i = 1; i <= opts.outlineChapters; i++) {
      const n = String(i).padStart(2, "0");
      writeFileSync(join(outlineDir, `${n}-chapter.md`), `# ch ${n}\n`, "utf-8");
    }
  }

  if (opts.brief !== undefined) {
    writeFileSync(join(tmpRoot, "brief.md"), opts.brief, "utf-8");
  }
}

describe("estimateRun — chapter inference", () => {
  it("counts outline files when outline/ exists", async () => {
    makeProject({ outlineChapters: 12 });
    const est = await estimateRun(tmpRoot);
    expect(est.chapters).toBe(12);
    expect(est.chaptersSource).toBe("outline");
  });

  it("excludes 00-chapter-map.md from the chapter count", async () => {
    makeProject({ outlineChapters: 3 });
    const est = await estimateRun(tmpRoot);
    expect(est.chapters).toBe(3);
  });

  it("falls back to brief.md 'N chapters' pattern when outline is missing", async () => {
    makeProject({ brief: "Target: 15 chapters total." });
    const est = await estimateRun(tmpRoot);
    expect(est.chapters).toBe(15);
    expect(est.chaptersSource).toBe("brief");
  });

  it("falls back to brief.md 'Number of chapters: N' pattern", async () => {
    makeProject({ brief: "Number of chapters: 22" });
    const est = await estimateRun(tmpRoot);
    expect(est.chapters).toBe(22);
    expect(est.chaptersSource).toBe("brief");
  });

  it("falls back to brief.md word target / 2500 when chapter count missing", async () => {
    makeProject({ brief: "Target length: ~80,000 words" });
    const est = await estimateRun(tmpRoot);
    expect(est.chapters).toBe(32); // 80000 / 2500
    expect(est.chaptersSource).toBe("brief");
  });

  it("uses the default chapter count when neither outline nor brief is informative", async () => {
    makeProject({ brief: "Just some text with no recognizable target." });
    const est = await estimateRun(tmpRoot);
    expect(est.chaptersSource).toBe("default");
    expect(est.chapters).toBeGreaterThan(0);
  });

  it("uses the default when neither outline nor brief exists", async () => {
    makeProject({});
    const est = await estimateRun(tmpRoot);
    expect(est.chaptersSource).toBe("default");
  });
});

describe("estimateRun — model multiplier", () => {
  it("Sonnet 4.6 uses the baseline 1× multiplier", async () => {
    makeProject({ outlineChapters: 10, model: "claude-sonnet-4-6" });
    const est = await estimateRun(tmpRoot);
    expect(est.modelMultiplier).toBe(1.0);
    // FIXED 4.7 + 10 * 1.86 = 23.3 baseline
    expect(est.expectedUsd).toBeCloseTo(23.3, 1);
  });

  it("Haiku 4.5 applies the 0.25× multiplier", async () => {
    makeProject({ outlineChapters: 10, model: "claude-haiku-4-5" });
    const est = await estimateRun(tmpRoot);
    expect(est.modelMultiplier).toBe(0.25);
    expect(est.expectedUsd).toBeCloseTo(23.3 * 0.25, 2);
  });

  it("Opus 4.7 applies the 5× multiplier", async () => {
    makeProject({ outlineChapters: 10, model: "claude-opus-4-7" });
    const est = await estimateRun(tmpRoot);
    expect(est.modelMultiplier).toBe(5.0);
    expect(est.expectedUsd).toBeCloseTo(23.3 * 5, 1);
  });

  it("unknown models fall back to 1× with a warning-worthy multiplier", async () => {
    makeProject({ outlineChapters: 10, model: "claude-future-model-9000" });
    const est = await estimateRun(tmpRoot);
    expect(est.modelMultiplier).toBe(1.0);
  });
});

describe("estimateRun — cost band shape", () => {
  it("low < expected < high", async () => {
    makeProject({ outlineChapters: 30 });
    const est = await estimateRun(tmpRoot);
    expect(est.lowUsd).toBeLessThan(est.expectedUsd);
    expect(est.expectedUsd).toBeLessThan(est.highUsd);
  });

  it("band is symmetric ±25% around expected", async () => {
    makeProject({ outlineChapters: 30 });
    const est = await estimateRun(tmpRoot);
    expect(est.lowUsd).toBeCloseTo(est.expectedUsd * 0.75, 2);
    expect(est.highUsd).toBeCloseTo(est.expectedUsd * 1.25, 2);
  });

  it("time bands follow the same shape", async () => {
    makeProject({ outlineChapters: 30 });
    const est = await estimateRun(tmpRoot);
    expect(est.lowSeconds).toBeLessThan(est.expectedSeconds);
    expect(est.expectedSeconds).toBeLessThan(est.highSeconds);
  });
});

describe("formatDurationRange", () => {
  it("formats sub-minute ranges in seconds", () => {
    expect(formatDurationRange(20, 45)).toBe("20s–45s");
  });

  it("formats sub-hour ranges in minutes", () => {
    expect(formatDurationRange(120, 1800)).toBe("2m–30m");
  });

  it("formats multi-hour ranges with h/m suffix", () => {
    expect(formatDurationRange(3600, 7200)).toBe("1h–2h");
    expect(formatDurationRange(3600, 9000)).toBe("1h–2h30m");
  });

  it("formats mixed boundaries (e.g. 50s–5m)", () => {
    expect(formatDurationRange(50, 300)).toBe("50s–5m");
  });
});
