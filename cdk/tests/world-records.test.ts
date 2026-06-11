import { describe, it, expect } from "vitest";
import { WorldEventSchema, validateWriteInvariants } from "../src/world/schema.js";
import { project, liveRecords, tablesToJSON } from "../src/world/project.js";

const ev = (o: unknown) => WorldEventSchema.parse(o);
function rec(id: string, recordId: string, text: string, extra: Record<string, unknown> = {}) {
  return ev({
    type: "record.upsert",
    id,
    recordId,
    label: recordId,
    text,
    provenance: { chapter: "01-x", source: "drafter" },
    ...extra,
  });
}

describe("record.upsert schema + projection (M7 verbatim records)", () => {
  it("parses with defaults (kind=document, tier=drafted) and projects to the records table", () => {
    const live = liveRecords(project([rec("r1", "harbor-log", "0615: discovery")]));
    expect(live).toHaveLength(1);
    expect(live[0]).toMatchObject({
      recordId: "harbor-log",
      text: "0615: discovery",
      kind: "document",
      tier: "drafted",
      status: "live",
    });
  });

  it("a superseding record retires the prior; only the latest is live", () => {
    const t = project([
      rec("r1", "harbor-log", "old text"),
      rec("r2", "harbor-log", "corrected text", { supersedes: "r1" }),
    ]);
    expect(liveRecords(t)).toHaveLength(1);
    expect(liveRecords(t)[0].text).toBe("corrected text");
    expect(t.records.get("r1")!.status).toBe("superseded");
  });

  it("a record-scope retract drops it from live", () => {
    const t = project([
      rec("r1", "harbor-log", "text"),
      ev({ type: "retract", target: "r1", scope: "record", provenance: { chapter: "02-x", source: "repair" } }),
    ]);
    expect(liveRecords(t)).toHaveLength(0);
    expect(t.records.get("r1")!.status).toBe("retracted");
  });

  it("a chapter-scope retract retracts that chapter's records", () => {
    const t = project([
      rec("r1", "harbor-log", "text", { provenance: { chapter: "05-y", source: "drafter" } }),
      ev({ type: "retract", target: "05-y", scope: "chapter", provenance: { chapter: "05-y", source: "drafter" } }),
    ]);
    expect(liveRecords(t)).toHaveLength(0);
  });

  it("is deterministic — records appear in tablesToJSON, codepoint-sorted by id", () => {
    const events = [rec("r2", "b", "two"), rec("r1", "a", "one")];
    const out = tablesToJSON(project(events)).records as { id: string }[];
    expect(out.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(tablesToJSON(project(events))).toEqual(tablesToJSON(project(events)));
  });

  it("validateWriteInvariants rejects an oversized record text (>8KB)", () => {
    expect(() => validateWriteInvariants(rec("r1", "huge", "x".repeat(8193)))).toThrow(/8KB/);
    expect(() => validateWriteInvariants(rec("r2", "fine", "x".repeat(100)))).not.toThrow();
  });
});
