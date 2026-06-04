import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveInProject } from "../paths.js";
import { WorldEventSchema, validateWriteInvariants, type WorldEvent } from "./schema.js";

/** Append-only event log, relative to a book's project root. */
export const WORLD_EVENTS_PATH = "logs/world/events.jsonl";

export interface ReadResult {
  events: WorldEvent[];
  /** Count of tolerated torn/garbage trailing lines (process killed mid-append). */
  skipped: number;
}

/**
 * Validate and append one event as a single JSONL line. The agent never writes
 * the log directly — all mutation flows through validated events, so the store
 * cannot be driven into an invalid shape. One event = one appended line = a
 * git-diffable additive hunk; prior lines are never rewritten (which is also why
 * a torn write can only ever damage the final line).
 */
export async function appendEvent(projectRoot: string, event: unknown): Promise<WorldEvent> {
  const parsed = WorldEventSchema.parse(event);
  validateWriteInvariants(parsed);
  const file = resolveInProject(projectRoot, WORLD_EVENTS_PATH);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await healTornTail(file);
  await fs.appendFile(file, JSON.stringify(parsed) + "\n", "utf-8");
  return parsed;
}

/**
 * Heal a torn trailing line left by a process killed mid-append: if the log
 * exists and its final byte is not a newline, the last line is a partial write —
 * truncate it so the next append lands on a clean line instead of gluing onto the
 * partial (which would corrupt a mid-file record and make the whole log throw on
 * read). The log stays append-only otherwise. Cheap common case: stat + 1 byte.
 */
async function healTornTail(file: string): Promise<void> {
  let handle: fs.FileHandle;
  try {
    handle = await fs.open(file, "r+");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return; // no log yet
    throw err;
  }
  try {
    const { size } = await handle.stat();
    if (size === 0) return;
    const lastByte = Buffer.alloc(1);
    await handle.read(lastByte, 0, 1, size - 1);
    if (lastByte[0] === 0x0a) return; // ends in "\n" — previous write was clean
    // Operate on raw BYTES: truncate() takes a byte length, and the log routinely
    // holds multibyte UTF-8 (em-dashes, accents, smart quotes). A decoded-string
    // (UTF-16) index would diverge from the byte offset and cut a prior committed
    // line mid-character, corrupting it.
    const buf = await handle.readFile();
    const lastNl = buf.lastIndexOf(0x0a); // BYTE index of the last "\n"
    await handle.truncate(lastNl + 1); // drop the partial line (truncate to 0 if no newline at all)
  } finally {
    await handle.close();
  }
}

export async function readEvents(projectRoot: string): Promise<ReadResult> {
  const file = resolveInProject(projectRoot, WORLD_EVENTS_PATH);
  let text: string;
  try {
    text = await fs.readFile(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { events: [], skipped: 0 };
    throw err;
  }
  return parseEvents(text);
}

/**
 * Pure: parse a JSONL blob into events. A torn or invalid FINAL line (the only
 * line a killed mid-append can damage, since writes are append-only and
 * single-line) is tolerated and counted in `skipped`. An invalid line anywhere
 * else is real corruption and throws. Exported for tests.
 */
export function parseEvents(text: string): ReadResult {
  const lines = text.split("\n");
  const events: WorldEvent[] = [];
  let skipped = 0;
  const restAllBlank = (from: number): boolean => lines.slice(from).every((l) => l.trim() === "");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    const atEof = restAllBlank(i + 1);
    let obj: unknown;
    try {
      obj = JSON.parse(line);
    } catch {
      if (atEof) {
        skipped++;
        continue;
      }
      throw new Error(`world event log corrupt at line ${i + 1}: not valid JSON`);
    }
    const res = WorldEventSchema.safeParse(obj);
    if (!res.success) {
      if (atEof) {
        skipped++;
        continue;
      }
      throw new Error(
        `world event log: invalid event at line ${i + 1}: ${res.error.issues
          .map((x) => x.message)
          .join("; ")}`
      );
    }
    events.push(res.data);
  }
  return { events, skipped };
}
