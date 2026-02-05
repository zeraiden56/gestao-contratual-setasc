import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3002,
    allowedHosts: [
      "setasc.blucaju.com.br",
      ".blucaju.com.br",
      "localhost"
    ]
  },
  build: {
    outDir: "dist",
    minify: "esbuild",
    sourcemap: false,
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [react()]
});
