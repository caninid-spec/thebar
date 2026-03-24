/* ═══════════════════════════════════════════════════════════════════════
   sw.js  –  Service Worker per The Bar PWA
   Strategia: Cache-first per asset statici, Network-first per HTML,
              Stale-while-revalidate per Google Fonts
═══════════════════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'thebar-v1';
const FONTS_CACHE   = 'thebar-fonts-v1';
const OFFLINE_PAGE  = 'offline.html';

const PRECACHE_ASSETS = [
  // Pagine
  'index.html',
  'category.html',
  'cocktail-all.html',
  'cocktail-finder.html',
  'cocktail-recipe.html',
  'search-results.html',
  'offline.html',

  // CSS
  'core.css',
  'components.css',
  'home-style.css',
  'recipe-style.css',
  'finder-style.css',
  'category-style.css',
  'search-results.css',
  'all-style.css',

  // JavaScript
  'config.js',
  'search-index.js',
  'search-filter.js',
  'cocktails-data.js',

  // Dati
  'cocktails-data.json',

  // Manifest e icone
  'manifest.json',
  'thebar192.png',
  'thebar512.png',
];

/* ── INSTALL: pre-caching di tutti gli asset ── */
self.addEventListener('install', event => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching assets');
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Failed to cache: ${url}`, err))
        )
      );
    }).then(() => {
      console.log('[SW] Install complete');
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE: pulizia vecchie cache ── */
self.addEventListener('activate', event => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== FONTS_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: strategia per tipo di risorsa ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET
  if (request.method !== 'GET') return;

  // Google Fonts: stale-while-revalidate (cache separata)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS_CACHE));
    return;
  }

  // Ignora altre richieste cross-origin
  if (url.origin !== self.location.origin) return;

  // File HTML: Network-first con fallback cache → offline.html
  if (request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // Tutto il resto (CSS, JS, immagini, JSON, dati): Cache-first
  event.respondWith(cacheFirst(request));
});

/* ── Cache-first ── */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/* ── Network-first con fallback a cache e offline.html ── */
async function networkFirstHTML(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }
  } catch { /* offline */ }

  const cached = await caches.match(request);
  if (cached) return cached;

  const offlinePage = await caches.match(OFFLINE_PAGE);
  return offlinePage || new Response('<h1>Offline</h1>', {
    headers: { 'Content-Type': 'text/html' }
  });
}

/* ── Stale-while-revalidate (usato per Google Fonts) ── */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('', { status: 408 });
}

/* ── Messaggi dal client (aggiornamento forzato) ── */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION')
    event.ports[0]?.postMessage({ version: CACHE_NAME });
});
