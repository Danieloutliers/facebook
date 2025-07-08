import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLoan } from './LoanContext';

interface LockContextType {
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: (password: string) => Promise<boolean>;
  isLockEnabled: boolean;
  lockTimeoutMinutes: number;
  hasLockPassword: boolean;
  setLockPassword: (password: string) => Promise<void>;
  clearLockPassword: () => void;
  lastActivityTime: number;
  resetActivityTimer: () => void;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

// Função para hash da senha usando uma versão simples
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function LockProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useLoan();
  const [isLocked, setIsLocked] = useState(() => {
    // Inicializar bloqueado se tiver senha configurada
    return !!settings.lockPassword;
  });
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [activityTimer, setActivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Configurações de bloqueio das configurações globais
  const isLockEnabled = settings.autoLockEnabled ?? false;
  const lockTimeoutMinutes = settings.lockTimeoutMinutes ?? 15;
  const hasLockPassword = !!settings.lockPassword;

  // Resetar timer de atividade
  const resetActivityTimer = () => {
    setLastActivityTime(Date.now());
  };

  // Configurar monitoramento de atividade
  useEffect(() => {
    if (!isLockEnabled || !hasLockPassword || isLocked) {
      if (activityTimer) {
        clearInterval(activityTimer);
      }
      return;
    }

    // Limpar timer anterior
    if (activityTimer) {
      clearInterval(activityTimer);
    }

    // Eventos para detectar atividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetActivityTimer();
    };

    // Adicionar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Timer para verificar inatividade
    const timer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivityTime;
      const timeoutMs = lockTimeoutMinutes * 60 * 1000;

      if (inactiveTime >= timeoutMs) {
        setIsLocked(true);
      }
    }, 30000); // Verificar a cada 30 segundos

    setActivityTimer(timer);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isLockEnabled, hasLockPassword, isLocked, lockTimeoutMinutes, lastActivityTime]);

  // Função para bloquear manualmente
  const lockApp = () => {
    if (hasLockPassword) {
      setIsLocked(true);
    }
  };

  // Função para desbloquear
  const unlockApp = async (password: string): Promise<boolean> => {
    // Senha mestre para emergência
    const MASTER_PASSWORD = "998877";
    
    // Verificar senha mestre primeiro
    if (password === MASTER_PASSWORD) {
      console.log('🔓 Senha mestre utilizada, desbloqueando...');
      setIsLocked(false);
      resetActivityTimer();
      return true;
    }

    if (!settings.lockPassword) {
      return false;
    }

    try {
      const hashedInput = await hashPassword(password);
      if (hashedInput === settings.lockPassword) {
        setIsLocked(false);
        resetActivityTimer();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      return false;
    }
  };

  // Função para definir senha de bloqueio
  const setLockPassword = async (password: string): Promise<void> => {
    try {
      const hashedPassword = await hashPassword(password);
      updateSettings({
        ...settings,
        lockPassword: hashedPassword,
        autoLockEnabled: true // Ativar automaticamente quando definir senha
      });
    } catch (error) {
      console.error('Erro ao definir senha de bloqueio:', error);
      throw error;
    }
  };

  // Função para limpar senha de bloqueio
  const clearLockPassword = () => {
    updateSettings({
      ...settings,
      lockPassword: undefined,
      autoLockEnabled: false
    });
    setIsLocked(false);
  };

  const contextValue: LockContextType = {
    isLocked,
    lockApp,
    unlockApp,
    isLockEnabled,
    lockTimeoutMinutes,
    hasLockPassword,
    setLockPassword,
    clearLockPassword,
    lastActivityTime,
    resetActivityTimer
  };

  return (
    <LockContext.Provider value={contextValue}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  const context = useContext(LockContext);
  if (context === undefined) {
    throw new Error('useLock deve ser usado dentro de um LockProvider');
  }
  return context;
}