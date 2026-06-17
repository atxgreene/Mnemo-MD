import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local-first PWA. No backend required for the first shipped version.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
