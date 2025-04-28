import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";

// Simulação de usuário para fins de demonstração
interface DemoUser {
  id: string;
  email: string;
}

interface AuthContextType {
  session: Session | null;
  user: DemoUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dados de demonstração
const demoUsers = [
  { email: "admin@exemplo.com", password: "senha123", id: "1" },
  { email: "usuario@teste.com", password: "123456", id: "2" }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário salvo no localStorage
    const savedUser = localStorage.getItem('demoUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setSession({ user: parsedUser } as Session);
    }
    
    // Simulação de carregamento
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simular um delay para parecer uma requisição real
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se o usuário existe na nossa "base de dados" de demonstração
    const foundUser = demoUsers.find(
      u => u.email === email && u.password === password
    );
    
    if (foundUser) {
      const user = { id: foundUser.id, email: foundUser.email };
      setUser(user);
      setSession({ user } as Session);
      localStorage.setItem('demoUser', JSON.stringify(user));
      return { error: null };
    }
    
    return {
      error: {
        message: "Credenciais inválidas. Tente novamente."
      }
    };
  };

  const signUp = async (email: string, password: string) => {
    // Simular um delay para parecer uma requisição real
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se o email já existe
    const userExists = demoUsers.some(u => u.email === email);
    
    if (userExists) {
      return {
        error: {
          message: "Este email já está em uso."
        },
        user: null
      };
    }
    
    // Criar novo usuário (apenas na memória, em um app real seria salvo no banco)
    const newUser = { 
      id: `${demoUsers.length + 1}`, 
      email,
      password // Em um app real nunca salvaríamos senhas em texto puro
    };
    
    // Adicionar à lista de usuários (simulação)
    demoUsers.push(newUser);
    
    // Retornar sucesso
    return { 
      error: null, 
      user: { id: newUser.id, email: newUser.email } 
    };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('demoUser');
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
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
