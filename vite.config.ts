import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

// NMV Lottery Vendor — PWA + Hashed Build
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // NO interceptar rutas de otros sub-sitios
        navigateFallbackDenylist: [/^\/admin/, /^\/cobrador/, /^\/numeros/],
        // Cache API requests for offline support
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/acvnyvsofwsatxqyjjfk\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'NMV Lottery Vendedor',
        short_name: 'NMV Vendedor',
        description: 'NMV Lottery – Sistema de Banca de Lotería',
        theme_color: '#0D9488',
        background_color: '#0D9488',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          {
            name: 'Nueva Venta',
            short_name: 'Vender',
            url: '/betting-pool/ticket/create',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: ['es2020', 'chrome80', 'firefox80', 'safari14'],
    assetsInlineLimit: 10240,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase':     ['@supabase/supabase-js'],
        },
      },
    },
  },
})
