import { describe, it, expect } from "vitest";
import { WorldEventSchema } from "../src/world/schema.js";
import { project } from "../src/world/project.js";
import { latestKnowledge, dramaticIrony } from "../src/world/epistemic.js";

/**
 * M5.5 pilot — the epistemic layer against `the-contingency`'s REAL irony map
 * (from its brief). Not an agent-population run (that's the deferred workflow leg);
 * this proves the QUERY surfaces the book's actual reader-ahead gaps at the right
 * reading-order points, and — the negative control — does NOT manufacture irony
 * where the reader and a character share the same uncertainty.
 *
 * Discourse indices follow the 16-chapter Reyes/Brandt alternation:
 *   01 Reyes day-before · 02 Reyes work · 04 Brandt first chapter ·
 *   08 Brandt processing (the president's son is shown in formation) ·
 *   13 the send-off night roll call (the president reads the names aloud).
 */
const ev = (o: unknown) => WorldEventSchema.parse(o);
function learn(
  id: string,
  knower: string,
  prop: string,
  stance: string,
  discourseIndex: number,
  chapter: string,
  basis?: string
) {
  return ev({
    type: "knowledge.learn",
    id,
    knower,
    proposition: { prop },
    stance,
    asOf: { discourseIndex },
    ...(basis ? { basis } : {}),
    provenance: { chapter, source: "drafter" },
  });
}

const SON = "presidents-son-in-contingency";
const VANISHING = "contingency-is-a-vanishing-not-a-rescue";
const INTELLIGENT = "creature-is-intelligent";

// The book's epistemic map as the brief lays it out.
const events = [
  // The president's son: the reader sees him in Brandt's formation (08); the
  // president is unaware until he reads the name aloud at the roll call (13).
  learn("k-prez-unaware", "president", SON, "unaware", 1, "01-the-specimen"),
  learn("k-reader-son", "@reader", SON, "knows", 8, "08-processing", "witnessed"),
  learn("k-prez-knows", "president", SON, "knows", 13, "13-the-roll-call", "witnessed"),

  // Brandt believes the mission is humanity's last chance; the reader suspects from
  // the opening roll-call-as-vanishing that nothing returns. Never recanted.
  learn("k-reader-vanish", "@reader", VANISHING, "suspects", 1, "01-the-specimen"),
  learn("k-brandt-vanish", "brandt", VANISHING, "wrong_believes", 4, "04-voluntary"),

  // Negative control: the creature's intelligence stays unresolved — the reader and
  // Reyes share the same unprovable suspicion. No one is "behind".
  learn("k-reader-creature", "@reader", INTELLIGENT, "suspects", 2, "02-first-light"),
  learn("k-reyes-creature", "reyes", INTELLIGENT, "suspects", 2, "02-first-light"),
];

describe("the-contingency irony pilot", () => {
  it("during the approach (as of ch ~10), the president's-son gap is LIVE alongside Brandt's belief", () => {
    const gaps = dramaticIrony(project(events), 10);
    const props = gaps.map((g) => g.proposition).sort();
    expect(props).toEqual([`p=${VANISHING}`, `p=${SON}`].sort());

    const son = gaps.find((g) => g.proposition === `p=${SON}`)!;
    expect(son).toMatchObject({ readerStance: "knows", character: "president", characterStance: "unaware" });
    const brandt = gaps.find((g) => g.proposition === `p=${VANISHING}`)!;
    expect(brandt).toMatchObject({ readerStance: "suspects", character: "brandt", characterStance: "wrong_believes" });
  });

  it("the president's-son irony DIES at the roll call (he learns), but Brandt's belief endures", () => {
    const gaps = dramaticIrony(project(events), 14);
    expect(gaps.map((g) => g.proposition)).toEqual([`p=${VANISHING}`]); // son gap closed, vanishing still open
  });

  it("never manufactures irony where the reader and Reyes share the uncertainty (negative control)", () => {
    // No gap on the creature's intelligence at any point — Reyes suspects too, she is not behind.
    for (const asOf of [3, 10, 16]) {
      const creature = dramaticIrony(project(events), asOf).find((g) => g.proposition === `p=${INTELLIGENT}`);
      expect(creature).toBeUndefined();
    }
  });

  it("who_knows resolves the president's flip (latest-wins on real material)", () => {
    const t = project(events);
    const before = latestKnowledge(t, "president", 10).find((k) => k.proposition && "prop" in k.proposition && k.proposition.prop === SON);
    const after = latestKnowledge(t, "president", 14).find((k) => k.proposition && "prop" in k.proposition && k.proposition.prop === SON);
    expect(before?.stance).toBe("unaware"); // before the roll call
    expect(after?.stance).toBe("knows"); // after — the LATEST stance, not both
  });
});
