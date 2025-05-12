import { ReactNode, useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  path: string;
  children: ReactNode;
}

export function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Verificar autenticação fora do render para evitar warning
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  return (
    <Route path={path}>
      {() => {
        // Mostrar loading enquanto verifica autenticação
        if (loading) {
          return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-background">
              <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-t-2 border-primary mb-4"></div>
              <p className="text-muted-foreground animate-pulse">Carregando...</p>
            </div>
          );
        }
        
        // Não renderizar o conteúdo se não estiver autenticado
        if (!user) {
          return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-background">
              <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-t-2 border-primary mb-4"></div>
              <p className="text-muted-foreground animate-pulse">Redirecionando...</p>
            </div>
          );
        }
        
        // Renderizar o conteúdo da rota se estiver autenticado
        return children;
      }}
    </Route>
  );
}
