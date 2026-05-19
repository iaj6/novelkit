import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Tests should be fast — fail fast if anything takes more than a few seconds.
    testTimeout: 5_000,
    globals: false,
    coverage: {
      provider: "v8",
      // Measure coverage only on files where the testable surface is real
      // (pure logic, helpers, small filesystem wrappers). LLM-driven code
      // (phases, runAgent, conductor orchestrator) is exercised in
      // integration runs against the actual API, not in unit tests.
      include: [
        "src/ansi.ts",
        "src/runlog.ts",
        "src/estimate.ts",
        "src/state.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
