// service-worker.js — Kitap Kutusu PWA
const CACHE = "kitap-kutusu-v1";
const ASSETS = [
  "/bybookcase/",
  "/bybookcase/index.html",
  "/bybookcase/style.css",
  "/bybookcase/app.js",
  "/bybookcase/manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // Firebase ve Google isteklerini cache'leme, direkt geçir
  if (e.request.url.includes("firebase") ||
      e.request.url.includes("google") ||
      e.request.url.includes("gstatic")) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
