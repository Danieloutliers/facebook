import { BorrowerType, LoanType, PaymentType, AppSettings } from "@/types";
import { logInfo, logWarning } from "@/utils/logUtils";

// Chaves para armazenar os dados no localStorage
const STORAGE_KEYS = {
  BORROWERS: 'loanbuddy_borrowers',
  LOANS: 'loanbuddy_loans',
  PAYMENTS: 'loanbuddy_payments',
  SETTINGS: 'loanbuddy_settings',
  PERSISTENCE_ENABLED: 'loanbuddy_persistence_enabled'
};

// Valores padrão para as configurações
const DEFAULT_SETTINGS: AppSettings = {
  defaultInterestRate: 5,
  defaultPaymentFrequency: "monthly",
  defaultInstallments: 12,
  currency: "R$",
  persistenceEnabled: true // Nova configuração, ativada por padrão
};

// Verifica se a persistência de dados está ativada
// Observação: As configurações são SEMPRE persistentes, 
// mas os outros dados podem ser configurados para não persistir
export function isPersistenceEnabled(): boolean {
  try {
    // Primeiro verifica se há uma configuração específica de persistência
    const persistenceFlag = localStorage.getItem(STORAGE_KEYS.PERSISTENCE_ENABLED);
    if (persistenceFlag !== null) {
      return persistenceFlag === 'true';
    }
    
    // Se não houver configuração específica, carrega das configurações gerais
    const settings = loadSettings();
    // Atualiza a flag específica para futuras consultas
    setPersistenceEnabled(settings.persistenceEnabled ?? true);
    return settings.persistenceEnabled ?? true;
  } catch (error) {
    console.error('Erro ao verificar status de persistência:', error);
    return true; // Em caso de erro, assume persistência ativada como padrão
  }
}

// Define se a persistência de dados está ativada
export function setPersistenceEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSISTENCE_ENABLED, String(enabled));
    
    // Registra a ação nos logs
    if (enabled) {
      logInfo("Persistência de dados ativada. Os dados serão salvos no navegador.");
    } else {
      logWarning("Persistência de dados desativada. Os dados existem apenas em memória.");
    }
  } catch (error) {
    console.error('Erro ao definir status de persistência:', error);
  }
}

// Funções de leitura do localStorage
export function loadBorrowers(): BorrowerType[] {
  try {
    // Configurações sempre serão carregadas para verificar persistência
    if (!isPersistenceEnabled()) {
      logInfo("Dados de mutuários carregados apenas da memória (sem localStorage)");
      return [];
    }
    
    const data = localStorage.getItem(STORAGE_KEYS.BORROWERS);
    const borrowers = data ? JSON.parse(data) : [];
    logInfo(`Carregados ${borrowers.length} mutuários do localStorage`);
    return borrowers;
  } catch (error) {
    console.error('Erro ao carregar mutuários:', error);
    return [];
  }
}

export function loadLoans(): LoanType[] {
  try {
    if (!isPersistenceEnabled()) {
      logInfo("Dados de empréstimos carregados apenas da memória (sem localStorage)");
      return [];
    }
    
    const data = localStorage.getItem(STORAGE_KEYS.LOANS);
    const loans = data ? JSON.parse(data) : [];
    logInfo(`Carregados ${loans.length} empréstimos do localStorage`);
    return loans;
  } catch (error) {
    console.error('Erro ao carregar empréstimos:', error);
    return [];
  }
}

export function loadPayments(): PaymentType[] {
  try {
    if (!isPersistenceEnabled()) {
      logInfo("Dados de pagamentos carregados apenas da memória (sem localStorage)");
      return [];
    }
    
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    const payments = data ? JSON.parse(data) : [];
    logInfo(`Carregados ${payments.length} pagamentos do localStorage`);
    return payments;
  } catch (error) {
    console.error('Erro ao carregar pagamentos:', error);
    return [];
  }
}

