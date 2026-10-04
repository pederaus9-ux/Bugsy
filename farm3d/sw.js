// Keeps the 3D game on the phone so it opens quickly and plays offline.
// (Named "sa3d-" so the 2D game's own clean-up never touches it.)
const CACHE = "sa3d-v38";
const SHELL = ["./", "index.html", "scene-polish.js?v=1", "features.js?v=1", "phase7m.js?v=2", "game.js?v=25", "analytics.js?v=3", "perf.js?v=1", "cow3d.js?v=2", "live3d.js?v=2", "sheep3d.js", "horse3d.js", "dog3d.js", "cat3d.js", "chicken3d.js", "farmer3d.js", "quadruped3d.js", "characters3d.html", "manifest.webmanifest", "lib/three.module.min.js", "lib/three.core.min.js"];


self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("sa3d-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// The page and its code: network first, so updates show up right away. Pictures, textures and the 3D engine: from the phone first
// (they rarely change), refreshed in the background.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  const heavy = /\/(lib|art|tex)\//.test(url.pathname);
  const fromNet = () => fetch(e.request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; });
  e.respondWith(heavy
    ? caches.match(e.request).then((hit) => { const net = fromNet().catch(() => hit); return hit || net; })
    : fromNet().catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});
