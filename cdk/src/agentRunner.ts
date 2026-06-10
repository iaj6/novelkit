import {
  query,
  type CanUseTool,
  type PermissionMode,
  type PermissionResult,
} from "@anthropic-ai/claude-agent-sdk";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { buildToolServer } from "./tools.js";
import { phaseToSource } from "./world/session.js";
import { openRunLog, readCostSummary, type RunLog } from "./runlog.js";
import { loadConfig, modelForPhase, type PhaseId } from "./config.js";
import { PROMPTS_DIR } from "./paths.js";
import * as c from "./ansi.js";

/** Per-run cap on each web tool for the researcher phase. */
export const WEB_TOOL_CAP_PER_RUN = 30;

/**
 * Builds the canUseTool handler for the researcher phase. Tracks WebSearch and
 * WebFetch invocations and denies further calls once each hits WEB_TOOL_CAP_PER_RUN.
 * All other tools (MCP and SDK built-ins) are allowed unconditionally — the
 * cap is the only behavioral gate this handler enforces.
 *
 * Exported for unit testing; not otherwise wired outside this module.
 */
export function createResearcherPermissionHandler(log: RunLog): CanUseTool {
  let webSearchCalls = 0;
  let webFetchCalls = 0;

  return async (toolName: string): Promise<PermissionResult> => {
    if (toolName === "WebSearch") {
      if (webSearchCalls >= WEB_TOOL_CAP_PER_RUN) {
        log.event("web_tool_cap_hit", { tool: "WebSearch", cap: WEB_TOOL_CAP_PER_RUN });
        return {
          behavior: "deny",
          message: `WebSearch cap of ${WEB_TOOL_CAP_PER_RUN} reached for this run. Finalize the dossier with what you have; do not attempt more searches. Perform the citation self-audit and stop.`,
        };
      }
      webSearchCalls++;
      log.event("web_tool_call", { tool: "WebSearch", count: webSearchCalls, cap: WEB_TOOL_CAP_PER_RUN });
      return { behavior: "allow" };
    }
    if (toolName === "WebFetch") {
      if (webFetchCalls >= WEB_TOOL_CAP_PER_RUN) {
        log.event("web_tool_cap_hit", { tool: "WebFetch", cap: WEB_TOOL_CAP_PER_RUN });
        return {
          behavior: "deny",
          message: `WebFetch cap of ${WEB_TOOL_CAP_PER_RUN} reached for this run. Finalize the dossier with what you have; do not attempt more fetches. Perform the citation self-audit and stop.`,
        };
      }
      webFetchCalls++;
      log.event("web_tool_call", { tool: "WebFetch", count: webFetchCalls, cap: WEB_TOOL_CAP_PER_RUN });
      return { behavior: "allow" };
    }
    return { behavior: "allow" };
  };
}

export type { PhaseId };

export type AgentRunArgs = {
  phase: PhaseId;
  projectRoot: string;
  userPrompt: string;
  maxTurnsOverride?: number;
};

export type AgentRunResult = {
  toolCalls: number;
  finalText: string;
};

const MAX_ATTEMPTS = 4;
const BASE_BACKOFF_MS = 10_000;
const RETRYABLE_PATTERN =
  /\b(429|502|503|504|408|529)\b|overloaded|stream idle timeout|request timed out|deadline exceeded|socket (?:connection|closed)|connection (?:closed|reset|refused|aborted|terminated)|econnreset|econnrefused|econnaborted|enetunreach|etimedout|epipe|rate.?limit|temporarily unavailable|service unavailable|fetch failed|network (?:error|unavailable)|bad gateway|gateway timeout/i;

/**
 * The Agent SDK does NOT throw on a failed run. It emits a normal `result`
 * message with `is_error: true` and a `subtype` such as `error_max_turns`,
 * `error_during_execution`, or `error_max_budget_usd`. If a phase treated that
 * as success it would `markComplete` a truncated/empty chapter, and a later
 * resume would skip it forever. `runQueryOnce` throws this instead so the phase
 * never marks complete and the run aborts cleanly (resume re-attempts the unit).
 */
export class AgentResultError extends Error {
  readonly phase: string;
  readonly subtype: string;
  constructor(phase: string, subtype: string, message: string) {
    super(message);
    this.name = "AgentResultError";
    this.phase = phase;
    this.subtype = subtype;
  }
}

