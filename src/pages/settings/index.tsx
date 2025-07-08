import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { useLoan } from "@/context/LoanContext";
import { useTheme } from "next-themes";
import { PaymentFrequency } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Upload, 
  Save, 
  AlertCircle, 
  Trash, 
  Info,
  Sliders,
  BellRing,
  PiggyBank,
  DollarSign,
  HandCoins,
  Settings as SettingsIcon,
  Calendar,
  Moon,
  Sun,
  Globe,
  Database,
  HardDrive,
  Save as SaveIcon,
  BellOff,
  Smartphone,
  Lock,
  KeyRound,
  Shield,
  Cloud,
  X
} from "lucide-react";
// Removida integração com Google Drive
import SupabaseBackup from "@/components/supabase/SupabaseBackup";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { 
  isPersistenceEnabled, 
  setPersistenceEnabled, 
  getPersistenceStatusMessage,
  resetAllDataForProduction,
  clearAllData
} from "@/lib/localStorageClient";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/utils/csvHelpers";
import { 
  createBackup, 
  downloadBackup, 
  validateBackup, 
  isEncryptedBackup,
  decryptBackup,
  BackupData,
  EncryptedBackupData 
} from "@/utils/backupHelpers";
import { promptForPassword } from "@/utils/cryptoUtils";
import NotificationTester from "@/components/shared/NotificationTester";
import { useLock } from "@/context/LockContext";
import { SetPasswordDialog } from "@/components/lock/SetPasswordDialog";


