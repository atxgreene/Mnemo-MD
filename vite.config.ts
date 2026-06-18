import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local-first PWA. No backend required for the first shipped version.
// `base` defaults to "/" for local dev; the GitHub Pages workflow sets
// VITE_BASE to "/<repo-name>/" so assets resolve under the project subpath.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  // strictPort keeps the dev server on 5173 so the Tauri shell (devUrl) attaches reliably.
  server: { port: 5173, strictPort: true },
  // Tauri reads build output from dist/ (configured in src-tauri/tauri.conf.json).
});
