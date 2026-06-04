import * as fs from "node:fs/promises";
import * as path from "node:path";
import { WORLD_EVENTS_PATH } from "./world/store.js";

/**
 * Per-key verification payload (M4 checkpoint integrity). An entry lets resume
 * VERIFY a completed unit instead of trusting `completed` membership. An absent
 * entry is legacy-trusted (v1 state, or a phase that records no payload).
 */
export type CompletedEntry = {
  /** ISO completion timestamp — resume metadata only, NOT a world event. */
  at?: string;
  /** Project-relative artifact paths the unit must have produced. */
  artifacts?: string[];
  /** sha256 of each artifact at completion — detects truncation/deletion/edit on resume. */
  hashes?: Record<string, string>;
  /** World event-stream length after this unit's writes (for future projection checks). */
  eventOffset?: number;
};

export type State = {
  version: 1 | 2;
  /** The membership list (unchanged from v1 — `isComplete` is a lookup here). */
  completed: string[];
  /** M4: per-key verification payloads, keyed by the same key. Absent for legacy v1 state. */
  entries?: Record<string, CompletedEntry>;
};

const STATE_FILE = "logs/.cdk-state.json";

export async function loadState(projectRoot: string): Promise<State> {
  const file = path.join(projectRoot, STATE_FILE);
  try {
    const text = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.completed)) {
      // v1 (completed-only) auto-migrates in memory to v2 with empty entries
      // (legacy-trusted — those units verify by file existence, no hash compare).
      return {
        version: 2,
        completed: parsed.completed,
        entries: parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {},
      };
    }
  } catch {
    // missing or corrupt -> recover to empty (existing chaos-tolerant behavior)
  }
  return { version: 2, completed: [], entries: {} };
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  await fs.writeFile(tmp, content, "utf-8");
  await fs.rename(tmp, filePath);
}

export async function saveState(state: State, projectRoot: string): Promise<void> {
  const file = path.join(projectRoot, STATE_FILE);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await atomicWrite(file, JSON.stringify(state, null, 2) + "\n");
}

export function isComplete(state: State, key: string): boolean {
  return state.completed.includes(key);
}

export function getEntry(state: State, key: string): CompletedEntry | undefined {
  return state.entries?.[key];
}

/**
 * Record a unit as complete. Adds the key to the membership list and, when a
 * verification payload is given, stores/REFRESHES its entry (so a re-run after a
 * failed verification updates the hash). Persists only when something changed.
 */
export async function markComplete(
  state: State,
  projectRoot: string,
  key: string,
  payload?: CompletedEntry
): Promise<void> {
  let changed = false;
  if (!state.completed.includes(key)) {
    state.completed.push(key);
    changed = true;
  }
  if (payload) {
    state.entries = state.entries ?? {};
    state.entries[key] = { at: new Date().toISOString(), ...payload };
    changed = true;
  }
  if (changed) await saveState(state, projectRoot);
}

export async function clearState(projectRoot: string): Promise<void> {
  await fs.unlink(path.join(projectRoot, STATE_FILE)).catch(() => {});
  // `--force` also clears the world EVENT STREAM so a forced re-run fills it fresh
  // instead of appending onto stale events. (The append-only markdown logs are NOT
  // reset by --force — pre-existing behavior; the architect re-seeds the canon files.)
  await fs.unlink(path.join(projectRoot, WORLD_EVENTS_PATH)).catch(() => {});
}
