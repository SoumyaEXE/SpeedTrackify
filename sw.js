/*
 *
 *  SpeedTrackify.
 *  Copyright 2024 Soumyadeep Dey. All rights reserved.
 *
 */
var CACHE_NAME = 'SpeedTrackify.';
var FilesToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FilesToCache)
      .then(() => self.skipWaiting());
    })
    .then(() => {
      // force waiting worker to become active worker (claim)
      self.skipWaiting();
    })
    .catch(error => {
      console.error('Pre-fetching failed:', error);
    })
  )
});

// self.addEventListener('activate',  event => {
//   event.waitUntil(self.clients.claim());
// });
// Activating service worker
self.addEventListener('activate', function(e) {
  console.log('[Service Worker] Activate');
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        // Removing old cache
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
  event.waitUntil(
    update(event.request)
      .then(refresh)
  );
});

// TO Update Request
function update(request) {
  return caches.open(CACHE_NAME).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response.clone()).then(function () {
        return response;
      });
    });
  });
}

// TO Refresh Response
function refresh(response) {
  return self.clients.matchAll().then(function (clients) {
    clients.forEach(function (client) {
      var message = {
        type: 'refresh',
        url: response.url,
        eTag: response.headers.get('ETag')
      };
    client.postMessage(JSON.stringify(message));
    });
  });
}
