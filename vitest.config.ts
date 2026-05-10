import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "hooks/**/*.test.ts", "components/**/*.test.tsx"],
    exclude: ["node_modules", "e2e", ".next", "playwright-report", "test-results"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
