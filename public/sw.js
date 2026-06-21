const CACHE = "aria-static-v1";
const IMMUTABLE = [
  "/manifest.json",
  "/window.svg",
  "/og.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(IMMUTABLE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls — network first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r ?? new Response(null, { status: 503 }))),
    );
    return;
  }

  // Static assets and pages — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchAndCache = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => cached ?? new Response(null, { status: 503 }));
      return cached ?? fetchAndCache;
    }),
  );
});
