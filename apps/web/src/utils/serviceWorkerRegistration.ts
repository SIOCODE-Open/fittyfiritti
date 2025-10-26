/**
 * Service Worker Registration Utility
 * Handles PWA service worker registration and lifecycle
 */

export const registerServiceWorker = async (): Promise<void> => {
  // Skip service worker registration in development mode to avoid caching issues
  // that interfere with hot module reloading (HMR)
  if (import.meta.env.DEV) {
    console.log(
      'Development mode detected, skipping service worker registration'
    )
    return
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('Service Worker registered successfully:', registration)

      // Check for updates on page load
      registration.update()

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available, prompt user to reload
              console.log('New service worker available, reload to update')
              // You could show a notification here to the user
              if (
                confirm(
                  'New version available! Reload to update the application?'
                )
              ) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }
            }
          })
        }
      })

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed, reloading...')
        window.location.reload()
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  } else {
    console.log('Service Workers are not supported in this browser')
  }
}

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.unregister()
      console.log('Service Worker unregistered successfully')
    } catch (error) {
      console.error('Service Worker unregistration failed:', error)
    }
  }
}
