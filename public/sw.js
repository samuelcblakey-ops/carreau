// Carreau service worker: makes the app installable and lets it open without a signal.
// Live data (scores, draws) always comes from Firebase, which keeps its own offline queue.
const VERSION = "__VERSION__";
const CACHE = "carreau-" + VERSION;
const SHELL = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest", "./qr.js", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon-32.png"];
const LIBS = ["firebase-app", "firebase-firestore", "firebase-auth"].map(n => `https://www.gstatic.com/firebasejs/__FBV__/${n}.js`);
// the Firebase libraries are fetched up front (best effort) so the app opens with no signal even on the second visit
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => Promise.all(LIBS.map(u => fetch(u).then(r => r.ok ? c.put(u, r) : null).catch(() => null))))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("carreau-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const staticCdn = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/") || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !staticCdn) return; // Firestore, sign-in etc. go straight to the network
  if (req.mode === "navigate" || (sameOrigin && /\/(index\.html)?$/.test(url.pathname))) {
    // page: newest version when online, cached copy when not
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  // versioned libraries, fonts, icons: cache first, refresh in the background
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
