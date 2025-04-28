import { BorrowerType, LoanType, PaymentType, AppSettings } from '../types';
import { generateId } from './memoryClient';

// Usamos sessionStorage para persistência temporária durante a sessão
// Isto é mais adequado para o Netlify do que localStorage, pois é limpo ao fechar a aba
let inMemoryBorrowers: BorrowerType[] = [];
let inMemoryLoans: LoanType[] = [];
let inMemoryPayments: PaymentType[] = [];
let inMemorySettings: AppSettings = {
  defaultInterestRate: 1.5,
  defaultPaymentFrequency: 'monthly',
  defaultInstallments: 12,
  currency: 'R$'
};

// Inicializa dados se existirem no sessionStorage
function initializeFromSessionStorage() {
  try {
    const borrowersStr = sessionStorage.getItem('borrowers');
    const loansStr = sessionStorage.getItem('loans');
    const paymentsStr = sessionStorage.getItem('payments');
    const settingsStr = sessionStorage.getItem('settings');

    if (borrowersStr) inMemoryBorrowers = JSON.parse(borrowersStr);
    if (loansStr) inMemoryLoans = JSON.parse(loansStr);
    if (paymentsStr) inMemoryPayments = JSON.parse(paymentsStr);
    if (settingsStr) inMemorySettings = JSON.parse(settingsStr);
    
    console.log('Dados carregados da sessionStorage');
  } catch (error) {
    console.error('Erro ao carregar dados da sessionStorage', error);
  }
}

// Carrega ao inicializar
initializeFromSessionStorage();

// Salva no sessionStorage após cada operação
function saveToSessionStorage() {
  try {
    sessionStorage.setItem('borrowers', JSON.stringify(inMemoryBorrowers));
    sessionStorage.setItem('loans', JSON.stringify(inMemoryLoans));
    sessionStorage.setItem('payments', JSON.stringify(inMemoryPayments));
    sessionStorage.setItem('settings', JSON.stringify(inMemorySettings));
    console.log('Dados salvos na sessionStorage');
  } catch (error) {
    console.error('Erro ao salvar dados na sessionStorage', error);
  }
}

// Funções de acesso aos dados
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
  return {...inMemorySettings};
}

export function saveBorrowers(borrowers: BorrowerType[]): void {
  inMemoryBorrowers = [...borrowers];
  saveToSessionStorage();
  console.log('Dados de mutuários atualizados na memória e sessionStorage');
}

export function saveLoans(loans: LoanType[]): void {
  inMemoryLoans = [...loans];
  saveToSessionStorage();
  console.log('Dados de empréstimos atualizados na memória e sessionStorage');
}

export function savePayments(payments: PaymentType[]): void {
  inMemoryPayments = [...payments];
  saveToSessionStorage();
  console.log('Dados de pagamentos atualizados na memória e sessionStorage');
}

export function saveSettings(settings: AppSettings): void {
  inMemorySettings = {...settings};
  saveToSessionStorage();
  console.log('Configurações atualizadas na memória e sessionStorage');
}

export { generateId };

export function clearAllData(): void {
  inMemoryBorrowers = [];
  inMemoryLoans = [];
  inMemoryPayments = [];
  inMemorySettings = {
    defaultInterestRate: 1.5,
    defaultPaymentFrequency: 'monthly',
    defaultInstallments: 12,
    currency: 'R$'
  };
  sessionStorage.clear();
  console.log('Todos os dados foram limpos da memória e sessionStorage');
}
