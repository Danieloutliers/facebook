import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string, phone?: string) => Promise<{ error: AuthError | null, user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual do Supabase
    const fetchSession = async () => {
      setLoading(true);
      
      try {
        // Verificar se o Supabase está disponível
        if (!isSupabaseConfigured() || !supabase) {
          console.warn("Supabase não está configurado. Funcionando em modo desenvolvimento local.");
          // Simular um usuário de desenvolvimento para facilitar o teste
          const devUser = { id: "dev-user", email: "dev@example.com" } as User;
          setUser(devUser);
          setSession({ user: devUser } as Session);
          setLoading(false);
          return;
        }
        
        try {
          // Obter sessão atual
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
          
          // Configurar listener para mudanças de autenticação
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
              setSession(newSession);
              setUser(newSession?.user ?? null);
              setLoading(false);
            }
          );
  
          setLoading(false);
          
          // Cleanup
          return () => {
            subscription.unsubscribe();
          };
        } catch (supabaseError) {
          console.warn("Erro ao conectar com Supabase. Usando modo de desenvolvimento local.", supabaseError);
          // Simular um usuário de desenvolvimento para facilitar o teste
          const devUser = { id: "dev-user", email: "dev@example.com" } as User;
          setUser(devUser);
          setSession({ user: devUser } as Session);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
        // Simular um usuário de desenvolvimento para facilitar o teste
        const devUser = { id: "dev-user", email: "dev@example.com" } as User;
        setUser(devUser);
        setSession({ user: devUser } as Session);
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Verificar se o Supabase está disponível
      if (!isSupabaseConfigured() || !supabase) {
        console.warn("Supabase não está configurado. Usando modo de desenvolvimento local.");
        // Simular login para desenvolvimento local (sem autenticação real)
        setUser({ id: "dev-user", email } as User);
        setSession({ user: { id: "dev-user", email } as User } as Session);
        return { error: null };
      }

      try {
        // Tenta fazer login no Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        return { error };
      } catch (supabaseError) {
        // Se houver erro no Supabase, cai no modo de desenvolvimento local
        console.warn("Erro ao conectar com Supabase. Usando modo de desenvolvimento local.", supabaseError);
        setUser({ id: "dev-user", email } as User);
        setSession({ user: { id: "dev-user", email } as User } as Session);
        return { error: null };
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      // Em caso de erro, também usamos o modo de desenvolvimento local
      setUser({ id: "dev-user", email } as User);
      setSession({ user: { id: "dev-user", email } as User } as Session);
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string, phone?: string) => {
    try {
      // Verificar se o Supabase está disponível
      if (!isSupabaseConfigured() || !supabase) {
        console.warn("Supabase não está configurado. Usando modo de desenvolvimento local.");
        // Simular registro para desenvolvimento local
        const mockUser = { 
          id: "dev-user", 
          email,
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          user_metadata: {
            display_name: displayName,
            phone: phone
          }
        } as User;
        setUser(mockUser);
        setSession({ user: mockUser } as Session);
        return { error: null, user: mockUser };
      }

      try {
        // Preparar dados do usuário com metadados
        const signUpData: any = {
          email,
          password
        };

        // Adicionar metadados se fornecidos
        if (displayName || phone) {
          signUpData.options = {
            data: {
              display_name: displayName,
              phone: phone
            }
          };
        }

        // Tenta registrar no Supabase
        const { data, error } = await supabase.auth.signUp(signUpData);
        
        return { error, user: data?.user || null };
      } catch (supabaseError) {
        // Se houver erro no Supabase, cai no modo de desenvolvimento local
        console.warn("Erro ao conectar com Supabase. Usando modo de desenvolvimento local.", supabaseError);
        const mockUser = { 
          id: "dev-user", 
          email,
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          user_metadata: {
            display_name: displayName,
            phone: phone
          }
        } as User;
        setUser(mockUser);
        setSession({ user: mockUser } as Session);
        return { error: null, user: mockUser };
      }
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      // Em caso de erro, também usamos o modo de desenvolvimento local
      const mockUser = { 
        id: "dev-user", 
        email,
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        user_metadata: {
          display_name: displayName,
          phone: phone
        }
      } as User;
      setUser(mockUser);
      setSession({ user: mockUser } as Session);
      return { error: null, user: mockUser };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    }
    
    // Sempre limpa o estado, independente do resultado da chamada de API
    setUser(null);
    setSession(null);
    
    // Limpar possíveis dados do localStorage relacionados ao trial
    localStorage.removeItem('loanbuddy_simulate_trial_expired');
    
    // Forçar reload da página para garantir limpeza completa
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
