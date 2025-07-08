import { BorrowerType, LoanType, PaymentType, LoanStatus } from "@/types";
import { addMonths, format } from "date-fns";

// Helper function that retorna datas fixas para meses futuros (relativas a maio de 2025)
const monthsFromNow = (months: number): string => {
  // Usa a data base fixa de 07/05/2025
  const baseDate = new Date(2025, 4, 7); // maio é 4, pois janeiro é 0
  return format(addMonths(baseDate, months), 'yyyy-MM-dd');
};

// Helper function que retorna uma data fixa para este mês com um dia específico
const thisMonth = (day: number = 15): string => {
  // Usa o mês fixo de maio de 2025
  const date = new Date(2025, 4, day); // maio é 4, pois janeiro é 0
  return format(date, 'yyyy-MM-dd');
};

// Helper function que retorna datas fixas para meses passados (relativas a maio de 2025)
const monthsAgo = (months: number): string => {
  // Usa a data base fixa de 07/05/2025
  const baseDate = new Date(2025, 4, 7); // maio é 4, pois janeiro é 0
  return format(addMonths(baseDate, -months), 'yyyy-MM-dd');
};

// Helper to generate random id
const generateId = (): string => Math.random().toString(36).substring(2, 10);

// Mock borrowers data
export const mockBorrowers: BorrowerType[] = [
  {
    id: '9',
    name: 'Teresa Oliveira',
    email: 'teresa.oliveira@email.com',
    phone: '(11) 99876-5432'
  },
  {
    id: '1',
    name: 'Carlos Almeida',
    email: 'carlos.almeida@email.com',
    phone: '(11) 98765-4321'
  },
  {
    id: '2',
    name: 'Márcia Santos',
    email: 'marcia.santos@email.com',
    phone: '(11) 91234-5678'
  },
  {
    id: '3',
    name: 'Fernando Costa',
    email: 'fernando.costa@email.com',
    phone: '(21) 99876-5432'
  },
  {
    id: '4',
    name: 'Paula Oliveira',
    email: 'paula.oliveira@email.com',
    phone: '(21) 98765-4321'
  },
  {
    id: '5',
    name: 'Roberto Silva',
    email: 'roberto.silva@email.com',
    phone: '(31) 97654-3210'
  },
  {
    id: '6',
    name: 'Juliana Ferreira',
    email: 'juliana.ferreira@email.com',
    phone: '(31) 98765-4321'
  },
  {
    id: '7',
    name: 'André Lima',
    email: 'andre.lima@email.com',
    phone: '(41) 98765-4321'
  },
  {
    id: '8',
    name: 'Bruno Gomes',
    email: 'bruno.gomes@email.com',
    phone: '(51) 98765-4321'
  }
];

// Mock loans data
export const mockLoans: LoanType[] = [
  {
    id: '9',
    borrowerId: '9',
    borrowerName: 'Teresa Oliveira',
    principal: 3000,
    interestRate: 1,
    issueDate: monthsAgo(8),
    dueDate: monthsAgo(2),
    status: 'archived' as LoanStatus, // Garantindo que pelo menos um contrato já está arquivado
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: monthsAgo(2),
      installments: 6,
      installmentAmount: 525.00
    }
  },
  {
    id: '1',
    borrowerId: '1',
    borrowerName: 'Carlos Almeida',
    principal: 5000,
    interestRate: 1,
    issueDate: monthsAgo(2),
    dueDate: monthsFromNow(10),
    status: 'active' as LoanStatus,
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: monthsFromNow(1),
      installments: 12,
      installmentAmount: 437.50
    }
  },
  {
    id: '2',
    borrowerId: '2',
    borrowerName: 'Márcia Santos',
    principal: 3500,
    interestRate: 1,
    issueDate: monthsAgo(3),
    dueDate: monthsAgo(1),
    status: 'archived' as LoanStatus, // Status alterado para teste
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: monthsAgo(1),
      installments: 6,
      installmentAmount: 606.67
    }
  },
  {
    id: '3',
    borrowerId: '3',
    borrowerName: 'Fernando Costa',
    principal: 2000,
    interestRate: 1,
    issueDate: monthsAgo(6),
    dueDate: monthsAgo(2),
    status: 'archived' as LoanStatus, // Mudado para arquivado para teste
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: monthsAgo(2),
      installments: 4,
      installmentAmount: 520.00
    }
  },
  {
    id: '4',
    borrowerId: '4',
    borrowerName: 'Paula Oliveira',
    principal: 8000,
    interestRate: 1,
    issueDate: monthsAgo(1),
    dueDate: monthsFromNow(5),
    status: 'active' as LoanStatus,
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: monthsFromNow(1),
      installments: 6,
      installmentAmount: 1403.33
    }
  },
  {
    id: '5',
    borrowerId: '5',
    borrowerName: 'Roberto Silva',
    principal: 1500,
    interestRate: 1,
    issueDate: monthsAgo(6),
    dueDate: monthsAgo(3),
    status: 'defaulted' as LoanStatus,
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: thisMonth(15), // Alterado para o mês atual
      installments: 3,
      installmentAmount: 535.00
    }
  },
  {
    id: '6',
    borrowerId: '6',
    borrowerName: 'Juliana Ferreira',
    principal: 10000,
    interestRate: 1,
    issueDate: monthsAgo(12),
    dueDate: monthsFromNow(6),
    status: 'active' as LoanStatus,
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: thisMonth(20), // Pagamento programado para dia 20 do mês atual
      installments: 18,
      installmentAmount: 616.67
    }
  },
  {
    id: '7',
    borrowerId: '7',
    borrowerName: 'André Lima',
    principal: 4000,
    interestRate: 1,
    issueDate: monthsAgo(4),
    dueDate: monthsFromNow(8),
    status: 'active' as LoanStatus,
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: monthsFromNow(1),
      installments: 12,
      installmentAmount: 350.00
    }
  },
  {
    id: '8',
    borrowerId: '8',
    borrowerName: 'Bruno Gomes',
    principal: 6000,
    interestRate: 1,
    issueDate: monthsAgo(6),
    dueDate: monthsFromNow(2),
    status: 'overdue' as LoanStatus, // Alterado para overdue para aparecer na métrica
    paymentSchedule: {
      frequency: 'monthly',
      nextPaymentDate: thisMonth(25), // Alterado para o mês atual
      installments: 6,
      installmentAmount: 1050.00
    }
  }
];

