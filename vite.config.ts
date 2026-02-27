import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/__fatec_proxy": {
        target: "https://www.fatecmaua.com.br",
        changeOrigin: true,
        secure: true,
        rewrite: (pathValue) => pathValue.replace(/^\/__fatec_proxy/, ""),
      },
      // proxy for ARInter news when running in development to avoid CORS
      "/__arinter_proxy": {
        target: "https://arinter.cps.sp.gov.br",
        changeOrigin: true,
        secure: true,
        rewrite: (pathValue) => pathValue.replace(/^\/__arinter_proxy/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
