// vite.config.ts
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  build: {
    rollupOptions: { external: ["socket:stream"] },
    // Don't minify the output
    minify: false,
  },
  plugins: [topLevelAwait(), wasm()],
  worker: {
    plugins: () => [topLevelAwait(), wasm()],
  },
});
