import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo192.png", "logo512.png"],
      workbox: {
        // FIX 1: Increase limit to 5MB so the build doesn't fail
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "Aerotive UAE Smart Approval",
        short_name: "Aerotive",
        description: "Aerotive UAE Smart Approval",
        theme_color: "#000000",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Note: You can keep your versioned aliases if strictly needed, 
      // but usually "@": path.resolve(__dirname, "./src") is enough.
    },
  },
  build: {
    target: "esnext",
    outDir: "build",
    // FIX 2: Split large libraries into their own files
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three")) return "vendor-three";
            if (id.includes("xlsx")) return "vendor-excel";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
            if (id.includes("recharts")) return "vendor-charts";
            if (id.includes("@mui") || id.includes("@emotion")) return "vendor-ui";
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
