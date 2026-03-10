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
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt'],
      manifest: false, // Disable static manifest - using dynamic manifest from edge function
       injectRegister: 'auto',
      workbox: {
        // CRITICAL: Force new SW to take control immediately
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        
        // Allow larger JS bundles to be precached (default is 2MB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        
        // Cache versioning - increment this to bust all caches
        cacheId: 'pwa-v9',
        
        // IMPORTANT: Only cache hashed/versioned static assets
           globPatterns: ['**/*.{js,css,ico,woff2,mp3}'],
        
        // DO NOT precache HTML - use NetworkFirst for documents
        navigateFallback: null, // Disable navigateFallback to prevent stale HTML
         
        // Import the push notification handlers
        importScripts: ['/sw-push.js'],
        
        runtimeCaching: [
          // ============================================
          // DOCUMENTS (HTML) - ALWAYS NETWORK FIRST
          // ============================================
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache-v9',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60, // 1 hour max
              },
            },
          },
          
          // ============================================
          // API/DATA - NEVER CACHE
          // ============================================
          {
            // Supabase REST API - NEVER cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Auth calls - NEVER cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Edge functions (including manifest) - NEVER cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: 'NetworkOnly',
          },
          
          // ============================================
          // PWA ICONS - NEVER SERVE STALE (root cause of old icon bug)
          // ============================================
          {
            // App icons from storage - ALWAYS fetch fresh from network
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*\/app-icons\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-icons-cache-v9',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour max
              },
            },
          },
          
          // ============================================
          // ASSETS - CACHE WITH REVALIDATION
          // ============================================
          {
            // Storage images (excluding app-icons handled above)
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'storage-cache-v9',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 4, // 4 hours
              },
            },
          },
          {
            // Local images - cache with revalidation
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache-v9',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
          {
            // Fonts - cache first (rarely change)
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache-v9',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
           {
             // Sound files - cache first for instant playback
             urlPattern: /\.(?:mp3|wav|ogg)$/i,
             handler: 'CacheFirst',
             options: {
               cacheName: 'sounds-cache-v9',
               expiration: {
                 maxEntries: 20,
                 maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
               },
             },
           },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
