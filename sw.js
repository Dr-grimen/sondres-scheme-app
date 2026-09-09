/* Sondres scheme – service worker.
   Skalet (html/css/js/vendor/ikon) blir cacha ved installasjon. Data (data/*.json og *.enc)
   blir henta frå nettet fyrst, og siste kjende versjon blir brukt om nettet er borte, slik at
   appen alltid viser den siste tilstanden han såg – og seier kor gammal han er. */
// VERSJON blir sett automatisk til innhaldssummen av skalet når appen blir publisert
// (scheme/app/publish.py -> stempl_sw). Rør han ikkje for hand.
const VERSJON = 'scheme-d0cefba9e857';
const SKAL = [
  './', './index.html', './manifest.json', './css/app.css',
  './js/app.js', './js/data.js', './js/ui.js', './js/brain3d.js',
  './js/sider/oversikt.js', './js/sider/hjernen.js', './js/sider/turnering.js', './js/sider/papir.js', './js/sider/sanning.js',
  './js/sider/selskapet.js', './js/sider/innlogging.js', './js/sider/provebane.js', './js/sider/avl.js', './js/sider/eksamen.js', './js/sider/stresslab.js', './js/sider/kunnskap.js', './js/sider/meklarar.js', './js/sider/uttak.js', './js/sider/rapportar.js',
  './js/sider/skann.js', './js/sider/nivaa.js', './js/sider/varsel.js',
  './vendor/preact.module.js', './vendor/preact-hooks.module.js', './vendor/htm.module.js',
  './vendor/three.module.min.js', './vendor/OrbitControls.js',
  './ikon/ikon-192.png', './ikon/ikon-512.png', './ikon/ikon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSJON).then((c) => c.addAll(SKAL).catch(() => null)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSJON).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;   // utvikling: aldri cache

  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const erData = url.pathname.includes('/data/');
  if (erData) {
    // nett fyrst, cache som reserve
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok) caches.open(VERSJON).then((c) => c.put(e.request, r.clone()));
      return r;
    }).catch(() => caches.match(e.request)));
  } else {
    // skal: cache fyrst, oppdater i bakgrunnen
    e.respondWith(caches.match(e.request).then((hit) => {
      const nett = fetch(e.request).then((r) => { if (r.ok) caches.open(VERSJON).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => hit);
      return hit || nett;
    }));
  }
});
