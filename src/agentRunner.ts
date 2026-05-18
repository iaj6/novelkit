import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { buildToolServer } from "./tools.js";
import { openRunLog, type RunLog } from "./runlog.js";
import { loadConfig, modelForPhase, type PhaseId } from "./config.js";
import { PROMPTS_DIR } from "./paths.js";

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
  /\b(429|502|503|504|408|529)\b|overloaded|stream idle timeout|socket (?:connection|closed)|connection (?:closed|reset|refused|aborted|terminated)|econnreset|econnrefused|econnaborted|enetunreach|etimedout|epipe|rate.?limit|temporarily unavailable|service unavailable|fetch failed|network (?:error|unavailable)|bad gateway|gateway timeout/i;

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return RETRYABLE_PATTERN.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAgent(args: AgentRunArgs): Promise<AgentRunResult> {
  const config = await loadConfig(args.projectRoot);
  const model = modelForPhase(config, args.phase);
  const log = await openRunLog(args.projectRoot, args.phase);
  const systemPrompt = await fs.readFile(path.join(PROMPTS_DIR, `${args.phase}.md`), "utf-8");
  const { server, serverName, allowedToolIds } = buildToolServer({
    projectRoot: args.projectRoot,
    log,
  });

  const maxTurns = args.maxTurnsOverride ?? config.maxTurnsPerPhase[args.phase];

  log.event("phase_start", { model, maxTurns });
  console.log(`[${args.phase}] start (model=${model}, maxTurns=${maxTurns})`);

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await runQueryOnce({
          args,
          model,
          systemPrompt,
          server,
          serverName,
          allowedToolIds,
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
          `[${args.phase}] transient error (attempt ${attempt}/${MAX_ATTEMPTS}): ${msg.slice(0, 120)}`
        );
        console.log(`[${args.phase}] retrying in ${backoffMs / 1000}s…`);
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
      tools: [],
      mcpServers: { [ctx.serverName]: ctx.server },
      allowedTools: ctx.allowedToolIds,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  });

  let toolCalls = 0;
  let finalText = "";

  for await (const message of q) {
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
          console.log(`[${ctx.args.phase}] tool ${toolCalls}: ${block.name}`);
          ctx.log.event("tool_use", { name: block.name, input: block.input });
        } else if (block.type === "text" && block.text && block.text.trim()) {
          const first = block.text.trim().split("\n")[0].slice(0, 200);
          console.log(`[${ctx.args.phase}] say: ${first}`);
          ctx.log.event("text", { text: block.text });
        }
      }
    } else if (message.type === "result") {
      const m = message as {
        subtype?: string;
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
      console.log(
        `[${ctx.args.phase}] result: ${m.subtype ?? "ok"} | $${usd.toFixed(4)} | in=${inputTokens} out=${outputTokens}${cacheStr} | ${(durationMs / 1000).toFixed(1)}s | ${numTurns} turn${numTurns === 1 ? "" : "s"}`
      );
      ctx.log.event("result", { subtype: m.subtype });
    }
  }

  console.log(`[${ctx.args.phase}] done (${toolCalls} tool calls)`);
  return { toolCalls, finalText };
}
