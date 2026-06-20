/**
 * sw.js — Prithvi Service Worker (manual fallback)
 * next-pwa generates the primary sw.js in production mode.
 * This file is a lightweight offline-first fallback that:
 * - Caches app shell on install
 * - Serves cached content on fetch
 * - Handles background sync for queued actions
 */

const CACHE_NAME = 'prithvi-v1'
const OFFLINE_URL = '/'

const APP_SHELL = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon.svg',
]

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// ─── Fetch — Network-First with Cache Fallback ─────────────────────────────

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  // Skip non-GET requests (POST/PUT handled via IndexedDB sync queue)
  if (event.request.method !== 'GET') return

  // Skip Next.js internal routes
  if (event.request.url.includes('/_next/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL)
        })
      })
  )
})

// ─── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'prithvi-sync') {
    event.waitUntil(
      // Notify all clients to trigger their manualSync
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGERED' })
        })
      })
    )
  }
})

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Prithvi Reminder'
  const body  = data.body  || "Don't forget to log today's activities."

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'prithvi-daily',
      renotify: false,
      data: { url: data.url || '/dashboard/track' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((c) => c.url.includes(self.location.origin))
      if (existingClient) return existingClient.focus()
      return self.clients.openWindow(url)
    })
  )
})
