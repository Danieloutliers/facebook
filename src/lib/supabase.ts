import { createClient } from "@supabase/supabase-js";

// Obter as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Variáveis de ambiente do Supabase não estão configuradas corretamente.");
  console.warn("Por favor, defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env ou .env.local.");
  console.warn("Usando modo de fallback para desenvolvimento local.");
}

// Criar cliente Supabase
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      }
    )
  : null;

// Função para verificar se o Supabase está configurado
export function isSupabaseConfigured() {
  return supabase !== null;
}
