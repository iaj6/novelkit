import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const FINDING_CATEGORIES = [
  "continuity-fact",
  "stylistic-tic",
  "over-articulation",
  "character-voice-drift",
  "ending-mode-uniformity",
  "register-bandwidth",
  "thread-drift",
  "other",
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const EvidenceSchema = z.object({
  file: z.string().describe("Path relative to project root."),
  line: z.number().int().optional(),
  text: z.string().optional().describe("Verbatim excerpt of the offending text, if applicable."),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const FindingSchema = z.object({
  id: z.string().describe("Stable identifier, e.g. 'continuity-fact-001'."),
  category: z.enum(FINDING_CATEGORIES),
  severity: z.enum(SEVERITIES),
  title: z.string(),
  description: z.string().optional(),
  evidence: z.array(EvidenceSchema),
  suggested_action: z.string(),
  auto_repair_safe: z
    .boolean()
    .describe("True only if a repair agent can apply this fix without human judgment."),
  repair_agent: z
    .string()
    .nullable()
    .describe("e.g. 'repair-fact-normalize'. Null if the finding requires human judgment."),
  repair_params: z
    .unknown()
    .optional()
    .describe("Free-form params passed to the repair agent. Each agent validates its own params."),
});
export type Finding = z.infer<typeof FindingSchema>;

export const FindingsFileSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string(),
  summary: z.object({
    critical: z.number().int(),
    high: z.number().int(),
    medium: z.number().int(),
    low: z.number().int(),
  }),
  findings: z.array(FindingSchema),
});
export type FindingsFile = z.infer<typeof FindingsFileSchema>;

const FINDINGS_PATH = "logs/findings.json";

function summarize(findings: Finding[]): FindingsFile["summary"] {
  const out = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) out[f.severity] += 1;
  return out;
}

export async function writeFindings(projectRoot: string, findings: Finding[]): Promise<string> {
  const file = path.join(projectRoot, FINDINGS_PATH);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const payload: FindingsFile = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    summary: summarize(findings),
    findings,
  };
  const tmp = `${file}.tmp.${process.pid}.${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, file);
  return FINDINGS_PATH;
}

export async function readFindings(projectRoot: string): Promise<FindingsFile | null> {
  const file = path.join(projectRoot, FINDINGS_PATH);
  let text: string;
  try {
    text = await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
  const raw = JSON.parse(text);
  return FindingsFileSchema.parse(raw);
}

export function filterByMinSeverity(
  findings: Finding[],
  minSeverity: Severity
): Finding[] {
  const rank: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return findings.filter((f) => rank[f.severity] >= rank[minSeverity]);
}
