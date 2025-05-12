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
  Smartphone
} from "lucide-react";
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
import { createBackup, downloadBackup, validateBackup, BackupData } from "@/utils/backupHelpers";
import NotificationTester from "@/components/shared/NotificationTester";

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
  
  // Estado para notificações
  const [enableNotifications, setEnableNotifications] = useState<boolean>(true);
  const [notifyLatePayments, setNotifyLatePayments] = useState<boolean>(true);
  const [paymentReminderDays, setPaymentReminderDays] = useState<number>(3);
  const [autoLock, setAutoLock] = useState<boolean>(false);
  const [lockTimeout, setLockTimeout] = useState<string>("15");
  
  // Estado para persistência de dados
  const [persistenceEnabled, setPersistenceState] = useState<boolean>(() => isPersistenceEnabled());
  const [persistenceStatusMessage, setPersistenceStatusMessage] = useState<string>(getPersistenceStatusMessage());
  
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
  
  // Função para alternar o estado de persistência
  const togglePersistence = (enabled: boolean) => {
    setPersistenceState(enabled);
    setPersistenceEnabled(enabled);
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
    // Salvar alterações gerais
    updateSettings(data);
    
    // Salvar outras configurações (simular para fins da interface)
    // Em uma aplicação real, estas também deveriam ser persistidas
    toast({
      title: "Configurações Atualizadas",
      description: "Suas configurações foram salvas com sucesso."
    });
  }
  
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
  
  // Handler para exportar backup em JSON
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
      
      downloadBackup(backupData);
      
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
  
  // Handler para importação de JSON
  function handleImportJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error("Arquivo vazio");
        
        const backupData = JSON.parse(content) as BackupData;
        const validation = validateBackup(backupData);
        
        if (!validation.valid) {
          toast({
            title: "Erro na importação",
            description: `Backup inválido: ${validation.errors.join(", ")}`,
            variant: "destructive"
          });
          return;
        }
        
        // Realizar a importação se dados válidos
        importData(JSON.stringify({
          borrowers: backupData.borrowers,
          loans: backupData.loans,
          payments: backupData.payments
        }));
        
        // Também importar configurações
        updateSettings(backupData.settings);
        
        toast({
          title: "Backup restaurado",
          description: "Os dados foram restaurados com sucesso do arquivo de backup."
        });
        
        // Limpar o input
        if (fileInputJsonRef.current) {
          fileInputJsonRef.current.value = "";
        }
      } catch (error) {
        console.error("Erro ao processar arquivo JSON:", error);
        toast({
          title: "Erro na importação",
          description: "O arquivo não contém um backup válido.",
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
                <Switch 
                  checked={enableNotifications}
                  onCheckedChange={setEnableNotifications}
                />
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
                    onChange={(e) => setPaymentReminderDays(parseInt(e.target.value) || 3)}
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
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Bloqueio Automático</Label>
                  <p className="text-sm text-muted-foreground">Bloquear após período de inatividade</p>
                </div>
                <Switch 
                  checked={autoLock}
                  onCheckedChange={setAutoLock}
                />
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Tempo para Bloqueio</Label>
                  <p className="text-sm text-muted-foreground">Minutos de inatividade</p>
                </div>
                <div>
                  <Select value={lockTimeout} onValueChange={setLockTimeout}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Tempo de bloqueio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              Configurações de Empréstimos
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <Label className="font-medium">Taxa de Juros Padrão</Label>
                  <p className="text-sm text-muted-foreground">Aplicado a novos empréstimos</p>
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
                <div className="flex gap-2">
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
                    onClick={handleExportCsv}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
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
                <div className="space-y-2">
                  <Button 
                    variant="destructive"
                    onClick={handleResetData}
                    size="sm"
                    className="mr-2"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Limpar Dados (Manter Configurações)
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-800"
                    onClick={handleResetForProduction}
                    size="sm"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Reset para Produção
                  </Button>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    O "Reset para Produção" limpa todos os dados, incluindo configurações, deixando o sistema pronto para uso em ambiente de produção.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Sobre o LoanBuddy */}
        <Card className="overflow-hidden relative border-t-4 border-t-indigo-500 md:col-span-2">
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center mb-4">
              <Info className="h-5 w-5 mr-2 text-indigo-500" />
              Sobre o LoanBuddy
            </h3>
            
            <div className="flex items-center">
              <div className="mr-6 text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center rounded-xl mx-auto">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium">LoanBuddy</h4>
                <p className="text-sm text-muted-foreground">Sistema de gerenciamento de empréstimos</p>
                <p className="text-sm text-muted-foreground">Versão 1.0.0</p>
                <p className="text-sm text-muted-foreground mt-1">© 2025 Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
