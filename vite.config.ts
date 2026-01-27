import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Psycho-Cinematics™ | The Director\'s OS',
        short_name: 'Director OS',
        description: 'Transform your identity with the Psycho-Cinematics™ framework. Build your Mind Movie. Become the Director of your life.',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'any', // Allow landscape rotation for Theater immersion
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Skip waiting and claim clients immediately for faster updates
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // CRITICAL: never cache media streams.
            // Caching video/audio responses breaks HTTP Range (206) playback on iOS
            // and causes freezes/crashes when the player tries to seek/pause.
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // CRITICAL: never cache the range-safe video proxy.
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/video-proxy(\?.*)?$/i,
            handler: 'NetworkOnly',
          },
          {
            // Cache only API-like requests (NOT storage/media)
            urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth|functions)\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
