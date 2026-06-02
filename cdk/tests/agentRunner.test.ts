import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Shared, hoisted handle the SDK mock reads from. Each test queues the stream of
// messages query() should yield. (vi.hoisted runs before the vi.mock factory, so
// the factory can close over it.)
const sdk = vi.hoisted(() => ({ messages: [] as Array<Record<string, unknown>> }));

vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  // query() returns an async iterable of whatever the test queued.
  query: () =>
    (async function* () {
      for (const m of sdk.messages) yield m;
    })(),
  // tools.ts only needs these to build its (mocked-away) MCP server.
  tool: (name: string) => ({ name }),
  createSdkMcpServer: (cfg: unknown) => ({ __server: cfg }),
}));

import {
  isErrorResult,
  isRetryable,
  AgentResultError,
  runAgent,
} from "../src/agentRunner.js";

describe("isErrorResult (SDK result success/failure gate)", () => {
  it("is false for a success subtype", () => {
    expect(isErrorResult({ subtype: "success" })).toBe(false);
  });
  it("is true for any error_* subtype", () => {
    expect(isErrorResult({ subtype: "error_max_turns" })).toBe(true);
    expect(isErrorResult({ subtype: "error_during_execution" })).toBe(true);
    expect(isErrorResult({ subtype: "error_max_budget_usd" })).toBe(true);
  });
  it("is true when is_error is set even if the subtype reads ok", () => {
    expect(isErrorResult({ is_error: true, subtype: "success" })).toBe(true);
  });
  it("is false for an empty/absent result shape", () => {
    expect(isErrorResult({})).toBe(false);
  });
});

describe("isRetryable (classification of failures)", () => {
  it("does NOT retry max_turns — a blind retry just hits the same wall", () => {
    expect(isRetryable(new AgentResultError("drafter", "error_max_turns", "m"))).toBe(false);
  });
  it("does NOT retry a budget cap", () => {
    expect(isRetryable(new AgentResultError("drafter", "error_max_budget_usd", "m"))).toBe(false);
  });
  it("DOES retry a transient mid-stream execution error", () => {
    expect(isRetryable(new AgentResultError("drafter", "error_during_execution", "m"))).toBe(true);
  });
  it("still retries network-shaped thrown errors (existing behavior preserved)", () => {
    expect(isRetryable(new Error("upstream connect error: overloaded"))).toBe(true);
    expect(isRetryable(new Error("read ECONNRESET"))).toBe(true);
  });
  it("does not retry a deterministic thrown error", () => {
    expect(isRetryable(new Error("TypeError: cannot read property of undefined"))).toBe(false);
  });
});

describe("AgentResultError", () => {
  it("is an Error carrying phase + subtype", () => {
    const e = new AgentResultError("drafter", "error_max_turns", "msg");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("AgentResultError");
    expect(e.phase).toBe("drafter");
    expect(e.subtype).toBe("error_max_turns");
  });
});

describe("runAgent (failed runs do not look like success)", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "novelkit-agentrunner-"));
    writeFileSync(
      join(root, "cdk.config.json"),
      JSON.stringify({ title: "T", model: "claude-sonnet-4-6" }),
      "utf-8"
    );
    sdk.messages = [];
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("throws AgentResultError when the SDK returns error_max_turns (so the caller never markComplete's)", async () => {
    sdk.messages = [{ type: "result", subtype: "error_max_turns", is_error: true }];
    await expect(
      runAgent({ phase: "architect", projectRoot: root, userPrompt: "x" })
    ).rejects.toBeInstanceOf(AgentResultError);
  });

  it("surfaces the subtype on the thrown error", async () => {
    sdk.messages = [{ type: "result", subtype: "error_max_turns", is_error: true }];
    await expect(
      runAgent({ phase: "architect", projectRoot: root, userPrompt: "x" })
    ).rejects.toMatchObject({ subtype: "error_max_turns", phase: "architect" });
  });

  it("returns normally (finalText) on a success result", async () => {
    sdk.messages = [
      { type: "result", subtype: "success", is_error: false, result: "the drafted text" },
    ];
    const res = await runAgent({ phase: "architect", projectRoot: root, userPrompt: "x" });
    expect(res.finalText).toBe("the drafted text");
  });
});
