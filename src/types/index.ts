// These are the core data types used throughout the application

export type BorrowerType = {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  rg?: string;
  profession?: string;
  income?: number;
  notes?: string;
};

export type LoanStatus = 'active' | 'pending' | 'paid' | 'overdue' | 'defaulted' | 'archived';

export type AdvanceStatus = 'active' | 'paid' | 'overdue' | 'defaulted';

export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | 'interest_only';

export type PaymentScheduleType = {
  frequency: PaymentFrequency;
  nextPaymentDate: string;
  installments: number;
  installmentAmount: number;
  paidInstallments?: number; // Número manual de parcelas já pagas
};

export type LoanType = {
  id: string;
  borrowerId: string;
  borrowerName: string;
  principal: number;
  interestRate: number;
  issueDate: string;
  dueDate: string;
  status: LoanStatus;
  paymentSchedule?: PaymentScheduleType;
  notes?: string;
};

export type AdvanceType = {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: AdvanceStatus;
  fee?: number;
  notes?: string;
};

export type PaymentType = {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  notes?: string;
};

export type LoanMetrics = {
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  remainingBalance: number;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
};

export type DashboardMetrics = {
  totalLoaned: number;
  totalInterestAccrued: number;
  totalOverdue: number;
  totalBorrowers: number;
  activeLoanCount: number;
  pendingLoanCount: number; // Empréstimos com status "A Vencer"
  paidLoanCount: number;
  overdueLoanCount: number;
  defaultedLoanCount: number;
  totalReceivedThisMonth: number;
};

export type AppSettings = {
  defaultInterestRate: number;
  defaultPaymentFrequency: PaymentFrequency;
  defaultInstallments: number;
  currency: string;
  persistenceEnabled?: boolean; // Controla se os dados devem ser persistidos no localStorage
  enableNotifications?: boolean; // Ativa ou desativa notificações automáticas
  paymentReminderDays?: number; // Dias antes do vencimento para enviar lembretes
  autoLockEnabled?: boolean; // Ativa ou desativa o bloqueio automático
  lockTimeoutMinutes?: number; // Tempo em minutos para bloqueio automático
  lockPassword?: string; // Senha para desbloquear o app (hash)
};
