/* ═══════════════════════════════════════════════════════════════════════
   sw.js  –  Service Worker per The Bar PWA
   Strategia: Cache-first per tutto (asset statici + HTML),
              Stale-while-revalidate per Google Fonts
   Fix offline: URL normalizzati, cache-first anche per HTML,
                match con ignoreSearch per pagine con query string
═══════════════════════════════════════════════════════════════════════ */

const CACHE_NAME   = 'thebar-v2';   // versione incrementata per forzare re-install
const FONTS_CACHE  = 'thebar-fonts-v1';
const OFFLINE_PAGE = 'offline.html';

const PRECACHE_ASSETS = [
  // Pagine
  './',
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
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching assets');
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(new Request(url, { cache: 'reload' }))
            .catch(err => console.warn('[SW] Failed to cache:', url, err))
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
  console.log('[SW] Activating...');
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

  // Tutto il resto: Cache-first con fallback rete -> offline.html per HTML
  event.respondWith(cacheFirst(request, url));
});

/* ── Cache-first (HTML, CSS, JS, JSON, immagini) ── */
async function cacheFirst(request, url) {
  // Per le pagine HTML usa ignoreSearch: true
  // cosi' category.html?name=aperitivi trova category.html in cache
  const isHTML = request.headers.get('accept')?.includes('text/html')
              || url.pathname.endsWith('.html')
              || url.pathname === '/'
              || url.pathname === '';

  const cached = await caches.match(request, { ignoreSearch: isHTML });
  if (cached) return cached;

  // Non in cache: prova la rete
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline e non in cache
    if (isHTML) {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      return offlinePage || new Response('<h1>Offline</h1>', {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/* ── Stale-while-revalidate (Google Fonts) ── */
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
