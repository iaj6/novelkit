import * as fs from "node:fs/promises";
import * as path from "node:path";

export type State = {
  version: 1;
  completed: string[];
};

const STATE_FILE = "logs/.cdk-state.json";

export async function loadState(projectRoot: string): Promise<State> {
  const file = path.join(projectRoot, STATE_FILE);
  try {
    const text = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.completed)) {
      return { version: 1, completed: parsed.completed };
    }
  } catch {}
  return { version: 1, completed: [] };
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

export async function markComplete(state: State, projectRoot: string, key: string): Promise<void> {
  if (!state.completed.includes(key)) {
    state.completed.push(key);
    await saveState(state, projectRoot);
  }
}

export async function clearState(projectRoot: string): Promise<void> {
  const file = path.join(projectRoot, STATE_FILE);
  await fs.unlink(file).catch(() => {});
}
