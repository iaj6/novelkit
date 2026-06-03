import { fileURLToPath } from "node:url";
import * as path from "node:path";

const here = fileURLToPath(import.meta.url);
export const PACKAGE_ROOT = path.resolve(path.dirname(here), "..");
export const PROMPTS_DIR = path.join(PACKAGE_ROOT, "src/prompts");
export const TEMPLATES_DIR = path.join(PACKAGE_ROOT, "templates");

/**
 * Resolve an agent-supplied path against a project root, refusing anything that
 * escapes it (parent traversal, absolute paths outside the tree). This is the
 * file-path jail every agent tool callback AND the world store route through —
 * it lives here (an SDK-free module) so any layer can share the exact same
 * containment check. Exported for tests.
 */
export function resolveInProject(projectRoot: string, p: string): string {
  const abs = path.isAbsolute(p) ? path.resolve(p) : path.resolve(projectRoot, p);
  const rel = path.relative(projectRoot, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes project root: ${p}`);
  }
  return abs;
}
