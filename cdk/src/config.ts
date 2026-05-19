import * as fs from "node:fs/promises";
import * as path from "node:path";

export type PhaseId =
  | "architect"
  | "plotter"
  | "threads"
  | "drafter"
  | "editor-continuity"
  | "editor-compression"
  | "editor-pacing"
  | "editor-voice"
  | "reader"
  | "continuity-fact-audit"
  | "repair-fact-normalize";

export type Visibility = "private" | "public";

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
  modelByPhase: Partial<Record<PhaseId, string>>;
  maxTurnsPerPhase: Record<PhaseId, number>;
};

const DEFAULT_MAX_TURNS: Record<PhaseId, number> = {
  architect: 60,
  plotter: 50,
  threads: 40,
  drafter: 30,
  "editor-continuity": 40,
  "editor-compression": 40,
  "editor-pacing": 40,
  "editor-voice": 40,
  reader: 50,
  "continuity-fact-audit": 80,
  "repair-fact-normalize": 30,
};

const DEFAULT_CONFIG: Config = {
  title: "Untitled",
  model: "claude-sonnet-4-6",
  visibility: "private",
  modelByPhase: {},
  maxTurnsPerPhase: DEFAULT_MAX_TURNS,
};

function normalizeVisibility(value: unknown): Visibility {
  return value === "public" ? "public" : "private";
}

export async function loadConfig(projectRoot: string): Promise<Config> {
  const file = path.join(projectRoot, "cdk.config.json");
  try {
    const text = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(text);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      // Anything other than the literal "public" is treated as "private"
      // — safer default for legacy configs without the field.
      visibility: normalizeVisibility(parsed.visibility),
      modelByPhase: { ...(parsed.modelByPhase ?? {}) },
      maxTurnsPerPhase: { ...DEFAULT_MAX_TURNS, ...(parsed.maxTurnsPerPhase ?? {}) },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
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
  let parsed: Record<string, unknown> = {};
  try {
    const text = await fs.readFile(file, "utf-8");
    parsed = JSON.parse(text);
  } catch {
    // No config file yet — start from defaults.
    parsed = { ...DEFAULT_CONFIG };
  }
  parsed.visibility = visibility;
  await fs.writeFile(file, JSON.stringify(parsed, null, 2) + "\n", "utf-8");
  return visibility;
}

export function modelForPhase(config: Config, phase: PhaseId): string {
  return config.modelByPhase[phase] ?? config.model;
}
