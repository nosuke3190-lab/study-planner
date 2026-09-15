/* Mindeck の Service Worker。オフラインでの起動と Web Push の受け取りを担う */
const VERSION = 'mindeck-v1'
const SCOPE = self.registration.scope
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL.map((p) => new URL(p, SCOPE).href)))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(new URL('./index.html', SCOPE).href)),
    )
    return
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const live = fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => undefined)
          }
          return res
        })
        .catch(() => hit)
      return hit || live
    }),
  )
})

self.addEventListener('push', (event) => {
  let data = { title: 'Mindeck', body: '', tag: 'mindeck' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    if (event.data) data.body = event.data.text()
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: new URL('./icon-192.png', SCOPE).href,
      badge: new URL('./icon-192.png', SCOPE).href,
      data: { url: SCOPE },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || SCOPE
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(SCOPE) && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
