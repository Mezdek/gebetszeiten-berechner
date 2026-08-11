import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  // Inlines JS/CSS into one HTML file so a module script never needs a
  // cross-file fetch — the app must also run opened directly from disk,
  // where browsers block fetching separate `type="module"` files over file://.
  plugins: [viteSingleFile()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
