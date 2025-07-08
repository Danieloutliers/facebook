// Service Worker para funcionalidade offline
import { Workbox } from 'workbox-window';

// Verifica se o navegador suporta Service Workers
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// Registra o service worker
export function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Worker não é suportado neste navegador');
    return false;
  }

  // Usar service worker manual para melhor controle
  const swPath = '/sw.js';
  
  // Registrar service worker manualmente para funcionar em desenvolvimento
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(swPath)
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
                } else {
                  console.log('[SW] Service Worker instalado pela primeira vez');
                }
              }
            });
          }
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
