import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Keyboard } from "lucide-react";
import { useLock } from "@/context/LockContext";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

export function LockScreen() {
  const { unlockApp, clearLockPassword } = useLock();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMasterPasswordPopup, setShowMasterPasswordPopup] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);

  // Atualizar horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mostrar dica do teclado para desktop após 3 segundos
  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => {
        setShowKeyboardHint(true);
        // Esconder a dica após 5 segundos
        setTimeout(() => setShowKeyboardHint(false), 5000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const handleNumberPress = (num: string) => {
    if (password.length < 10) { // Limite máximo de 10 dígitos
      const newPassword = password + num;
      setPassword(newPassword);
      setError(''); // Limpar erro ao digitar
      
      // Auto unlock apenas se tiver 6 dígitos (senha completa)
      if (newPassword.length === 6) {
        setTimeout(() => {
          handleUnlock(newPassword);
        }, 200); // Pequeno delay para ver o último dígito
      }
    }
  };

  const handleBackspace = () => {
    setPassword(prev => prev.slice(0, -1));
    setError('');
  };

  const handleUnlock = async (passwordToUse?: string) => {
    const currentPassword = passwordToUse || password;
    
    if (!currentPassword.trim()) {
      setError('Digite a senha para desbloquear');
      return;
    }

    setIsUnlocking(true);
    setError('');

    try {
      const success = await unlockApp(currentPassword);
      
      if (success) {
        setPassword('');
        setError('');
      } else {
        setError('Senha incorreta. Tente novamente.');
        setPassword('');
        // Vibração em dispositivos móveis
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Erro ao desbloquear:', error);
      setError('Erro ao desbloquear. Tente novamente.');
      setPassword('');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleForgotPassword = () => {
    setShowMasterPasswordPopup(true);
  };

  // Enhanced keyboard support for desktop
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isUnlocking) return;
      
      // Hide keyboard hint when user starts typing
      if (showKeyboardHint) {
        setShowKeyboardHint(false);
      }
      
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter' && password.length >= 4) {
        e.preventDefault();
        handleUnlock();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPassword('');
        setError('');
      } else if (e.key === 'F1') {
        e.preventDefault();
        handleForgotPassword();
      }
    };

    // Only add keyboard listener for desktop
    if (!isMobile) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [password, isUnlocking, isMobile, showKeyboardHint]);

  // Formatação do horário estilo iPhone
  const timeString = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const dateString = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Enhanced Wallpaper Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
        }}
      />
      
      {/* Enhanced Blur Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/30 backdrop-blur-xl" />
      
      {/* Content - Responsive layout for desktop/mobile */}
      <div className={`relative flex h-full text-white ${
        isMobile 
          ? 'flex-col items-center justify-between p-8' 
          : 'flex-row items-center justify-center gap-16 p-16'
      }`}>
        
        {/* Left/Top Section - Time & Date */}
        <div className={`flex flex-col items-center ${
          isMobile ? 'pt-12 sm:pt-16' : 'space-y-8'
        }`}>
          <div className={`font-thin tracking-tight drop-shadow-lg ${
            isMobile ? 'text-6xl sm:text-8xl mb-2' : 'text-9xl xl:text-[10rem] mb-4'
          }`}>
            {timeString}
          </div>
          <div className={`font-light text-white/90 capitalize drop-shadow-sm ${
            isMobile ? 'text-base sm:text-lg' : 'text-2xl'
          }`}>
            {dateString}
          </div>

          {/* Desktop User Info */}
          {!isMobile && (
            <div className="flex flex-col items-center space-y-6 mt-8">
              {/* User Name */}
              <div className="text-center space-y-2">
                <div className="text-2xl font-medium text-white drop-shadow-sm">
                  {user?.email ? user.email.split('@')[0] : 'Usuário'}
                </div>
                <div className="text-lg text-white/70 drop-shadow-sm">
                  Digite os 6 dígitos da sua senha
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile User Info Section */}
        {isMobile && (
          <div className="flex flex-col items-center space-y-6">
            {/* User Name */}
            <div className="text-center space-y-2">
              <div className="text-xl sm:text-2xl font-medium text-white drop-shadow-sm">
                {user?.email ? user.email.split('@')[0] : 'Usuário'}
              </div>
              <div className="text-sm sm:text-base text-white/70 drop-shadow-sm">
                Digite os 6 dígitos da sua senha
              </div>
            </div>
          </div>
        )}

        {/* Right/Bottom Section - Password Display & Keypad */}
        <div className={`space-y-8 ${
          isMobile ? 'w-full max-w-sm pb-4' : 'flex flex-col items-center'
        }`}>
          {/* Password Display */}
          <div className="space-y-6">
            {/* Password Dots */}
            <div className="flex justify-center space-x-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full border-2 transition-all duration-300 ${
                    isMobile ? 'w-5 h-5' : 'w-6 h-6'
                  } ${
                    i < password.length
                      ? 'bg-white border-white scale-110 shadow-lg shadow-white/20'
                      : 'bg-transparent border-white/50'
                  } ${
                    // Adicionar pulsação no último dígito quando completo
                    i === password.length - 1 && password.length === 6
                      ? 'animate-pulse'
                      : ''
                  }`}
                />
              ))}
            </div>
            
            {/* Keyboard Hint for Desktop */}
            {!isMobile && showKeyboardHint && (
              <div className="flex items-center justify-center space-x-2 text-white/70 animate-fade-in">
                <Keyboard className="h-4 w-4" />
                <span className="text-sm">Use o teclado numérico ou clique nos botões</span>
              </div>
            )}
            
            {/* Instrução visual */}
            <div className="text-center">
              <p className={`text-white/60 ${isMobile ? 'text-sm' : 'text-base'}`}>
                {!isMobile && !showKeyboardHint ? 'Use o teclado ou clique nos números' : 'Digite sua senha de 6 dígitos'}
              </p>
            </div>

            {/* Loading State */}
            {isUnlocking && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2 text-white/80">
                  <div className={`animate-spin rounded-full border-2 border-white/30 border-t-white ${
                    isMobile ? 'h-5 w-5' : 'h-6 w-6'
                  }`} />
                  <span className={isMobile ? 'text-sm' : 'text-base'}>Verificando...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 backdrop-blur-md shadow-lg">
                <div className="flex items-center space-x-3 text-red-100 justify-center">
                  <AlertCircle className={`flex-shrink-0 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                  <p className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Numeric Keypad */}
          <div className={`grid grid-cols-3 gap-5 mx-auto ${
            isMobile ? 'max-w-xs' : 'max-w-sm'
          }`}>
            {/* Numbers 1-9 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberPress(num.toString())}
                disabled={isUnlocking}
                className={`rounded-full bg-white/15 border border-white/30 backdrop-blur-md text-white font-light transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-white/10 ${
                  isMobile 
                    ? 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl' 
                    : 'w-24 h-24 xl:w-28 xl:h-28 text-3xl xl:text-4xl'
                }`}
              >
                {num}
              </button>
            ))}

            {/* Bottom Row: Emergency, 0, Backspace */}
            <button
              onClick={handleForgotPassword}
              disabled={isUnlocking}
              className={`rounded-full bg-white/15 border border-white/30 backdrop-blur-md text-white text-xs font-medium transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg ${
                isMobile 
                  ? 'w-20 h-20 sm:w-24 sm:h-24' 
                  : 'w-24 h-24 xl:w-28 xl:h-28 text-sm'
              }`}
            >
              SOS
            </button>

            <button
              onClick={() => handleNumberPress('0')}
              disabled={isUnlocking}
              className={`rounded-full bg-white/15 border border-white/30 backdrop-blur-md text-white font-light transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-white/10 ${
                isMobile 
                  ? 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl' 
                  : 'w-24 h-24 xl:w-28 xl:h-28 text-3xl xl:text-4xl'
              }`}
            >
              0
            </button>

            <button
              onClick={handleBackspace}
              disabled={isUnlocking || password.length === 0}
              className={`rounded-full bg-white/15 border border-white/30 backdrop-blur-md text-white transition-all duration-200 hover:bg-white/25 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg ${
                isMobile 
                  ? 'w-20 h-20 sm:w-24 sm:h-24 text-xl' 
                  : 'w-24 h-24 xl:w-28 xl:h-28 text-2xl'
              }`}
            >
              ⌫
            </button>
          </div>

          {/* PWA Home Indicator - Only on mobile */}
          {isMobile && (
            <div className="flex justify-center pt-4">
              <div className="w-36 h-1 bg-white/30 rounded-full" />
            </div>
          )}

          {/* Desktop Additional Info */}
          {!isMobile && (
            <div className="flex justify-center pt-6">
              <div className="text-center space-y-2">
                <p className="text-white/50 text-sm">
                  Enter para confirmar • ESC para limpar • F1 para ajuda
                </p>
                <div className="flex items-center justify-center space-x-4 text-white/40 text-xs">
                  <span>Teclado: 0-9, ⌫, Enter, ESC</span>
                  <span>•</span>  
                  <span>Mouse: Clique nos botões</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Master Password Popup */}
      {showMasterPasswordPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMasterPasswordPopup(false)} />
          <div className="relative bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center space-y-6">
              <div className="text-white">
                <h3 className="text-xl font-semibold mb-2">Esqueceu sua senha?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Entre em contato com o suporte ou use a senha mestre de emergência:
                </p>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <code className="text-2xl font-mono text-white tracking-wider">998877</code>
                </div>
              </div>
              
              <button
                onClick={() => setShowMasterPasswordPopup(false)}
                className="w-full py-3 bg-white/20 border border-white/30 rounded-2xl text-white font-medium transition-all duration-200 hover:bg-white/30"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}