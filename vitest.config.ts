import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/server/services/**/*.ts"],
      exclude: ["**/*.test.ts"],
      // Spec B6: 80%+ line coverage on the Service layer.
      thresholds: { lines: 80 },
    },
  },
});
