import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // allow runtime access to the API base URL; in dev proxy will handle /api requests
    "process.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL || "http://localhost:3000/api"),
  },
}));
