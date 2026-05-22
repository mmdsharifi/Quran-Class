const CACHE_NAME = 'quclass-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper for Range requests (required for Safari/Chrome audio caching)
async function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return cachedResponse;
  }

  try {
    const arrayBuffer = await cachedResponse.arrayBuffer();
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : arrayBuffer.byteLength - 1;

    if (start >= arrayBuffer.byteLength || end >= arrayBuffer.byteLength) {
      return new Response('', {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: { 'Content-Range': `bytes */${arrayBuffer.byteLength}` }
      });
    }

    const slicedBuffer = arrayBuffer.slice(start, end + 1);
    const responseHeaders = new Headers({
      'Content-Type': cachedResponse.headers.get('content-type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
      'Content-Length': slicedBuffer.byteLength.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    });

    return new Response(slicedBuffer, {
      status: 206,
      statusText: 'Partial Content',
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error handling range request:', error);
    return cachedResponse;
  }
}

// Fetch Event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Audio files (.mp3) - Special range caching strategy
  const isAudio = url.pathname.endsWith('.mp3') || url.hostname.includes('mp3quran.net') || url.hostname.includes('quranicaudio.com');
  if (isAudio) {
    event.respondWith(
      caches.match(event.request.url).then((cachedResponse) => {
        if (cachedResponse) {
          return handleRangeRequest(event.request, cachedResponse);
        }

        // Cache miss: fetch from network
        // We delete the Range header to download the full file as a 200 response, which can be cached
        const cleanHeaders = new Headers(event.request.headers);
        cleanHeaders.delete('range');
        const cleanRequest = new Request(event.request, { headers: cleanHeaders });

        return fetch(cleanRequest).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request.url, cacheCopy);
            });
            return handleRangeRequest(event.request, networkResponse);
          }
          return networkResponse;
        }).catch((err) => {
          console.error('Audio fetch failed:', err);
          return new Response('Offline and audio not cached', { status: 503 });
        });
      })
    );
    return;
  }

  // Google Fonts & ESM dependencies - Cache First
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com' ||
    url.origin === 'https://esm.sh'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Local assets & other requests - Stale While Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignore fetch errors when offline
        });

      return cachedResponse || fetchPromise;
    })
  );
});
