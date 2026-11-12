// Network first, so content stays current; the cache only serves offline visits.
const CACHE = "mykiez-v4"; // v4 (2026-11-13): sponsor sizes, story rules; v3 (2026-11-11): dropped outdated sponsor links
const SHELL = ["/", "/styles.css", "/styles-extended.css", "/data.js", "/data-extended.js", "/app.js", "/app-extended.js", "/app-parity.js", "/assets/images/mykiez_logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
