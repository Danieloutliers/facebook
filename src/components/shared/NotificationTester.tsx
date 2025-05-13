import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { BellRing, Smartphone, AlertCircle, Check, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  areNotificationsSupported, 
  getNotificationPermissionStatus, 
  isIOS, 
  isPWA, 
  requestNotificationPermission, 
  sendIOSTestNotification,
  sendPaymentDueNotification,
  sendPaymentLateNotification 
} from "@/utils/notificationHelpers";

export default function NotificationTester() {
  const { toast } = useToast();
  const [notificationsSupported, setNotificationsSupported] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [isIOSDevice, setIsIOSDevice] = useState<boolean>(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Verificar suporte a notificações ao carregar o componente
  useEffect(() => {
    setNotificationsSupported(areNotificationsSupported());
    setPermissionStatus(getNotificationPermissionStatus());
    setIsIOSDevice(isIOS());
    setIsPWAInstalled(isPWA());
  }, []);

  // Função para solicitar permissão
  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setPermissionStatus(getNotificationPermissionStatus());
      
      if (granted) {
        toast({
          title: "Permissão concedida",
          description: "Você agora pode receber notificações.",
        });
      } else {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações nas configurações do navegador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao solicitar permissão de notificação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar notificação de teste
  const handleSendTestNotification = () => {
    if (permissionStatus !== 'granted') {
      toast({
        title: "Permissão necessária",
        description: "Você precisa conceder permissão para receber notificações.",
        variant: "destructive",
      });
      return;
    }

    const success = isIOSDevice 
      ? sendIOSTestNotification()
      : sendPaymentDueNotification("João Silva", "R$ 500,00", "amanhã");

    if (success) {
      toast({
        title: "Notificação enviada",
        description: "A notificação de teste foi enviada com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive",
      });
    }
  };

  // Função para enviar notificação de vencimento
  const handleSendDueNotification = () => {
    if (permissionStatus !== 'granted') {
      toast({
        title: "Permissão necessária",
        description: "Você precisa conceder permissão para receber notificações.",
        variant: "destructive",
      });
      return;
    }

    const success = sendPaymentDueNotification(
      "Maria Oliveira", 
      "R$ 750,00", 
      "2 dias"
    );

    if (success) {
      toast({
        title: "Notificação enviada",
        description: "A notificação de vencimento foi enviada com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação de vencimento.",
        variant: "destructive",
      });
    }
  };

  // Função para enviar notificação de atraso
  const handleSendLateNotification = () => {
    if (permissionStatus !== 'granted') {
      toast({
        title: "Permissão necessária",
        description: "Você precisa conceder permissão para receber notificações.",
        variant: "destructive",
      });
      return;
    }

    const success = sendPaymentLateNotification(
      "Carlos Santos", 
      "R$ 1.200,00", 
      5
    );

    if (success) {
      toast({
        title: "Notificação enviada",
        description: "A notificação de atraso foi enviada com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação de atraso.",
        variant: "destructive",
      });
    }
  };

  // Renderizar alerta de iOS
  const renderIOSAlert = () => {
    if (!isIOSDevice) return null;

    return (
      <Alert className="mb-4" variant={isPWAInstalled ? "default" : "destructive"}>
        <Smartphone className="h-4 w-4" />
        <AlertTitle>Dispositivo iOS detectado</AlertTitle>
        <AlertDescription>
          {isPWAInstalled 
            ? "O app está instalado como PWA. As notificações devem funcionar corretamente."
            : "Para melhor suporte a notificações no iOS, adicione este app à tela inicial."
          }
        </AlertDescription>
      </Alert>
    );
  };

  // Renderizar badge de status
  const renderStatusBadge = () => {
    if (!notificationsSupported) {
      return (
        <Badge variant="destructive" className="ml-2">
          <X className="h-3 w-3 mr-1" /> Não suportado
        </Badge>
      );
    }

    switch (permissionStatus) {
      case 'granted':
        return (
          <Badge variant="default" className="ml-2 bg-green-600 text-white">
            <Check className="h-3 w-3 mr-1" /> Permitido
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive" className="ml-2">
            <X className="h-3 w-3 mr-1" /> Negado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="ml-2">
            <AlertCircle className="h-3 w-3 mr-1" /> Não solicitado
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BellRing className="h-5 w-5 mr-2 text-amber-500" />
          Testador de Notificações
          {renderStatusBadge()}
        </CardTitle>
        <CardDescription>
          Teste e verifique o funcionamento das notificações push no seu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!notificationsSupported && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não suportado</AlertTitle>
            <AlertDescription>
              Seu navegador não suporta notificações push. Tente usar um navegador mais recente.
            </AlertDescription>
          </Alert>
        )}

        {renderIOSAlert()}

        {notificationsSupported && permissionStatus !== 'granted' && (
          <div className="p-4 border rounded-md">
            <p className="font-medium mb-2">Permissão necessária</p>
            <p className="text-sm text-muted-foreground mb-4">
              Para receber notificações, você precisa permitir que este site envie notificações.
            </p>
            <Button 
              onClick={handleRequestPermission} 
              disabled={isLoading || permissionStatus === 'denied'}
            >
              {isLoading ? "Solicitando..." : "Solicitar Permissão"}
            </Button>
            {permissionStatus === 'denied' && (
              <p className="text-xs text-red-500 mt-2">
                Permissão negada. Você precisa permitir notificações nas configurações do navegador.
              </p>
            )}
          </div>
        )}

        {isIOSDevice && (
          <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950/30">
            <p className="font-medium mb-2">Dispositivo iOS</p>
            <p className="text-sm text-muted-foreground mb-2">
              {isPWAInstalled 
                ? "O app está instalado como PWA no seu dispositivo iOS."
                : "Para melhor experiência, adicione este app à tela inicial."
              }
            </p>
            <p className="text-xs text-muted-foreground">
              O suporte a notificações push no iOS tem algumas limitações quando comparado a outros sistemas operacionais.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start space-y-2">
        <div className="w-full border-t pt-4">
          <p className="text-sm font-medium mb-3">Enviar notificações de teste:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleSendDueNotification}
              disabled={permissionStatus !== 'granted'}
              className="w-full"
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">Vencimento Próximo</span>
                <span className="text-xs text-muted-foreground">Testar notificações de pagamentos a vencer</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={handleSendLateNotification}
              disabled={permissionStatus !== 'granted'}
              className="w-full border-red-200 dark:border-red-900"
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-medium text-red-500">Pagamento Atrasado</span>
                <span className="text-xs text-muted-foreground">Testar notificações de empréstimos vencidos</span>
              </div>
            </Button>
          </div>
          
          {isIOSDevice && (
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={handleSendTestNotification}
                disabled={permissionStatus !== 'granted'}
                className="w-full"
                size="sm"
              >
                <Smartphone className="h-3 w-3 mr-2" />
                Teste específico para iOS
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
