import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["shared/**/*.test.ts", "server/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@shared": new URL("./shared", import.meta.url).pathname },
  },
});
