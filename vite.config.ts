import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Chemin de base de l'app :
// - Vercel et local : « / » (Vercel définit VERCEL=1 ; on n'impose pas de sous-chemin).
// - GitHub Pages : « /F1-manager/ », fourni par VITE_BASE dans .github/workflows/deploy.yml.
const base = process.env.VITE_BASE || '/'
// Version jointe aux messages du support : commit (GitHub Actions) + date du build.
const appVersion = `${(process.env.GITHUB_SHA ?? 'local').slice(0, 7)} · ${new Date().toISOString().slice(0, 10)}`

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
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
        background_color: '#08090a',
        theme_color: '#08090a',
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
        // Coquille de l'app (JS, CSS, HTML, icônes) en précache → démarrage hors ligne.
        // Supabase, OpenF1 et le direct F1 (livetiming.formula1.com) sont sur d'autres domaines : jamais précachés.
        globPatterns: ['**/*.{js,css,html,svg,png,jpeg,ico,webmanifest,woff2}', 'replay/*.json'],
        maximumFileSizeToCacheInBytes: 1024 * 1024,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
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
            // Photos et plans uniquement. Pas livetiming.formula1.com (flux live).
            urlPattern: ({ url }) => url.hostname === 'media.formula1.com',
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
