import { fileURLToPath } from "node:url";
import * as path from "node:path";

const here = fileURLToPath(import.meta.url);
export const PACKAGE_ROOT = path.resolve(path.dirname(here), "..");
export const PROMPTS_DIR = path.join(PACKAGE_ROOT, "src/prompts");
export const TEMPLATES_DIR = path.join(PACKAGE_ROOT, "templates");
