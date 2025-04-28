import { ReactNode } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  path: string;
  children: ReactNode;
}

export function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  return (
    <Route path={path}>
      {() => {
        // Mostrar loading enquanto verifica autenticação
        if (loading) {
          return (
            <div className="flex justify-center items-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          );
        }
        
        // Redirecionar para login se não estiver autenticado
        if (!user) {
          navigate("/auth");
          return null;
        }
        
        // Renderizar o conteúdo da rota se estiver autenticado
        return children;
      }}
    </Route>
  );
}
