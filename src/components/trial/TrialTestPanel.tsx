import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Crown, RefreshCw } from "lucide-react";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useToast } from "@/hooks/use-toast";

export function TrialTestPanel() {
  const { isExpired, daysRemaining, plan, simulateExpired, resetSimulation } = useTrialStatus();
  const { toast } = useToast();

  const handleSimulateExpired = () => {
    console.log("Simulando teste expirado...");
    simulateExpired();
    toast({
      title: "Teste Simulado",
      description: "O teste foi marcado como expirado. Você será redirecionado em instantes.",
      variant: "destructive"
    });
    
    // Forçar redirecionamento após pequeno delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleResetSimulation = () => {
    resetSimulation();
    toast({
      title: "Simulação Resetada",
      description: "O teste foi restaurado para 3 dias restantes.",
    });
  };

  return (
    <Card className="overflow-hidden relative border-t-4 border-t-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Teste de Expiração de Plano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                Status Atual do Teste
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={isExpired ? "destructive" : "outline"}>
                    {plan.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-amber-700 dark:text-amber-400">
                    {isExpired ? "Expirado" : `${daysRemaining} dias restantes`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Use os botões abaixo para testar o sistema de soft block por data de expiração:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleSimulateExpired}
              variant="destructive"
              size="sm"
              disabled={isExpired}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Simular Teste Expirado
            </Button>
            
            <Button 
              onClick={handleResetSimulation}
              variant="outline"
              size="sm"
              disabled={!isExpired}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Resetar Simulação
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p><strong>Como funciona:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Clique em "Simular Teste Expirado" para ser redirecionado para a tela de expiração</li>
            <li>Na tela de expiração, clique em "Sair da Conta" e faça login novamente</li>
            <li>Use "Resetar Simulação" para voltar ao estado normal do teste</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}