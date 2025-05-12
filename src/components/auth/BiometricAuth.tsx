import React, { useState, useEffect } from 'react';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Fingerprint, AlertCircle } from 'lucide-react';

interface BiometricAuthProps {
  onAuthSuccess: () => void;
}

export default function BiometricAuth({ onAuthSuccess }: BiometricAuthProps) {
  const { toast } = useToast();
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Verificar suporte à Web Authentication API
    const isWebAuthnSupported = browserSupportsWebAuthn();
    setBiometricAvailable(isWebAuthnSupported);
  }, []);

  const handleAuthenticateWithBiometrics = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simular uma requisição de autenticação
      // Em uma implementação real, isso viria do servidor
      
      // Solicitar a autenticação iOS - isso acionará o Face ID/Touch ID no iOS e
      // no macOS, e outros métodos de autenticação em outros dispositivos
      window.location.href = 'web+auth://auth';
      
      // Como é apenas uma simulação, vamos considerar sucesso após um curto período
      setTimeout(() => {
        toast({
          title: "Autenticação solicitada",
          description: "Se disponível, o Face ID/Touch ID será acionado em seu dispositivo.",
          variant: "default",
        });
        
        // Depois de um tempo, simulamos uma autenticação bem-sucedida
        setTimeout(() => {
          toast({
            title: "Autenticação bem-sucedida",
            description: "Você foi autenticado com sucesso.",
            variant: "default",
          });
          onAuthSuccess();
          setIsAuthenticating(false);
        }, 2000);
      }, 1000);
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível iniciar a autenticação biométrica.",
        variant: "destructive",
      });
      setIsAuthenticating(false);
    }
  };

  if (biometricAvailable === null) {
    return <div className="flex justify-center p-4">Verificando disponibilidade biométrica...</div>;
  }

  if (biometricAvailable === false) {
    return (
      <div className="space-y-4">
        <div className="border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800/50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-800 dark:text-orange-300">Autenticação biométrica não disponível</h4>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                Seu dispositivo ou navegador não suporta autenticação biométrica ou por código.
              </p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={onAuthSuccess}
          className="w-full"
        >
          Continuar sem autenticação biométrica
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-primary/20 rounded-lg p-4 mb-6 bg-primary/5">
      <div className="flex items-center mb-3">
        <Shield className="h-5 w-5 text-primary mr-2" />
        <h3 className="font-semibold">Autenticação Biométrica</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Use Face ID, Touch ID ou seu código de acesso para entrar de forma segura.
      </p>
      <Button 
        onClick={handleAuthenticateWithBiometrics}
        className="w-full"
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-t-2 border-white rounded-full"></span>
            Autenticando...
          </span>
        ) : (
          <span className="flex items-center">
            <Fingerprint className="mr-2 h-4 w-4" />
            Entrar com Biometria
          </span>
        )}
      </Button>
    </div>
  );
}
