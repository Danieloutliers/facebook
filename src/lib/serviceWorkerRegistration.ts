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

  // @ts-ignore - Import.meta.env é adicionado pelo Vite
  if (import.meta.env.DEV) {
    console.log('Service Worker não será registrado em ambiente de desenvolvimento');
    return false;
  }

  const wb = new Workbox('/service-worker.js');

  // Adiciona listeners para atualização e instalação
  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      console.log('Nova versão instalada em segundo plano - não recarregando automaticamente');
      // Não recarregar automaticamente, para evitar interrupção do usuário
    } else {
      console.log('Aplicativo instalado e disponível para uso offline');
    }
  });

  wb.addEventListener('activated', (event) => {
    if (event.isUpdate) {
      console.log('Service Worker atualizado e ativado');
    } else {
      console.log('Service Worker ativado pela primeira vez');
    }
  });

  // Completamente desabilitar prompts de atualização
  wb.addEventListener('waiting', (event) => {
    console.log('Nova versão pronta, ativando silenciosamente');
    
    // Ativar automaticamente sem perguntar ao usuário
    // Pequeno atraso para garantir estabilidade
    setTimeout(() => {
      wb.messageSkipWaiting();
    }, 3000);
  });

  // Registrar o service worker
  wb.register()
    .then((registration) => {
      console.log('Service Worker registrado com sucesso:', registration);
      
      // Solicitar permissão para notificações
      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Permissão para notificações concedida');
          }
        });
      }
    })
    .catch((error) => {
      console.error('Erro ao registrar Service Worker:', error);
    });

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
