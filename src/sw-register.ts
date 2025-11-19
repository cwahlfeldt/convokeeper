/**
 * Service Worker Registration
 *
 * Registers the service worker for offline functionality and caching
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, show update notification
                  console.log('[SW] New version available! Refresh to update.');

                  // Optionally notify user (you can implement a custom UI for this)
                  if (confirm('A new version of ConvoKeep is available. Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Handle controller change (when a new service worker activates)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Service Worker controller changed, reloading page');
        window.location.reload();
      });
    });
  } else {
    console.warn('[SW] Service Workers are not supported in this browser');
  }
}
