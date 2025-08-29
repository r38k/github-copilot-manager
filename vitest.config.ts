import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Run in a single process to satisfy sandbox restrictions
    threads: false,
    watch: false,
    include: [
      "src/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
  },
});
