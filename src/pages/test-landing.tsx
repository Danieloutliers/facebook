import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Users, 
  FileText, 
  AlertCircle, 
  DollarSign, 
  BarChart3, 
  Smartphone,
  CreditCard,
  TrendingUp,
  Shield,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function TestLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [, navigate] = useLocation();

  // Redirecionar para /teste após 30 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 30000); // 30 segundos

    return () => clearTimeout(timer);
  }, [navigate]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Como é realizado o pagamento do sistema?",
      answer: "O pagamento é realizado mensalmente através de cartão de crédito ou débito. Sem taxas ocultas ou surpresas."
    },
    {
      question: "O sistema possui alguma limitação?",
      answer: "Não! O loanBuddy é 100% ilimitado. Cadastre quantos clientes e contratos precisar, sem restrições."
    },
    {
      question: "Consigo acompanhar as informações de qualquer lugar?",
      answer: "Sim! O sistema é 100% online e funciona em qualquer dispositivo com internet - computador, tablet ou smartphone."
    },
    {
      question: "Tenho garantia?",
      answer: "Oferecemos garantia de 30 dias. Se não ficar satisfeito, devolvemos seu dinheiro."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">loanBuddy</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">Entrar</Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">Cadastro</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Controle Total na Palma da Suas Mãos
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
            Simplifique a gestão de suas contas a receber e obtenha controle completo sobre seu negócio de forma{" "}
            <span className="font-bold text-green-600">rápida</span>,{" "}
            <span className="font-bold text-green-600">prática</span> e{" "}
            <span className="font-bold text-green-600">eficiente</span>. Deixe para trás os{" "}
            <span className="font-bold">caderninhos de papel</span> ou as{" "}
            <span className="font-bold">planilhas complicadas</span>.
          </p>
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
            Começar agora
          </Button>
        </div>
      </section>

      {/* App Screenshot */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Smartphone className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <p className="text-lg text-gray-600 dark:text-gray-400">Interface do loanBuddy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Badge */}
      <section className="py-8 bg-green-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white">100% ON-LINE - 100% ILIMITADO</h2>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Por que Escolher Nossa Solução?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Rápido, fácil e intuitivo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">Gestão de Clientes Simplificada</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Tenha todas as informações dos seus clientes organizadas e acessíveis em um único lugar. 
                  Cadastre novos clientes em poucos cliques e mantenha um histórico completo de todas as suas transações.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">Gestão de Contratos Inteligente</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Crie, edite e acompanhe os contratos com facilidade. Estabeleça condições claras 
                  e acompanhe todo o ciclo de vida dos contratos, desde a criação até o término.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">Acompanhamento de Recebíveis</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitore de forma automática as parcelas recebíveis. Nossa plataforma te ajuda a garantir 
                  que você nunca perca uma data de recebimento e acompanha as parcelas atrasadas e a vencer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Essential Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              ESSENCIAL
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Funcionalidades Essenciais
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Monitoramento da Margem de Lucro</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Acompanhe em tempo real o retorno do seu investimento. Veja suas margens de lucro e identifique oportunidades.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gestão de Parcelas Atrasadas e a Vencer</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Saiba exatamente quem deve e quem está em dia. Receba alertas automáticos de atrasos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Relatórios Detalhados</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Gera relatórios detalhados de clientes, contratos e recebíveis, ajudando nas decisões.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Interface Simples e Intuitiva</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Criada para simplificar sua rotina, com poucos cliques você acessa informações essenciais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              PLANOS
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Solução barata que resolve o controle da sua gestão
            </h2>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-2 border-green-600 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="text-4xl font-bold text-green-600 mb-2">R$ 37</div>
                  <div className="text-gray-600 dark:text-gray-400">Mensal</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span>Controle de clientes</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span>Controle de contratos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span>Controle de vencimentos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span>Controle de lucro</span>
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3">
                  Criar minha conta
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tem alguma dúvida? Vamos te ajudar! 🙂
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Venha se juntar a nós.
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Siga o exemplo dos grandes e faça uma gestão profissional.
          </p>
          <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 px-8 py-6 text-lg">
            Começar agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">loanBuddy</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-gray-400">2025 - Termos de Uso</span>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                Entrar
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                Cadastro
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}