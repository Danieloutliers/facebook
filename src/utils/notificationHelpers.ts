// Helpers para lidar com notificações, incluindo PWA e iOS

/**
 * Verifica se o dispositivo é iOS
 */
export function isIOS() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

/**
 * Verifica se o aplicativo está sendo executado como um PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         // @ts-ignore - Para iOS
         window.navigator.standalone === true;
}

/**
 * Verifica se as notificações são suportadas no navegador atual
 */
export function areNotificationsSupported() {
  return 'Notification' in window;
}

/**
 * Solicita permissão para enviar notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    console.warn('Notificações não são suportadas neste navegador');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return false;
  }
}

/**
 * Verifica o status atual da permissão de notificação
 */
export function getNotificationPermissionStatus(): string {
  if (!areNotificationsSupported()) {
    return 'não suportado';
  }
  
  return Notification.permission;
}

/**
 * Envia uma notificação de teste para iOS quando o app está instalado como PWA
 */
export function sendTestNotification(title = 'Teste de Notificação', options: NotificationOptions = {}): boolean {
  if (!areNotificationsSupported()) {
    console.warn('Notificações não são suportadas neste navegador');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Permissão para notificações não concedida');
    return false;
  }

  try {
    // Configurações padrão
    const defaultOptions: NotificationOptions = {
      body: 'Esta é uma notificação de teste do LoanBuddy',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'test-notification',
      // Na prática estas propriedades funcionam em navegadores modernos, 
      // mas o TypeScript não as reconhece no tipo NotificationOptions
      // timestamp: Date.now(),
      // vibrate: [100, 50, 100], // Padrão de vibração
      // renotify: true, // Comentado para evitar erros de TypeScript
      requireInteraction: true,
      silent: false,
      data: {
        type: 'test',
        url: window.location.origin,
        date: new Date().toISOString()
      }
    };

    // Mesclar opções personalizadas
    const mergedOptions = { ...defaultOptions, ...options };

    // Enviar notificação
    const notification = new Notification(title, mergedOptions);

    // Configurar eventos
    notification.onclick = function() {
      console.log('Notificação clicada');
      window.focus();
      notification.close();
    };

    notification.onshow = function() {
      console.log('Notificação exibida');
    };

    notification.onclose = function() {
      console.log('Notificação fechada');
    };

    notification.onerror = function(error) {
      console.error('Erro na notificação:', error);
    };

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Função específica para enviar notificação de teste para iOS
 * Inclui personalização específica para iOS
 */
export function sendIOSTestNotification(): boolean {
  if (!isIOS()) {
    console.log('Esta função é específica para dispositivos iOS');
    // Ainda assim enviar uma notificação normal
    return sendTestNotification('Teste de Notificação (Não-iOS)');
  }

  const iOSOptions: NotificationOptions = {
    body: 'Esta é uma notificação de teste para iOS PWA',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    // iOS específico - Comentado para evitar erros de TypeScript
    // actions: [
    //   {
    //     action: 'view',
    //     title: 'Ver Detalhes'
    //   },
    //   {
    //     action: 'dismiss',
    //     title: 'Dispensar'
    //   }
    // ],
    // vibrate: [200, 100, 200], // Padrão de vibração mais forte para iOS
  };

  return sendTestNotification('LoanBuddy iOS', iOSOptions);
}

/**
 * Envia uma notificação no estilo de vencimento próximo
 */
export function sendPaymentDueNotification(borrowerName: string, amount: string, dueDate: string): boolean {
  const options: NotificationOptions = {
    body: `Contrato de ${borrowerName} no valor de ${amount} vence em ${dueDate}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'payment-due',
    requireInteraction: true,
    data: {
      type: 'payment-due',
      borrowerName,
      amount,
      dueDate
    }
  };

  return sendTestNotification('Pagamento Próximo', options);
}

/**
 * Envia uma notificação no estilo de pagamento atrasado
 */
export function sendPaymentLateNotification(borrowerName: string, amount: string, daysLate: number): boolean {
  const options: NotificationOptions = {
    body: `Pagamento de ${borrowerName} no valor de ${amount} está atrasado há ${daysLate} dias`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'payment-late',
    requireInteraction: true,
    data: {
      type: 'payment-late',
      borrowerName,
      amount,
      daysLate
    }
  };

  return sendTestNotification('Pagamento Atrasado', options);
}