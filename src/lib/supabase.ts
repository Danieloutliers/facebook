import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/config/supabaseConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}