// Form schema
const settingsFormSchema = z.object({
  defaultInterestRate: z.coerce.number().min(0, "Taxa deve ser maior ou igual a zero"),
  defaultPaymentFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"] as const),
  defaultInstallments: z.coerce.number().int().positive("Número de parcelas deve ser positivo"),
  currency: z.string().min(1, "Moeda não pode estar vazia"),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const { settings, updateSettings, exportData, importData, borrowers, loans, payments } = useLoan();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  // Estado para backup/importação
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const fileInputJsonRef = useRef<HTMLInputElement>(null);
  const fileInputCsvRef = useRef<HTMLInputElement>(null);
  
  // Estado para notificações - inicializado a partir das configurações
  const [enableNotifications, setEnableNotifications] = useState<boolean>(
    settings.enableNotifications ?? true
  );
  const [notifyLatePayments, setNotifyLatePayments] = useState<boolean>(true);
  const [paymentReminderDays, setPaymentReminderDays] = useState<number>(
    settings.paymentReminderDays ?? 3
  );
  const [autoLock, setAutoLock] = useState<boolean>(settings.autoLockEnabled ?? false);
  const [lockTimeout, setLockTimeout] = useState<string>((settings.lockTimeoutMinutes ?? 15).toString());
  
  // Estado para persistência de dados
  const [persistenceEnabled, setPersistenceState] = useState<boolean>(() => isPersistenceEnabled());
  const [persistenceStatusMessage, setPersistenceStatusMessage] = useState<string>(getPersistenceStatusMessage());
  
  // Estado para controlar a visibilidade do Backup do Supabase
  const [showSupabaseBackup, setShowSupabaseBackup] = useState<boolean>(false);
  
  // Estado para diálogo de senha de bloqueio
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  
  // Hook de bloqueio
  const { hasLockPassword, lockApp, clearLockPassword } = useLock();
  
  // Atualize a mensagem de status de persistência quando o estado mudar
  useEffect(() => {
    setPersistenceStatusMessage(getPersistenceStatusMessage());
    
    // Adicione a persistência ao objeto de configurações
    if (settings.persistenceEnabled !== persistenceEnabled) {
      updateSettings({
        ...settings,
        persistenceEnabled: persistenceEnabled
      });
    }
  }, [persistenceEnabled, settings, updateSettings]);
  
  // Atualizar estados locais quando as configurações mudarem
  useEffect(() => {
    setEnableNotifications(settings.enableNotifications ?? true);
    setPaymentReminderDays(settings.paymentReminderDays ?? 3);
    setAutoLock(settings.autoLockEnabled ?? false);
    setLockTimeout((settings.lockTimeoutMinutes ?? 15).toString());
  }, [settings.enableNotifications, settings.paymentReminderDays, settings.autoLockEnabled, settings.lockTimeoutMinutes]);
  
  // Função para alternar o estado de persistência
  const togglePersistence = (enabled: boolean) => {
    setPersistenceState(enabled);
    setPersistenceEnabled(enabled);
  };
  
  // Função para alternar estado de notificações
  const toggleNotifications = async (enabled: boolean) => {
    setEnableNotifications(enabled);
    
    // Se estiver ativando as notificações, solicitar permissão se ainda não tiver
    if (enabled) {
      try {
        // Verificar se as notificações são suportadas
        if ('Notification' in window) {
          // Se a permissão ainda não foi decidida, solicitar ao usuário
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
              toast({
                title: "Permissão de notificação concedida",
                description: "Você receberá notificações de empréstimos próximos ou atrasados."
              });
            } else {
              toast({
                title: "Notificações bloqueadas",
                description: "As notificações estão habilitadas nas configurações, mas o navegador está bloqueando-as.",
                variant: "destructive"
              });
            }
          }
        }
      } catch (error) {
        console.error("Erro ao solicitar permissão de notificação:", error);
      }
    }
    
    // Atualizar imediatamente para que as notificações comecem/parem
    updateSettings({
      ...settings,
      enableNotifications: enabled
    });
  };
  
  // Função para atualizar os dias de lembrete
  const updateReminderDays = (days: number) => {
    setPaymentReminderDays(days);
    // Atualizar imediatamente para que as notificações usem o novo valor
    updateSettings({
      ...settings,
      paymentReminderDays: days
    });
  };

  // Set up form with default values
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      defaultInterestRate: settings.defaultInterestRate,
      defaultPaymentFrequency: settings.defaultPaymentFrequency,
      defaultInstallments: settings.defaultInstallments,
      currency: settings.currency,
    },
  });

  function onSubmit(data: SettingsFormValues) {
    // Salvar todas as configurações incluindo as novas configurações de notificação e bloqueio
    updateSettings({
      ...data,
      enableNotifications: enableNotifications,
      paymentReminderDays: paymentReminderDays,
      autoLockEnabled: autoLock,
      lockTimeoutMinutes: parseInt(lockTimeout),
      // Manter a configuração de persistência
      persistenceEnabled: persistenceEnabled,
    });
    
    toast({
      title: "Configurações Atualizadas",
      description: "Suas configurações foram salvas com sucesso."
    });
  }
  
  // Função para alternar o bloqueio automático
  const toggleAutoLock = (enabled: boolean) => {
    if (enabled && !hasLockPassword) {
      // Se tentando ativar mas não tem senha, abrir diálogo
      setIsEditingPassword(false);
      setShowPasswordDialog(true);
      return;
    }
    
    setAutoLock(enabled);
    // Salvar imediatamente
    updateSettings({
      ...settings,
      autoLockEnabled: enabled
    });
    
    toast({
      title: enabled ? "Bloqueio automático ativado" : "Bloqueio automático desativado",
      description: enabled 
        ? `O app será bloqueado após ${lockTimeout} minutos de inatividade`
        : "O app não será mais bloqueado automaticamente"
    });
  };
  
  // Função para alterar tempo de bloqueio
  const handleLockTimeoutChange = (value: string) => {
    setLockTimeout(value);
    // Salvar imediatamente
    updateSettings({
      ...settings,
      lockTimeoutMinutes: parseInt(value)
    });
  };
  
  // Função para abrir diálogo de alteração de senha
  const handleChangePassword = () => {
    setIsEditingPassword(true);
    setShowPasswordDialog(true);
  };
  
  // Função para bloquear manualmente
  const handleManualLock = () => {
    if (hasLockPassword) {
      lockApp();
    } else {
      toast({
        title: "Senha não definida",
        description: "Defina uma senha de bloqueio primeiro.",
        variant: "destructive"
      });
    }
  };

  // Função para remover senha de bloqueio
  const handleRemovePassword = () => {
    if (window.confirm('Tem certeza que deseja remover a senha de bloqueio? O app não será mais protegido.')) {
      clearLockPassword();
      toast({
        title: "Senha removida",
        description: "A senha de bloqueio foi removida. O app não será mais bloqueado automaticamente."
      });
    }
  };
  
  // Handler para exportar backup em CSV
  function handleExportCsv() {
    const csvData = exportData();
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `loanbuddy_export_${date}.csv`);
    
    toast({
      title: "Dados exportados",
      description: "Os dados foram exportados com sucesso em formato CSV."
    });
  }
  
  // Handler para exportar backup em JSON (sem criptografia)
  function handleExportJson() {
    setIsCreatingBackup(true);
    
    try {
      const backupData = createBackup(
        borrowers, 
        loans, 
        payments, 
        settings,
        `Backup manual - ${new Date().toLocaleString()}`
      );
      
      downloadBackup(backupData, false);
      
      toast({
        title: "Backup criado",
        description: "O backup foi criado e baixado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao criar backup:", error);
      toast({
        title: "Erro ao criar backup",
        description: "Ocorreu um erro ao criar o backup. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  }
  
  // Handler para exportar backup em JSON (com criptografia)
  async function handleExportEncryptedJson() {
    setIsCreatingBackup(true);
    
    try {
      // Criar o objeto de backup
      let backupData;
      try {
        backupData = createBackup(
          borrowers, 
          loans, 
          payments, 
          settings,
          `Backup criptografado - ${new Date().toLocaleString()}`
        );
      } catch (createError) {
        console.error("Erro ao criar dados de backup:", createError);
        toast({
          title: "Erro na preparação do backup",
          description: "Não foi possível criar o backup. Verifique os dados ou tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        // O segundo parâmetro 'true' instrui a função a solicitar uma senha
        // e criptografar os dados antes de fazer o download
        await downloadBackup(backupData, true);
        
        toast({
          title: "Backup criptografado criado",
          description: "O backup criptografado foi criado e baixado com sucesso."
        });
      } catch (downloadError) {
        console.error("Erro ao baixar backup criptografado:", downloadError);
        
        // Se o erro for devido ao cancelamento pelo usuário, mostrar uma mensagem adequada
        if (downloadError instanceof Error && 
            (downloadError.message.includes('cancelada') || 
             downloadError.message.includes('canceled'))) {
          toast({
            title: "Operação cancelada",
            description: "A criação do backup criptografado foi cancelada pelo usuário.",
            variant: "default"
          });
        } else {
          toast({
            title: "Erro ao criar backup criptografado",
            description: "Ocorreu um erro ao criar o backup criptografado. Por favor, tente novamente.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Erro geral ao criar backup criptografado:", error);
      toast({
        title: "Falha na operação",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  }
  
  // Handler para importação de CSV
  function handleImportCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          importData(content);
          
          toast({
            title: "Dados importados",
            description: "Os dados foram importados com sucesso do arquivo CSV."
          });
          
          // Limpar o input
          if (fileInputCsvRef.current) {
            fileInputCsvRef.current.value = "";
          }
        } catch (error) {
          console.error("Erro na importação:", error);
          toast({
            title: "Erro na importação",
            description: error instanceof Error ? error.message : "Erro desconhecido na importação de dados",
            variant: "destructive"
          });
        }
      }
    };
    reader.readAsText(file);
  }
  
  // Handler para importação de JSON (normal ou criptografado)
  async function handleImportJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error("Arquivo vazio");
        
        // Analisar o conteúdo do arquivo
        let jsonData;
        try {
          jsonData = JSON.parse(content);
        } catch (parseError) {
          throw new Error("O arquivo não contém JSON válido");
        }
        
        // Validar o backup (verificará automaticamente se é criptografado)
        const validation = validateBackup(jsonData);
        
        // Se for um backup criptografado
        if (validation.encrypted) {
          try {
            // Solicitar senha ao usuário
            let password = null;
            try {
              password = await promptForPassword(true);
            } catch (passwordError) {
              console.error("Erro ao solicitar senha:", passwordError);
              toast({
                title: "Erro ao solicitar senha",
                description: "Não foi possível abrir o diálogo de senha. Tente novamente.",
                variant: "destructive"
              });
              return;
            }
            
            // Se o usuário cancelou, abortar
            if (!password) {
              toast({
                title: "Importação cancelada",
                description: "A operação foi cancelada pelo usuário.",
                variant: "default"
              });
              return;
            }
            
            // Descriptografar o backup
            const encryptedBackup = jsonData as EncryptedBackupData;
            let decryptedBackup;
            try {
              decryptedBackup = await decryptBackup(encryptedBackup, password);
            } catch (decryptError) {
              console.error("Erro ao descriptografar backup:", decryptError);
              toast({
                title: "Erro na descriptografia",
                description: "Falha ao descriptografar o backup. Verifique se a senha está correta.",
                variant: "destructive"
              });
              return;
            }
            
            // Realizar a importação com os dados descriptografados
            try {
              importData(JSON.stringify({
                borrowers: decryptedBackup.borrowers || [],
                loans: decryptedBackup.loans || [],
                payments: decryptedBackup.payments || []
              }));
              
              // Também importar configurações
              if (decryptedBackup.settings) {
                updateSettings(decryptedBackup.settings);
              }
              
              toast({
                title: "Backup criptografado restaurado",
                description: "Os dados foram descriptografados e restaurados com sucesso.",
              });
            } catch (importError) {
              console.error("Erro ao importar dados descriptografados:", importError);
              toast({
                title: "Erro na importação",
                description: "Os dados foram descriptografados mas houve erro ao importar.",
                variant: "destructive"
              });
              return;
            }
          } catch (encryptedProcessError) {
            console.error("Erro ao processar backup criptografado:", encryptedProcessError);
            toast({
              title: "Erro ao processar backup criptografado",
              description: "Ocorreu um erro inesperado ao processar o backup criptografado.",
              variant: "destructive"
            });
            return;
          }
        } 
        // Backup normal, não criptografado
        else { 
          if (!validation.valid) {
            toast({
              title: "Erro na importação",
              description: `Backup inválido: ${validation.errors.join(", ")}`,
              variant: "destructive"
            });
            return;
          }
          
          try {
            // Realizar a importação se dados válidos
            const backupData = jsonData as BackupData;
            importData(JSON.stringify({
              borrowers: backupData.borrowers || [],
              loans: backupData.loans || [],
              payments: backupData.payments || []
            }));
            
            // Também importar configurações
            if (backupData.settings) {
              updateSettings(backupData.settings);
            }
            
            toast({
              title: "Backup restaurado",
              description: "Os dados foram restaurados com sucesso do arquivo de backup."
            });
          } catch (importError) {
            console.error("Erro ao importar backup:", importError);
            toast({
              title: "Erro na importação",
              description: "Falha ao importar os dados do backup.",
              variant: "destructive"
            });
            return;
          }
        }
        
        // Limpar o input em todos os casos de sucesso
        if (fileInputJsonRef.current) {
          fileInputJsonRef.current.value = "";
        }
      } catch (error) {
        console.error("Erro ao processar arquivo JSON:", error);
        toast({
          title: "Erro na importação",
          description: error instanceof Error 
            ? error.message 
            : "O arquivo não contém um backup válido.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  }
  
  // Handler para limpar todos os dados (preserva as configurações)
  function handleResetData() {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita!')) {
      clearAllData();
      importData('RESET');
      toast({
        title: "Dados reiniciados",
        description: "Todos os dados foram removidos, mas suas configurações foram mantidas."
      });
    }
  }
  
  // Handler para resetar para produção (limpa TUDO, inclusive configurações)
  function handleResetForProduction() {
    if (window.confirm('ATENÇÃO: Você está prestes a limpar TODOS os dados para iniciar em modo de PRODUÇÃO. Todas as configurações também serão redefinidas. Esta ação não pode ser desfeita!\n\nDeseja continuar?')) {
      resetAllDataForProduction();
      toast({
        title: "Reset para produção concluído",
        description: "Sistema reiniciado para uso em produção. Todos os dados e configurações foram limpos.",
        variant: "destructive"
      });
      // Recarregar a página para garantir que todos os componentes sejam resetados
      setTimeout(() => window.location.reload(), 1500);
    }
  }
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Personalize o sistema de acordo com suas preferências</p>
        </div>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferências Gerais */}
        <Card className="overflow-hidden relative border-t-4 border-t-blue-500">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center mb-4">
              <Sliders className="h-5 w-5 mr-2 text-blue-500" />
              Preferências Gerais
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Tema</Label>
                  <p className="text-sm text-muted-foreground">Escolha entre tema claro ou escuro</p>
                </div>
                <div>
                  <Select
                    value={theme}
                    onValueChange={(value) => setTheme(value)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Moeda</Label>
                  <p className="text-sm text-muted-foreground">Formato de moeda para valores</p>
                </div>
                <div>
                  <Input 
                    value={settings.currency}
                    onChange={(e) => form.setValue("currency", e.target.value)}
                    className="w-36 text-center" 
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Formato de Data</Label>
                  <p className="text-sm text-muted-foreground">Como as datas serão exibidas</p>
                </div>
                <div>
                  <Select defaultValue="DD/MM/YYYY">
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Formato de data" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Persistência de Dados</Label>
                  <p className="text-sm text-muted-foreground">Salvar dados no navegador</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={persistenceEnabled}
                    onCheckedChange={togglePersistence}
                  />
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {persistenceStatusMessage}
                </p>
              </div>
              
              {/* Configurações de Bloqueio */}
              <div className="pt-4 mt-4 border-t">
                <div className="mb-3 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-primary" />
                  <h4 className="font-medium">Bloqueio do Aplicativo</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="py-2 border-b">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <Label className="font-medium">Senha de Bloqueio</Label>
                        <p className="text-sm text-muted-foreground">
                          {hasLockPassword ? 'Senha definida' : 'Nenhuma senha definida'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleChangePassword}
                          className="text-xs flex-shrink-0"
                        >
                          <KeyRound className="h-3 w-3 mr-1" />
                          {hasLockPassword ? 'Alterar' : 'Definir'}
                        </Button>
                        {hasLockPassword && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleManualLock}
                              className="text-xs flex-shrink-0"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Bloquear
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemovePassword}
                              className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex-shrink-0"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remover
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2 border-b">
                    <div>
                      <Label className="font-medium">Bloqueio Automático</Label>
                      <p className="text-sm text-muted-foreground">
                        {autoLock && hasLockPassword 
                          ? `Ativo (${lockTimeout} min)` 
                          : 'Inativo'
                        }
                      </p>
                    </div>
                    <Switch 
                      checked={autoLock && hasLockPassword}
                      onCheckedChange={toggleAutoLock}
                      disabled={!hasLockPassword}
                    />
                  </div>
                  
                  {autoLock && hasLockPassword && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-2 border-b">
                      <div>
                        <Label className="font-medium">Tempo para Bloqueio</Label>
                        <p className="text-sm text-muted-foreground">Minutos de inatividade</p>
                      </div>
                      <div>
                        <Select value={lockTimeout} onValueChange={handleLockTimeoutChange}>
                          <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Tempo de bloqueio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutos</SelectItem>
                            <SelectItem value="10">10 minutos</SelectItem>
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {!hasLockPassword && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md text-xs text-amber-700 dark:text-amber-400">
                      <p className="font-medium mb-1">Configure uma senha de bloqueio</p>
                      <p>Defina uma senha para ativar o bloqueio automático e proteger seus dados quando o app estiver inativo.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Notificações */}
        <Card className="overflow-hidden relative border-t-4 border-t-amber-500">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center mb-4">
              <BellRing className="h-5 w-5 mr-2 text-amber-500" />
              Notificações
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Ativar Notificações</Label>
                  <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={enableNotifications}
                    onCheckedChange={toggleNotifications}
                  />
                  {enableNotifications && (
                    'Notification' in window && Notification.permission === 'granted' ? (
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-800 dark:text-green-300">
                        Notificações ativas
                      </span>
                    ) : (
                      <button 
                        onClick={async () => {
                          try {
                            if ('Notification' in window) {
                              const permission = await Notification.requestPermission();
                              if (permission === 'granted') {
                                toast({
                                  title: "Permissão concedida",
                                  description: "Você receberá notificações de empréstimos próximos ou atrasados."
                                });
                              }
                            }
                          } catch (error) {
                            console.error("Erro ao solicitar permissão:", error);
                          }
                        }}
                        className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/30 cursor-pointer"
                      >
                        Permitir notificações
                      </button>
                    )
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Lembrete de Pagamento</Label>
                  <p className="text-sm text-muted-foreground">Dias antes do vencimento</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="14"
                    value={paymentReminderDays}
                    onChange={(e) => updateReminderDays(parseInt(e.target.value) || 3)}
                    className="w-20 text-center"
                  />
                  <span className="text-muted-foreground">dias</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Notificar Sobre Atrasos</Label>
                  <p className="text-sm text-muted-foreground">Alertas de pagamentos em atraso</p>
                </div>
                <Switch 
                  checked={notifyLatePayments}
                  onCheckedChange={setNotifyLatePayments}
                />
              </div>
              

              
              {/* Teste de Notificações iOS */}
              <div className="pt-4 mt-4 border-t">
                <div className="mb-3 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2 text-amber-500" />
                  <h4 className="font-medium">Teste de Notificações Push</h4>
                </div>
                <NotificationTester />
              </div>
            </div>
          </div>
        </Card>
        
        {/* Configurações de Empréstimos */}
        <Card className="overflow-hidden relative border-t-4 border-t-green-500">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center mb-4">
              <PiggyBank className="h-5 w-5 mr-2 text-green-500" />
              Configurações de Contratos
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Taxa de Juros Padrão</Label>
                  <p className="text-sm text-muted-foreground">Aplicado a novos contratos</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={settings.defaultInterestRate}
                    onChange={(e) => form.setValue("defaultInterestRate", Number(e.target.value))}
                    className="w-20 text-center"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Frequência de Pagamento</Label>
                  <p className="text-sm text-muted-foreground">Padrão para novos empréstimos</p>
                </div>
                <div>
                  <Select
                    value={settings.defaultPaymentFrequency}
                    onValueChange={(value: any) => form.setValue("defaultPaymentFrequency", value)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Número de Parcelas</Label>
                  <p className="text-sm text-muted-foreground">Padrão para novos empréstimos</p>
                </div>
                <div>
                  <Input 
                    type="number" 
                    min="1" 
                    step="1"
                    value={settings.defaultInstallments}
                    onChange={(e) => form.setValue("defaultInstallments", Number(e.target.value))}
                    className="w-20 text-center"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Dias de Carência</Label>
                  <p className="text-sm text-muted-foreground">Antes de considerar atraso</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    defaultValue="3"
                    className="w-20 text-center"
                  />
                  <span className="text-muted-foreground">dias</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Backup e Restauração */}
        <Card className="overflow-hidden relative border-t-4 border-t-purple-500">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center mb-4">
              <HandCoins className="h-5 w-5 mr-2 text-purple-500" />
              Backup e Importação
            </h3>
            
            <Alert className={`mb-6 ${
              persistenceEnabled 
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50" 
                : "bg-amber-50 dark:bg-yellow-900/20 border-amber-200 dark:border-yellow-900/50"
            }`}>
              {persistenceEnabled ? (
                <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              )}
              <AlertTitle>
                {persistenceEnabled 
                  ? "Recomendação de Backup" 
                  : "Seus dados não estão sendo salvos automaticamente"}
              </AlertTitle>
              <AlertDescription>
                {persistenceEnabled 
                  ? "Mesmo com a persistência ativada, é importante fazer backups regulares dos seus dados. Os backups permitem restaurar informações em caso de limpeza de cookies ou uso em outro dispositivo."
                  : "A persistência está desativada! Para evitar perder dados, faça um backup regularmente ou exporte-os para CSV. Você pode importar esses dados depois ou ativar a persistência nas preferências gerais."}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-5">
              <div>
                <h4 className="font-medium mb-2">Exportar Dados</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleExportJson}
                    variant="default"
                    disabled={isCreatingBackup}
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar JSON
                  </Button>
                  
                  <Button 
                    onClick={handleExportEncryptedJson}
                    variant="secondary"
                    disabled={isCreatingBackup}
                    size="sm"
                    className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Backup Criptografado
                  </Button>
                  
                  <Button 
                    onClick={handleExportCsv}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                  
                  <div className="w-full mt-2">
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Shield className="h-3.5 w-3.5 mr-1 text-purple-500 inline" />
                      O backup criptografado protege seus dados com uma senha que você define
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Importar Dados</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="json-import">Arquivo JSON:</Label>
                    <div className="flex mt-1">
                      <Input
                        id="json-import"
                        type="file"
                        ref={fileInputJsonRef}
                        accept=".json"
                        onChange={handleImportJson}
                        size={28}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <KeyRound className="h-3.5 w-3.5 mr-1 text-purple-500 inline" />
                      Suporta arquivos normais e criptografados (será solicitada senha se necessário)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="csv-import">Arquivo CSV:</Label>
                    <div className="flex mt-1">
                      <Input
                        id="csv-import"
                        type="file"
                        ref={fileInputCsvRef}
                        accept=".csv"
                        onChange={handleImportCsv}
                        size={28}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Reiniciar Dados</h4>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="destructive"
                      onClick={handleResetData}
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Limpar Dados (Manter Configurações)
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-800 flex-1 sm:flex-none"
                      onClick={handleResetForProduction}
                      size="sm"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Reset para Produção
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    O "Reset para Produção" limpa todos os dados, incluindo configurações, deixando o sistema pronto para uso em ambiente de produção.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Integração com Supabase para backup em nuvem - só aparece quando o cifrão é clicado */}
        {showSupabaseBackup && (
          <Card className="overflow-hidden border-t-4 border-t-emerald-500 md:col-span-2 animate-fadeIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Database className="h-5 w-5 mr-2 text-emerald-500" />
                  Backup com Supabase (Recurso Secreto)
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSupabaseBackup(false)}
                  className="h-8 w-8 p-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </Button>
              </div>
              <SupabaseBackup />
            </div>
          </Card>
        )}
        
        {/* Sobre o LoanBuddy */}
        <Card className="overflow-hidden relative border-t-4 border-t-indigo-500 md:col-span-2">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center mb-4">
              <Info className="h-5 w-5 mr-2 text-indigo-500" />
              Sobre o LoanBuddy
            </h3>
            
            <div className="flex items-center">
              <div className="mr-6 text-center">
                <div 
                  className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center rounded-xl mx-auto cursor-pointer transition-all hover:shadow-lg transform hover:scale-105 active:scale-95"
                  onClick={() => setShowSupabaseBackup(prev => !prev)}
                  title="Clique aqui para revelar opções de backup com Supabase"
                >
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium">LoanBuddy</h4>
                <p className="text-sm text-muted-foreground">Sistema de gerenciamento de empréstimos</p>
                <p className="text-sm text-muted-foreground">Versão 2.5.0</p>
                <p className="text-sm text-muted-foreground mt-1">© 2025 Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Diálogo de configuração de senha */}
      <SetPasswordDialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          // Se fechou o diálogo e estava tentando ativar o bloqueio, desmarcar o switch
          if (!open && !isEditingPassword && !hasLockPassword) {
            setAutoLock(false);
          }
        }}
        isEditing={isEditingPassword}
      />
    </div>
  );
}
