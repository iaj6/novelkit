import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadState,
  saveState,
  clearState,
  isComplete,
  markComplete,
  getEntry,
  type State,
} from "../src/state.js";
import { appendEvent, WORLD_EVENTS_PATH } from "../src/world/store.js";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "novelkit-state-"));
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function emptyState(): State {
  return { version: 1, completed: [] };
}

describe("state", () => {
  it("loadState returns an empty completed list when no state file exists", async () => {
    const state = await loadState(tmpRoot);
    expect(state.completed).toEqual([]);
  });

  it("saveState writes a JSON file under logs/.cdk-state.json", async () => {
    const state: State = { version: 1, completed: ["architect", "plotter"] };
    await saveState(state, tmpRoot);
    const file = join(tmpRoot, "logs", ".cdk-state.json");
    expect(existsSync(file)).toBe(true);

    const parsed = JSON.parse(readFileSync(file, "utf-8"));
    expect(parsed.completed).toEqual(["architect", "plotter"]);
  });

  it("loadState reads what saveState wrote (round trip)", async () => {
    const original: State = { version: 1, completed: ["architect", "drafter:01-foo"] };
    await saveState(original, tmpRoot);
    const loaded = await loadState(tmpRoot);
    expect(loaded.completed).toEqual(original.completed);
  });

  it("isComplete reports false for unknown keys and true for known ones", () => {
    const state: State = { version: 1, completed: ["a", "b", "drafter:03-x"] };
    expect(isComplete(state, "a")).toBe(true);
    expect(isComplete(state, "drafter:03-x")).toBe(true);
    expect(isComplete(state, "missing")).toBe(false);
  });

  it("markComplete adds the key, persists, and avoids duplicates", async () => {
    const state = emptyState();
    await markComplete(state, tmpRoot, "architect");
    await markComplete(state, tmpRoot, "drafter:01-x");
    // Duplicate add — should be a no-op.
    await markComplete(state, tmpRoot, "architect");

    expect(state.completed.sort()).toEqual(["architect", "drafter:01-x"]);

    const reloaded = await loadState(tmpRoot);
    expect(reloaded.completed.sort()).toEqual(["architect", "drafter:01-x"]);
  });

  it("clearState removes the persisted state file", async () => {
    const state: State = { version: 1, completed: ["architect"] };
    await saveState(state, tmpRoot);
    expect(existsSync(join(tmpRoot, "logs", ".cdk-state.json"))).toBe(true);

    await clearState(tmpRoot);
    expect(existsSync(join(tmpRoot, "logs", ".cdk-state.json"))).toBe(false);
  });

  it("clearState on a missing file is a no-op (no throw)", async () => {
    await expect(clearState(tmpRoot)).resolves.toBeUndefined();
  });

  it("loadState recovers from a corrupted state file", async () => {
    // Hand-write garbage where the state file should be.
    const dir = join(tmpRoot, "logs");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, ".cdk-state.json"), "{not json", "utf-8");

    const loaded = await loadState(tmpRoot);
    expect(loaded.completed).toEqual([]);
  });

  it("loadState recovers from a file with missing 'completed' field", async () => {
    const dir = join(tmpRoot, "logs");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, ".cdk-state.json"), JSON.stringify({ version: 1 }), "utf-8");

    const loaded = await loadState(tmpRoot);
    expect(loaded.completed).toEqual([]);
  });

  // ── M4: verification payloads + migration ──────────────────────────
  it("markComplete records a verification entry payload and reloads it", async () => {
    const state = await loadState(tmpRoot);
    await markComplete(state, tmpRoot, "drafter:01-x", {
      artifacts: ["draft/01-x.md"],
      hashes: { "draft/01-x.md": "abc" },
      eventOffset: 3,
    });
    expect(getEntry(state, "drafter:01-x")?.hashes).toEqual({ "draft/01-x.md": "abc" });

    const reloaded = await loadState(tmpRoot);
    expect(reloaded.entries?.["drafter:01-x"]?.hashes).toEqual({ "draft/01-x.md": "abc" });
    expect(reloaded.entries?.["drafter:01-x"]?.at).toBeTypeOf("string");
  });

  it("markComplete refreshes an existing entry (re-run after a failed verification)", async () => {
    const state = await loadState(tmpRoot);
    await markComplete(state, tmpRoot, "drafter:01-x", { hashes: { "draft/01-x.md": "old" } });
    await markComplete(state, tmpRoot, "drafter:01-x", { hashes: { "draft/01-x.md": "new" } });
    expect(getEntry(state, "drafter:01-x")?.hashes).toEqual({ "draft/01-x.md": "new" });
    expect(state.completed.filter((k) => k === "drafter:01-x")).toHaveLength(1); // no duplicate
  });

  it("auto-migrates a v1 state file (completed-only) to v2 with empty entries", async () => {
    const dir = join(tmpRoot, "logs");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, ".cdk-state.json"),
      JSON.stringify({ version: 1, completed: ["architect", "drafter:01-x"] }),
      "utf-8"
    );
    const loaded = await loadState(tmpRoot);
    expect(loaded.version).toBe(2);
    expect(loaded.completed).toEqual(["architect", "drafter:01-x"]);
    expect(loaded.entries).toEqual({}); // legacy-trusted
  });

  it("clearState also clears the world event stream (--force is a clean re-run)", async () => {
    await appendEvent(tmpRoot, {
      type: "entity.upsert",
      id: "x",
      kind: "object",
      display_name: "X",
      provenance: { chapter: "canon", source: "architect" },
    });
    expect(existsSync(join(tmpRoot, WORLD_EVENTS_PATH))).toBe(true);
    await clearState(tmpRoot);
    expect(existsSync(join(tmpRoot, WORLD_EVENTS_PATH))).toBe(false);
  });
});
