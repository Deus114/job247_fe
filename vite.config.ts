import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || "/";
  const backendUrl = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL || "";
  const useMock = env.VITE_USE_MOCK === "true" || !backendUrl;

  return {
    define: {
      __BASE_PATH__: JSON.stringify(base),
    },
    plugins: [react()],
    base,
    build: {
      sourcemap: mode !== "production",
      outDir: "out",
    },
    resolve: {
      alias: {
        "@": resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: useMock
        ? undefined
        : {
            "/api": {
              target: backendUrl,
              changeOrigin: true,
            },
          },
    },
  };
});
