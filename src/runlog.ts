import * as fs from "node:fs/promises";
import * as path from "node:path";

export type RunLog = {
  event: (kind: string, payload?: Record<string, unknown>) => void;
  close: () => Promise<void>;
};

export async function openRunLog(projectRoot: string, phase: string): Promise<RunLog> {
  const logDir = path.join(projectRoot, "logs");
  await fs.mkdir(logDir, { recursive: true });
  const file = path.join(logDir, "run.jsonl");
  const start = Date.now();
  const pending: Promise<unknown>[] = [];

  const event = (kind: string, payload: Record<string, unknown> = {}) => {
    const line = JSON.stringify({ t: Date.now() - start, phase, kind, ...payload }) + "\n";
    pending.push(fs.appendFile(file, line, "utf-8").catch(() => {}));
  };

  const close = async () => {
    await Promise.all(pending);
  };

  return { event, close };
}

export type PhaseCost = {
  calls: number;
  usd: number;
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheCreation: number;
  durationMs: number;
};

export type CostSummary = {
  totalUsd: number;
  totalCalls: number;
  totalDurationMs: number;
  byPhase: Record<string, PhaseCost>;
};

export async function readCostSummary(projectRoot: string): Promise<CostSummary> {
  const file = path.join(projectRoot, "logs/run.jsonl");
  let text = "";
  try {
    text = await fs.readFile(file, "utf-8");
  } catch {
    return { totalUsd: 0, totalCalls: 0, totalDurationMs: 0, byPhase: {} };
  }

  const summary: CostSummary = { totalUsd: 0, totalCalls: 0, totalDurationMs: 0, byPhase: {} };
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let evt: Record<string, unknown>;
    try {
      evt = JSON.parse(line);
    } catch {
      continue;
    }
    if (evt.kind !== "cost") continue;
    const phase = typeof evt.phase === "string" ? evt.phase : "unknown";
    const usd = typeof evt.usd === "number" ? evt.usd : 0;
    const inputTokens = typeof evt.inputTokens === "number" ? evt.inputTokens : 0;
    const outputTokens = typeof evt.outputTokens === "number" ? evt.outputTokens : 0;
    const cacheRead = typeof evt.cacheRead === "number" ? evt.cacheRead : 0;
    const cacheCreation = typeof evt.cacheCreation === "number" ? evt.cacheCreation : 0;
    const durationMs = typeof evt.durationMs === "number" ? evt.durationMs : 0;

    summary.totalUsd += usd;
    summary.totalCalls += 1;
    summary.totalDurationMs += durationMs;

    if (!summary.byPhase[phase]) {
      summary.byPhase[phase] = {
        calls: 0,
        usd: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheRead: 0,
        cacheCreation: 0,
        durationMs: 0,
      };
    }
    const p = summary.byPhase[phase];
    p.calls += 1;
    p.usd += usd;
    p.inputTokens += inputTokens;
    p.outputTokens += outputTokens;
    p.cacheRead += cacheRead;
    p.cacheCreation += cacheCreation;
    p.durationMs += durationMs;
  }
  return summary;
}

export function formatCostSummary(s: CostSummary): string {
  const lines: string[] = [];
  const fmtUsd = (n: number) => `$${n.toFixed(4)}`;
  const fmtTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  };
  const fmtDuration = (ms: number) => {
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return `${m}m${s}s`;
  };

  const phases = Object.keys(s.byPhase).sort();
  const longest = phases.reduce((acc, p) => Math.max(acc, p.length), 0);

  lines.push("phase".padEnd(longest) + "  calls    cost      in      out   cache    time");
  lines.push("-".repeat(longest + 50));
  for (const phase of phases) {
    const p = s.byPhase[phase];
    lines.push(
      [
        phase.padEnd(longest),
        String(p.calls).padStart(5),
        fmtUsd(p.usd).padStart(9),
        fmtTokens(p.inputTokens).padStart(7),
        fmtTokens(p.outputTokens).padStart(7),
        fmtTokens(p.cacheRead).padStart(7),
        fmtDuration(p.durationMs).padStart(7),
      ].join("  ")
    );
  }
  lines.push("-".repeat(longest + 50));
  lines.push(
    [
      "TOTAL".padEnd(longest),
      String(s.totalCalls).padStart(5),
      fmtUsd(s.totalUsd).padStart(9),
      "".padStart(7),
      "".padStart(7),
      "".padStart(7),
      fmtDuration(s.totalDurationMs).padStart(7),
    ].join("  ")
  );
  return lines.join("\n");
}
