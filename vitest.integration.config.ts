import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/** Integration suite: real Postgres via DATABASE_URL (a migrated test database). */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    setupFiles: ["./vitest.integration.setup.ts"],
  },
});
