import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoan } from "@/context/LoanContext";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { formatCurrency } from "@/utils/formatters";
import { differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationDropdown() {
  const { getOverdueLoans } = useLoan();
  const [, navigate] = useLocation();
  
  // Estado para rastrear notificações já enviadas
  const [sentNotifications, setSentNotifications] = useState<{[key: string]: boolean}>({});
  const previousLoansCountRef = useRef<number>(0);

  // Criar notificações baseadas em contratos atrasados
  const notifications = getOverdueLoans().map(loan => ({
    id: loan.id,
    title: `Pagamento Atrasado - ${loan.borrowerName}`,
    message: `Contrato está com pagamento atrasado`,
    date: new Date(loan.dueDate),
    loanId: loan.id,
    borrowerName: loan.borrowerName,
    amount: loan.principal
  }));
  
  // Enviar notificações push quando houver contratos atrasados
  useEffect(() => {
    // Só enviar notificações se houver mudança na quantidade de contratos atrasados
    // ou ao carregar o componente pela primeira vez
    if (notifications.length > 0 && 
        (notifications.length > previousLoansCountRef.current || 
        previousLoansCountRef.current === 0)) {
      
      // Verificar permissão de notificação
      if ('Notification' in window && Notification.permission === 'granted') {
        
        // Enviar notificações para cada contrato atrasado que ainda não foi notificado
        notifications.forEach(notification => {
          if (!sentNotifications[notification.id]) {
            try {
              // Calcular dias de atraso
              const today = new Date();
              const daysLate = differenceInDays(today, notification.date);
              
              // Configurar opções da notificação
              const notificationOptions = {
                body: `Contrato de ${notification.borrowerName} no valor de ${formatCurrency(notification.amount || 0)} está atrasado há ${daysLate} dias`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: `late-payment-${notification.id}`,
                vibrate: [200, 100, 200],
                requireInteraction: true,
                data: {
                  loanId: notification.loanId,
                  url: `/loans/${notification.loanId}`
                }
              };
              
              // Criar e enviar a notificação
              const notif = new Notification(
                `Pagamento Atrasado - ${notification.borrowerName}`, 
                notificationOptions
              );
              
              // Configurar evento de clique
              notif.onclick = function() {
                window.focus();
                navigate(`/loans/${notification.loanId}`);
                notif.close();
              };
              
              // Marcar esta notificação como já enviada
              setSentNotifications(prev => ({
                ...prev,
                [notification.id]: true
              }));
              
              console.log(`Notificação enviada para empréstimo atrasado: ${notification.borrowerName}`);
            } catch (error) {
              console.error(`Erro ao enviar notificação: ${error}`);
            }
          }
        });
      }
    }
    
    // Atualizar a contagem para a próxima verificação
    previousLoansCountRef.current = notifications.length;
  }, [notifications.length, sentNotifications, navigate]);

  // Função para solicitar permissão de notificação quando o usuário clicar no ícone
  const handleBellClick = async () => {
    // Verificar se as notificações são suportadas
    if (!('Notification' in window)) {
      console.warn('Notificações não são suportadas neste navegador');
      return;
    }
    
    // Se a permissão ainda não foi concedida
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted' && notifications.length > 0) {
          // Enviar notificações imediatamente após permissão concedida
          notifications.forEach(notification => {
            try {
              // Calcular dias de atraso
              const today = new Date();
              const daysLate = differenceInDays(today, notification.date);
              
              // Enviar a notificação
              new Notification(`Pagamento Atrasado - ${notification.borrowerName}`, {
                body: `Empréstimo de ${notification.borrowerName} no valor de ${formatCurrency(notification.amount || 0)} está atrasado há ${daysLate} dias`,
                icon: '/icons/icon-192x192.png',
                tag: `late-payment-${notification.id}`,
                vibrate: [200, 100, 200],
                requireInteraction: true
              });
              
              // Marcar a notificação como enviada
              setSentNotifications(prev => ({
                ...prev,
                [notification.id]: true
              }));
            } catch (error) {
              console.error('Erro ao enviar notificação após permissão:', error);
            }
          });
        }
      } catch (error) {
        console.error('Erro ao solicitar permissão de notificação:', error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground rounded-full relative"
          onClick={handleBellClick}
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
              {notifications.length}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className="p-4 cursor-pointer"
              onClick={() => navigate(`/loans/${notification.loanId}`)}
            >
              <div>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">{notification.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {notification.date.toLocaleDateString()}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
