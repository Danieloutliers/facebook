import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Info, UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, CreditCard, ArrowLeft, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Função para formatar telefone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return value;
};

export default function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Detectar parâmetro da URL para definir aba inicial
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') === 'register' ? 'register' : 'login';
  
  // Estados para login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para cadastro
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      
      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message || "Verifique suas credenciais",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !phoneNumber || !signUpEmail || !signUpPassword || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSigningUp(true);
    try {
      const { error, user } = await signUp(signUpEmail, signUpPassword, fullName, phoneNumber);
      
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message || "Tente novamente mais tarde",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar a conta",
      });

      // Limpar formulário
      setSignUpEmail("");
      setSignUpPassword("");
      setConfirmPassword("");
      setFullName("");
      setPhoneNumber("");
      
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LoanBuddy Pro
              </h1>
              <p className="text-xs text-gray-500">Sistema de Contratos</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/landing")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {defaultTab === 'register' ? 'Comece seu teste grátis' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-gray-600">
              {defaultTab === 'register' 
                ? 'Crie sua conta e revolucione sua gestão de contratos' 
                : 'Entre na sua conta para continuar'
              }
            </p>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl shadow-blue-500/10">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-xl mb-8">
                <TabsTrigger 
                  value="login" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-6 p-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">
                      Esqueceu sua senha?
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Entrando...
                      </div>
                    ) : (
                      "Entrar na conta"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-6 p-6">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        Nome Completo
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Seu nome completo"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                        Telefone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                          required
                          maxLength={15}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signUpEmail" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="signUpEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signUpPassword" className="text-sm font-medium text-gray-700">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="signUpPassword"
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                          className="pl-10 pr-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 transition-all duration-200"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-transparent"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        >
                          {showSignUpPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        Confirmar Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pl-10 pr-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 transition-all duration-200"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={isSigningUp}
                    >
                      {isSigningUp ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Criando conta...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <UserPlus className="w-5 h-5 mr-2" />
                          Criar conta grátis
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Info Section */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Info className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Teste Grátis por 3 Dias
                  </h4>
                  <p className="text-sm text-gray-600">
                    Acesso completo a todas as funcionalidades. Sem compromisso, cancele quando quiser.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center space-y-3">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <span>Seguro</span>
              <span>•</span>
              <span>Confiável</span>
              <span>•</span>
              <span>Suporte 24/7</span>
            </div>
            <p className="text-xs text-gray-400">
              Sistema de Gestão de Contratos - LoanBuddy Pro v2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}