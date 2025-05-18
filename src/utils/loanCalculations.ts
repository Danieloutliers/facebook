import { LoanType, PaymentType, LoanStatus } from "@/types";
import { differenceInDays, parseISO } from "date-fns";

/**
 * Calculate the total amount due for a loan (principal + interest)
 */
export function calculateTotalDue(loan: LoanType): number {
  // Obtém o número de parcelas do cronograma de pagamento ou usa um valor padrão
  const installments = loan.paymentSchedule?.installments || 1;

  // Calcula o total de juros usando a fórmula de juros simples
  const monthlyRate = loan.interestRate / 100;
  const interestAmount = loan.principal * monthlyRate * installments;

  return loan.principal + interestAmount;
}

/**
 * Calculate the remaining balance of a loan after payments
 */
export function calculateRemainingBalance(loan: LoanType, payments: PaymentType[]): number {
  // Para empréstimos no modo "Somente Juros", o saldo devedor é reduzido apenas 
  // pelo valor pago para o principal (não para os juros)
  const isInterestOnly = loan.paymentSchedule?.frequency === 'interest_only';
  
  if (isInterestOnly) {
    // Soma apenas os valores de pagamento destinados ao principal
    const principalPaid = payments.reduce((sum, payment) => sum + payment.principal, 0);
    
    // O saldo devedor é o principal original menos o principal já pago
    return Math.max(0, loan.principal - principalPaid);
  } else {
    // Para empréstimos normais, usa a lógica anterior
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDue = calculateTotalDue(loan);
    return Math.max(0, totalDue - totalPaid);
  }
}

/**
 * Check if a loan is overdue
 */
export function isLoanOverdue(loan: LoanType): boolean {
  // Se o empréstimo não tem programação de pagamento, verifica a data final
  if (!loan.paymentSchedule) {
    const currentDate = new Date();
    const dueDate = parseISO(loan.dueDate);
    return currentDate > dueDate;
  }

  // Verifica a data do próximo pagamento programado
  const currentDate = new Date();
  const nextPaymentDate = parseISO(loan.paymentSchedule.nextPaymentDate);
  return currentDate > nextPaymentDate;
}

/**
 * Calculate the number of days a loan is overdue
 */
export function getDaysOverdue(loan: LoanType): number {
  if (!isLoanOverdue(loan)) return 0;

  const currentDate = new Date();

  // Se o empréstimo não tem programação de pagamento, usa a data final
  if (!loan.paymentSchedule) {
    const dueDate = parseISO(loan.dueDate);
    return differenceInDays(currentDate, dueDate);
  }

  // Caso contrário, usa a data do próximo pagamento
  const nextPaymentDate = parseISO(loan.paymentSchedule.nextPaymentDate);
  return differenceInDays(currentDate, nextPaymentDate);
}

/**
 * Distribute a payment amount between principal and interest
 */
export function calculatePaymentDistribution(
  loan: LoanType,
  paymentAmount: number,
  previousPayments: PaymentType[]
): { principal: number; interest: number } {
  // Verificar se o empréstimo está no modo "Somente Juros"
  const isInterestOnly = loan.paymentSchedule?.frequency === 'interest_only';
  
  // Obter número de parcelas do cronograma de pagamento ou usar valor padrão
  const installments = loan.paymentSchedule?.installments || 1;

  // Calcular juros mensais usando a fórmula de juros simples (Principal * Taxa)
  const monthlyRate = loan.interestRate / 100;
  
  if (isInterestOnly) {
    // Para empréstimos no modo "Somente Juros", o valor dos juros é calculado
    // sobre o principal atual, sem considerar a quantidade de parcelas
    const interestAmount = loan.principal * monthlyRate;
    
    // Se o pagamento for menor ou igual aos juros, todo o pagamento vai para juros
    if (paymentAmount <= interestAmount) {
      return {
        principal: 0,
        interest: paymentAmount
      };
    } 
    // Se o pagamento for maior que os juros, o excedente vai para o principal
    else {
      return {
        principal: paymentAmount - interestAmount,
        interest: interestAmount
      };
    }
  } else {
    // Para empréstimos normais, manter a lógica proporcional original
    // Calcular juros totais do empréstimo (Principal * Taxa * Tempo)
    const totalInterest = loan.principal * monthlyRate * installments;
    
    // Calcular valor total a ser pago (principal + juros)
    const totalAmount = loan.principal + totalInterest;
    
    // Calcular a proporção de principal e juros no valor total
    const principalRatio = loan.principal / totalAmount;
    const interestRatio = totalInterest / totalAmount;
    
    // Distribuir o pagamento proporcionalmente
    return {
      principal: paymentAmount * principalRatio,
      interest: paymentAmount * interestRatio
    };
  }
}

/**
 * Determine the new status of a loan based on payments and dates
 */
