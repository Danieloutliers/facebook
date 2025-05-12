import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Lida com o redirecionamento após autenticação OAuth
    // Como o Supabase já manipula a sessão automaticamente,
    // apenas redirecione para a página inicial após um breve atraso
    
    toast({
      title: "Login realizado com sucesso",
      description: "Você será redirecionado para o Dashboard"
    });
    
    const timer = setTimeout(() => {
      navigate("/");
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Autenticação concluída</h2>
        <p className="text-muted-foreground">Redirecionando para o Dashboard...</p>
      </div>
    </div>
  );
}