/**
 * True when an SDK `result` message represents a failure rather than success.
 * Pure; exported for testing.
 */
export function isErrorResult(msg: { subtype?: unknown; is_error?: unknown }): boolean {
  if (msg.is_error === true) return true;
  return typeof msg.subtype === "string" && msg.subtype.startsWith("error");
}

function resultErrorMessage(phase: string, subtype: string): string {
  const base = `agent phase "${phase}" ended with an error result (${subtype}); the phase was NOT marked complete`;
  if (subtype === "error_max_turns") {
    return `${base}. Re-run \`cdk run\` to retry this phase, or raise maxTurnsPerPhase.${phase} in cdk.config.json.`;
  }
  if (subtype === "error_max_budget_usd") {
    return `${base}. The run hit its budget cap. Re-run \`cdk run\` to continue.`;
  }
  return `${base}. Re-run \`cdk run\` to retry from this phase.`;
}

/**
 * Result subtypes a blind retry cannot fix — re-running with the same caps just
 * hits the same wall, so we surface them immediately instead of burning the
 * backoff budget. Other failures (e.g. a transient mid-stream execution error)
 * fall through to the normal retry loop.
 */
const NON_RETRYABLE_RESULT_SUBTYPES = new Set(["error_max_turns", "error_max_budget_usd"]);