// Mock payments data
export const mockPayments: PaymentType[] = [
  // Teresa Oliveira payments (archived loan)
  {
    id: generateId(),
    loanId: '9',
    date: monthsAgo(8),
    amount: 525.00,
    principal: 450.00,
    interest: 75.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '9',
    date: monthsAgo(7),
    amount: 525.00,
    principal: 465.00,
    interest: 60.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '9',
    date: monthsAgo(6),
    amount: 525.00,
    principal: 475.00,
    interest: 50.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '9',
    date: monthsAgo(5),
    amount: 525.00,
    principal: 485.00,
    interest: 40.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '9',
    date: monthsAgo(4),
    amount: 525.00,
    principal: 495.00,
    interest: 30.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '9',
    date: monthsAgo(3),
    amount: 525.00,
    principal: 505.00,
    interest: 20.00,
    notes: 'Pagamento final'
  },
  
  // Carlos Almeida payments
  {
    id: generateId(),
    loanId: '1',
    date: monthsAgo(1),
    amount: 437.50,
    principal: 375.00,
    interest: 62.50,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '1',
    date: monthsAgo(0),
    amount: 437.50,
    principal: 385.00,
    interest: 52.50,
    notes: 'Pagamento em dia'
  },
  
  // Márcia Santos payments
  {
    id: generateId(),
    loanId: '2',
    date: monthsAgo(3),
    amount: 606.67,
    principal: 540.00,
    interest: 66.67,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '2',
    date: monthsAgo(2),
    amount: 606.67,
    principal: 550.00,
    interest: 56.67,
    notes: 'Pagamento em dia'
  },
  
  // Fernando Costa payments (paid in full)
  {
    id: generateId(),
    loanId: '3',
    date: monthsAgo(6),
    amount: 520.00,
    principal: 480.00,
    interest: 40.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '3',
    date: monthsAgo(5),
    amount: 520.00,
    principal: 490.00,
    interest: 30.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '3',
    date: monthsAgo(4),
    amount: 520.00,
    principal: 500.00,
    interest: 20.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '3',
    date: monthsAgo(3),
    amount: 520.00,
    principal: 510.00,
    interest: 10.00,
    notes: 'Pagamento final'
  },
  
  // Paula Oliveira payment
  {
    id: generateId(),
    loanId: '4',
    date: monthsAgo(0),
    amount: 1403.33,
    principal: 1250.00,
    interest: 153.33,
    notes: 'Pagamento em dia'
  },
  
  // Roberto Silva payment (defaulted)
  {
    id: generateId(),
    loanId: '5',
    date: monthsAgo(5),
    amount: 535.00,
    principal: 485.00,
    interest: 50.00,
    notes: 'Pagamento em dia'
  },
  
  // Juliana Ferreira payments
  {
    id: generateId(),
    loanId: '6',
    date: monthsAgo(11),
    amount: 616.67,
    principal: 500.00,
    interest: 116.67,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '6',
    date: monthsAgo(10),
    amount: 616.67,
    principal: 510.00,
    interest: 106.67,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '6',
    date: monthsAgo(9),
    amount: 616.67,
    principal: 520.00,
    interest: 96.67,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '6',
    date: monthsAgo(8),
    amount: 616.67,
    principal: 530.00,
    interest: 86.67,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '6',
    date: monthsAgo(7),
    amount: 616.67,
    principal: 540.00,
    interest: 76.67,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '6',
    date: monthsAgo(6),
    amount: 616.67,
    principal: 550.00,
    interest: 66.67,
    notes: 'Pagamento em dia'
  },
  
  // André Lima payments
  {
    id: generateId(),
    loanId: '7',
    date: monthsAgo(3),
    amount: 350.00,
    principal: 300.00,
    interest: 50.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '7',
    date: monthsAgo(2),
    amount: 350.00,
    principal: 310.00,
    interest: 40.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '7',
    date: monthsAgo(1),
    amount: 350.00,
    principal: 320.00,
    interest: 30.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '7',
    date: monthsAgo(0),
    amount: 350.00,
    principal: 330.00,
    interest: 20.00,
    notes: 'Pagamento em dia'
  },
  
  // Bruno Gomes payments (paid in full)
  {
    id: generateId(),
    loanId: '8',
    date: monthsAgo(6),
    amount: 1050.00,
    principal: 950.00,
    interest: 100.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '8',
    date: monthsAgo(5),
    amount: 1050.00,
    principal: 960.00,
    interest: 90.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '8',
    date: monthsAgo(4),
    amount: 1050.00,
    principal: 970.00,
    interest: 80.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '8',
    date: monthsAgo(3),
    amount: 1050.00,
    principal: 980.00,
    interest: 70.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '8',
    date: monthsAgo(2),
    amount: 1050.00,
    principal: 990.00,
    interest: 60.00,
    notes: 'Pagamento em dia'
  },
  {
    id: generateId(),
    loanId: '8',
    date: monthsAgo(1),
    amount: 1050.00,
    principal: 1000.00,
    interest: 50.00,
    notes: 'Pagamento final'
  },
];
