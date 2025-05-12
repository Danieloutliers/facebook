import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { useLoan } from "@/context/LoanContext";
import { PaymentFrequency } from "@/types";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, Save, AlertCircle, Trash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/utils/csvHelpers";
import { createBackup, downloadBackup, validateBackup, BackupData } from "@/utils/backupHelpers";

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
  const { toast } = useToast();
  
  // Estado para backup/importação
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const fileInputJsonRef = useRef<HTMLInputElement>(null);
  const fileInputCsvRef = useRef<HTMLInputElement>(null);
  
  // Aviso sobre modo sem persistência
  useEffect(() => {
    console.log("Sistema operando sem persistência de dados. Dados existem apenas em memória.");
  }, []);

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
    updateSettings(data);
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
  
  // Handler para limpar todos os dados
  function handleResetData() {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita!')) {
      importData('RESET');
      toast({
        title: "Dados reiniciados",
        description: "Todos os dados foram removidos e as configurações padrão foram restauradas."
      });
    }
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <Tabs defaultValue="general" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Gerais</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure valores padrão para novos empréstimos e preferências do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="defaultInterestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Juros Padrão (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Taxa de juros mensal usada como padrão para novos empréstimos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moeda</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Símbolo da moeda usado em todo o sistema (ex: R$, $, €)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="defaultPaymentFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência de Pagamento Padrão</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="biweekly">Quinzenal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Frequência de pagamento usada como padrão para novos empréstimos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="defaultInstallments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas Padrão</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Número de parcelas usado como padrão para novos empréstimos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Salvar Configurações</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Dados</CardTitle>
              <CardDescription>
                Limpe ou restaure os dados da aplicação. Cuidado: estas ações não podem ser desfeitas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Reiniciar Dados</div>
                <p className="text-sm text-slate-500">
                  Limpa todos os dados e restaura para os valores iniciais. Esta ação não pode ser desfeita.
                </p>
                <Button 
                  variant="destructive"
                  onClick={handleResetData}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Reiniciar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup e Restauração</CardTitle>
              <CardDescription>
                Faça backup dos seus dados para arquivos locais (sem utilizar cookies ou localStorage)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>Modo sem persistência local</AlertTitle>
                <AlertDescription>
                  O aplicativo está operando em modo sem persistência. Seus dados NÃO são salvos em cookies 
                  ou localStorage do navegador, existindo apenas em memória durante esta sessão.
                  <strong className="block mt-2">Faça backups regulares para evitar perda de dados!</strong>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Exportar Dados</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleExportJson}
                      variant="default"
                      disabled={isCreatingBackup}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar JSON
                    </Button>
                    
                    <Button 
                      onClick={handleExportCsv}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </div>
                  
                  <p className="text-sm text-slate-500 mt-2">
                    O formato JSON preserva todos os dados e é recomendado para backups completos.
                    O formato CSV é útil para exportar dados para outros programas.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Importar Dados</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="json-import">Arquivo JSON:</Label>
                      <div className="flex mt-1 gap-2">
                        <Input
                          id="json-import"
                          type="file"
                          ref={fileInputJsonRef}
                          accept=".json"
                          onChange={handleImportJson}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Formato JSON preserva todas as configurações e dados
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="csv-import">Arquivo CSV:</Label>
                      <div className="flex mt-1 gap-2">
                        <Input
                          id="csv-import"
                          type="file"
                          ref={fileInputCsvRef}
                          accept=".csv"
                          onChange={handleImportCsv}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Formato CSV é compatível com planilhas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
