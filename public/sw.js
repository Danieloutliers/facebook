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
  
  // Estratégia Cache First para recursos estáticos
  if (event.request.destination === 'image' || 
      event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return response;
            });
        })
    );
    return;
  }
  
  // Estratégia Network First para navegação e API
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cachear apenas respostas válidas
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
          // Fallback para cache se network falhar
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              
              // Fallback para página principal se navegação falhar
              if (event.request.mode === 'navigate') {
                return caches.match('/');
              }
              
              // Resposta offline para API
              if (url.pathname.startsWith('/api/')) {
                return new Response(
                  JSON.stringify({ error: 'Offline', message: 'Sem conexão com a internet' }),
                  {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                  }
                );
              }
              
              return new Response('Offline', { status: 503 });
            });
        })
    );
    return;
  }
  
  // Estratégia padrão: tentar cache primeiro
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
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