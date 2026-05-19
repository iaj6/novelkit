import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 5_000,
    globals: false,
    // library.ts uses import.meta.env.BASE_URL — provide a default for tests
    // so url() and artifactUrl() resolve consistently.
    env: {
      BASE_URL: "/novelkit/",
    },
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
