const CACHE = 'bhakti-study-shell-v4';

const SHELL = [
  './',
  './index.html',
  './shared/styles.css',
  './shared/app.js',
  './shared/course-home.js',
  './shared/program-data.js',
  './shared/study-workflow.js',
  './data/programs.json',
  './data/books.json',
  './manifest.webmanifest',
  './assets/bhakti-study-logo.png',
  './assets/bhakti-study-icon-192.png',
  './assets/bhakti-study-icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('bhakti-study-shell-') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
