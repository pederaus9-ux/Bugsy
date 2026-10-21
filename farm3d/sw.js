// Keeps the 3D game on the phone so it opens quickly and plays offline.
// (Named "sa3d-" so the 2D game's own clean-up never touches it.)
const CACHE = "sa3d-v60";
const SHELL = ["./","index.html","farm-land.js?v=1","farm-path.js?v=1","seasonal-leaves.js?v=1","holiday-decor.js?v=1","decor-models.js?v=1","utility-lights.js?v=1","market-sales.js?v=1","cow-care.js?v=1","cow-yard.js?v=3","cow-stations.js?v=1","animal-stations.js?v=1","chicken-stations.js?v=4","animal-care-poses.js?v=2","chicken-care.js?v=2","chicken-yard.js?v=4","player-motion.js?v=1","player-arm-attachment.js?v=1","scene-polish.js?v=2","features.js?v=1","phase7m.js?v=4","game.js?v=30","analytics.js?v=3","perf.js?v=1","cow3d.js?v=5","live3d.js?v=3","sheep3d.js","horse3d.js","dog3d.js","cat3d.js","chicken3d.js?v=1","farmer3d.js","quadruped3d.js","characters3d.html","manifest.webmanifest","lib/three.module.min.js","lib/three.core.min.js","art/authored-hands.js?v=2","assets/hands/hands-candidate.glb?v=2","lib/addons/loaders/GLTFLoader.js","lib/addons/utils/BufferGeometryUtils.js","lib/addons/utils/SkeletonUtils.js","auth.js?v=19","canon.js?v=1","friends.js?v=7","horse-ik3d.js","horse-stance3d.js","lib/addons/postprocessing/EffectComposer.js","lib/addons/postprocessing/MaskPass.js","lib/addons/postprocessing/OutputPass.js","lib/addons/postprocessing/Pass.js","lib/addons/postprocessing/RenderPass.js","lib/addons/postprocessing/ShaderPass.js","lib/addons/postprocessing/UnrealBloomPass.js","lib/addons/shaders/CopyShader.js","lib/addons/shaders/LuminosityHighPassShader.js","lib/addons/shaders/OutputShader.js","verified.js?v=1"];


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
  const heavy = /\/(lib|art|tex|assets)\//.test(url.pathname);
  const fromNet = () => fetch(e.request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; });
  e.respondWith(heavy
    ? caches.match(e.request).then((hit) => { const net = fromNet().catch(() => hit); return hit || net; })
    : fromNet().catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});
