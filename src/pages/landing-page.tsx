import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Smartphone, Download, CreditCard, BarChart3, Users, Shield, Clock, Zap, Globe, TrendingUp, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const [openFaq, setOpenFaq] = useState<number | null>(null);



  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Visualize todos os seus contratos, pagamentos e métricas em tempo real com gráficos interativos."
    },
    {
      icon: Users,
      title: "Gestão de Mutuários",
      description: "Cadastre e gerencie informações completas dos seus clientes com histórico de crédito."
    },
    {
      icon: CreditCard,
      title: "Controle de Pagamentos",
      description: "Acompanhe vencimentos, registre pagamentos e envie lembretes automáticos."
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia de ponta e backup automático na nuvem."
    },
    {
      icon: Clock,
      title: "Notificações Inteligentes",
      description: "Receba alertas de vencimentos, atrasos e oportunidades de negócio."
    },
    {
      icon: TrendingUp,
      title: "Relatórios Avançados",
      description: "Análises detalhadas de performance, lucratividade e tendências do seu negócio."
    }
  ];

  const mobileFeatures = [
    "Acesso offline completo",
    "Sincronização automática",
    "Notificações push",
    "Scanner de documentos",
    "Assinatura digital",
    "Geolocalização de clientes"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              loanBuddy Pro
            </h1>
          </div>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Fazer Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            🚀 Nova versão disponível
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            Revolucione seu <br />Negócio de Contratos
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            O sistema mais completo e intuitivo para gerenciar contratos, controlar pagamentos e fazer seu negócio crescer com segurança e eficiência.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6"
              onClick={() => navigate("/auth?tab=register")}
            >
              <Zap className="w-5 h-5 mr-2" />
              Teste Grátis
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 hover:bg-gray-50"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Funcionalidades Poderosas</h2>
            <p className="text-xl text-gray-600">Tudo que você precisa para gerenciar seus contratos com eficiência</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Apps Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Apps Mobile Nativos</h2>
              <p className="text-xl text-gray-600 mb-8">
                Acesse seu sistema em qualquer lugar com nossos apps nativos para iOS e Android. 
                Funcionalidade completa mesmo offline.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {mobileFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button 
                  className="bg-black hover:bg-gray-800 text-white flex items-center"
                  onClick={installPWA}
                  disabled={isInstalled}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isInstalled ? "App Instalado" : "Instalar App"}
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                  onClick={installPWA}
                  disabled={isInstalled}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isInstalled ? "App Instalado" : "Instalar App"}
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
                <Smartphone className="w-16 h-16 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-center mb-4">Disponível em Breve</h3>
                <p className="text-center opacity-90">
                  Nossos apps mobile estão em desenvolvimento final. 
                  Seja um dos primeiros a experimentar!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Escolha o Plano Ideal</h2>
            <p className="text-xl text-gray-600">Soluções flexíveis para todos os tipos de negócio</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Teste Grátis */}
            <Card className="border-2 border-gray-200 hover:border-green-500 transition-all duration-300 relative">
              <div className="p-8 text-center">
                <div className="mb-6">
                  <Badge className="mb-4 bg-green-100 text-green-800">TESTE GRÁTIS</Badge>
                  <div className="text-4xl font-bold text-gray-900 mb-2">R$ 0</div>
                  <div className="text-gray-600">3 dias grátis</div>
                </div>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Até 5 clientes</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Até 10 contratos</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Relatórios básicos</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Suporte por email</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  onClick={() => navigate("/auth?tab=register")}
                >
                  Começar Teste Grátis
                </Button>
              </div>
            </Card>

            {/* Plano Básico - R$ 37 */}
            <Card className="border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 relative transform scale-105">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">MAIS POPULAR</Badge>
              </div>
              <div className="p-8 text-center">
                <div className="mb-6">
                  <Badge className="mb-4 bg-blue-100 text-blue-800">BÁSICO</Badge>
                  <div className="text-4xl font-bold text-gray-900 mb-2">R$ 37</div>
                  <div className="text-gray-600">por mês</div>
                </div>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Clientes ilimitados</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Contratos ilimitados</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Relatórios completos</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Notificações automáticas</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Backup automático</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Suporte prioritário</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  onClick={() => navigate("/auth?tab=register")}
                >
                  Assinar Agora
                </Button>
              </div>
            </Card>

            {/* Plano Profissional - R$ 97 */}
            <Card className="border-2 border-purple-500 hover:border-purple-600 transition-all duration-300 relative">
              <div className="p-8 text-center">
                <div className="mb-6">
                  <Badge className="mb-4 bg-purple-100 text-purple-800">PROFISSIONAL</Badge>
                  <div className="text-4xl font-bold text-gray-900 mb-2">R$ 97</div>
                  <div className="text-gray-600">por mês</div>
                </div>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Tudo do plano Básico</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>API de integração</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Relatórios avançados</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Múltiplos usuários</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>White label</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>Suporte 24/7</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                  onClick={() => navigate("/auth?tab=register")}
                >
                  Assinar Agora
                </Button>
              </div>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Não tem certeza? Teste grátis por 3 dias, sem compromisso!
            </p>
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => navigate("/auth?tab=register")}
            >
              Começar Teste Grátis Agora
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Perguntas Frequentes</h2>
            <p className="text-xl text-gray-600">Tire suas dúvidas sobre o loanBuddy</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "Como funciona o período de teste gratuito?",
                answer: "Você tem 3 dias completos para testar todas as funcionalidades do sistema, sem compromisso. Não é necessário cartão de crédito para começar."
              },
              {
                question: "Posso cancelar minha assinatura a qualquer momento?",
                answer: "Sim! Você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta. Não há multas ou taxas de cancelamento."
              },
              {
                question: "Meus dados estão seguros?",
                answer: "Absolutamente! Utilizamos criptografia de ponta a ponta e backup automático na nuvem. Seus dados estão protegidos com os mais altos padrões de segurança."
              },
              {
                question: "O sistema funciona offline?",
                answer: "Sim! O loanBuddy funciona completamente offline em dispositivos móveis e sincroniza automaticamente quando a conexão é restaurada."
              },
              {
                question: "Existe limite de clientes ou contratos?",
                answer: "No plano Básico e Profissional não há limites. Você pode cadastrar quantos clientes e contratos precisar para seu negócio."
              }
            ].map((faq, index) => (
              <Card key={index} className="border border-gray-200">
                <div className="p-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 text-gray-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para Transformar seu Negócio?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de empresários que já revolucionaram seus negócios com o LoanBuddy Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => navigate("/auth?tab=register")}
            >
              Começar Teste Grátis
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6"
            >
              <Globe className="w-5 h-5 mr-2" />
              Agendar Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">LoanBuddy Pro</h3>
              </div>
              <p className="text-gray-400">
                A solução completa para gestão de contratos
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Funcionalidades</li>
                <li>Apps Mobile</li>
                <li>Integrações</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de Ajuda</li>
                <li>Documentação</li>
                <li>Contato</li>
                <li>Status do Sistema</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre Nós</li>
                <li>Blog</li>
                <li>Carreiras</li>
                <li>Privacidade</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LoanBuddy Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}