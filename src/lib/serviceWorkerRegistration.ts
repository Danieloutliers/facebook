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
      console.log('Nova versão disponível! Recarregando...');
      // Recarregar a página para carregar a nova versão
      window.location.reload();
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

  // Armazenar a última vez que mostramos a notificação de atualização
  const lastUpdatePromptKey = 'lastUpdatePrompt';
  const lastUpdatePrompt = localStorage.getItem(lastUpdatePromptKey);
  const now = Date.now();
  // Reduzido para teste - em produção usar 24h (1000 * 60 * 60 * 24)
  const showUpdatePromptThreshold = 1000 * 60 * 60; // 1 hora em milissegundos
  
  wb.addEventListener('waiting', (event) => {
    console.log('Nova versão pronta, aguardando ativação');
    
    try {
      // Verificar se já mostramos a notificação recentemente
      if (!lastUpdatePrompt || (now - parseInt(lastUpdatePrompt)) > showUpdatePromptThreshold) {
        console.log('Mostrando notificação de atualização');
        // Se passou tempo suficiente, mostrar o prompt
        if (confirm('Nova versão disponível. Recarregar para atualizar?')) {
          // Salvar o timestamp atual
          localStorage.setItem(lastUpdatePromptKey, now.toString());
          wb.messageSkipWaiting();
        } else {
          // Se o usuário cancelou, também salvamos o timestamp para não perguntar logo em seguida
          localStorage.setItem(lastUpdatePromptKey, now.toString());
        }
      } else {
        // Se já mostramos recentemente, apenas ativar em segundo plano
        console.log('Atualização em segundo plano, sem interromper o usuário');
        // Opcional: ativar automaticamente após um tempo
        setTimeout(() => {
          wb.messageSkipWaiting();
        }, 5000); // Ativa após 5 segundos
      }
    } catch (error) {
      console.error('Erro ao processar notificação de atualização:', error);
      // Em caso de erro, simplesmente ativar sem prompt
      wb.messageSkipWaiting();
    }
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
