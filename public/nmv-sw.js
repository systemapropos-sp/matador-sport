// NMV Lottery — Service Worker v16.0 — SELF-UNREGISTER
// This SW was replaced by VitePWA's Workbox SW to prevent conflicts.
// On activation, it unregisters itself so only sw.js (Workbox) runs.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Delete all old NMV caches
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('nmv-') || k.startsWith('nmv-static'))
          .map((k) => {
            console.log('[NMV SW v16] Removing old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => {
      // Self-unregister this SW — Workbox sw.js handles everything
      console.log('[NMV SW v16] Self-unregistering (replaced by Workbox SW)');
      return self.registration.unregister();
    })
  );
});

// Pass all fetches through — don't intercept anything
