import { generateSW } from 'workbox-build';

generateSW({
  swDest: 'dist/service-worker.js',
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,png,svg,ico,webmanifest,wasm}'],
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|svg|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});
