// Importé par le service worker généré par vite-plugin-pwa (voir vite.config.ts) : réception des notifications Web Push.
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'F1 Manager 🏁'
  const options = {
    body: data.body || 'Une session démarre bientôt.',
    icon: self.registration.scope + 'pwa-192x192.png',
    badge: self.registration.scope + 'pwa-192x192.png',
    tag: data.tag,
    data: { url: data.url || self.registration.scope },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus()
      return self.clients.openWindow(url)
    }),
  )
})
