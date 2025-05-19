import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import TaskCalendar from "@/components/task-calendar";
import IOSSafeTaskCalendar from "@/components/ios-safe-task-calendar";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthPage() {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Redirecionar para home se já estiver logado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Não carregamos mais automaticamente o formulário de login
  // Mesmo que o usuário já tenha desbloqueado anteriormente, ele terá que
  // desbloquear novamente ao entrar na página de login
  useEffect(() => {
    // Removemos o item do localStorage para garantir que o usuário 
    // sempre veja o calendário primeiro
    localStorage.removeItem('login-unlocked');
    setShowLoginForm(false);
  }, []);

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

  // Função chamada quando o usuário completa a sequência secreta
  const handleSecretComplete = () => {
    // Primeiro mostramos uma animação de "desbloqueio" antes de mostrar o formulário
    toast({
      title: "Sequência secreta completada!",
      description: "Desbloqueando acesso ao sistema...",
      variant: "default",
    });
    
    // Esperamos um pouco para criar um efeito dramático
    setTimeout(() => {
      setShowLoginForm(true);
      
      // Garantir que nenhuma informação sobre o progresso da sequência é salva
      localStorage.removeItem('calendar-tasks');
      localStorage.removeItem('secret-progress');
      localStorage.removeItem('login-unlocked');
      
      toast({
        title: "Acesso desbloqueado!",
        description: "Você revelou o formulário de login.",
        variant: "default",
      });
    }, 1500);
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
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container mx-auto p-4 flex-1 flex flex-col">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-3 title-gradient">Calendário de Tarefas</h1>
          <p className="text-muted-foreground">
            {showLoginForm 
              ? "Faça login para acessar o sistema" 
              : "Organize seu dia a dia com este gerenciador de tarefas"}
          </p>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {!showLoginForm ? (
            <div className="w-full max-w-4xl">
              {/* Detectar iOS e usar o componente otimizado quando necessário */}
              {(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ? (
                <IOSSafeTaskCalendar onSecretComplete={handleSecretComplete} />
              ) : (
                <TaskCalendar onSecretComplete={handleSecretComplete} />
              )}
            </div>
          ) : (
            <Card className="w-full max-w-md p-8 border-border shadow-lg">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Acesso ao Sistema</h2>
                <p className="text-muted-foreground">
                  Entre com suas credenciais para continuar
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
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-2 text-sm" 
                  onClick={() => setShowLoginForm(false)}
                >
                  Voltar ao calendário
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Rodapé removido para não revelar a verdadeira natureza do aplicativo */}
      </div>
    </div>
  );
}
