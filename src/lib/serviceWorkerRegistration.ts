// Service Worker para funcionalidade offline
import { Workbox } from 'workbox-window';

// Verifica se o navegador suporta Service Workers
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// Detecta se é iOS Safari
function isIOSSafari(): boolean {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
  return isIOS && isSafari;
}

// Registra o service worker
export function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Worker não é suportado neste navegador');
    return false;
  }

  // Usar service worker manual para melhor controle
  const swPath = '/sw.js';
  
  // Configurações especiais para iOS Safari
  const isIOS = isIOSSafari();
  
  // Registrar service worker manualmente para funcionar em desenvolvimento
  if ('serviceWorker' in navigator) {
    // Para iOS, aguardar um pouco antes de registrar
    const registerDelay = isIOS ? 1000 : 0;
    
    setTimeout(() => {
      navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none' // Importante para iOS
      })
        .then((registration) => {
          console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
          
          // Para iOS, forçar ativação imediata
          if (isIOS && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[SW] Nova versão disponível');
                    if (isIOS) {
                      // Para iOS, ativar imediatamente
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                  } else {
                    console.log('[SW] Service Worker instalado pela primeira vez');
                  }
                }
              });
            }
          });
          
          // Listener para recarregar quando o SW for controlado
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            if (isIOS) {
              // Para iOS, aguardar um pouco antes de recarregar
              setTimeout(() => window.location.reload(), 500);
            } else {
              window.location.reload();
            }
          });
          
          // Solicitar permissão para notificações (não no iOS)
          if ('Notification' in window && !isIOS) {
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
    }, registerDelay);
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
