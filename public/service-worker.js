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

// Tratamento melhorado para navegação e requisições em modo offline
self.addEventListener('fetch', (event) => {
  // Verifica se é uma requisição de navegação (HTML)
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    
    // Rotas principais do aplicativo que devem funcionar offline
    const isMainRoute = url.pathname === '/' || 
                        url.pathname === '/index.html' ||
                        url.pathname.startsWith('/dashboard') ||
                        url.pathname.startsWith('/loans') ||
                        url.pathname.startsWith('/borrowers') ||
                        url.pathname.startsWith('/reports');
    
    event.respondWith(
      // Estratégia: Verificar cache primeiro, depois rede, e se falhar usar fallback
      caches.match(event.request)
        .then((cachedResponse) => {
          // Se temos no cache, retorne imediatamente
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Caso contrário, tente a rede
          return fetch(event.request)
            .then((networkResponse) => {
              // Se obtiver resposta da rede, guarde no cache para uso futuro
              if (networkResponse && networkResponse.status === 200) {
                const clonedResponse = networkResponse.clone();
                caches.open('pages-cache').then((cache) => {
                  cache.put(event.request, clonedResponse);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              // Se a rede falhar...
              if (isMainRoute) {
                // Para rotas principais, tente recuperar a página principal do cache
                return caches.match('/index.html');
              } else {
                // Para outras rotas, use a página offline
                return caches.match(offlineFallbackPage).then(response => {
                  // Certifique-se de que nunca retornamos null
                  return response || new Response(
                    '<html><body><h1>Você está offline</h1><p>Por favor, conecte-se à internet para usar este recurso.</p></body></html>',
                    { 
                      headers: { 'Content-Type': 'text/html' },
                      status: 200,
                      statusText: 'OK'
                    }
                  );
                });
              }
            });
        })
    );
  } else if (event.request.url.includes('/api/')) {
    // Para requisições de API, tente rede primeiro, depois cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Guardar no cache se for sucesso
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open('api-cache').then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tente o cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Se não há cache, retorne uma resposta JSON vazia formatada
            // mas válida - isso evita o erro "null response"
            return new Response(
              JSON.stringify({ 
                error: true, 
                message: 'Você está offline. Os dados não puderam ser carregados.',
                offline: true
              }), 
              { 
                headers: { 'Content-Type': 'application/json' },
                status: 503,
                statusText: 'Service Unavailable'
              }
            );
          });
        })
    );
  } else {
    // Para outros recursos (CSS, JS, imagens, etc), tentar cache primeiro, depois rede
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
              // Guardar uma cópia no cache
              if (response && response.status === 200) {
                const clonedResponse = response.clone();
                caches.open('static-assets').then((cache) => {
                  cache.put(event.request, clonedResponse);
                });
              }
              return response;
            })
            .catch(() => {
              // Se for uma imagem, podemos retornar uma imagem placeholder
              if (event.request.destination === 'image') {
                return new Response(
                  // Uma pequena imagem SVG como fallback
                  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" text-anchor="middle" fill="#999">Imagem</text></svg>',
                  { 
                    headers: { 'Content-Type': 'image/svg+xml' },
                    status: 200,
                    statusText: 'OK'
                  }
                );
              }
              
              // Para outros recursos, retornamos uma resposta vazia mas válida
              return new Response(
                '', 
                { 
                  status: 504,
                  statusText: 'Gateway Timeout'
                }
              );
            });
        })
    );
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
