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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          recharts: ['recharts'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-separator', '@radix-ui/react-tooltip', '@radix-ui/react-dialog'],
        },
      },
    },
  },
});
