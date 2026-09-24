/**
 * EXHALE — Service Worker Registration Helper
 * 
 * Registers the production Progressive Web App service worker.
 * Operates in production builds, and optionally in testing via `?sw=true`.
 * Never interferes with normal local development or throws unhandled rejections.
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const isExplicitTest = window.location.search.includes('sw=true');
    if (import.meta.env.PROD || isExplicitTest) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New cached content available for next session
                  }
                };
              }
            };
          })
          .catch((err) => {
            // Graceful non-blocking degradation
            if (isExplicitTest) {
              console.warn('[PWA] Service worker registration notice:', err);
            }
          });
      });
    }
  }
}