export function isRetryable(err: unknown): boolean {
  if (err instanceof AgentResultError) {
    return !NON_RETRYABLE_RESULT_SUBTYPES.has(err.subtype);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return RETRYABLE_PATTERN.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pull a one-line "key arg" from a tool's input for human-readable logging.
 *
 * Tries common arg shapes in priority order:
 *   - path-like (read_file / write_file)
 *   - id-like   (update_story_arc chapterId, record_scene sceneId, glossary term)
 *   - small typed knobs (read_recent_scenes n=3)
 *   - fallback to the first non-empty string value, truncated.
 */
function summarizeToolInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;

  for (const key of ["path", "file", "filename"]) {
    const v = obj[key];
    if (typeof v === "string" && v) return v;
  }

  for (const key of ["chapterId", "sceneId", "id", "term"]) {
    const v = obj[key];
    if (typeof v === "string" && v) return v;
  }

  for (const key of ["n", "count", "name"]) {
    const v = obj[key];
    if (typeof v === "string" || typeof v === "number") return `${key}=${v}`;
  }

  for (const v of Object.values(obj)) {
    if (typeof v === "string" && v.length > 0) {
      return v.length > 50 ? v.slice(0, 47) + "…" : v;
    }
  }
  return "";
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m${s}s`;
}

/**
 * Process-scoped cumulative cost. Seeded once from the project's existing
 * run.jsonl so resumed runs continue the tally instead of restarting at zero.
 */
let cumulativeUsd = 0;
let cumulativeCalls = 0;
let cumulativeDurationMs = 0;
let cumulativeSeededFor: string | null = null;

async function ensureCumulativeSeeded(projectRoot: string): Promise<void> {
  if (cumulativeSeededFor === projectRoot) return;
  const summary = await readCostSummary(projectRoot);
  cumulativeUsd = summary.totalUsd;
  cumulativeCalls = summary.totalCalls;
  cumulativeDurationMs = summary.totalDurationMs;
  cumulativeSeededFor = projectRoot;
}

export async function runAgent(args: AgentRunArgs): Promise<AgentRunResult> {
  await ensureCumulativeSeeded(args.projectRoot);
  const config = await loadConfig(args.projectRoot);
  const model = modelForPhase(config, args.phase);
  const log = await openRunLog(args.projectRoot, args.phase);
  const systemPrompt = await fs.readFile(path.join(PROMPTS_DIR, `${args.phase}.md`), "utf-8");
  const { server, serverName, allowedToolIds } = buildToolServer({
    projectRoot: args.projectRoot,
    log,
    source: phaseToSource(args.phase),
    epistemic: config.epistemic,
  });

  const maxTurns = args.maxTurnsOverride ?? config.maxTurnsPerPhase[args.phase];

  // The researcher phase opts into the SDK's built-in WebSearch and WebFetch
  // tools. Every other phase keeps the existing closed-world tool surface
  // (MCP tools only, no web). For the researcher we also install a custom
  // permission handler that caps WebSearch and WebFetch at WEB_TOOL_CAP_PER_RUN
  // each — which means we must drop bypassPermissions for this phase, since
  // bypass mode skips the handler.
  const isResearcher = args.phase === "researcher";
  const builtInTools: string[] = isResearcher ? ["WebSearch", "WebFetch"] : [];
  const effectiveAllowedTools = isResearcher
    ? [...allowedToolIds, "WebSearch", "WebFetch"]
    : allowedToolIds;
  const canUseTool: CanUseTool | undefined = isResearcher
    ? createResearcherPermissionHandler(log)
    : undefined;
  const permissionMode: PermissionMode = isResearcher ? "default" : "bypassPermissions";
  const allowDangerouslySkipPermissions = !isResearcher;

  log.event("phase_start", { model, maxTurns });
  console.log(`${c.phase(args.phase)} start ${c.dim(`(model=${model}, maxTurns=${maxTurns})`)}`);

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await runQueryOnce({
          args,
          model,
          systemPrompt,
          server,
          serverName,
          allowedToolIds: effectiveAllowedTools,
          builtInTools,
          canUseTool,
          permissionMode,
          allowDangerouslySkipPermissions,
          maxTurns,
          log,
        });
      } catch (err) {
        if (!isRetryable(err) || attempt === MAX_ATTEMPTS) {
          throw err;
        }
        const msg = err instanceof Error ? err.message : String(err);
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.log(
          `${c.phase(args.phase)} ${c.yellow("transient error")} (attempt ${attempt}/${MAX_ATTEMPTS}): ${c.dim(msg.slice(0, 120))}`
        );
        console.log(`${c.phase(args.phase)} ${c.yellow("retrying")} in ${backoffMs / 1000}s…`);
        log.event("retry", {
          attempt,
          maxAttempts: MAX_ATTEMPTS,
          error: msg.slice(0, 240),
          backoffMs,
        });
        await sleep(backoffMs);
      }
    }
    throw new Error("unreachable: retry loop fell through");
  } finally {
    await log.close();
  }
}

type QueryContext = {
  args: AgentRunArgs;
  model: string;
  systemPrompt: string;
  server: ReturnType<typeof buildToolServer>["server"];
  serverName: string;
  allowedToolIds: string[];
  builtInTools: string[];
  canUseTool: CanUseTool | undefined;
  permissionMode: PermissionMode;
  allowDangerouslySkipPermissions: boolean;
  maxTurns: number;
  log: RunLog;
};

async function runQueryOnce(ctx: QueryContext): Promise<AgentRunResult> {
  const q = query({
    prompt: ctx.args.userPrompt,
    options: {
      model: ctx.model,
      systemPrompt: ctx.systemPrompt,
      cwd: ctx.args.projectRoot,
      maxTurns: ctx.maxTurns,
      tools: ctx.builtInTools,
      mcpServers: { [ctx.serverName]: ctx.server },
      allowedTools: ctx.allowedToolIds,
      canUseTool: ctx.canUseTool,
      permissionMode: ctx.permissionMode,
      allowDangerouslySkipPermissions: ctx.allowDangerouslySkipPermissions,
      // SDK isolation mode: load NO filesystem settings. Omitting this makes
      // the SDK load all sources (user ~/.claude, project .claude, local) like
      // the CLI does — which (a) bleeds the developer's global hooks/MCP/env
      // into every book run, and (b) would execute hooks from a
      // .claude/settings.json that an agent could write inside the project
      // jail, under bypassPermissions. The pipeline supplies its own
      // systemPrompt + mcpServers and needs none of the filesystem settings.
      settingSources: [],
    },
  });

  let toolCalls = 0;
  let finalText = "";
  let errorResult: { subtype: string } | null = null;

  // Heartbeat: if no event lands for HEARTBEAT_THRESHOLD seconds, emit a
  // "still thinking…" line so the user knows the process isn't hung.
  const HEARTBEAT_THRESHOLD_MS = 20_000;
  let lastEventAt = Date.now();
  const heartbeatTimer = setInterval(() => {
    const elapsedMs = Date.now() - lastEventAt;
    if (elapsedMs >= HEARTBEAT_THRESHOLD_MS) {
      const elapsedSec = Math.round(elapsedMs / 1000);
      console.log(
        `${c.phase(ctx.args.phase)} ${c.dim(`(still thinking, ${elapsedSec}s since last event…)`)}`
      );
    }
  }, 15_000);

  const noteActivity = () => {
    lastEventAt = Date.now();
  };

  try {
    for await (const message of q) {
      noteActivity();
      if (message.type === "assistant") {
        const blocks = (message.message?.content ?? []) as Array<{
          type: string;
          name?: string;
          input?: unknown;
          text?: string;
        }>;
        for (const block of blocks) {
          if (block.type === "tool_use") {
            toolCalls++;
            const argSummary = summarizeToolInput(block.input);
            const argSuffix = argSummary ? ` ${c.dim(argSummary)}` : "";
            console.log(
              `${c.phase(ctx.args.phase)} ${c.dim(`tool ${toolCalls}:`)} ${block.name ?? ""}${argSuffix}`
            );
            ctx.log.event("tool_use", { name: block.name, input: block.input });
          } else if (block.type === "text" && block.text && block.text.trim()) {
            const first = block.text.trim().split("\n")[0].slice(0, 200);
            console.log(`${c.phase(ctx.args.phase)} ${c.dim("say:")} ${c.italic(first)}`);
            ctx.log.event("text", { text: block.text });
          }
        }
      } else if (message.type === "result") {
      const m = message as {
        subtype?: string;
        is_error?: boolean;
        result?: string;
        total_cost_usd?: number;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          cache_read_input_tokens?: number;
          cache_creation_input_tokens?: number;
        };
        duration_ms?: number;
        num_turns?: number;
      };
      finalText = m.result ?? "";
      const usd = m.total_cost_usd ?? 0;
      const inputTokens = m.usage?.input_tokens ?? 0;
      const outputTokens = m.usage?.output_tokens ?? 0;
      const cacheRead = m.usage?.cache_read_input_tokens ?? 0;
      const cacheCreation = m.usage?.cache_creation_input_tokens ?? 0;
      const durationMs = m.duration_ms ?? 0;
      const numTurns = m.num_turns ?? 0;
      ctx.log.event("cost", {
        usd,
        inputTokens,
        outputTokens,
        cacheRead,
        cacheCreation,
        durationMs,
        numTurns,
        subtype: m.subtype,
      });
      const cacheStr = cacheRead ? ` cache=${cacheRead}` : "";
      const subtype = m.subtype ?? "ok";
      const subtypeStr = subtype === "success"
        ? c.green(subtype)
        : isErrorResult(m)
          ? c.yellow(subtype)
          : subtype;
      console.log(
        `${c.phase(ctx.args.phase)} ${c.dim("result:")} ${subtypeStr} | ${c.cost(usd)} | ${c.dim(`in=${inputTokens} out=${outputTokens}${cacheStr}`)} | ${c.dim(`${(durationMs / 1000).toFixed(1)}s`)} | ${c.dim(`${numTurns} turn${numTurns === 1 ? "" : "s"}`)}`
      );
      cumulativeUsd += usd;
      cumulativeCalls += 1;
      cumulativeDurationMs += durationMs;
      console.log(
        `${c.phase(ctx.args.phase)} ${c.dim("cumulative:")} ${c.bold(c.cost(cumulativeUsd))} ${c.dim(`(${cumulativeCalls} call${cumulativeCalls === 1 ? "" : "s"}, ${formatDuration(cumulativeDurationMs)})`)}`
      );
        ctx.log.event("result", { subtype: m.subtype, isError: m.is_error === true });
        if (isErrorResult(m)) {
          errorResult = { subtype: typeof m.subtype === "string" ? m.subtype : "unknown" };
        }
      }
    }
  } finally {
    clearInterval(heartbeatTimer);
  }

  // A failed run is an SDK result message, not a thrown error — turn it into one
  // here so the calling phase never reaches markComplete on truncated output.
  if (errorResult) {
    ctx.log.event("phase_failed", { subtype: errorResult.subtype });
    throw new AgentResultError(
      ctx.args.phase,
      errorResult.subtype,
      resultErrorMessage(ctx.args.phase, errorResult.subtype)
    );
  }

  console.log(`${c.phase(ctx.args.phase)} ${c.green("done")} ${c.dim(`(${toolCalls} tool calls)`)}`);
  return { toolCalls, finalText };
}
