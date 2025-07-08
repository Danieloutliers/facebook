// Importar scripts do Workbox
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
  console.log('[SW] Workbox importado com sucesso');
} catch (error) {
  console.error('[SW] Erro ao importar Workbox:', error);
  // Fallback para service worker sem Workbox
}

// Configurar Workbox se disponível
if (typeof workbox !== 'undefined') {
  workbox.setConfig({ debug: false });
  console.log('[SW] Workbox configurado');
} else {
  console.warn('[SW] Workbox não disponível, usando service worker básico');
}

const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;

// Precarregamento dos assets principais
precacheAndRoute(self.__WB_MANIFEST || []);

// Arquivos essenciais para cache offline
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Cache de assets estáticos (CSS, JS, imagens)
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
      }),
    ],
  })
);

// Cache de imagens
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
      }),
    ],
  })
);

// Cache de API - Dados da aplicação
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
      }),
    ],
  })
);

// Estratégia offline - Página fallback quando não há internet
const offlineFallbackPage = '/offline.html';

// Instalar o service worker e fazer o precache da página offline
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
  self.skipWaiting();
});

// Retornar a página offline quando não houver conexão
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(offlineFallbackPage);
      })
    );
  }
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  self.clients.claim();
});

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento de sincronização:', event.tag);
  
  if (event.tag === 'sync-loans') {
    event.waitUntil(syncLoanData());
  } else if (event.tag === 'sync-payments') {
    event.waitUntil(syncPaymentData());
  } else if (event.tag === 'sync-borrowers') {
    event.waitUntil(syncBorrowerData());
  }
});

// Função para sincronizar dados de empréstimos quando voltamos online
async function syncLoanData() {
  try {
    const pendingLoans = await getPendingItems('pendingLoans');
    if (pendingLoans.length === 0) return;

    for (const loan of pendingLoans) {
      try {
        const response = await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loan),
        });

        if (response.ok) {
          await removePendingItem('pendingLoans', loan.id);
        }
      } catch (err) {
        console.error('Erro ao sincronizar empréstimo:', err);
      }
    }
  } catch (err) {
    console.error('Erro ao processar sincronização de empréstimos:', err);
  }
}

// Função para sincronizar dados de pagamentos quando voltamos online
async function syncPaymentData() {
  try {
    const pendingPayments = await getPendingItems('pendingPayments');
    if (pendingPayments.length === 0) return;

    for (const payment of pendingPayments) {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        });

        if (response.ok) {
          await removePendingItem('pendingPayments', payment.id);
        }
      } catch (err) {
        console.error('Erro ao sincronizar pagamento:', err);
      }
    }
  } catch (err) {
    console.error('Erro ao processar sincronização de pagamentos:', err);
  }
}

// Função para sincronizar dados de clientes quando voltamos online
async function syncBorrowerData() {
  try {
    const pendingBorrowers = await getPendingItems('pendingBorrowers');
    if (pendingBorrowers.length === 0) return;

    for (const borrower of pendingBorrowers) {
      try {
        const response = await fetch('/api/borrowers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(borrower),
        });

        if (response.ok) {
          await removePendingItem('pendingBorrowers', borrower.id);
        }
      } catch (err) {
        console.error('Erro ao sincronizar cliente:', err);
      }
    }
  } catch (err) {
    console.error('Erro ao processar sincronização de clientes:', err);
  }
}

// Funções auxiliares para gerenciar a fila de dados pendentes
async function getPendingItems(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('loanBuddyOfflineDB', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const items = [];
      
      store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
      
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

async function removePendingItem(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('loanBuddyOfflineDB', 2);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

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
    
    // Sincronizar todos os tipos de dados
    await Promise.all([
      syncLoanData(),
      syncPaymentData(),
      syncBorrowerData()
    ]);
    
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