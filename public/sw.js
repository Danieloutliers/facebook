// Service Worker para loanBuddy PWA - Otimizado para iOS Safari
const CACHE_NAME = 'loanbuddy-v3';
const OFFLINE_URL = '/offline.html';

// Instalação do service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Adicionando página offline ao cache');
        return cache.add(OFFLINE_URL);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro na instalação:', error);
        return self.skipWaiting();
      })
  );
});

// Ativação do service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Só interceptar requisições de navegação (páginas)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Se conseguiu carregar a página, retorna normalmente
          if (response.ok) {
            return response;
          }
          // Se não conseguiu, mostra página offline
          return caches.match(OFFLINE_URL);
        })
        .catch(() => {
          // Se falhou completamente, mostra página offline
          console.log('[SW] Navegação offline - mostrando página offline');
          return caches.match(OFFLINE_URL);
        })
    );
  }
  
  // Para outras requisições, deixa passar normalmente
  return;
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificações push básicas
self.addEventListener('push', (event) => {
  const options = {
    body: 'Lembrete do loanBuddy',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100]
  };
  
  event.waitUntil(
    self.registration.showNotification('loanBuddy', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});