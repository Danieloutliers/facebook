import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date().toLocaleTimeString());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listeners para mudanças de conectividade
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para mensagens do service worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const handleSync = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'REQUEST_SYNC'
      });
    }
  };

  if (isOnline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <Wifi className="w-3 h-3 mr-1" />
          Online
        </Badge>
        {lastSyncTime && (
          <span className="text-xs text-gray-500">
            Última sincronização: {lastSyncTime}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
      <button
        onClick={handleSync}
        className="flex items-center text-xs text-gray-500 hover:text-gray-700"
        title="Tentar sincronizar"
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        Sincronizar
      </button>
    </div>
  );
}