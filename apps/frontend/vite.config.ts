import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173,
    allowedHosts: [
      "frontend-production-219b.up.railway.app",
      "dailyrepo-9rgp.onrender.com",
      "www.dailyrepo.tianpai.io",
      ".railway.app",
      ".tianpai.io",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          recharts: ["recharts"],
          ui: [
            "@radix-ui/react-slot",
            "@radix-ui/react-separator",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-dialog",
          ],
        },
      },
    },
  },
});
