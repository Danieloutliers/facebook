// IndexedDB para armazenamento offline
const DB_NAME = 'loanBuddyOfflineDB';
const DB_VERSION = 1;

interface DBStores {
  borrowers: IDBObjectStore;
  loans: IDBObjectStore;
  payments: IDBObjectStore;
  settings: IDBObjectStore;
  pendingBorrowers: IDBObjectStore;
  pendingLoans: IDBObjectStore;
  pendingPayments: IDBObjectStore;
}

// Inicializa o banco de dados IndexedDB
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Erro ao abrir o banco de dados:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log('Banco de dados offline inicializado com sucesso');
      resolve(request.result);
    };
    
    // Cria as stores na primeira execução ou quando há upgrade de versão
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const stores = {} as DBStores;
      
      // Store para mutuários
      if (!db.objectStoreNames.contains('borrowers')) {
        stores.borrowers = db.createObjectStore('borrowers', { keyPath: 'id' });
        stores.borrowers.createIndex('name', 'name', { unique: false });
        stores.borrowers.createIndex('email', 'email', { unique: false });
      }
      
      // Store para empréstimos
      if (!db.objectStoreNames.contains('loans')) {
        stores.loans = db.createObjectStore('loans', { keyPath: 'id' });
        stores.loans.createIndex('borrowerId', 'borrowerId', { unique: false });
        stores.loans.createIndex('status', 'status', { unique: false });
      }
      
      // Store para pagamentos
      if (!db.objectStoreNames.contains('payments')) {
        stores.payments = db.createObjectStore('payments', { keyPath: 'id' });
        stores.payments.createIndex('loanId', 'loanId', { unique: false });
        stores.payments.createIndex('date', 'date', { unique: false });
      }
      
      // Store para configurações
      if (!db.objectStoreNames.contains('settings')) {
        stores.settings = db.createObjectStore('settings', { keyPath: 'id' });
      }
      
      // Stores para itens pendentes (quando offline)
      if (!db.objectStoreNames.contains('pendingBorrowers')) {
        stores.pendingBorrowers = db.createObjectStore('pendingBorrowers', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingLoans')) {
        stores.pendingLoans = db.createObjectStore('pendingLoans', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingPayments')) {
        stores.pendingPayments = db.createObjectStore('pendingPayments', { keyPath: 'id' });
      }
      
      console.log('Estrutura do banco de dados offline criada/atualizada');
    };
  });
}

// Função para salvar dados (genérica)
export function saveData<T>(storeName: string, data: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const saveRequest = store.put(data);
      
      saveRequest.onsuccess = () => {
        console.log(`Item salvo em ${storeName} (offline)`);
        resolve(data);
      };
      
      saveRequest.onerror = () => {
        console.error(`Erro ao salvar em ${storeName}:`, saveRequest.error);
        reject(saveRequest.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

// Função para salvar array de dados (genérica)
export function saveAllData<T>(storeName: string, dataArray: T[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Limpar a store antes de adicionar os novos itens
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Adicionar todos os itens
        dataArray.forEach(data => {
          store.add(data);
        });
        
        console.log(`${dataArray.length} itens salvos em ${storeName} (offline)`);
        resolve(dataArray);
      };
      
      clearRequest.onerror = () => {
        console.error(`Erro ao limpar ${storeName}:`, clearRequest.error);
        reject(clearRequest.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

// Função para carregar todos os dados (genérica)
export function loadAllData<T>(storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        console.log(`${getAllRequest.result.length} itens carregados de ${storeName} (offline)`);
        resolve(getAllRequest.result);
      };
      
      getAllRequest.onerror = () => {
        console.error(`Erro ao carregar de ${storeName}:`, getAllRequest.error);
        reject(getAllRequest.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

// Função para carregar um item específico (genérica)
export function loadData<T>(storeName: string, id: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        console.log(`Item ${id} carregado de ${storeName} (offline)`);
        resolve(getRequest.result);
      };
      
      getRequest.onerror = () => {
        console.error(`Erro ao carregar item ${id} de ${storeName}:`, getRequest.error);
        reject(getRequest.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

// Função para deletar um item (genérica)
export function deleteData(storeName: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        console.log(`Item ${id} removido de ${storeName} (offline)`);
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error(`Erro ao remover item ${id} de ${storeName}:`, deleteRequest.error);
        reject(deleteRequest.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

// Função para adicionar um item à fila de pendentes
export function addPendingItem<T>(storeName: string, data: T): Promise<T> {
  return saveData<T>(`pending${storeName.charAt(0).toUpperCase() + storeName.slice(1)}`, data);
}

// Adiciona registro para sincronização posterior quando estiver offline
export function enqueueForSync(type: 'borrowers' | 'loans' | 'payments', data: any): Promise<any> {
  return addPendingItem(type, data);
}

// Verifica se o navegador está online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Registra listeners para eventos de online/offline
export function setupConnectivityListeners() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

// Handler para quando o dispositivo volta a ficar online
function handleOnline() {
  console.log('Conexão restaurada. Iniciando sincronização...');
  
  // Tenta registrar uma sincronização em segundo plano
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(registration => {
        // Registra tarefas de sincronização
        registration.sync.register('sync-borrowers');
        registration.sync.register('sync-loans');
        registration.sync.register('sync-payments');
        console.log('Sincronização em segundo plano registrada');
      })
      .catch(err => {
        console.error('Erro ao registrar sincronização:', err);
        // Se falhar, tentar sincronizar manualmente
        manualSync();
      });
  } else {
    // Se o navegador não suportar sync em segundo plano
    manualSync();
  }
}

// Handler para quando o dispositivo fica offline
function handleOffline() {
  console.log('Conexão perdida. Operando em modo offline.');
  // Exibir notificação para o usuário
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('LoanBuddy - Modo Offline', {
      body: 'Você está operando em modo offline. Seus dados serão sincronizados quando voltar online.',
      icon: '/icons/icon-192x192.png'
    });
  }
}

// Sincronização manual (quando o navegador não suporta background sync)
async function manualSync() {
  try {
    // Sync de mutuários
    const pendingBorrowers = await loadAllData('pendingBorrowers');
    for (const borrower of pendingBorrowers) {
      try {
        await fetch('/api/borrowers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(borrower)
        });
        await deleteData('pendingBorrowers', borrower.id);
      } catch (err) {
        console.error('Erro ao sincronizar mutuário:', err);
      }
    }
    
    // Sync de empréstimos
    const pendingLoans = await loadAllData('pendingLoans');
    for (const loan of pendingLoans) {
      try {
        await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loan)
        });
        await deleteData('pendingLoans', loan.id);
      } catch (err) {
        console.error('Erro ao sincronizar empréstimo:', err);
      }
    }
    
    // Sync de pagamentos
    const pendingPayments = await loadAllData('pendingPayments');
    for (const payment of pendingPayments) {
      try {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment)
        });
        await deleteData('pendingPayments', payment.id);
      } catch (err) {
        console.error('Erro ao sincronizar pagamento:', err);
      }
    }
    
    console.log('Sincronização manual concluída');
  } catch (err) {
    console.error('Erro durante sincronização manual:', err);
  }
}
