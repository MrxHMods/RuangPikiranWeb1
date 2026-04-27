// Ruang Pikiran Service Worker
const CACHE_NAME = 'ruang-pikiran-v3';
const DYNAMIC_CACHE = 'ruang-pikiran-dynamic-v1';

// Asset yang di-cache saat install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-48.png',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-144.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/icon-shortcut-96.png'
];

// CDN externals
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Firebase CDN (tidak di-cache optimal, biarkan network)
const FIREBASE_CDN = [
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll([...STATIC_ASSETS, ...CDN_ASSETS]).catch(err => {
        console.error('[SW] Cache error:', err);
        return Promise.resolve();
      });
    })
  );
  
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - Cache First untuk static, Network First untuk Firebase
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Untuk Firebase CDN - Network first
  if (FIREBASE_CDN.some(cdn => url.href.includes(cdn))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Untuk Firebase API calls - Network only
  if (url.href.includes('firestore.googleapis.com') || 
      url.href.includes('identitytoolkit.googleapis.com')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Untuk static assets - Cache first
  if (STATIC_ASSETS.includes(url.pathname) || CDN_ASSETS.some(cdn => url.href.includes(cdn))) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Untuk lainnya - Network first
  event.respondWith(networkFirstStrategy(request));
});

// Cache first strategy
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page or cached version
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Network first strategy
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Fallback untuk navigasi HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/index.html');
    }
    
    throw error;
  }
}

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Jangan lupa tulis jurnal hari ini!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Ruang Pikiran', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});