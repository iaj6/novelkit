/**
 * Pre-run cost + time estimator.
 *
 * Calibration constants below were fit against the empirical run-log
 * data in library/ as of 2026-05. Specifically: a linear-with-intercept
 * model on the two complete recent pipeline runs (coldwater-reach-v031,
 * the-hollowback) which both included the current set of editor passes.
 *
 *   $60.50 ≈ FIXED + 30 × PER_CHAPTER  (v031, 30 chapters)
 *   $34.50 ≈ FIXED + 16 × PER_CHAPTER  (hollowback, 16 chapters)
 *   ──────────────────────────────────
 *   FIXED ≈ $4.70   PER_CHAPTER ≈ $1.86
 *
 * The fit is on Sonnet 4.6 (the project default). Other models apply a
 * rough pricing multiplier relative to Sonnet 4.6 baseline.
 *
 * Estimates are intentionally widened to ± ~25% to communicate honest
 * uncertainty — the model is two data points and pipeline costs do drift.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { loadConfig } from "./config.js";

const FIXED_USD = 4.7;
const PER_CHAPTER_USD = 1.86;
const UNCERTAINTY = 0.25; // ±25% band

const DEFAULT_CHAPTERS = 25;

// Approximate input/output blended pricing ratio vs claude-sonnet-4-6.
// Order-of-magnitude only — accurate enough for a pre-run gut check.
const MODEL_MULTIPLIER: Record<string, number> = {
  "claude-haiku-4-5-20251001": 0.25,
  "claude-haiku-4-5": 0.25,
  "claude-sonnet-4-6": 1.0,
  "claude-opus-4-7": 5.0,
};

// Wall-time estimate — based on observed ~80–100 sec per chapter end-to-end
// across editor passes + drafter, plus ~3-5 min for fixed phases.
const FIXED_SECONDS = 240;
const PER_CHAPTER_SECONDS = 95;

export interface RunEstimate {
  chapters: number;
  chaptersSource: "outline" | "brief" | "default";
  model: string;
  modelMultiplier: number;
  lowUsd: number;
  expectedUsd: number;
  highUsd: number;
  lowSeconds: number;
  expectedSeconds: number;
  highSeconds: number;
}

async function safeReaddir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function safeRead(file: string): Promise<string> {
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Try to infer chapter count from (in order):
 *   1. outline/*.md files (most reliable — plotter has run)
 *   2. brief.md "N chapters" or "Number of chapters: N" mentions
 *   3. brief.md "~X words" target → divide by 2500 words/chapter
 *   4. default fallback
 */
async function inferChapters(
  projectRoot: string
): Promise<{ chapters: number; source: RunEstimate["chaptersSource"] }> {
  const outlineDir = path.join(projectRoot, "outline");
  const outlineFiles = (await safeReaddir(outlineDir)).filter(
    (f) => f.endsWith(".md") && /^\d{2}-/.test(f) && f !== "00-chapter-map.md"
  );
  if (outlineFiles.length > 0) {
    return { chapters: outlineFiles.length, source: "outline" };
  }

  const brief = await safeRead(path.join(projectRoot, "brief.md"));
  if (brief) {
    // Look for explicit "N chapters" / "Number of chapters: N"
    const explicit = brief.match(
      /(?:number of chapters|chapters?)\s*[:=]\s*(\d{1,3})/i
    );
    if (explicit && explicit[1]) {
      const n = parseInt(explicit[1], 10);
      if (n >= 1 && n <= 200) return { chapters: n, source: "brief" };
    }
    // Try the inverse: "30 chapters", "N chapters"
    const reverse = brief.match(/\b(\d{1,3})\s+chapters?\b/i);
    if (reverse && reverse[1]) {
      const n = parseInt(reverse[1], 10);
      if (n >= 1 && n <= 200) return { chapters: n, source: "brief" };
    }
    // Fall back to word target / 2500.
    const wordTarget = brief.match(/(?:target\s+(?:length|words)|~?\s*)(\d{1,3}[,.]?\d{3})\s*words?/i);
    if (wordTarget && wordTarget[1]) {
      const words = parseInt(wordTarget[1].replace(/[,.]/g, ""), 10);
      if (words >= 5_000 && words <= 500_000) {
        return { chapters: Math.max(3, Math.round(words / 2500)), source: "brief" };
      }
    }
  }

  return { chapters: DEFAULT_CHAPTERS, source: "default" };
}

export async function estimateRun(projectRoot: string): Promise<RunEstimate> {
  const config = await loadConfig(projectRoot);
  const { chapters, source } = await inferChapters(projectRoot);

  const model = config.model;
  const multiplier = MODEL_MULTIPLIER[model] ?? 1.0;

  const baseUsd = (FIXED_USD + chapters * PER_CHAPTER_USD) * multiplier;
  const baseSeconds = FIXED_SECONDS + chapters * PER_CHAPTER_SECONDS;

  return {
    chapters,
    chaptersSource: source,
    model,
    modelMultiplier: multiplier,
    lowUsd: baseUsd * (1 - UNCERTAINTY),
    expectedUsd: baseUsd,
    highUsd: baseUsd * (1 + UNCERTAINTY),
    lowSeconds: Math.round(baseSeconds * (1 - UNCERTAINTY)),
    expectedSeconds: Math.round(baseSeconds),
    highSeconds: Math.round(baseSeconds * (1 + UNCERTAINTY)),
  };
}

export function formatDurationRange(lowSec: number, highSec: number): string {
  const toLabel = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.round(sec / 60)}m`;
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };
  return `${toLabel(lowSec)}–${toLabel(highSec)}`;
}
