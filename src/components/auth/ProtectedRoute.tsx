import { ReactNode, useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";

interface ProtectedRouteProps {
  path: string;
  children: ReactNode;
}

export function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isExpired, loading: trialLoading } = useTrialStatus();
  const [, navigate] = useLocation();

  // Verificar autenticação e status do teste
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && !trialLoading && user && isExpired) {
      navigate("/trial-expired");
    }
  }, [user, authLoading, trialLoading, isExpired, navigate]);

  return (
    <Route path={path}>
      {() => {
        // Mostrar loading enquanto verifica autenticação e status do teste
        if (authLoading || trialLoading) {
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

        // Não renderizar o conteúdo se o teste expirou
        if (isExpired) {
          return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-background">
              <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-t-2 border-primary mb-4"></div>
              <p className="text-muted-foreground animate-pulse">Redirecionando...</p>
            </div>
          );
        }
        
        // Renderizar o conteúdo da rota se estiver autenticado e teste válido
        return children;
      }}
    </Route>
  );
}
