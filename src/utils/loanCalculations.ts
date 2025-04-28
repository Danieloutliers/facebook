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
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalDue = calculateTotalDue(loan);
  return Math.max(0, totalDue - totalPaid);
}

/**
 * Check if a loan is overdue
 */
export function isLoanOverdue(loan: LoanType): boolean {
  // Se o empréstimo não tem programação de pagamento, verifica a data final
  if (!loan.paymentSchedule) {
    const today = new Date();
    const dueDate = parseISO(loan.dueDate);
    return today > dueDate;
  }
  
  // Verifica a data do próximo pagamento programado
  const today = new Date();
  const nextPaymentDate = parseISO(loan.paymentSchedule.nextPaymentDate);
  return today > nextPaymentDate;
}

/**
 * Calculate the number of days a loan is overdue
 */
export function getDaysOverdue(loan: LoanType): number {
  if (!isLoanOverdue(loan)) return 0;
  
  const today = new Date();
  
  // Se o empréstimo não tem programação de pagamento, usa a data final
  if (!loan.paymentSchedule) {
    const dueDate = parseISO(loan.dueDate);
    return differenceInDays(today, dueDate);
  }
  
  // Caso contrário, usa a data do próximo pagamento
  const nextPaymentDate = parseISO(loan.paymentSchedule.nextPaymentDate);
  return differenceInDays(today, nextPaymentDate);
}

/**
 * Distribute a payment amount between principal and interest
 */
export function calculatePaymentDistribution(
  loan: LoanType,
  paymentAmount: number,
  previousPayments: PaymentType[]
): { principal: number; interest: number } {
  // Para juros simples, o valor da parcela é dividido proporcionalmente entre
  // principal e juros com base no cálculo original do empréstimo
  
  // Obter número de parcelas do cronograma de pagamento ou usar valor padrão
  const installments = loan.paymentSchedule?.installments || 1;
  
  // Calcular juros totais usando a fórmula de juros simples (Principal * Taxa * Tempo)
  const monthlyRate = loan.interestRate / 100;
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

/**
 * Determine the new status of a loan based on payments and dates
 */
export function determineNewLoanStatus(loan: LoanType, payments: PaymentType[]): LoanStatus {
  const remainingBalance = calculateRemainingBalance(loan, payments);
  
  // Se o empréstimo foi totalmente pago (o saldo restante é zero ou negativo)
  if (remainingBalance <= 0) {
    return 'paid';
  }
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Verificar se existe um pagamento no mês atual
  // Esta é a lógica principal para determinar se o empréstimo está "Pago" no mês atual
  const hasCurrentMonthPayment = payments.some(payment => {
    const paymentDate = new Date(payment.date);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });
  
  // Se tem um pagamento no mês atual, marcar como "Pago"
  if (hasCurrentMonthPayment) {
    return 'paid';
  }
  
  // Se não tem pagamento no mês atual, verificar se está vencido
  
  // Se tem uma programação de pagamento definida, usar a data do próximo pagamento
  if (loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate) {
    const nextPaymentDate = new Date(loan.paymentSchedule.nextPaymentDate);
    const today = new Date();
    
    // Se a data do próximo pagamento já passou, considerar vencido
    if (nextPaymentDate < today) {
      // Se estiver vencido por mais de 90 dias, considerar inadimplente
      const daysOverdue = Math.floor((today.getTime() - nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 90) {
        return 'defaulted';
      }
      
      return 'overdue';
    }
  } else {
    // Usar a lógica anterior se não houver programação de pagamento
    const daysOverdue = getDaysOverdue(loan);
    
    if (daysOverdue > 90) {
      return 'defaulted';
    }
    
    if (daysOverdue > 0) {
      return 'overdue';
    }
  }
  
  // Se não tem pagamento no mês atual e não está vencido, considerar ativo
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
