// Cliente IndexedDB para o LoanBuddy
// Essa implementação substitui memoryClient.ts e localStorageClient.ts
// para proporcionar armazenamento offline persistente

import { BorrowerType, LoanType, PaymentType, AppSettings, PaymentFrequency } from '@/types';
import { initDB, saveAllData, loadAllData, saveData, loadData, deleteData, isOnline, enqueueForSync } from './indexedDB';

// Um ID temporário para garantir que elementos adicionados quando offline
// não entrem em conflito com os elementos existentes
let tempIdCounter = Date.now();

const defaultSettings: AppSettings = {
  defaultInterestRate: 5,
  defaultPaymentFrequency: 'monthly' as PaymentFrequency,
  defaultInstallments: 12,
  currency: 'R$'
};

// Inicializar o banco de dados no carregamento
initDB().catch(err => {
  console.error('Falha ao inicializar o banco de dados IndexedDB:', err);
});

// Carregar mutuários do armazenamento offline
export async function loadBorrowers(): Promise<BorrowerType[]> {
  try {
    // Tentar carregar do IndexedDB
    const borrowers = await loadAllData<BorrowerType>('borrowers');
    console.log(`${borrowers.length} mutuários carregados do IndexedDB`);
    return borrowers;
  } catch (error) {
    console.error('Erro ao carregar mutuários do IndexedDB:', error);
    // Em caso de erro, retornar array vazio
    return [];
  }
}

// Carregar empréstimos do armazenamento offline
export async function loadLoans(): Promise<LoanType[]> {
  try {
    // Tentar carregar do IndexedDB
    const loans = await loadAllData<LoanType>('loans');
    console.log(`${loans.length} empréstimos carregados do IndexedDB`);
    return loans;
  } catch (error) {
    console.error('Erro ao carregar empréstimos do IndexedDB:', error);
    // Em caso de erro, retornar array vazio
    return [];
  }
}

// Carregar pagamentos do armazenamento offline
export async function loadPayments(): Promise<PaymentType[]> {
  try {
    // Tentar carregar do IndexedDB
    const payments = await loadAllData<PaymentType>('payments');
    console.log(`${payments.length} pagamentos carregados do IndexedDB`);
    return payments;
  } catch (error) {
    console.error('Erro ao carregar pagamentos do IndexedDB:', error);
    // Em caso de erro, retornar array vazio
    return [];
  }
}

// Carregar configurações do armazenamento offline
export async function loadSettings(): Promise<AppSettings | null> {
  try {
    // Tentar carregar do IndexedDB (usamos ID 'app' para as configurações)
    const settings = await loadData<AppSettings & { id: string }>('settings', 'app');
    if (settings) {
      console.log('Configurações carregadas do IndexedDB');
      return settings;
    }
    return defaultSettings;
  } catch (error) {
    console.error('Erro ao carregar configurações do IndexedDB:', error);
    // Em caso de erro, retornar configurações padrão
    return defaultSettings;
  }
}

// Salvar mutuários no armazenamento offline
export async function saveBorrowers(borrowers: BorrowerType[]): Promise<void> {
  try {
    await saveAllData('borrowers', borrowers);
    console.log(`${borrowers.length} mutuários salvos no IndexedDB`);
    
    // Se estivermos online, sincronizar com o servidor
    if (isOnline()) {
      // Lógica para sincronizar com o servidor
      try {
        await fetch('/api/borrowers/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(borrowers)
        });
        console.log('Mutuários sincronizados com o servidor');
      } catch (err) {
        console.error('Erro ao sincronizar mutuários com o servidor:', err);
      }
    }
  } catch (error) {
    console.error('Erro ao salvar mutuários no IndexedDB:', error);
  }
}

// Salvar empréstimos no armazenamento offline
export async function saveLoans(loans: LoanType[]): Promise<void> {
  try {
    await saveAllData('loans', loans);
    console.log(`${loans.length} empréstimos salvos no IndexedDB`);
    
    // Se estivermos online, sincronizar com o servidor
    if (isOnline()) {
      // Lógica para sincronizar com o servidor
      try {
        await fetch('/api/loans/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loans)
        });
        console.log('Empréstimos sincronizados com o servidor');
      } catch (err) {
        console.error('Erro ao sincronizar empréstimos com o servidor:', err);
      }
    }
  } catch (error) {
    console.error('Erro ao salvar empréstimos no IndexedDB:', error);
  }
}

// Salvar pagamentos no armazenamento offline
export async function savePayments(payments: PaymentType[]): Promise<void> {
  try {
    await saveAllData('payments', payments);
    console.log(`${payments.length} pagamentos salvos no IndexedDB`);
    
    // Se estivermos online, sincronizar com o servidor
    if (isOnline()) {
      // Lógica para sincronizar com o servidor
      try {
        await fetch('/api/payments/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payments)
        });
        console.log('Pagamentos sincronizados com o servidor');
      } catch (err) {
        console.error('Erro ao sincronizar pagamentos com o servidor:', err);
      }
    }
  } catch (error) {
    console.error('Erro ao salvar pagamentos no IndexedDB:', error);
  }
}

// Salvar configurações no armazenamento offline
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    // Adicionar um ID para armazenar no IndexedDB
    const settingsWithId = { ...settings, id: 'app' };
    await saveData('settings', settingsWithId);
    console.log('Configurações salvas no IndexedDB');
    
    // Se estivermos online, sincronizar com o servidor
    if (isOnline()) {
      // Lógica para sincronizar com o servidor
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        console.log('Configurações sincronizadas com o servidor');
      } catch (err) {
        console.error('Erro ao sincronizar configurações com o servidor:', err);
      }
    }
  } catch (error) {
    console.error('Erro ao salvar configurações no IndexedDB:', error);
  }
}

// Gerar ID único
export function generateId(): string {
  // Se não tivermos conectividade, prefixar com "temp_" para evitar conflitos
  const prefix = isOnline() ? '' : 'temp_';
  const id = `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return id;
}

// Limpar todos os dados
export async function clearAllData(): Promise<void> {
  try {
    // Limpar todas as stores
    await saveAllData('borrowers', []);
    await saveAllData('loans', []);
    await saveAllData('payments', []);
    
    // Salvar configurações padrão
    await saveSettings(defaultSettings);
    
    console.log('Todos os dados limpos do IndexedDB');
    
    // Se estivermos online, enviar comando de reset para o servidor
    if (isOnline()) {
      try {
        await fetch('/api/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Comando de reset enviado para o servidor');
      } catch (err) {
        console.error('Erro ao enviar comando de reset para o servidor:', err);
      }
    }
  } catch (error) {
    console.error('Erro ao limpar dados do IndexedDB:', error);
  }
}
