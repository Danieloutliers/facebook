// Service Worker para funcionalidade offline
// Verifica se o navegador suporta Service Workers
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// Registra o service worker
export function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.warn('[SW] Service Worker não é suportado neste navegador');
    return false;
  }

  // Registrar service worker manualmente
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
        
        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[SW] Nova versão disponível');
                  // Ativar automaticamente a nova versão
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                } else {
                  console.log('[SW] Service Worker instalado pela primeira vez');
                }
              }
            });
          }
        });
        
        // Listener para mudanças do service worker
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Controller do service worker mudou');
        });
        
        // Solicitar permissão para notificações
        if ('Notification' in window) {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              console.log('[SW] Permissão para notificações concedida');
            }
          });
        }
      })
      .catch((error) => {
        console.error('[SW] Erro ao registrar Service Worker:', error);
      });
  }

  return true;
}

// Envia mensagem para o service worker
export function sendMessageToSW(message: any) {
  if (!isServiceWorkerSupported()) return false;
  
  navigator.serviceWorker.controller?.postMessage(message);
  return true;
}

// Verifica se o aplicativo foi instalado como PWA
export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         // @ts-ignore - Propriedade específica para iOS
         window.navigator.standalone === true;
}

// Detecta se o app está rodando offline
export function isOffline() {
  return !navigator.onLine;
}

// Adiciona listeners para eventos de conectividade
export function setupConnectivityListeners(
  onlineCallback: () => void,
  offlineCallback: () => void
) {
  window.addEventListener('online', onlineCallback);
  window.addEventListener('offline', offlineCallback);
  
  // Verificar estado inicial
  if (isOffline()) {
    offlineCallback();
  }
  
  return () => {
    // Função para limpar os listeners
    window.removeEventListener('online', onlineCallback);
    window.removeEventListener('offline', offlineCallback);
  };
}
