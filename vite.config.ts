import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { docsWatcherPlugin } from "./src/infrastructure/vite-requirements-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), docsWatcherPlugin()],
  root: ".",
  build: {
    outDir: "dist-ui",
  },
});
