import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import path from "path"

// cache-bust: 2026-04-08-2103
export default defineConfig({
  logLevel: "error",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

