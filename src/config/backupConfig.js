/**
 * Configuração do Supabase para Backup
 * 
 * Este arquivo contém as credenciais do Supabase específicas para backup.
 * Estas credenciais são separadas das utilizadas para autenticação.
 * 
 * Para conectar com seu próprio projeto Supabase para backup:
 * 1. Acesse https://supabase.com e faça login
 * 2. Selecione seu projeto (ou crie um novo) para backup
 * 3. Vá para "Settings" > "API"
 * 4. Copie a URL do projeto e a chave anônima (anon public)
 * 5. Substitua os valores abaixo
 */

// IMPORTANTE: Credenciais do Supabase para BACKUP configuradas separadamente
export const BACKUP_CONFIG = {
  // URL do projeto Supabase para backup
  url: 'https://mduscgwhzvulpfprdzbx.supabase.co',
  
  // Chave anônima (anon key) do Supabase para backup
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdXNjZ3doenZ1bHBmcHJkemJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NzIxNDgsImV4cCI6MjA2MTM0ODE0OH0.YujEi6-vS4-rE1bTW-WaRhNOfU-nUJzy34RCXln0vsw',
  
  // Nome do bucket para armazenar os backups
  bucketName: 'loanbuddy',
  
  // Se verdadeiro, as credenciais acima serão usadas mesmo que existam valores nos cookies
  // Isso garante que sempre use as credenciais definidas no código
  forceUseDefaultCredentials: false
};