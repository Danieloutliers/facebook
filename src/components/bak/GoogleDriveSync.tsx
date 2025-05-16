import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLoan } from '@/context/LoanContext';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Download, 
  LogIn, 
  LogOut, 
  Settings, 
  Shield, 
  Upload,
  AlertCircle
} from 'lucide-react';

import * as GoogleDriveClient from '@/utils/googleDriveClient';

interface GoogleDriveSyncProps {
  clientId: string;
}

export default function GoogleDriveSync({ clientId }: GoogleDriveSyncProps) {
  const { toast } = useToast();
  const { borrowers, loans, payments, settings, updateSettings, importData } = useLoan();
  
  // Estados para controle da interface
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const [useEncryption, setUseEncryption] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [missingClientId, setMissingClientId] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'not_connected' | 'connecting' | 'connected' | 'error'>('not_connected');
  
  // Inicializar o cliente do Google Drive
  useEffect(() => {
    const initGoogleDrive = async () => {
      try {
        if (!clientId || clientId.trim() === '') {
          console.error('ID do cliente Google não fornecido');
          setMissingClientId(true);
          return;
        }
        
        // Verificar se estamos em um ambiente onde o Google SDK está disponível
        if (typeof window === 'undefined' || typeof window.gapi === 'undefined') {
          console.log('Ambiente sem acesso ao Google API. Aguardando carregamento ou em ambiente de desenvolvimento.');
        }
        
        // Tentar inicializar
        await GoogleDriveClient.initGoogleDriveClient(clientId);
        setIsInitialized(true);
        
        // Verificar se o usuário já está logado
        const signedIn = GoogleDriveClient.isSignedIn();
        setIsSignedIn(signedIn);
        
        console.log('Google Drive inicializado. Usuário logado:', signedIn);
      } catch (error) {
        console.error('Erro ao inicializar Google Drive:', error);
        // Não mostrar o toast de erro durante a inicialização
        // pois pode ser apenas um ambiente onde o Google não está disponível
      }
    };
    
    if (clientId) {
      initGoogleDrive();
    } else {
      setMissingClientId(true);
    }
  }, [clientId, toast]);
  
  // Função para fazer login com o Google
  const handleSignIn = async () => {
    try {
      setConnectionStatus('connecting');
      setIsLoading(true);
      setLastError(null);
      console.log('Iniciando processo de autenticação com o Google Drive...');
      await GoogleDriveClient.signIn();
      setIsSignedIn(true);
      setConnectionStatus('connected');
      toast({
        title: 'Login realizado com sucesso',
        description: 'Você está conectado ao Google Drive.'
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setConnectionStatus('error');
      // Guardar o erro para exibição
      setLastError(error instanceof Error ? error.message : JSON.stringify(error));
      
      // Verificar se é um erro de redirecionamento
      const errorStr = JSON.stringify(error);
      if (errorStr.includes('redirect_uri_mismatch')) {
        setLastError(`Erro de URI de redirecionamento: "${window.location.origin + window.location.pathname}" não está na lista de URIs autorizadas.`);
        toast({
          title: 'Erro de configuração do Google OAuth',
          description: `A URI de redirecionamento não está autorizada. Adicione "${window.location.origin + window.location.pathname}" às URIs de redirecionamento autorizadas no Console do Google Cloud.`,
          variant: 'destructive'
        });
      } else if (errorStr.includes('popup_closed_by_user')) {
        setLastError('O popup de autenticação foi fechado. Tentando método alternativo de autenticação...');
        toast({
          title: 'Autenticação interrompida',
          description: 'O popup de autenticação foi fechado. Tentaremos um método alternativo automaticamente.',
          variant: 'default'
        });
        
        // Tentar método alternativo de autenticação (redirecionamento completo)
        try {
          // Criar uma URL de autenticação OAuth direta
          // Definir o escopo completo para garantir permissões suficientes
          const driveScope = 'https://www.googleapis.com/auth/drive';
          const redirectUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&scope=${encodeURIComponent(driveScope)}&response_type=code`;
          
          // Perguntar ao usuário se deseja tentar o método alternativo
          const shouldRedirect = window.confirm('Deseja tentar o método de autenticação por redirecionamento de página? Você será redirecionado para a página de login do Google.');
          
          if (shouldRedirect) {
            // Redirecionar para a página de autenticação do Google
            window.location.href = redirectUrl;
            return; // Interromper a execução, pois o navegador será redirecionado
          }
        } catch (redirectError) {
          console.error('Erro ao tentar redirecionamento alternativo:', redirectError);
        }
      } else {
        toast({
          title: 'Erro ao fazer login',
          description: error instanceof Error ? error.message : 'Erro desconhecido ao fazer login com o Google.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
      // Se ainda não estiver conectado, definir como não conectado
      if (!GoogleDriveClient.isSignedIn()) {
        setConnectionStatus('not_connected');
      }
    }
  };
  
  // Função para fazer logout do Google
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await GoogleDriveClient.signOut();
      setIsSignedIn(false);
      toast({
        title: 'Logout realizado com sucesso',
        description: 'Você foi desconectado do Google Drive.'
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro ao fazer logout',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao fazer logout do Google.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para salvar dados no Google Drive
  const handleSaveToGoogleDrive = async () => {
    if (!isSignedIn) {
      await handleSignIn();
      if (!GoogleDriveClient.isSignedIn()) {
        return; // Se o login falhar, não continua
      }
    }
    
    try {
      setIsLoading(true);
      await GoogleDriveClient.saveDataToDrive(
        borrowers,
        loans,
        payments,
        settings,
        useEncryption
      );
      
      setLastSyncTime(new Date().toISOString());
      setSyncStatus('Dados salvos com sucesso no Google Drive');
      
      toast({
        title: 'Dados salvos no Google Drive',
        description: `Seus dados foram ${useEncryption ? 'criptografados e ' : ''}salvos com sucesso no Google Drive.`
      });
    } catch (error) {
      console.error('Erro ao salvar no Google Drive:', error);
      setSyncStatus('Erro ao salvar dados');
      
      toast({
        title: 'Erro ao salvar no Google Drive',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao salvar dados no Google Drive.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para carregar dados do Google Drive
  const handleLoadFromGoogleDrive = async () => {
    if (!isSignedIn) {
      await handleSignIn();
      if (!GoogleDriveClient.isSignedIn()) {
        return; // Se o login falhar, não continua
      }
    }
    
    try {
      setIsLoading(true);
      const data = await GoogleDriveClient.loadDataFromDrive(useEncryption);
      
      if (!data) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não foram encontrados dados salvos no Google Drive.',
          variant: 'default'
        });
        return;
      }
      
      // Importar os dados carregados
      try {
        importData(JSON.stringify({
          borrowers: data.borrowers,
          loans: data.loans,
          payments: data.payments
        }));
        
        // Atualizar configurações se disponíveis
        if (data.settings) {
          updateSettings(data.settings);
        }
        
        setLastSyncTime(data.lastSyncTime);
        setSyncStatus('Dados carregados com sucesso do Google Drive');
        
        toast({
          title: 'Dados carregados com sucesso',
          description: `Seus dados foram ${useEncryption ? 'descriptografados e ' : ''}carregados com sucesso do Google Drive.`
        });
      } catch (importError) {
        console.error('Erro ao importar dados do Google Drive:', importError);
        toast({
          title: 'Erro ao importar dados',
          description: 'Os dados foram carregados do Google Drive, mas houve um erro ao importá-los.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar do Google Drive:', error);
      setSyncStatus('Erro ao carregar dados');
      
      toast({
        title: 'Erro ao carregar do Google Drive',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados do Google Drive.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para sincronizar manualmente os dados com o Google Drive
  const handleSyncWithGoogleDrive = async () => {
    if (!isSignedIn) {
      await handleSignIn();
      if (!GoogleDriveClient.isSignedIn()) {
        return; // Se o login falhar, não continua
      }
    }
    
    try {
      setIsLoading(true);
      const result = await GoogleDriveClient.syncWithGoogleDrive(
        borrowers,
        loans,
        payments,
        settings,
        useEncryption
      );
      
      if (result.success) {
        setLastSyncTime(new Date().toISOString());
        setSyncStatus('Sincronização concluída com sucesso');
        
        toast({
          title: 'Sincronização concluída',
          description: result.message
        });
      } else {
        setSyncStatus('Erro na sincronização');
        
        toast({
          title: 'Erro na sincronização',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro na sincronização com Google Drive:', error);
      setSyncStatus('Erro na sincronização');
      
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro desconhecido na sincronização com Google Drive.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatar a data da última sincronização
  const formattedLastSyncTime = lastSyncTime 
    ? new Date(lastSyncTime).toLocaleString() 
    : 'Nunca sincronizado';
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-blue-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <Cloud className="h-5 w-5 mr-2 text-blue-500" />
          Integração com Google Drive
        </CardTitle>
        <CardDescription>
          Sincronize seus dados com o Google Drive para backup e acesso em múltiplos dispositivos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {missingClientId ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Configuração Incompleta</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  O ID do cliente do Google não foi configurado. A integração com o Google Drive não estará disponível até que o ID do cliente seja fornecido nas variáveis de ambiente.
                </p>
              </div>
            </div>
          </div>
        ) : typeof window === 'undefined' || typeof window.gapi === 'undefined' ? (
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-start">
              <Cloud className="h-5 w-5 mr-2 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">API do Google não disponível</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  O SDK do Google não está disponível no ambiente atual. Esta funcionalidade estará disponível quando o aplicativo for acessado em um ambiente de produção com acesso completo às APIs do Google.
                </p>
                <p className="text-sm text-amber-500 mt-2 font-medium">
                  Se estiver vendo um erro "redirect_uri_mismatch", você precisa configurar as URIs de redirecionamento autorizadas no Console do Google Cloud para incluir a URL atual: {window.location.origin + window.location.pathname}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Status de Conexão */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium flex items-center">
                    {isSignedIn ? (
                      <><Cloud className="h-4 w-4 mr-2 text-green-500" /> Conectado ao Google Drive</>
                    ) : (
                      <><CloudOff className="h-4 w-4 mr-2 text-slate-500" /> Não conectado</>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSignedIn 
                      ? 'Sua conta está conectada e pronta para sincronização'
                      : 'Faça login para habilitar a sincronização com o Google Drive'}
                  </p>
                </div>
                <div>
                  {isSignedIn ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSignOut}
                      disabled={isLoading}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleSignIn}
                      disabled={!isInitialized || isLoading}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Exibir erro se houver problemas de conexão */}
              {connectionStatus === 'error' && lastError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h5 className="text-sm font-medium text-red-800 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> 
                    Erro na conexão
                  </h5>
                  <p className="text-xs text-red-700 mt-1">{lastError}</p>
                </div>
              )}
              
              {/* Guia de configuração do Google Drive */}
              {!isSignedIn && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <h5 className="text-sm font-medium text-blue-800">
                    Como configurar o Google Drive
                  </h5>
                  <ol className="text-xs text-blue-700 mt-1 list-decimal pl-4 space-y-1">
                    <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Console do Google Cloud</a></li>
                    <li>Crie um novo projeto ou selecione um existente</li>
                    <li>Vá para "APIs e Serviços" &gt; "Biblioteca" e ative a API do Google Drive</li>
                    <li>Vá para "APIs e Serviços" &gt; "Credenciais"</li>
                    <li>Crie ou edite uma credencial do tipo "ID do cliente OAuth"</li>
                    <li>Em "Escopos de OAuth", adicione o escopo completo para o Google Drive:
                      <code className="block bg-blue-100 p-1 mt-1 mb-1 font-mono text-xs overflow-auto">
                        https://www.googleapis.com/auth/drive
                      </code>
                    </li>
                    <li>Adicione as seguintes URLs às URIs de redirecionamento autorizadas:
                      <code className="block bg-blue-100 p-1 mt-1 mb-1 font-mono text-xs overflow-auto">
                        {window.location.origin}
                      </code>
                      <code className="block bg-blue-100 p-1 mb-1 font-mono text-xs overflow-auto">
                        {window.location.origin + window.location.pathname}
                      </code>
                      <code className="block bg-blue-100 p-1 mb-1 font-mono text-xs overflow-auto">
                        {window.location.origin + '/auth/callback'}
                      </code>
                    </li>
                    <li>Em "Origens JavaScript autorizadas", adicione:
                      <code className="block bg-blue-100 p-1 mt-1 font-mono text-xs overflow-auto">
                        {window.location.origin}
                      </code>
                    </li>
                    <li>Salve as alterações e tente conectar novamente</li>
                    <li className="font-semibold text-amber-600">Importante: Esta aplicação requer permissões completas para o Google Drive a fim de criar e gerenciar seus arquivos de backup.</li>
                  </ol>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => {
                        // Cria uma URL com o ID do cliente para verificar se é válido
                        const testUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=https://www.googleapis.com/auth/drive&response_type=token&include_granted_scopes=true`;
                        
                        // Abre uma pequena janela para testar se o cliente ID é válido
                        const testWindow = window.open(testUrl, 'Teste de Credenciais', 'width=600,height=600');
                        
                        // Alerta o usuário sobre o que está acontecendo
                        toast({
                          title: 'Verificando credenciais',
                          description: 'Uma janela foi aberta para verificar se suas credenciais do Google estão configuradas corretamente.',
                        });
                        
                        // Fecha a janela após 10 segundos
                        setTimeout(() => {
                          if (testWindow) testWindow.close();
                        }, 10000);
                      }}
                    >
                      <Shield className="h-3.5 w-3.5 mr-1" /> Verificar credenciais
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => {
                        // Revogar o acesso e limpar os tokens
                        const shouldRevoke = window.confirm(
                          "Esta ação vai revogar completamente seu acesso atual ao Google Drive e remover todos os tokens salvos. " +
                          "Você precisará autorizar novamente com o escopo completo. Deseja continuar?"
                        );
                        
                        if (shouldRevoke) {
                          try {
                            // Revogar o token atual
                            const gapi = window.gapi;
                            if (gapi && gapi.auth2) {
                              const authInstance = gapi.auth2.getAuthInstance();
                              if (authInstance.isSignedIn.get()) {
                                const user = authInstance.currentUser.get();
                                user.disconnect().then(() => {
                                  authInstance.signOut().then(() => {
                                    // Redirecionar para a página de revogação do Google
                                    window.open('https://myaccount.google.com/permissions', '_blank');
                                    
                                    toast({
                                      title: 'Acesso revogado',
                                      description: 'Seu acesso ao Google Drive foi revogado. Uma nova janela foi aberta para que você também remova a permissão no Google.',
                                    });
                                    
                                    // Recarregar a página para limpar qualquer estado
                                    setTimeout(() => {
                                      window.location.reload();
                                    }, 3000);
                                  });
                                });
                              } else {
                                toast({
                                  title: 'Não conectado',
                                  description: 'Você não está conectado ao Google Drive no momento.',
                                });
                              }
                            }
                          } catch (error) {
                            console.error('Erro ao revogar acesso:', error);
                            toast({
                              title: 'Erro ao revogar acesso',
                              description: 'Ocorreu um erro ao tentar revogar o acesso. Tente novamente ou revogue manualmente em sua conta Google.',
                              variant: 'destructive'
                            });
                          }
                        }
                      }}
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1" /> Revogar acesso e começar de novo
                    </Button>
                  </div>
                </div>
              )}
              
              {isSignedIn && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>Última sincronização:</span>
                    <span className="font-mono">{formattedLastSyncTime}</span>
                  </div>
                  {syncStatus && (
                    <div className="mt-1">
                      <span>Status: {syncStatus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Ações de Sincronização */}
            {isSignedIn && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleSaveToGoogleDrive} 
                    variant="outline"
                    className="h-20 flex-col space-y-1"
                    disabled={isLoading}
                  >
                    <Upload className="h-5 w-5" />
                    <span>Salvar no Google Drive</span>
                  </Button>
                  
                  <Button 
                    onClick={handleLoadFromGoogleDrive} 
                    variant="outline"
                    className="h-20 flex-col space-y-1"
                    disabled={isLoading}
                  >
                    <Download className="h-5 w-5" />
                    <span>Carregar do Google Drive</span>
                  </Button>
                </div>
                
                <Button 
                  onClick={handleSyncWithGoogleDrive} 
                  variant="default"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Sincronizar Agora
                </Button>
                
                {/* Configurações */}
                <div className="space-y-3 mt-4">
                  <h4 className="font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-slate-500" />
                    Configurações de Sincronização
                  </h4>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <Label className="font-medium">Sincronização Automática</Label>
                      <p className="text-xs text-muted-foreground">
                        Sincroniza automaticamente ao fazer alterações
                      </p>
                    </div>
                    <Switch 
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                      disabled={!isSignedIn || isLoading}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <Label className="font-medium flex items-center">
                        <Shield className="h-4 w-4 mr-1 text-purple-500" />
                        Usar Criptografia
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Criptografa os dados antes de enviar para o Google Drive
                      </p>
                    </div>
                    <Switch 
                      checked={useEncryption}
                      onCheckedChange={setUseEncryption}
                      disabled={!isSignedIn || isLoading}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}