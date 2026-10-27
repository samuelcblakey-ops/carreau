// Carreau service worker: makes the app installable and lets it open without a signal.
// Live data (scores, draws) always comes from Firebase, which keeps its own offline queue.
const VERSION = "__VERSION__";
const CACHE = "carreau-" + VERSION;
const SHELL = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest", "./qr.js", "./privacy.html", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon-32.png"];
const FONTS = ["barlow-400", "barlow-500", "barlow-600", "barlowcondensed-500", "barlowcondensed-600", "barlowcondensed-700"].flatMap(n => [`./fonts/${n}-latin.woff2`, `./fonts/${n}-latin-ext.woff2`]);
const LIBS = ["firebase-app", "firebase-firestore", "firebase-auth"].map(n => `https://www.gstatic.com/firebasejs/__FBV__/${n}.js`).concat(FONTS);
// each language is its own file and the page fetches only the one it shows; a new version also fetches the ones this
// phone used before, so it still opens in its own language with no signal
const LANG_FILES = __LANGS__;
async function usedLangs() {
  const used = new Set();
  for (const k of await caches.keys()) if (k.startsWith("carreau-") && k !== CACHE)
    for (const r of await (await caches.open(k)).keys()) { const m = new URL(r.url).pathname.match(/\/lang\/([a-z]+)-[0-9a-f]+\.json$/); if (m && LANG_FILES[m[1]]) used.add("./lang/" + LANG_FILES[m[1]]); }
  return [...used];
}
// the Firebase libraries and fonts are fetched up front (best effort) so the app opens with no signal even on the second visit
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(usedLangs).then(langs => Promise.all(LIBS.concat(langs).map(u => fetch(u).then(r => r.ok ? c.put(u, r) : null).catch(() => null))))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("carreau-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const staticCdn = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  if (!sameOrigin && !staticCdn) return; // Firestore, sign-in etc. go straight to the network
  if (sameOrigin && url.pathname.includes("/videos/")) return; // guide videos stream from the network, never cached
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
