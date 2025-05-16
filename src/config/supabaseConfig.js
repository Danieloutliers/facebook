/**
 * Configuração do Supabase para Autenticação
 * 
 * Este arquivo contém as credenciais do Supabase específicas para autenticação.
 * Estas credenciais são separadas das utilizadas para backup.
 * 
 * Para conectar com seu próprio projeto Supabase para autenticação:
 * 1. Acesse https://supabase.com e faça login
 * 2. Selecione seu projeto (ou crie um novo) para autenticação
 * 3. Vá para "Settings" > "API"
 * 4. Copie a URL do projeto e a chave anônima (anon public)
 * 5. Substitua os valores abaixo
 */

// IMPORTANTE: Credenciais do Supabase específicas para AUTENTICAÇÃO
export const SUPABASE_CONFIG = {
  // URL do projeto Supabase para autenticação
  url: 'https://mduscgwhzvulpfprdzbx.supabase.co',
  
  // Chave anônima (anon key) do Supabase para autenticação
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdXNjZ3doenZ1bHBmcHJkemJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NzIxNDgsImV4cCI6MjA2MTM0ODE0OH0.YujEi6-vS4-rE1bTW-WaRhNOfU-nUJzy34RCXln0vsw',
  
  // Se verdadeiro, as credenciais acima serão usadas mesmo que existam valores nos cookies
  // Isso garante que sempre use as credenciais definidas no código
  forceUseDefaultCredentials: false
};

/**
 * Política de segurança recomendada para o bucket:
 * 
 * Para permitir acesso de leitura e escrita, vá até "Storage" no Supabase,
 * selecione seu bucket, vá para a aba "Policies" e adicione:
 * 
 * Nome: "Acesso completo para usuários anônimos"
 * Allowed operations: SELECT, INSERT, UPDATE, DELETE
 * Definição da política: true
 * 
 * ATENÇÃO: Esta política permite acesso público. Para maior segurança,
 * é recomendável implementar autenticação de usuários.
 */