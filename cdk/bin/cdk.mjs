#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(here, "..", "src", "cli.ts");
const tsx = path.resolve(here, "..", "node_modules", ".bin", "tsx");

const r = spawnSync(tsx, [cli, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(r.status ?? 1);
