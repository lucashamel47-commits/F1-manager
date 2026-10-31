import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// En production sur GitHub Pages l'app vit sous /F1-manager/ (voir .github/workflows/deploy.yml).
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // « prompt » : on prévient l'utilisateur quand une nouvelle version est prête (voir PwaStatus).
      registerType: 'prompt',
      manifest: {
        id: base,
        name: 'F1 Manager',
        short_name: 'F1 Manager',
        description: 'Classements, calendrier, circuits, statistiques et records de la Formule 1.',
        lang: 'fr',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'any',
        background_color: '#000000',
        theme_color: '#000000',
        categories: ['sports', 'entertainment'],
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Coquille de l'app (JS, CSS, HTML, icônes, photos des voitures) en précache → démarrage hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,jpeg,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 1024 * 1024,
        navigateFallback: `${base}index.html`,
        // Réception des notifications Web Push (public/push-sw.js), chargé par le service worker.
        importScripts: ['push-sw.js'],
        globIgnores: ['push-sw.js'],
        cleanupOutdatedCaches: true,
        clientsClaim: true, // le SW prend la main dès la 1re visite (la mise à jour, elle, attend le clic de l'utilisateur)
        runtimeCaching: [
          {
            // Données Jolpica (classements, résultats…) : on répond tout de suite avec le cache, puis on rafraîchit.
            urlPattern: ({ url }) => url.hostname === 'api.jolpi.ca',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'f1-api',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Plans de circuits, photos de GP et de pilotes (formula1.com) : cache d'abord.
            urlPattern: ({ url }) => url.hostname === 'media.formula1.com' || url.hostname.endsWith('.formula1.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'f1-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
