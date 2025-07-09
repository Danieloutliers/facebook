// Service Worker melhorado para funcionalidade offline
const CACHE_NAME = 'loanbuddy-v2';
const STATIC_CACHE_NAME = 'loanbuddy-static-v2';
const API_CACHE_NAME = 'loanbuddy-api-v2';

// Arquivos essenciais para cache offline
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sw.js'
];

// Rotas da API para cache
const API_ROUTES = [
  '/api/borrowers',
  '/api/loans',
  '/api/payments'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando arquivos estáticos');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear arquivos estáticos:', error);
      })
  );
  
  // Forçar ativação imediata
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Controlar todas as abas imediatamente
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições de outros domínios
  if (url.origin !== location.origin) {
    return;
  }
  
  // Estratégia especial para iOS Safari - sempre responder com algo do cache primeiro
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Se temos uma versão em cache, usar ela
            return cachedResponse;
          }
          
          // Tentar buscar da rede
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Se falhar completamente, retornar index.html do cache
              return caches.match('/index.html')
                .then((indexResponse) => {
                  if (indexResponse) {
                    return indexResponse;
                  }
                  
                  // Última tentativa: página offline
                  return caches.match('/offline.html');
                });
            });
        })
    );
    return;
  }
  
  // Estratégia Cache First para recursos estáticos
  if (event.request.destination === 'image' || 
      event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.url.includes('/icons/') ||
      event.request.url.includes('/manifest.json')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Fallback para recursos estáticos
              if (event.request.url.includes('/manifest.json')) {
                return new Response(JSON.stringify({
                  name: "LoanBuddy",
                  short_name: "LoanBuddy",
                  start_url: "/",
                  display: "standalone"
                }), {
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              return new Response('', { status: 404 });
            });
        })
    );
    return;
  }
  
  // Estratégia para API - Network First com fallback robusto
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Resposta offline padrão para API
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'Sem conexão com a internet',
                  offline: true 
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }
  
  // Estratégia padrão: Cache First
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch(() => {
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento de sincronização:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Notificações push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do loanBuddy',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('loanBuddy', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clique na notificação');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Função para sincronizar dados offline
async function syncOfflineData() {
  try {
    console.log('[SW] Sincronizando dados offline...');
    
    // Aqui você pode implementar a lógica de sincronização
    // Por exemplo, enviar dados salvos localmente para a API
    
    // Simular sincronização
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('[SW] Sincronização concluída');
    
    // Notificar todas as abas abertas
    const allClients = await clients.matchAll();
    allClients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { success: true }
      });
    });
    
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  if (event.data && event.data.type === 'REQUEST_SYNC') {
    // Registrar sincronização em background
    self.registration.sync.register('sync-data');
    return;
  }
  
  // Responder de volta ao cliente
  event.ports[0].postMessage({
    type: 'SW_RESPONSE',
    data: 'Service Worker ativo'
  });
});

console.log('[SW] Service Worker carregado com sucesso');