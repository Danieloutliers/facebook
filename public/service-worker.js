// Importar scripts do Workbox e outras bibliotecas necessárias
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Desativar o registro de log no console em produção
workbox.setConfig({ debug: false });

const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;

// Precarregamento dos assets principais
// Isso será preenchido pelo plugin de build
precacheAndRoute(self.__WB_MANIFEST || []);

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
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
});

// Retornar a página offline quando não houver conexão, exceto para páginas do calendário
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    
    // Verificar se é uma rota do calendário ou da aplicação principal que deve funcionar offline
    const isCalendarRoute = url.pathname === '/' || 
                          url.pathname === '/calendar' || 
                          url.pathname === '/index.html';
    
    if (isCalendarRoute) {
      // Para rotas do calendário, tentar o cache primeiro
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || fetch(event.request).catch(() => {
            // Se falhar, tentar servir a página principal do cache
            return caches.match('/index.html');
          });
        })
      );
    } else {
      // Para outras rotas, comportamento padrão
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match(offlineFallbackPage);
        })
      );
    }
  }
});

// Sincronização em segundo plano
self.addEventListener('sync', (event) => {
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
    const request = indexedDB.open('loanBuddyOfflineDB', 1);
    
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
    const request = indexedDB.open('loanBuddyOfflineDB', 1);
    
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
