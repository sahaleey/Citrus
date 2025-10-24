import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": "https://citrus-c209.onrender.com",
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "icons/icon-192x192.png",
        "icons/icon-512x512.png",
      ], // Added icons folder
      manifest: {
        name: "Citrus Restaurant QR Menu", // Updated name
        short_name: "Citrus Menu", // Updated name
        start_url: "/menu?table=default", // Safer default start_url
        display: "standalone",
        background_color: "#f8f9fa", // Using our --background-color
        theme_color: "#399c6c", // <-- THE FIX: Matched to our primary theme color
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
