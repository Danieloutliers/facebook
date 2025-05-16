/**
 * Serviço de sincronização automática com Supabase
 * 
 * Este módulo fornece funcionalidades para sincronizar automaticamente
 * os dados do aplicativo com o Supabase sempre que houver mudanças.
 */

import { BorrowerType, LoanType, PaymentType, AppSettings } from '@/types';
import * as SupabaseBackupClient from './supabaseBackupClient';
import { isBackupSupabaseConfigured } from '@/lib/backupSupabase';
import { getAutoSyncEnabled, getUseEncryption } from './cookieUtils';

// Configuração
const AUTO_SYNC_DEBOUNCE_MS = 5000; // Tempo de espera após mudanças para sincronizar (5 segundos)
let syncTimeout: NodeJS.Timeout | null = null;
let isSyncing = false;

// Status de sincronização
let lastSyncTime: string | null = null;
let syncStatus: 'idle' | 'pending' | 'syncing' | 'success' | 'error' = 'idle';
let syncErrorMessage: string | null = null;

// Opções de sincronização - inicializadas a partir dos cookies
let useEncryption = getUseEncryption();
let autoSyncEnabled = getAutoSyncEnabled();

/**
 * Verifica se a sincronização automática está habilitada
 */
export function isAutoSyncEnabled(): boolean {
  return autoSyncEnabled;
}

/**
 * Define se a sincronização automática está habilitada ou não
 * e salva a configuração nos cookies
 */
export function setAutoSyncEnabled(enabled: boolean): void {
  autoSyncEnabled = enabled;
  // Já não é necessário salvar aqui, pois estamos salvando no componente SupabaseBackup
  console.log(`Sincronização automática ${enabled ? 'ativada' : 'desativada'}`);
}

/**
 * Define se a criptografia será usada na sincronização automática
 * e salva a configuração nos cookies
 */
export function setUseEncryption(encrypt: boolean): void {
  useEncryption = encrypt;
  // Já não é necessário salvar aqui, pois estamos salvando no componente SupabaseBackup
}

/**
 * Obtém o status atual da sincronização
 */
export function getSyncStatus(): {
  status: 'idle' | 'pending' | 'syncing' | 'success' | 'error';
  lastSyncTime: string | null;
  errorMessage: string | null;
} {
  return {
    status: syncStatus,
    lastSyncTime,
    errorMessage: syncErrorMessage
  };
}

/**
 * Sincroniza os dados com o Supabase
 * Essa função é chamada automaticamente após mudanças nos dados,
 * respeitando o tempo de debounce configurado
 */
export async function synchronizeData(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[],
  settings: AppSettings
): Promise<boolean> {
  // Se não estiver habilitado, não sincroniza
  if (!autoSyncEnabled) return false;
  
  // Se o Supabase para backup não estiver configurado, não sincroniza
  if (!isBackupSupabaseConfigured()) {
    console.warn('Supabase para backup não está configurado. Sincronização automática desabilitada.');
    return false;
  }
  
  try {
    // Se já estiver sincronizando, não inicia outra sincronização
    if (isSyncing) {
      console.log('Já existe uma sincronização em andamento. Aguardando conclusão...');
      return false;
    }
    
    isSyncing = true;
    syncStatus = 'syncing';
    console.log('Iniciando sincronização automática com Supabase...');
    
    // Sincronizar dados
    const result = await SupabaseBackupClient.saveDataToSupabase(
      borrowers,
      loans,
      payments,
      settings,
      useEncryption
    );
    
    // Atualizar status
    if (result.success) {
      lastSyncTime = new Date().toISOString();
      syncStatus = 'success';
      syncErrorMessage = null;
      console.log('Sincronização automática concluída com sucesso.');
      return true;
    } else {
      syncStatus = 'error';
      syncErrorMessage = result.message;
      console.error('Erro na sincronização automática:', result.message);
      return false;
    }
  } catch (error) {
    syncStatus = 'error';
    syncErrorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na sincronização automática:', error);
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Agenda uma sincronização automática para ocorrer após o tempo de debounce
 * Isso evita múltiplas sincronizações quando muitas mudanças ocorrem em sequência
 */
export function scheduleSync(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[],
  settings: AppSettings
): void {
  // Se não estiver habilitado, não agenda
  if (!autoSyncEnabled) return;
  
  // Se já houver um timeout agendado, cancela-o
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  // Atualiza o status para pendente
  syncStatus = 'pending';
  
  // Agenda nova sincronização
  syncTimeout = setTimeout(async () => {
    await synchronizeData(borrowers, loans, payments, settings);
  }, AUTO_SYNC_DEBOUNCE_MS);
  
  console.log('Sincronização automática agendada para ocorrer em', AUTO_SYNC_DEBOUNCE_MS/1000, 'segundos');
}