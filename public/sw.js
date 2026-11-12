// Minimal, hand-written service worker (no Workbox/next-pwa) so behavior
// stays simple and auditable.
//
// Strategy:
// - API requests and cross-origin requests are never intercepted — this is
//   a financial app, so budgets/transactions/goals must always come from
//   the network, never a stale cache.
// - Build files under /_next/static/ and the app icons: cache-first. Their
//   names change whenever their content does, so a cached copy is never stale.
// - Everything else (page navigations, and the page data Next.js fetches when
//   moving between pages): network-first, falling back to a cached copy, then
//   to /offline.html. Serving these from the cache first showed old pages,
//   with old settings, after a new deploy.

// bumping this clears every older cache when the new worker activates
const CACHE_VERSION = "v2";
const RUNTIME_CACHE = `fincoach-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/manifest.json", "/icons/icon-192.png"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== RUNTIME_CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

const isUnchangingFile = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

const saveCopy = (request, response) => {
  if (response.ok) {
    const copy = response.clone();
    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (isUnchangingFile(url)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => saveCopy(request, response))));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => saveCopy(request, response))
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || (request.mode === "navigate" ? caches.match(OFFLINE_URL) : Response.error()))
      )
  );
});
