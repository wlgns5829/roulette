import { generateSW } from 'workbox-build';

generateSW({
  swDest: 'dist/service-worker.js',
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,png,svg,ico,webmanifest,wasm}'],
  skipWaiting: true,
  clientsClaim: true,
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
    {
      urlPattern: /\.(?:js|css|html|webmanifest|wasm)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    },
  ],
});
