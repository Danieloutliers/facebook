import { createClient } from "@supabase/supabase-js";

// Demo values para fins de demonstração - em produção devem ser configurados adequadamente
const supabaseUrl = "https://demo-supabase-url.supabase.co";
const supabaseAnonKey = "demo-anon-key";

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
