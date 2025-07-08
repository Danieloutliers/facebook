import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Crown, Star, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

export default function TrialExpired() {
  const { signOut } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Forçar redirecionamento para a página de autenticação
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, redirecionar para garantir que o usuário saia
      navigate("/auth");
    }
  };

  const plans = [
    {
      name: "Premium",
      price: "R$ 29,90",
      period: "/mês",
      description: "Perfeito para pequenas empresas",
      features: [
        "Empréstimos ilimitados",
        "Relatórios avançados",
        "Backup automático",
        "Suporte prioritário",
        "Notificações automáticas",
        "Exportação de dados"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$ 89,90",
      period: "/mês",
      description: "Para empresas em crescimento",
      features: [
        "Todos os recursos Premium",
        "Usuários ilimitados",
        "API personalizada",
        "Integrações avançadas",
        "Suporte 24/7",
        "Treinamento personalizado"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full">
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Seu teste gratuito expirou
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seu teste gratuito de 24 horas expirou! Esperamos que tenha gostado do LoanBuddy. 
            Para continuar aproveitando todos os recursos e manter seus dados seguros, 
            escolha um plano que melhor atende às suas necessidades.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  <Crown className={`h-6 w-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-baseline justify-center mt-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full mt-6 ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}
                  size="lg"
                >
                  Assinar {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem dúvidas? Entre em contato conosco para uma demonstração personalizada.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button variant="outline" size="sm">
              Falar com Vendas
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sair da Conta
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            30 dias de garantia • Cancele a qualquer momento • Suporte incluído
          </p>
        </div>
      </div>
    </div>
  );
}