export function determineNewLoanStatus(loan: LoanType, payments: PaymentType[]): LoanStatus {
  // Nunca mudar o status de empréstimos arquivados
  if (loan.status === 'archived') {
    console.log(`Mantendo status 'archived' para empréstimo ${loan.id}`);
    return 'archived';
  }

  const remainingBalance = calculateRemainingBalance(loan, payments);

  // Se o empréstimo foi totalmente pago (o saldo restante é zero ou negativo)
  if (remainingBalance <= 0) {
    return 'paid';
  }

  // Criar a data atual para verificações de status
  const dateForChecks = new Date();
  const currentMonth = dateForChecks.getMonth();
  const currentYear = dateForChecks.getFullYear();

  // Verificar se existe um pagamento no mês atual que foi marcado como "parcela paga"
  // Esta é a lógica principal para determinar se o empréstimo está "Pago" no mês atual
  const hasCurrentMonthPayment = payments.some(payment => {
    const paymentDate = new Date(payment.date);
    const isCurrentMonth = paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    // Só considera o pagamento se estiver marcado como "parcela paga" nas notas
    const isMarkedAsPaid = payment.notes && payment.notes.includes('Parcela marcada como paga');
    return isCurrentMonth && isMarkedAsPaid;
  });

  // Se tem um pagamento no mês atual marcado como "parcela paga", marcar empréstimo como "Pago"
  if (hasCurrentMonthPayment) {
    return 'paid';
  }

  // Se não tem pagamento no mês atual, verificar se está vencido ou a vencer
  
  // Redefinir a variável today para evitar conflitos com a declaração anterior
  const currentDate = new Date();
  
  // Definição de dias para status "A Vencer"
  const UPCOMING_DAYS_THRESHOLD = 15; // Considerar "A Vencer" quando faltar até 15 dias para o pagamento
  
  // Se tem uma programação de pagamento definida, usar a data do próximo pagamento
  if (loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate) {
    const nextPaymentDate = new Date(loan.paymentSchedule.nextPaymentDate);
    
    // Se a data do próximo pagamento já passou, considerar vencido
    if (nextPaymentDate < currentDate) {
      // Se estiver vencido por mais de 90 dias, considerar inadimplente
      const daysOverdue = Math.floor((currentDate.getTime() - nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Empréstimo ${loan.id} vencido há ${daysOverdue} dias`);

      if (daysOverdue > 90) {
        return 'defaulted';
      }
      
      return 'overdue';
    }
    
    // Se o pagamento estiver se aproximando (dentro do limite de dias definido), considerar "A Vencer"
    const daysUntilPayment = Math.floor((nextPaymentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilPayment <= UPCOMING_DAYS_THRESHOLD) {
      console.log(`Empréstimo ${loan.id} com pagamento em ${daysUntilPayment} dias - status: A Vencer`);
      return 'pending';
    }
    
    // Se tem pagamento programado mas ainda não está próximo, considerar ativo
    return 'active';
  } else {
    // Usar a lógica baseada na data final se não houver programação de pagamento
    const dueDate = new Date(loan.dueDate);
    
    // Se já passou da data de vencimento final
    if (dueDate < currentDate) {
      const daysOverdue = getDaysOverdue(loan);
      
      if (daysOverdue > 90) {
        return 'defaulted';
      }
      
      return 'overdue';
    }
    
    // Calcular dias até o vencimento final
    const daysUntilDue = Math.floor((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se estiver próximo do vencimento final
    if (daysUntilDue <= UPCOMING_DAYS_THRESHOLD) {
      console.log(`Empréstimo ${loan.id} vence em ${daysUntilDue} dias - status: A Vencer`);
      return 'pending';
    }
    
    // Verifica adicionalmente se está no mesmo mês do vencimento (lógica atual mantida por compatibilidade)
    const isCurrentMonth = dueDate.getMonth() === currentDate.getMonth() && 
                           dueDate.getFullYear() === currentDate.getFullYear();
    
    if (isCurrentMonth) {
      return 'pending';
    }
  }
  
  // Se chegou até aqui, considerar ativo
  return 'active';
}

/**
 * Calculate the monthly payment amount for a loan using simple interest
 */
export function calculateMonthlyPayment(principal: number, interestRate: number, months: number): number {
  // Verificar se os valores são válidos
  if (isNaN(principal) || isNaN(interestRate) || isNaN(months) || 
      principal <= 0 || interestRate <= 0 || months <= 0) {
    return 0;
  }

  // Converter taxa de juros mensal para decimal
  const monthlyRate = interestRate / 100;

  // Calcula juros simples (Principal * Taxa * Tempo)
  const totalInterest = principal * monthlyRate * months;

  // Valor da parcela = (Principal + Juros Total) / Número de parcelas  
  const payment = (principal + totalInterest) / months;

  return payment;
}
