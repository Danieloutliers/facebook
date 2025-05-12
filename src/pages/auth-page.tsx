import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirecionar para home se já estiver logado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast({
        title: "Login realizado com sucesso",
        description: "Você será redirecionado para o Dashboard",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-t-2 border-primary mb-4"></div>
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Formulário - Lado Esquerdo */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 border-border shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-3 title-gradient">LoanBuddy</h1>
            <p className="text-muted-foreground">
              Gerencie seus empréstimos de forma simples e eficiente
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/90">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-border bg-background/60 focus-visible:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/90">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-border bg-background/60 focus-visible:ring-primary/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-8 btn-gradient h-11 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2 h-5 w-5 border-b-2 border-t-2 border-white rounded-full"></span>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>O cadastro de usuários é realizado pelo administrador do sistema.</p>
          </div>
        </Card>
      </div>

      {/* Hero - Lado Direito */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-primary via-accent to-secondary">
        <div className="max-w-md p-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Gerencie seus empréstimos com facilidade
          </h2>
          <p className="text-white text-xl mb-8 leading-relaxed">
            Uma forma simples e organizada de controlar empréstimos pessoais, 
            acompanhar pagamentos e gerar relatórios detalhados.
          </p>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <ul className="space-y-4 text-white text-left">
              <li className="flex items-center">
                <span className="mr-3 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</span> 
                <span>Controle de mutuários e empréstimos</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</span> 
                <span>Gestão de pagamentos e parcelas</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</span> 
                <span>Notificações de vencimentos</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</span> 
                <span>Relatórios financeiros detalhados</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
