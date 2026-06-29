import * as fs from "node:fs/promises";
import * as path from "node:path";

export type PhaseId =
  | "researcher"
  | "architect"
  | "plotter"
  | "threads"
  | "calibrate-sample"
  | "calibrate-grade"
  | "drafter"
  | "editor-continuity"
  | "editor-compression"
  | "editor-pacing"
  | "editor-voice"
  | "reader"
  | "continuity-fact-audit"
  | "repair-fact-normalize";

export type Visibility = "private" | "public";

export type CalibrationConfig = {
  /** Whether the drafter calibration loop runs before drafter. Default: true. */
  enabled: boolean;
  /** Hard cap on iterations of the sample→grade→revise cycle. Default: 2. */
  max_iterations: number;
};

export type Config = {
  title: string;
  model: string;
  /**
   * Whether this book appears on the deployed site.
   *   "private" — exists in the repo but is hidden from the landing,
   *               from /book/<slug>/ routes, and from the site's
   *               getBooks() return value. (Default for new books.)
   *   "public"  — included on the landing and gets a per-book page.
   *
   * Flip with `cdk publish <dir>` / `cdk unpublish <dir>`.
   */
  visibility: Visibility;
  /**
   * Whether the researcher phase runs before the architect. When true (or
   * when brief.md contains a `## Research scope` section), the conductor
   * invokes the researcher to produce canon/research.md from primary
   * sources before canon is built. Default false — most briefs don't need it.
   */
  research: boolean;
  /**
   * Opt-in: the drafter records who-knows-what (record_knowledge) so the
   * who_knows / dramatic_irony queries work. Default false — most briefs are
   * linear and don't need the epistemic layer. Turn on for braided-POV /
   * dramatic-irony / unreliable-narration books (the M5.5 pilot bet).
   */
  epistemic: boolean;
  /**
   * Drafter calibration loop (runs between threads and drafter). When enabled,
   * the pipeline drafts a short sample of chapter 1's opening, has a grader
   * compare it against the brief's audience/exemplars, and revises
   * canon/agent-guidance/drafter.md if the sample drifts from the briefed
   * register. Capped iteration; the pipeline always proceeds eventually.
   */
  calibration: CalibrationConfig;
  modelByPhase: Partial<Record<PhaseId, string>>;
  maxTurnsPerPhase: Record<PhaseId, number>;
};

const DEFAULT_MAX_TURNS: Record<PhaseId, number> = {
  researcher: 120,
  architect: 60,
  plotter: 50,
  threads: 40,
  drafter: 100, // FM1: M6 structured-capture is ~40+ tool calls/chapter (30 crashed at ch21). Raised 50→100: a brief
  // with a per-chapter compounding mechanism (#8) front-loads heavy world-store seeding — a real run needed 76 turns
  // on chapter 1. The cap is a ceiling, not a target, so books that finish sooner are unaffected.
  "calibrate-sample": 20,
  "calibrate-grade": 30,
  "editor-continuity": 40,
  "editor-compression": 40,
  "editor-pacing": 40,
  "editor-voice": 40,
  reader: 50,
  "continuity-fact-audit": 80,
  "repair-fact-normalize": 30,
};

const DEFAULT_CALIBRATION: CalibrationConfig = {
  enabled: true,
  max_iterations: 2,
};

const DEFAULT_CONFIG: Config = {
  title: "Untitled",
  model: "claude-sonnet-4-6",
  visibility: "private",
  research: false,
  epistemic: false,
  calibration: DEFAULT_CALIBRATION,
  modelByPhase: {},
  maxTurnsPerPhase: DEFAULT_MAX_TURNS,
};

function normalizeVisibility(value: unknown): Visibility {
  return value === "public" ? "public" : "private";
}

export async function loadConfig(projectRoot: string): Promise<Config> {
  const file = path.join(projectRoot, "cdk.config.json");
  let text: string;
  try {
    text = await fs.readFile(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      // No config file — run with defaults. The private/default direction is
      // fail-safe; the harm to avoid is silently *defaulting* a config the
      // operator did write (handled in the parse branch below).
      return structuredClone(DEFAULT_CONFIG);
    }
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `cdk.config.json is not valid JSON (${msg}). Fix it before running; ` +
        `refusing to silently fall back to defaults (model, turn caps, calibration).`
    );
  }
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    // Anything other than the literal "public" is treated as "private"
    // — safer default for legacy configs without the field.
    visibility: normalizeVisibility(parsed.visibility),
    research: parsed.research === true,
    epistemic: parsed.epistemic === true,
    calibration: { ...DEFAULT_CALIBRATION, ...(parsed.calibration ?? {}) },
    modelByPhase: { ...(parsed.modelByPhase ?? {}) },
    maxTurnsPerPhase: { ...DEFAULT_MAX_TURNS, ...(parsed.maxTurnsPerPhase ?? {}) },
  };
}

/**
 * Update the visibility field in cdk.config.json. Used by the
 * `cdk publish` / `cdk unpublish` commands. Returns the new visibility.
 */
export async function setVisibility(
  projectRoot: string,
  visibility: Visibility
): Promise<Visibility> {
  const file = path.join(projectRoot, "cdk.config.json");
  let parsed: Record<string, unknown>;
  let text: string | null = null;
  try {
    text = await fs.readFile(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    // No config file yet — start from defaults.
  }
  if (text === null) {
    parsed = { ...DEFAULT_CONFIG };
  } else {
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `cdk.config.json is not valid JSON (${msg}). Fix it before publishing; ` +
          `refusing to overwrite it with defaults (which would wipe title, model, ` +
          `and tuning).`
      );
    }
  }
  parsed.visibility = visibility;
  await fs.writeFile(file, JSON.stringify(parsed, null, 2) + "\n", "utf-8");
  return visibility;
}

export function modelForPhase(config: Config, phase: PhaseId): string {
  return config.modelByPhase[phase] ?? config.model;
}
