import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null, user: User | null }>;
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
        if (!isSupabaseConfigured()) {
          console.warn("Supabase não está configurado. Funcionando em modo desenvolvimento local.");
          setLoading(false);
          return;
        }
        
        // Obter sessão atual
        const { data: { session: currentSession } } = await supabase!.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
        
        // Configurar listener para mudanças de autenticação
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(
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
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Verificar se o Supabase está disponível
      if (!isSupabaseConfigured()) {
        console.warn("Supabase não está configurado. Usando modo de desenvolvimento local.");
        // Simular login para desenvolvimento local (sem autenticação real)
        setUser({ id: "dev-user", email } as User);
        setSession({ user: { id: "dev-user", email } as User } as Session);
        return { error: null };
      }

      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password
      });
      
      return { error };
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      return { 
        error: new Error("Ocorreu um erro ao tentar fazer login") as unknown as AuthError
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Verificar se o Supabase está disponível
      if (!isSupabaseConfigured()) {
        console.warn("Supabase não está configurado. Usando modo de desenvolvimento local.");
        // Simular registro para desenvolvimento local
        const mockUser = { id: "dev-user", email } as User;
        setUser(mockUser);
        setSession({ user: mockUser } as Session);
        return { error: null, user: mockUser };
      }

      const { data, error } = await supabase!.auth.signUp({
        email,
        password
      });
      
      return { error, user: data?.user || null };
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      return { 
        error: new Error("Ocorreu um erro ao tentar criar a conta") as unknown as AuthError,
        user: null 
      };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase!.auth.signOut();
    } else {
      // Para desenvolvimento local, apenas limpar o estado
      setUser(null);
      setSession(null);
    }
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
