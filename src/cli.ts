import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runPhase, runAll, ALL_PHASE_NAMES, type PhaseName } from "./conductor.js";
import { TEMPLATES_DIR } from "./paths.js";
import { clearState, loadState, saveState } from "./state.js";
import { readCostSummary, formatCostSummary } from "./runlog.js";
import { runRepairFactNormalize } from "./phases/repair-fact-normalize.js";
import { SEVERITIES, type Severity } from "./findings.js";

function usage(): never {
  console.error(`usage:
  cdk init <dir> [--title "..."]
  cdk run <dir> [--force]                   run pipeline; resumes from logs/.cdk-state.json by default
  cdk resume <dir>                          alias for \`cdk run\`
  cdk review <dir>                          re-run only the Reader phase on an existing manuscript
  cdk repair <dir> [--severity=<lvl>]       apply repair agents to findings.json (default severity=critical)
                                            <lvl> ∈ ${SEVERITIES.join(" | ")}
  cdk phase <name> <dir>                    run one phase, ignoring state
    where <name> is one of: ${ALL_PHASE_NAMES.join(", ")}
    (\`editor\` runs continuity, pacing, and voice passes in sequence)
  cdk status <dir>                          show output files and completed-task state
`);
  process.exit(1);
}

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function cmdInit(target: string, opts: { title?: string }) {
  const exists = await fs
    .stat(target)
    .then(() => true)
    .catch(() => false);
  if (exists) {
    console.error(`error: target already exists: ${target}`);
    process.exit(1);
  }
  const src = path.join(TEMPLATES_DIR, "novelkit-cdk");
  await copyDir(src, target);
  if (opts.title) {
    const cfgPath = path.join(target, "cdk.config.json");
    const cfg = JSON.parse(await fs.readFile(cfgPath, "utf-8"));
    cfg.title = opts.title;
    await fs.writeFile(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf-8");
  }
  console.log(`created: ${target}`);
  console.log(
    `next: edit ${path.relative(process.cwd(), path.join(target, "brief.md"))} and run \`cdk run ${target}\``
  );
}

async function cmdStatus(target: string) {
  const dirs = ["canon", "outline", "draft", "revision-1", "logs"];
  for (const d of dirs) {
    let entries: string[] = [];
    try {
      entries = (await fs.readdir(path.join(target, d))).filter((e) => !e.startsWith("."));
    } catch {}
    if (entries.length > 0 || d === "canon" || d === "draft") {
      console.log(`${d}/  (${entries.length})  ${entries.sort().join(", ")}`);
    }
  }
  const state = await loadState(target);
  console.log(`\ncompleted tasks (${state.completed.length}):`);
  for (const k of state.completed) console.log(`  ✓ ${k}`);
  const summary = await readCostSummary(target);
  if (summary.totalCalls > 0) {
    console.log("\ncost so far:");
    console.log(formatCostSummary(summary));
  }
}

function parseSeverity(value: string | undefined): Severity {
  if (!value) return "critical";
  if (!SEVERITIES.includes(value as Severity)) {
    console.error(
      `error: invalid severity '${value}'. Expected one of: ${SEVERITIES.join(", ")}`
    );
    process.exit(1);
  }
  return value as Severity;
}

/** Split argv into positional args and flag args. Lets users put `--force`, `--title`, `--severity` anywhere. */
function splitArgs(args: string[]): { positional: string[]; flags: string[] } {
  const positional: string[] = [];
  const flags: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      flags.push(a);
      // If the flag isn't using --key=value and the next arg isn't a flag, treat next as the flag's value
      if (!a.includes("=") && i + 1 < args.length && !args[i + 1].startsWith("--")) {
        // For known value-taking flags only, consume the next arg.
        if (a === "--title" || a === "--severity") {
          flags.push(args[i + 1]);
          i++;
        }
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function findFlagValue(flags: string[], name: string): string | undefined {
  // Match --name=value or --name value
  for (let i = 0; i < flags.length; i++) {
    const f = flags[i];
    if (f.startsWith(`${name}=`)) return f.slice(name.length + 1);
    if (f === name) return flags[i + 1];
  }
  return undefined;
}

async function main() {
  const raw = process.argv.slice(2);
  const cmd = raw[0];

  if (!cmd || cmd === "-h" || cmd === "--help") usage();

  const { positional, flags } = splitArgs(raw.slice(1));

  if (cmd === "init") {
    const target = positional[0];
    if (!target) usage();
    const title = findFlagValue(flags, "--title");
    await cmdInit(path.resolve(target), { title });
  } else if (cmd === "run" || cmd === "resume") {
    const target = positional[0];
    if (!target) usage();
    const projectRoot = path.resolve(target);
    if (flags.includes("--force")) {
      await clearState(projectRoot);
      console.log("[cdk] cleared state (--force)");
    }
    await runAll(projectRoot);
  } else if (cmd === "review") {
    const target = positional[0];
    if (!target) usage();
    const projectRoot = path.resolve(target);
    // `cdk review` always re-runs the Reader phase from scratch.
    const state = await loadState(projectRoot);
    const reset = state.completed.filter((k) => k.startsWith("reader"));
    if (reset.length > 0) {
      state.completed = state.completed.filter((k) => !k.startsWith("reader"));
      await saveState(state, projectRoot);
      console.log(`[cdk] cleared ${reset.length} reader state task${reset.length === 1 ? "" : "s"} for fresh review`);
    }
    await runPhase("reader", projectRoot);
  } else if (cmd === "repair") {
    const target = positional[0];
    if (!target) usage();
    const sevArg = findFlagValue(flags, "--severity");
    const minSeverity = parseSeverity(sevArg);
    console.log(`[cdk] repair pass at severity≥${minSeverity}`);
    await runRepairFactNormalize(path.resolve(target), minSeverity);
  } else if (cmd === "phase") {
    const phase = positional[0] as PhaseName | undefined;
    const target = positional[1];
    if (!phase || !target || !ALL_PHASE_NAMES.includes(phase)) usage();
    await runPhase(phase, path.resolve(target));
  } else if (cmd === "status") {
    const target = positional[0];
    if (!target) usage();
    await cmdStatus(path.resolve(target));
  } else {
    usage();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
