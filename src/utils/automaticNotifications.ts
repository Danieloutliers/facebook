import { LoanType, BorrowerType } from "@/types";
import { 
  sendPaymentDueNotification, 
  sendPaymentLateNotification,
  getNotificationPermissionStatus
} from "@/utils/notificationHelpers";
import { formatCurrency } from "@/utils/formatters";
import { differenceInDays, parseISO, format } from "date-fns";
import { pt } from "date-fns/locale";

/**
 * Verifica os empréstimos e envia notificações automáticas
 * quando necessário (pagamentos próximos ou atrasados)
 */
export function checkAndSendAutomaticNotifications(
  loans: LoanType[],
  borrowers: BorrowerType[],
  reminderDays: number = 3
): { sent: number; errors: number } {
  // Verificar se as notificações estão permitidas
  if (getNotificationPermissionStatus() !== 'granted') {
    console.log('Notificações automáticas: Permissão não concedida');
    return { sent: 0, errors: 0 };
  }

  let sentCount = 0;
  let errorCount = 0;
  const today = new Date();
  
  // Filtrar apenas empréstimos ativos ou em atraso
  const activeLoans = loans.filter(loan => {
    return loan.status === 'active' || loan.status === 'overdue';
  });
  
  console.log(`Verificando ${activeLoans.length} empréstimos ativos para notificações automáticas...`);
  
  activeLoans.forEach(loan => {
    try {
      const borrower = borrowers.find(b => b.id === loan.borrowerId);
      if (!borrower) {
        console.warn(`Mutuário não encontrado para o empréstimo ID: ${loan.id}`);
        return;
      }
      
      const borrowerName = borrower.name;
      // Usar principal para o montante do empréstimo ou o valor da parcela se disponível
      const amount = loan.paymentSchedule?.installmentAmount || loan.principal;
      const formattedAmount = formatCurrency(amount || 0);
      
      // Verificar se o empréstimo está atrasado
      if (loan.status === 'overdue' && loan.dueDate) {
        const dueDate = parseISO(loan.dueDate);
        const daysLate = differenceInDays(today, dueDate);
        
        if (daysLate > 0) {
          // Enviar notificação de pagamento atrasado
          const success = sendPaymentLateNotification(
            borrowerName,
            formattedAmount,
            daysLate
          );
          
          if (success) {
            console.log(`✓ Notificação de atraso enviada para: ${borrowerName}`);
            sentCount++;
          } else {
            console.error(`✗ Erro ao enviar notificação de atraso para: ${borrowerName}`);
            errorCount++;
          }
        }
      } 
      // Verificar se o empréstimo está próximo de vencer
      else if (loan.status === 'active' && loan.dueDate) {
        const dueDate = parseISO(loan.dueDate);
        const daysUntilDue = differenceInDays(dueDate, today);
        
        if (daysUntilDue <= reminderDays && daysUntilDue >= 0) {
          // Formatar a data de vencimento
          const formattedDueDate = format(dueDate, "dd 'de' MMMM", { locale: pt });
          
          // Enviar notificação de pagamento próximo
          const success = sendPaymentDueNotification(
            borrowerName,
            formattedAmount,
            daysUntilDue === 0 ? 'hoje' : 
            daysUntilDue === 1 ? 'amanhã' : 
            `${daysUntilDue} dias (${formattedDueDate})`
          );
          
          if (success) {
            console.log(`✓ Notificação de vencimento próximo enviada para: ${borrowerName}`);
            sentCount++;
          } else {
            console.error(`✗ Erro ao enviar notificação de vencimento próximo para: ${borrowerName}`);
            errorCount++;
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar notificações automáticas:', error);
      errorCount++;
    }
  });
  
  console.log(`Notificações automáticas processadas: ${sentCount} enviadas, ${errorCount} erros`);
  return { sent: sentCount, errors: errorCount };
}

/**
 * Configura um intervalo para verificar e enviar notificações automáticas
 */
export function setupAutomaticNotifications(
  getLoans: () => LoanType[],
  getBorrowers: () => BorrowerType[],
  getReminderDays: () => number,
  intervalMinutes: number = 30
): () => void {
  console.log(`Configurando notificações automáticas (intervalo: ${intervalMinutes} minutos)`);
  
  // Função para verificar se podemos mostrar notificações
  const canSendNotifications = (): boolean => {
    if (!('Notification' in window)) {
      console.log('Notificações não são suportadas neste navegador');
      return false;
    }
    
    if (Notification.permission !== 'granted') {
      console.log(`Notificações automáticas: Permissão não concedida (status: ${Notification.permission})`);
      return false;
    }
    
    return true;
  };
  
  // Função de verificação que pode ser reutilizada
  const runCheck = () => {
    try {
      // Verificar se podemos enviar notificações
      if (!canSendNotifications()) return;
      
      // Executar a verificação
      const result = checkAndSendAutomaticNotifications(
        getLoans(),
        getBorrowers(),
        getReminderDays()
      );
      
      console.log(`Verificação de notificações automáticas: ${result.sent} enviadas`);
    } catch (error) {
      console.error('Erro na verificação de notificações:', error);
    }
  };
  
  // Primeira verificação após um curto atraso para carregar dados
  const initialTimeoutId = setTimeout(runCheck, 5000);
  
  // Configurar verificação periódica
  const intervalId = setInterval(runCheck, intervalMinutes * 60 * 1000);
  
  // Adicionar listener para mudanças no status de permissão
  let permissionChangeHandler: EventListener | null = null;
  
  // Verificar se a API de mudança de permissão está disponível
  if ('Notification' in window) {
    permissionChangeHandler = function(this: PermissionStatus, ev: Event) {
      console.log(`Status de permissão de notificação alterado para: ${Notification.permission}`);
      
      // Se a permissão foi concedida, executa a verificação imediatamente
      if (Notification.permission === 'granted') {
        runCheck();
      }
    };
    
    try {
      // Adicionar o listener (em navegadores modernos)
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'notifications' as PermissionName })
          .then(status => {
            status.addEventListener('change', permissionChangeHandler!);
          })
          .catch(err => console.log('Erro ao configurar listener de permissão:', err));
      }
    } catch (error) {
      console.log('API de permissões não suportada completamente:', error);
    }
  }
  
  // Retornar função para limpar o intervalo e os listeners
  return () => {
    console.log('Cancelando verificação automática de notificações');
    clearTimeout(initialTimeoutId);
    clearInterval(intervalId);
    
    // Remover listener de mudança de permissão se existir
    if (permissionChangeHandler && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(status => {
            status.removeEventListener('change', permissionChangeHandler!);
        })
        .catch(() => {});
    }
  };
}
