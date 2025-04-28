import { BorrowerType, LoanType, PaymentType, AppSettings } from "@/types";
import { mockBorrowers, mockLoans, mockPayments } from "@/utils/mockData";

// Chaves para armazenar os dados no localStorage
const STORAGE_KEYS = {
  BORROWERS: 'loanbuddy_borrowers',
  LOANS: 'loanbuddy_loans',
  PAYMENTS: 'loanbuddy_payments',
  SETTINGS: 'loanbuddy_settings'
};

// Funções de leitura do localStorage
export function loadBorrowers(): BorrowerType[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BORROWERS);
    return data ? JSON.parse(data) : mockBorrowers;
  } catch (error) {
    console.error('Erro ao carregar mutuários:', error);
    return mockBorrowers;
  }
}

export function loadLoans(): LoanType[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOANS);
    return data ? JSON.parse(data) : mockLoans;
  } catch (error) {
    console.error('Erro ao carregar empréstimos:', error);
    return mockLoans;
  }
}

export function loadPayments(): PaymentType[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return data ? JSON.parse(data) : mockPayments;
  } catch (error) {
    console.error('Erro ao carregar pagamentos:', error);
    return mockPayments;
  }
}

export function loadSettings(): AppSettings | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      return {
        defaultInterestRate: 5,
        defaultPaymentFrequency: "monthly",
        defaultInstallments: 12,
        currency: "R$"
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    return {
      defaultInterestRate: 5,
      defaultPaymentFrequency: "monthly",
      defaultInstallments: 12,
      currency: "R$"
    };
  }
}

// Funções de salvamento no localStorage
export function saveBorrowers(borrowers: BorrowerType[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(borrowers));
  } catch (error) {
    console.error('Erro ao salvar mutuários:', error);
  }
}

export function saveLoans(loans: LoanType[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  } catch (error) {
    console.error('Erro ao salvar empréstimos:', error);
  }
}

export function savePayments(payments: PaymentType[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  } catch (error) {
    console.error('Erro ao salvar pagamentos:', error);
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
}

// Função para gerar IDs únicos
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Função para limpar todos os dados
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.BORROWERS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
  }
}
