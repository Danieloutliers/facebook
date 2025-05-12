import { BorrowerType, LoanType, PaymentType, AppSettings } from "@/types";

// Dados armazenados apenas em memória (sem localStorage/cookies)
// Iniciando com arrays vazios para permitir inserção manual de dados
let inMemoryBorrowers: BorrowerType[] = [];
let inMemoryLoans: LoanType[] = []; 
let inMemoryPayments: PaymentType[] = [];
let inMemorySettings: AppSettings = {
  defaultInterestRate: 5,
  defaultPaymentFrequency: "monthly",
  defaultInstallments: 12,
  currency: "R$"
};

// Funções de leitura dos dados em memória
export function loadBorrowers(): BorrowerType[] {
  return [...inMemoryBorrowers];
}

export function loadLoans(): LoanType[] {
  return [...inMemoryLoans];
}

export function loadPayments(): PaymentType[] {
  return [...inMemoryPayments];
}

export function loadSettings(): AppSettings | null {
  return inMemorySettings ? { ...inMemorySettings } : null;
}

// Funções de salvamento em memória (sem localStorage)
export function saveBorrowers(borrowers: BorrowerType[]): void {
  inMemoryBorrowers = [...borrowers];
  console.log('Dados de mutuários atualizados apenas em memória (sem cookies)');
}

export function saveLoans(loans: LoanType[]): void {
  inMemoryLoans = [...loans];
  console.log('Dados de empréstimos atualizados apenas em memória (sem cookies)');
}

export function savePayments(payments: PaymentType[]): void {
  inMemoryPayments = [...payments];
  console.log('Dados de pagamentos atualizados apenas em memória (sem cookies)');
}

export function saveSettings(settings: AppSettings): void {
  inMemorySettings = { ...settings };
  console.log('Configurações atualizadas apenas em memória (sem cookies)');
}

// Função para gerar IDs únicos
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Função para limpar todos os dados
export function clearAllData(): void {
  // Limpar para arrays vazios em vez de recarregar os dados mock
  inMemoryBorrowers = [];
  inMemoryLoans = [];
  inMemoryPayments = [];
  inMemorySettings = {
    defaultInterestRate: 5,
    defaultPaymentFrequency: "monthly",
    defaultInstallments: 12,
    currency: "R$"
  };
  console.log('Todos os dados foram limpos');
}
