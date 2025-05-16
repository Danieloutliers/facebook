/**
 * Cliente Supabase específico para operações de backup
 * 
 * Este arquivo configura um cliente Supabase separado, dedicado exclusivamente
 * para operações de backup e sincronização de dados.
 */

import { createClient } from '@supabase/supabase-js';
import { BACKUP_CONFIG } from '@/config/backupConfig';

import { getCookie } from '@/utils/cookieUtils';

// Chaves para os cookies de configuração do Supabase
const COOKIE_KEYS = {
  SUPABASE_URL: 'loanbuddy_supabase_url',
  SUPABASE_ANON_KEY: 'loanbuddy_supabase_anon_key',
  SUPABASE_BUCKET: 'loanbuddy_supabase_bucket'
};

// Obter valores de configuração de backup
let BACKUP_URL;
let BACKUP_ANON_KEY;

// Verificar se devemos usar as credenciais padrão ou as dos cookies
if (BACKUP_CONFIG.forceUseDefaultCredentials) {
  BACKUP_URL = BACKUP_CONFIG.url;
  BACKUP_ANON_KEY = BACKUP_CONFIG.anonKey;
} else {
  // Usar credenciais dos cookies
  BACKUP_URL = getCookie(COOKIE_KEYS.SUPABASE_URL) || '';
  BACKUP_ANON_KEY = getCookie(COOKIE_KEYS.SUPABASE_ANON_KEY) || '';
}

/**
 * Verifica se o Supabase para backup está configurado corretamente
 * @returns boolean indicando se as variáveis de configuração estão definidas
 */
export function isBackupSupabaseConfigured(): boolean {
  return Boolean(BACKUP_URL && BACKUP_ANON_KEY);
}

// Criar o cliente Supabase específico para backup
// Função para validar se uma string é uma URL válida
function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Criar o cliente Supabase apenas se as credenciais forem válidas
export const backupSupabase = isBackupSupabaseConfigured() && 
  isValidUrl(BACKUP_URL) && BACKUP_ANON_KEY?.length > 20
  ? createClient(BACKUP_URL, BACKUP_ANON_KEY)
  : null;