export function loadSettings(): AppSettings {
  try {
    // Settings são SEMPRE persistentes para garantir que configurações não sejam perdidas
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    if (!data) {
      // Se não existirem configurações salvas, retorna os valores padrão
      return DEFAULT_SETTINGS;
    }
    
    // Mescla as configurações salvas com os valores padrão para garantir compatibilidade
    const savedSettings = JSON.parse(data);
    const mergedSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
    
    // Garante que a configuração de persistência esteja presente
    if (mergedSettings.persistenceEnabled === undefined) {
      mergedSettings.persistenceEnabled = true;
    }
    
    return mergedSettings;
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    return DEFAULT_SETTINGS;
  }
}

// Funções de salvamento no localStorage
export function saveBorrowers(borrowers: BorrowerType[]): void {
  try {
    if (!isPersistenceEnabled()) {
      logInfo("Dados de mutuários atualizados apenas em memória (sem localStorage)");
      return;
    }
    
    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(borrowers));
    logInfo(`Salvos ${borrowers.length} mutuários no localStorage`);
  } catch (error) {
    console.error('Erro ao salvar mutuários:', error);
  }
}

export function saveLoans(loans: LoanType[]): void {
  try {
    if (!isPersistenceEnabled()) {
      logInfo("Dados de empréstimos atualizados apenas em memória (sem localStorage)");
      return;
    }
    
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    logInfo(`Salvos ${loans.length} empréstimos no localStorage`);
  } catch (error) {
    console.error('Erro ao salvar empréstimos:', error);
  }
}

export function savePayments(payments: PaymentType[]): void {
  try {
    if (!isPersistenceEnabled()) {
      logInfo("Dados de pagamentos atualizados apenas em memória (sem localStorage)");
      return;
    }
    
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    logInfo(`Salvos ${payments.length} pagamentos no localStorage`);
  } catch (error) {
    console.error('Erro ao salvar pagamentos:', error);
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    // Settings são SEMPRE persistentes, independente da configuração de persistência
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    
    // Atualiza o status de persistência se foi alterado
    if (settings.persistenceEnabled !== undefined) {
      setPersistenceEnabled(settings.persistenceEnabled);
    }
    
    logInfo("Configurações salvas no localStorage");
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
}

// Função para gerar IDs únicos
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Função para limpar todos os dados, mantendo configurações
export function clearAllData(): void {
  try {
    const settingsBackup = loadSettings(); // Backup das configurações
    
    localStorage.removeItem(STORAGE_KEYS.BORROWERS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    
    // Restaura as configurações (incluindo o status de persistência)
    saveSettings(settingsBackup);
    
    logWarning("Todos os dados foram removidos do localStorage, mas as configurações foram mantidas");
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
  }
}

// Função para remover TODOS os dados, incluindo configurações (usado apenas para o reset completo para produção)
export function resetAllDataForProduction(): void {
  try {
    // Primeiro, fazer backup da persistência
    const persistenceEnabled = isPersistenceEnabled();
    
    // Remover todos os dados, inclusive configurações
    localStorage.removeItem(STORAGE_KEYS.BORROWERS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    
    // Restaurar apenas o status de persistência para garantir que o aplicativo continue funcionando
    setPersistenceEnabled(persistenceEnabled);
    
    // Carregar as configurações padrão e salvá-las
    saveSettings(DEFAULT_SETTINGS);
    
    logWarning("🧹 RESET COMPLETO: Todos os dados foram removidos para inicialização em produção");
    console.group("🚀 INÍCIO: RESET DE DADOS");
    console.table({
      "Mutuários": 0,
      "Empréstimos": 0,
      "Pagamentos": 0
    });
    console.groupEnd();
  } catch (error) {
    console.error('Erro ao fazer reset completo para produção:', error);
  }
}

// Função para verificar se o localStorage está disponível
export function isLocalStorageAvailable(): boolean {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Função para obter uma mensagem de status sobre a persistência
export function getPersistenceStatusMessage(): string {
  if (!isLocalStorageAvailable()) {
    return "Sistema operando em modo offline. Acesso ao localStorage bloqueado pelo navegador.";
  }
  
  if (isPersistenceEnabled()) {
    return "Sistema operando com persistência de dados ativada. Seus dados estão sendo salvos no navegador.";
  } else {
    return "Sistema operando sem persistência de dados. Dados existem apenas em memória.";
  }
}
