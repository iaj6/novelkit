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

export type Config = {
  title: string;
  model: string;
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
  modelByPhase: {},
  maxTurnsPerPhase: DEFAULT_MAX_TURNS,
};

export async function loadConfig(projectRoot: string): Promise<Config> {
  const file = path.join(projectRoot, "cdk.config.json");
  try {
    const text = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(text);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      modelByPhase: { ...(parsed.modelByPhase ?? {}) },
      maxTurnsPerPhase: { ...DEFAULT_MAX_TURNS, ...(parsed.maxTurnsPerPhase ?? {}) },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function modelForPhase(config: Config, phase: PhaseId): string {
  return config.modelByPhase[phase] ?? config.model;
}
