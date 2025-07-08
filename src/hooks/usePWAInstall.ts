import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o prompt automático
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      // Para iOS Safari
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert('Para instalar no iOS: Toque no ícone de compartilhar e selecione "Adicionar à Tela de Início"');
        return;
      }
      
      // Para outros navegadores que não suportam
      alert('Seu navegador não suporta instalação de PWA. Tente usar Chrome, Edge ou Safari.');
      return;
    }

    try {
      // Mostra o prompt de instalação
      await deferredPrompt.prompt();
      
      // Aguarda a escolha do usuário
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA instalado com sucesso');
      } else {
        console.log('Instalação do PWA cancelada');
      }
      
      // Reset do prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    installPWA
  };
}