import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { RunLog } from "./runlog.js";
import { FindingSchema, writeFindings as persistFindings, appendFindings as persistAppendFindings } from "./findings.js";

export const SERVER_NAME = "cdk";

export type ToolDeps = {
  projectRoot: string;
  log: RunLog;
};

function resolveInProject(projectRoot: string, p: string): string {
  const abs = path.isAbsolute(p) ? path.resolve(p) : path.resolve(projectRoot, p);
  const rel = path.relative(projectRoot, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes project root: ${p}`);
  }
  return abs;
}

export function buildToolServer(deps: ToolDeps) {
  const { projectRoot, log } = deps;

  const readFile = tool(
    "read_file",
    "Read a file within the project. Path is relative to the project root (e.g. 'brief.md', 'canon/world.md').",
    { path: z.string() },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      const content = await fs.readFile(abs, "utf-8");
      log.event("tool", { name: "read_file", path: args.path, bytes: content.length });
      return { content: [{ type: "text", text: content }] };
    }
  );

  const listFiles = tool(
    "list_files",
    "List files in a project subdirectory. Path is relative to the project root. Use '.' for the root.",
    { path: z.string() },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      let entries: string[] = [];
      try {
        entries = await fs.readdir(abs);
      } catch {
        // directory does not exist; report as empty
      }
      const text = entries.length ? entries.sort().join("\n") : "(empty)";
      log.event("tool", { name: "list_files", path: args.path, count: entries.length });
      return { content: [{ type: "text", text }] };
    }
  );

  const writeFile = tool(
    "write_file",
    "Create or overwrite a file in the project. Path is relative to the project root. Parent directories are created as needed.",
    {
      path: z.string(),
      content: z.string(),
    },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, args.content, "utf-8");
      log.event("tool", { name: "write_file", path: args.path, bytes: args.content.length });
      return { content: [{ type: "text", text: `wrote ${args.path} (${args.content.length} bytes)` }] };
    }
  );

  const appendToFile = tool(
    "append_to_file",
    "Append content to a file (create if missing). Use this to accumulate notes across multiple per-chapter passes — for example, when a per-chapter editor pass needs to add a section to a global logs/editor-X.md file without rewriting the whole file.",
    {
      path: z.string(),
      content: z.string(),
    },
    async (args) => {
      const abs = resolveInProject(projectRoot, args.path);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.appendFile(abs, args.content, "utf-8");
      log.event("tool", { name: "append_to_file", path: args.path, bytes: args.content.length });
      return { content: [{ type: "text", text: `appended ${args.content.length} bytes to ${args.path}` }] };
    }
  );

  const appendContinuity = tool(
    "append_continuity",
    "Append durable canon facts to logs/continuity.md. Use for facts later drafting must not break.",
    {
      facts: z.array(z.string()).min(1).describe("One or more standalone factual statements."),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/continuity.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      const now = new Date().toISOString();
      const lines = args.facts.map((f) => `- ${f}`).join("\n");
      const block = `\n## ${now}\n${lines}\n`;
      await fs.appendFile(file, block, "utf-8");
      log.event("tool", { name: "append_continuity", count: args.facts.length });
      return { content: [{ type: "text", text: `appended ${args.facts.length} facts` }] };
    }
  );

  const appendGlossary = tool(
    "append_glossary",
    "Append entries to canon/glossary.md. Use for new names, places, terms, objects.",
    {
      entries: z.array(z.object({ term: z.string(), definition: z.string() })).min(1),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "canon/glossary.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      const block = "\n" + args.entries.map((e) => `**${e.term}** — ${e.definition}`).join("\n\n") + "\n";
      await fs.appendFile(file, block, "utf-8");
      log.event("tool", { name: "append_glossary", count: args.entries.length });
      return { content: [{ type: "text", text: `appended ${args.entries.length} glossary entries` }] };
    }
  );

  const recordScene = tool(
    "record_scene",
    "Record a scene entry in logs/scene-log.md. Call this after drafting a scene or chapter.",
    {
      sceneId: z.string().describe("e.g. 'ch01' or '03-the-prize'"),
      summary: z.string(),
      newFacts: z.array(z.string()),
      looseThreads: z.array(z.string()),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/scene-log.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      const parts = [
        `\n## ${args.sceneId}`,
        `**Summary:** ${args.summary}`,
      ];
      if (args.newFacts.length) {
        parts.push(`**New facts:**\n${args.newFacts.map((f) => `- ${f}`).join("\n")}`);
      }
      if (args.looseThreads.length) {
        parts.push(`**Loose threads:**\n${args.looseThreads.map((t) => `- ${t}`).join("\n")}`);
      }
      await fs.appendFile(file, parts.join("\n") + "\n", "utf-8");
      log.event("tool", { name: "record_scene", sceneId: args.sceneId });
      return { content: [{ type: "text", text: `recorded scene ${args.sceneId}` }] };
    }
  );

  const projectState = tool(
    "project_state",
    "Summarize what files exist in canon/, outline/, draft/. Use as a 'where am I' check.",
    {},
    async () => {
      const dirs = ["canon", "outline", "draft"];
      const out: string[] = [];
      for (const d of dirs) {
        const abs = resolveInProject(projectRoot, d);
        let entries: string[] = [];
        try {
          entries = (await fs.readdir(abs)).filter((e) => !e.startsWith("."));
        } catch {}
        out.push(`${d}/ (${entries.length} files): ${entries.sort().join(", ") || "(empty)"}`);
      }
      log.event("tool", { name: "project_state" });
      return { content: [{ type: "text", text: out.join("\n") }] };
    }
  );

  const updateStoryArc = tool(
    "update_story_arc",
    "Append a one-line summary of a freshly-drafted chapter to logs/story-arc.md. Call this once after writing a chapter, before record_scene. The arc file is a chronological digest later chapters use instead of re-reading the full scene log.",
    {
      chapterId: z.string().describe("e.g. '01-the-finding'"),
      oneLine: z.string().describe("One sentence (≤ 30 words) summarizing what changed in this chapter."),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/story-arc.md");
      await fs.mkdir(path.dirname(file), { recursive: true });
      const exists = await fs.access(file).then(() => true).catch(() => false);
      if (!exists) {
        await fs.writeFile(
          file,
          "# Story Arc\n\nOne tight line per drafted chapter, in chronological order.\n\n",
          "utf-8"
        );
      }
      await fs.appendFile(file, `- **${args.chapterId}** — ${args.oneLine}\n`, "utf-8");
      log.event("tool", { name: "update_story_arc", chapterId: args.chapterId });
      return { content: [{ type: "text", text: `appended story-arc line for ${args.chapterId}` }] };
    }
  );

  const writeFindings = tool(
    "write_findings",
    "Write the complete structured findings file (logs/findings.json) for a developmental review. Replaces any prior findings file. Call exactly once per review, AFTER you have finished writing the prose letter. Each finding is a single concrete issue with severity, category, evidence, and (when applicable) a repair_agent + repair_params that downstream repair phases will consume. Findings must be CATEGORICAL — describe the kind of issue and cite specific evidence — not bespoke to a single named tic. The same finding category may appear many times for different instances.",
    {
      findings: z.array(FindingSchema),
    },
    async (args) => {
      const relpath = await persistFindings(projectRoot, args.findings);
      log.event("tool", {
        name: "write_findings",
        count: args.findings.length,
        bySeverity: args.findings.reduce<Record<string, number>>((acc, f) => {
          acc[f.severity] = (acc[f.severity] ?? 0) + 1;
          return acc;
        }, {}),
      });
      return {
        content: [
          {
            type: "text",
            text: `wrote ${args.findings.length} findings to ${relpath}`,
          },
        ],
      };
    }
  );

  const appendFindings = tool(
    "append_findings",
    "Append findings to the existing logs/findings.json (creating it if missing). Unlike write_findings, this preserves any findings other agents already produced. Dedupes by `id` — if a finding with the same id exists, the new version replaces it. Use this when adding findings to a shared findings file alongside other review-style phases.",
    {
      findings: z.array(FindingSchema),
    },
    async (args) => {
      const relpath = await persistAppendFindings(projectRoot, args.findings);
      log.event("tool", {
        name: "append_findings",
        count: args.findings.length,
        bySeverity: args.findings.reduce<Record<string, number>>((acc, f) => {
          acc[f.severity] = (acc[f.severity] ?? 0) + 1;
          return acc;
        }, {}),
      });
      return {
        content: [
          {
            type: "text",
            text: `appended ${args.findings.length} findings to ${relpath}`,
          },
        ],
      };
    }
  );

  const readRecentScenes = tool(
    "read_recent_scenes",
    "Return only the most recent N entries from logs/scene-log.md. Use this when drafting a later chapter — it gives you the immediate-context entries without dragging in the full accumulated log.",
    {
      n: z.number().int().min(1).max(20).describe("How many of the most recent scene-log entries to return (3 is the usual choice for drafting)."),
    },
    async (args) => {
      const file = resolveInProject(projectRoot, "logs/scene-log.md");
      let text = "";
      try {
        text = await fs.readFile(file, "utf-8");
      } catch {
        return { content: [{ type: "text", text: "(no scene log yet)" }] };
      }
      const entries = text.split(/\n(?=## )/).filter((e) => e.trim());
      const recent = entries.slice(-args.n).join("\n").trim();
      log.event("tool", { name: "read_recent_scenes", n: args.n, returned: Math.min(args.n, entries.length) });
      return { content: [{ type: "text", text: recent || "(empty)" }] };
    }
  );

  const server = createSdkMcpServer({
    name: SERVER_NAME,
    version: "0.1.0",
    tools: [
      readFile,
      listFiles,
      writeFile,
      appendToFile,
      appendContinuity,
      appendGlossary,
      recordScene,
      projectState,
      updateStoryArc,
      readRecentScenes,
      writeFindings,
      appendFindings,
    ],
  });

  const toolNames = [
    "read_file",
    "list_files",
    "write_file",
    "append_to_file",
    "append_continuity",
    "append_glossary",
    "record_scene",
    "project_state",
    "update_story_arc",
    "read_recent_scenes",
    "write_findings",
    "append_findings",
  ];

  return {
    server,
    serverName: SERVER_NAME,
    allowedToolIds: toolNames.map((n) => `mcp__${SERVER_NAME}__${n}`),
  };
}
