// Service Worker for 我的计划日历
// Cache-first strategy for static assets, network-first for pages

const CACHE_NAME = 'plan-calendar-v1'
const STATIC_ASSETS = [
  '/',
  '/calendar',
  '/today',
  '/habits',
  '/insights',
  '/settings',
  '/login',
  '/manifest.json',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Individual cache failures shouldn't block installation
      })
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip browser extensions and non-http(s)
  if (!url.protocol.startsWith('http')) return

  // Skip Supabase API calls (always go to network)
  if (url.hostname.includes('supabase')) return

  // Skip auth and application API responses. These can contain user-specific
  // data and should rely on normal HTTP caching semantics.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('/auth/v1/')
  ) {
    return
  }

  const shouldCacheResponse = (response) => {
    if (!response || !response.ok) return false
    const cacheControl = response.headers.get('cache-control') || ''
    return !/(no-store|no-cache|private)/i.test(cacheControl)
  }

  // For navigation requests (pages), use network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a copy of the page for offline
          if (shouldCacheResponse(response)) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        .catch(() => {
          // Offline: try cache, then fallback
          return caches.match(request).then((cached) => {
            return cached || caches.match('/')
          })
        })
    )
    return
  }

  // For static assets (JS, CSS, images, fonts), cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/_next/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          // Update cache in background
          if (shouldCacheResponse(response)) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        return cached || fetchPromise
      })
    )
    return
  }

  // Default: network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (shouldCacheResponse(response)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
