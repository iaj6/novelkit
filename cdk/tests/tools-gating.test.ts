import { describe, it, expect } from "vitest";
import { buildToolServer } from "../src/tools.js";

const stubLog = { event: () => {} } as never;
const EPISTEMIC = ["record_knowledge", "who_knows", "dramatic_irony"];

describe("buildToolServer epistemic tool gating (FM2)", () => {
  it("excludes the epistemic tools when epistemic is off (default)", () => {
    const { allowedToolIds } = buildToolServer({ projectRoot: "/tmp/x", log: stubLog });
    for (const name of EPISTEMIC) {
      expect(allowedToolIds.some((id) => id.endsWith(`__${name}`))).toBe(false);
    }
    // the factual store tools stay available regardless
    expect(allowedToolIds.some((id) => id.endsWith("__assert_fact"))).toBe(true);
    expect(allowedToolIds.some((id) => id.endsWith("__query_facts"))).toBe(true);
  });

  it("includes the epistemic tools when epistemic is on", () => {
    const { allowedToolIds } = buildToolServer({ projectRoot: "/tmp/x", log: stubLog, epistemic: true });
    for (const name of EPISTEMIC) {
      expect(allowedToolIds.some((id) => id.endsWith(`__${name}`))).toBe(true);
    }
  });

  it("includes the M7 record tools (register_record/read_record) always — not epistemic-gated", () => {
    for (const epistemic of [false, true]) {
      const { allowedToolIds } = buildToolServer({ projectRoot: "/tmp/x", log: stubLog, epistemic });
      expect(allowedToolIds.some((id) => id.endsWith("__register_record"))).toBe(true);
      expect(allowedToolIds.some((id) => id.endsWith("__read_record"))).toBe(true);
    }
  });
});
