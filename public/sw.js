// Service worker v4 — passive, no caching, no interception.
// Prevents stale chunk errors from old cached service workers.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});
// Do NOT intercept fetch — let the browser handle everything.
