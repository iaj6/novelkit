import { describe, it, expect } from "vitest";
import { WorldEventSchema } from "../src/world/schema.js";
import { project } from "../src/world/project.js";
import { latestKnowledge, dramaticIrony, propKey } from "../src/world/epistemic.js";

const ev = (o: unknown) => WorldEventSchema.parse(o);

function learn(
  id: string,
  knower: string,
  prop: string | { factRef: string } | { prop: string },
  stance: string,
  discourseIndex: number,
  extra: Record<string, unknown> = {}
) {
  return ev({
    type: "knowledge.learn",
    id,
    knower,
    proposition: typeof prop === "string" ? { prop } : prop,
    stance,
    asOf: { discourseIndex },
    provenance: { chapter: `${String(discourseIndex).padStart(2, "0")}-x`, source: "drafter" },
    ...extra,
  });
}

describe("latestKnowledge (who_knows latest-wins fix)", () => {
  it("returns the LATEST stance per proposition, not the full history", () => {
    const t = project([
      learn("k1", "reyes", "creature-intelligent", "suspects", 10),
      learn("k2", "reyes", "creature-intelligent", "knows", 13),
    ]);
    const latest = latestKnowledge(t, "reyes", 15);
    expect(latest).toHaveLength(1);
    expect(latest[0].stance).toBe("knows");
  });

  it("respects the as-of horizon", () => {
    const t = project([
      learn("k1", "reyes", "creature-intelligent", "suspects", 10),
      learn("k2", "reyes", "creature-intelligent", "knows", 13),
    ]);
    expect(latestKnowledge(t, "reyes", 11)[0].stance).toBe("suspects"); // ch13 not yet reached
    expect(latestKnowledge(t, "reyes", 9)).toHaveLength(0); // nothing yet
  });
});

describe("dramaticIrony", () => {
  it("detects a reader-ahead-of-character gap (reader knows, character unaware)", () => {
    const t = project([
      learn("k1", "@reader", "creature-intelligent", "knows", 7, { basis: "witnessed" }),
      learn("k2", "brandt", "creature-intelligent", "unaware", 8),
    ]);
    const gaps = dramaticIrony(t, 14);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({
      readerStance: "knows",
      character: "brandt",
      characterStance: "unaware",
    });
  });

  it("closes the gap once the character catches up (latest stance wins)", () => {
    const t = project([
      learn("k1", "@reader", "creature-intelligent", "knows", 7),
      learn("k2", "brandt", "creature-intelligent", "unaware", 8),
      learn("k3", "brandt", "creature-intelligent", "knows", 13),
    ]);
    expect(dramaticIrony(t, 14)).toEqual([]); // brandt now knows
    expect(dramaticIrony(t, 10)).toHaveLength(1); // but as of ch10, brandt was still unaware
  });

  it("no gap when the reader is also unaware", () => {
    const t = project([
      learn("k1", "@reader", "creature-intelligent", "unaware", 7),
      learn("k2", "brandt", "creature-intelligent", "unaware", 8),
    ]);
    expect(dramaticIrony(t, 14)).toEqual([]);
  });

  it("flags wrong_believes as a gap (character actively mistaken)", () => {
    const t = project([
      learn("k1", "@reader", "the-vault-is-empty", "knows", 5),
      learn("k2", "mara", "the-vault-is-empty", "wrong_believes", 6),
    ]);
    const gaps = dramaticIrony(t, 9);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].characterStance).toBe("wrong_believes");
  });

  it("is deterministic and sorted by proposition then character (independent of ingestion order)", () => {
    // events deliberately NOT in sorted order
    const events = [
      learn("k4", "reyes", "p2", "wrong_believes", 6),
      learn("k3", "@reader", "p2", "suspects", 5),
      learn("k2", "brandt", "p1", "unaware", 6),
      learn("k1", "@reader", "p1", "knows", 5),
    ];
    const a = dramaticIrony(project(events), 10);
    const b = dramaticIrony(project(events), 10);
    expect(a).toEqual(b);
    expect(a.map((g) => g.proposition)).toEqual(["p=p1", "p=p2"]); // sorted regardless of ingestion order
  });

  it("treats reader 'believes' as reader-ahead (aligned with the drafter's reveal menu)", () => {
    const t = project([
      learn("k1", "@reader", "the-locket-is-fake", "believes", 5),
      learn("k2", "nadia", "the-locket-is-fake", "unaware", 6),
    ]);
    const gaps = dramaticIrony(t, 9);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({ readerStance: "believes", character: "nadia", characterStance: "unaware" });
  });

  it("sorts multiple characters behind on the same proposition by character id", () => {
    const t = project([
      learn("k1", "@reader", "p1", "knows", 5),
      learn("k2", "zara", "p1", "unaware", 6),
      learn("k3", "amir", "p1", "wrong_believes", 6),
    ]);
    expect(dramaticIrony(t, 9).map((g) => g.character)).toEqual(["amir", "zara"]); // tiebreak by character
  });

  it("exposes a human-readable proposition (no p=/f= key prefix) for the tool", () => {
    const t = project([
      learn("k1", "@reader", "the-vault-is-empty", "knows", 5),
      learn("k2", "mara", "the-vault-is-empty", "unaware", 6),
    ]);
    const g = dramaticIrony(t, 9)[0];
    expect(g.proposition).toBe("p=the-vault-is-empty"); // internal key (sort/dedup)
    expect(g.readable).toBe("the-vault-is-empty"); // model-facing
  });
});

describe("propKey", () => {
  it("keys prop and factRef distinctly", () => {
    expect(propKey({ prop: "x" })).toBe("p=x");
    expect(propKey({ factRef: "f1" })).toBe("f=f1");
  });
});
