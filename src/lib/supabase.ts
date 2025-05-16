/**
 * Cliente Supabase para integração com o sistema LoanBuddy
 * 
 * Este módulo configura o cliente Supabase para ser usado como solução de armazenamento
 * em nuvem para backups de dados.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/config/supabaseConfig';

// Obter valores de configuração
let SUPABASE_URL = SUPABASE_CONFIG.url;
let SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

// Se existirem variáveis de ambiente, elas terão prioridade (a menos que forceUseDefaultCredentials seja true)
if (!SUPABASE_CONFIG.forceUseDefaultCredentials) {
  if (import.meta.env.VITE_SUPABASE_URL) {
    SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  }
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
}

/**
 * Verifica se o Supabase está configurado corretamente
 * @returns boolean indicando se as variáveis de ambiente estão definidas
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Criar o cliente Supabase se as variáveis de ambiente estiverem definidas
export const supabase = isSupabaseConfigured() 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Configuração do cliente Supabase.
 * 
 * Para utilizar este módulo, é necessário:
 * 1. Criar uma conta no Supabase (https://supabase.com)
 * 2. Criar um novo projeto
 * 3. Obter a URL do projeto e a chave anônima nas configurações da API
 * 4. Definir as variáveis de ambiente:
 *    - VITE_SUPABASE_URL: URL do projeto
 *    - VITE_SUPABASE_ANON_KEY: Chave anônima do projeto
 */