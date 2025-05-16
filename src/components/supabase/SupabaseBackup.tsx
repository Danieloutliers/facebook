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
  ServerIcon,
  RefreshCw, 
  Download, 
  LogIn, 
  LogOut, 
  Settings, 
  Shield, 
  Upload,
  AlertCircle,
  Database,
  Zap,
  Cog
} from 'lucide-react';

import * as SupabaseBackupClient from '@/utils/supabaseBackupClient';
import * as AutoSyncService from '@/utils/autoSyncService';
import { isBackupSupabaseConfigured } from '@/lib/backupSupabase';
import { getAutoSyncEnabled, saveAutoSyncEnabled, getUseEncryption, saveUseEncryption } from '@/utils/cookieUtils';
import SupabaseConfig from './SupabaseConfig';

export default function SupabaseBackup() {
  const { toast } = useToast();
  const { borrowers, loans, payments, settings, updateSettings, importData } = useLoan();
  
  // Estados para controle da interface
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [useEncryption, setUseEncryption] = useState<boolean>(getUseEncryption());
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(getAutoSyncEnabled());
  
  // Verificar disponibilidade do Supabase ao iniciar
  useEffect(() => {
    const checkSupabaseAvailability = async () => {
      try {
        const available = await SupabaseBackupClient.isSupabaseAvailable();
        setIsAvailable(available);
        
        if (!available) {
          console.warn('Supabase não está disponível. Funcionalidades de backup na nuvem serão limitadas.');
        } else {
          console.log('Supabase está disponível para backups.');
          
          // Verificar se o bucket existe
          const bucketOk = await SupabaseBackupClient.ensureBucketExists();
          if (!bucketOk) {
            console.warn('Não foi possível criar ou acessar o bucket de backups no Supabase.');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar disponibilidade do Supabase:', error);
        setIsAvailable(false);
      }
    };
    
    if (isBackupSupabaseConfigured()) {
      checkSupabaseAvailability();
    }
  }, []);
  
  // Inicializar o serviço de sincronização automática e atualizar status
  useEffect(() => {
    // Configurar o serviço de autossincronização
    AutoSyncService.setUseEncryption(useEncryption);
    AutoSyncService.setAutoSyncEnabled(autoSyncEnabled);
    
    // Atualizar o status de sincronização periodicamente
    const statusInterval = setInterval(() => {
      const syncInfo = AutoSyncService.getSyncStatus();
      
      if (syncInfo.lastSyncTime) {
        setLastSyncTime(syncInfo.lastSyncTime);
      }
      
      if (syncInfo.status === 'syncing') {
        setSyncStatus('Sincronizando...');
      } else if (syncInfo.status === 'success') {
        setSyncStatus('Sincronização automática concluída');
      } else if (syncInfo.status === 'error' && syncInfo.errorMessage) {
        setSyncStatus(`Erro na sincronização: ${syncInfo.errorMessage}`);
      } else if (syncInfo.status === 'pending') {
        setSyncStatus('Aguardando sincronização...');
      }
    }, 1000);
    
    return () => clearInterval(statusInterval);
  }, [useEncryption, autoSyncEnabled]);
  
  // Função para salvar dados no Supabase
  const handleSaveToSupabase = async () => {
    try {
      setIsLoading(true);
      const result = await SupabaseBackupClient.saveDataToSupabase(
        borrowers,
        loans,
        payments,
        settings,
        useEncryption
      );
      
      if (result.success) {
        setLastSyncTime(new Date().toISOString());
        setSyncStatus('Dados salvos com sucesso no Supabase');
        
        toast({
          title: 'Dados salvos no Supabase',
          description: result.message
        });
      } else {
        setSyncStatus('Erro ao salvar dados');
        
        toast({
          title: 'Erro ao salvar no Supabase',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      setSyncStatus('Erro ao salvar dados');
      
      toast({
        title: 'Erro ao salvar no Supabase',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao salvar dados no Supabase.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para carregar dados do Supabase
  const handleLoadFromSupabase = async () => {
    try {
      setIsLoading(true);
      const data = await SupabaseBackupClient.loadDataFromSupabase(useEncryption);
      
      if (!data) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não foram encontrados dados salvos no Supabase.',
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
        setSyncStatus('Dados carregados com sucesso do Supabase');
        
        toast({
          title: 'Dados carregados com sucesso',
          description: `Seus dados foram ${useEncryption ? 'descriptografados e ' : ''}carregados com sucesso do Supabase.`
        });
      } catch (importError) {
        console.error('Erro ao importar dados do Supabase:', importError);
        toast({
          title: 'Erro ao importar dados',
          description: 'Os dados foram carregados do Supabase, mas houve um erro ao importá-los.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar do Supabase:', error);
      setSyncStatus('Erro ao carregar dados');
      
      toast({
        title: 'Erro ao carregar do Supabase',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados do Supabase.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para sincronizar manualmente os dados com o Supabase
  const handleSyncWithSupabase = async () => {
    try {
      setIsLoading(true);
      const result = await SupabaseBackupClient.syncWithSupabase(
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
      console.error('Erro na sincronização com Supabase:', error);
      setSyncStatus('Erro na sincronização');
      
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro desconhecido na sincronização com Supabase.',
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
    <Card className="overflow-hidden border-t-4 border-t-emerald-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2 text-emerald-500" />
          Backup com Supabase
        </CardTitle>
        <CardDescription>
          Armazene seus dados no Supabase para backup seguro e acesso em múltiplos dispositivos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Botão de configuração sempre visível no topo */}
        <div className="flex justify-end mb-2">
          <SupabaseConfig />
        </div>
        
        {!isBackupSupabaseConfigured() ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Configuração Incompleta</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  O Supabase não foi configurado. Para usar o backup no Supabase, você precisa:
                </p>
                <ol className="text-sm text-amber-700 dark:text-amber-400 mt-2 list-decimal pl-5 space-y-1">
                  <li>Criar uma conta no <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase</a></li>
                  <li>Criar um novo projeto</li>
                  <li>No painel do projeto, ir para "Storage" e criar um bucket (ex: "loanbuddy")</li>
                  <li>Nas políticas do bucket, adicionar permissão para ações de inserção e leitura</li>
                  <li>Copiar a URL do projeto e chave anônima nas configurações de API</li>
                </ol>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                  Use o botão "Configurar" acima para adicionar suas credenciais do Supabase.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Após configurar, recarregue a página para aplicar as configurações.
                </p>
              </div>
            </div>
          </div>
        ) : !isAvailable ? (
          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md border border-red-200 dark:border-red-800">
            <div className="flex items-start">
              <ServerIcon className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">Supabase: Erro de Permissão</h4>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Conectamos ao Supabase, mas não conseguimos criar ou acessar nenhum bucket de armazenamento devido a restrições de permissão.
                </p>
                <h5 className="font-medium text-red-800 dark:text-red-300 mt-3">Como resolver:</h5>
                <ol className="text-sm text-red-700 dark:text-red-400 mt-1 list-decimal pl-5 space-y-1">
                  <li>No painel do Supabase, acesse "Storage"</li>
                  <li>Crie um bucket chamado "loanbuddy"</li>
                  <li>Clique na aba "Policies"</li>
                  <li>Adicione uma política para INSERT com a condição <code className="bg-white/30 px-1 rounded">true</code></li>
                  <li>Adicione uma política para SELECT com a condição <code className="bg-white/30 px-1 rounded">true</code></li>
                  <li>Após configurar as permissões, recarregue a página</li>
                </ol>
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
                    <Database className="h-4 w-4 mr-2 text-green-500" /> Conectado ao Supabase
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seu backup na nuvem está configurado e pronto para uso
                  </p>
                </div>
                <SupabaseConfig />
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Última sincronização:</span>
                  <span className="font-mono">{formattedLastSyncTime}</span>
                </div>
                {syncStatus && (
                  <div className="mt-1 flex items-center justify-between">
                    <span>Status: {syncStatus}</span>
                    {autoSyncEnabled && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Zap className="h-3 w-3" />
                        Auto
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Ações de Sincronização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleSaveToSupabase} 
                variant="outline"
                className="h-20 flex-col space-y-1"
                disabled={isLoading}
              >
                <Upload className="h-5 w-5" />
                <span>Salvar no Supabase</span>
              </Button>
              
              <Button 
                onClick={handleLoadFromSupabase} 
                variant="outline"
                className="h-20 flex-col space-y-1"
                disabled={isLoading}
              >
                <Download className="h-5 w-5" />
                <span>Carregar do Supabase</span>
              </Button>
            </div>
            
            <Button 
              onClick={handleSyncWithSupabase} 
              variant="default"
              className="w-full h-12"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
            
            {/* Configurações */}
            <div className="space-y-3 mt-4">
              <h4 className="font-medium flex items-center">
                <Settings className="h-4 w-4 mr-2 text-slate-500" />
                Configurações de Backup
              </h4>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Sincronização Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Sincroniza automaticamente com o Supabase quando houver mudanças
                  </p>
                </div>
                <Switch
                  checked={autoSyncEnabled}
                  onCheckedChange={(enabled) => {
                    // Atualiza o estado local
                    setAutoSyncEnabled(enabled);
                    
                    // Atualiza o serviço de sincronização
                    AutoSyncService.setAutoSyncEnabled(enabled);
                    
                    // Salva a configuração no cookie
                    saveAutoSyncEnabled(enabled);
                    
                    if (enabled) {
                      // Faz a primeira sincronização para garantir que os dados estejam salvos
                      AutoSyncService.scheduleSync(borrowers, loans, payments, settings);
                      
                      toast({
                        title: "Sincronização automática ativada",
                        description: "Seus dados serão sincronizados automaticamente quando houver mudanças"
                      });
                    } else {
                      toast({
                        title: "Sincronização automática desativada",
                        description: "Seus dados precisarão ser sincronizados manualmente"
                      });
                    }
                  }}
                  aria-label="Ativar sincronização automática"
                />
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Criptografia</Label>
                  <p className="text-xs text-muted-foreground">
                    Proteja seus dados com senha antes de armazenar no Supabase
                  </p>
                </div>
                <Switch
                  checked={useEncryption}
                  onCheckedChange={(enabled) => {
                    // Atualiza o estado local
                    setUseEncryption(enabled);
                    
                    // Atualiza o serviço de sincronização
                    AutoSyncService.setUseEncryption(enabled);
                    
                    // Salva a configuração no cookie
                    saveUseEncryption(enabled);
                    
                    toast({
                      title: enabled ? "Criptografia ativada" : "Criptografia desativada",
                      description: enabled 
                        ? "Seus dados serão criptografados antes de serem enviados ao Supabase" 
                        : "Seus dados serão armazenados sem criptografia no Supabase"
                    });
                  }}
                  aria-label="Ativar criptografia"
                />
              </div>
            </div>
            
            {useEncryption && (
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md text-xs text-blue-700 dark:text-blue-400">
                <div className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p>
                    Com a criptografia ativada, você precisará fornecer uma senha para salvar e carregar seus dados. 
                    Esta senha não é armazenada em nenhum lugar e não pode ser recuperada se for perdida.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}