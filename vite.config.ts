import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local-first PWA. No backend required for the first shipped version.
// `base` defaults to "/" for local dev; the GitHub Pages workflow sets
// VITE_BASE to "/<repo-name>/" so assets resolve under the project subpath.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: { port: 5173 },
});
