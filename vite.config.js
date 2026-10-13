import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs so the build works from a GitHub Pages subpath.
  base: "./",
  // Pyodide locates its runtime files itself; pre-bundling breaks that.
  optimizeDeps: { exclude: ["pyodide"] },
});
