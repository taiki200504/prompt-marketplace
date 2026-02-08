// PromptMarket Service Worker
const CACHE_NAME = 'promptmarket-v2'
const STATIC_CACHE_NAME = 'promptmarket-static-v2'
const DYNAMIC_CACHE_NAME = 'promptmarket-dynamic-v2'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/prompts',
  '/login',
  '/signup',
  '/offline',
  '/manifest.json',
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('promptmarket-') && 
                   name !== STATIC_CACHE_NAME && 
                   name !== DYNAMIC_CACHE_NAME
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Take control of all pages immediately
  return self.clients.claim()
})

// Fetch event - Network first for API, Cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Next.js hashed build assets - Network first to avoid stale cache after deploy
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Other static assets (images, icons) - Cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // HTML pages - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request))
})

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Cache first failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Network first failed, trying cache:', error)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Return offline page if both cache and network fail
    return caches.match('/offline')
  })

  return cachedResponse || fetchPromise
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: '開く' },
      { action: 'close', title: '閉じる' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites())
  }
  if (event.tag === 'sync-result-logs') {
    event.waitUntil(syncResultLogs())
  }
})

async function syncFavorites() {
  // Sync queued favorite actions when back online
  const queue = await getQueue('favorites')
  for (const item of queue) {
    try {
      await fetch('/api/prompts/' + item.promptId + '/favorite', {
        method: item.action === 'add' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      await removeFromQueue('favorites', item.id)
    } catch (error) {
      console.log('[SW] Sync failed for favorite:', error)
    }
  }
}

async function syncResultLogs() {
  // Sync queued result logs when back online
  const queue = await getQueue('result-logs')
  for (const item of queue) {
    try {
      await fetch('/api/prompts/' + item.promptId + '/result-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      })
      await removeFromQueue('result-logs', item.id)
    } catch (error) {
      console.log('[SW] Sync failed for result log:', error)
    }
  }
}

// Queue helpers using IndexedDB
async function getQueue(_storeName) {
  // Simplified - in production, use IndexedDB
  return []
}

async function removeFromQueue(_storeName, _id) {
  // Simplified - in production, use IndexedDB
}

console.log('[SW] Service Worker loaded')
