import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, TrendingUp, Calendar } from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { cn } from "@/lib/utils";

type ChartInstance = any;

export default function PaymentTrendsNew() {
  const { loans, payments, settings } = useLoan();
  const [period, setPeriod] = useState("1");
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartInstance | null>(null);
  const [renderKey, setRenderKey] = useState(Date.now());
  
  // Formatar valores monetários de acordo com a moeda nas configurações
  const formatCurrency = (value: number) => {
    return `${settings.currency} ${value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };
  
  // Função para forçar a atualização do gráfico
  const forceChartUpdate = () => {
    console.log("Forçando atualização do gráfico...");
    // Gerar nova chave de renderização
    setRenderKey(Date.now());
  };

  // UseEffect combinado para detectar mudanças em empréstimos ou pagamentos
  useEffect(() => {
    console.log("Detectada mudança nos dados:", {
      contratos: loans.length, 
      pagamentos: payments.length
    });
    
    // Usar um setTimeout para garantir que o estado foi atualizado completamente
    const timerId = setTimeout(() => {
      forceChartUpdate();
      console.log("Gráfico atualizado após mudanças nos dados");
    }, 100);
    
    return () => clearTimeout(timerId);
  }, [loans.length, payments.length]); // Dependência apenas no tamanho para melhor performance
  
  // Efeito para renderizar o gráfico sempre que a chave de renderização mudar
  useEffect(() => {
    if (!chartRef.current) return;
    
    const createChart = async () => {
      console.log("Criando gráfico com nova chave de renderização:", renderKey);
      // Importar Chart.js dinamicamente
      const Chart = (await import("chart.js/auto")).default;
      
      // Destruir o gráfico existente, se houver
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      
      const ctx = chartRef.current?.getContext("2d");
      if (!ctx) return;
      
      // Obter data atual
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Configurar a visualização com base no período selecionado
      const months = parseInt(period);
      
      // Se for visualização de 1 mês (diária)
      if (months === 1) {
        // Calcular o número de dias no mês atual
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Criar array de datas para o mês atual
        const days = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(currentYear, currentMonth, i + 1);
          return date;
        });
        
        // Calcular pagamentos para cada dia e armazenar status para colorir adequadamente
        const dailyPaymentsData = days.map(day => {
          // Não vamos mais usar os pagamentos realizados, apenas os empréstimos programados
          // Isso vai garantir que só os empréstimos relevantes apareçam no gráfico
          let scheduledPayments = 0;
          let hasOverdue = false;
          let hasPending = false;
          let isPaid = false;
          
          // Configurar dia para comparação
          day.setHours(0, 0, 0, 0);
          
          // Mostrar TODOS os pagamentos do mês, sem filtrar pelo dia atual
          // Verificar empréstimos com pagamentos programados (ativos, a vencer e vencidos)
          loans.forEach(loan => {
            // Incluir empréstimos ativos, a vencer (pending), vencidos (overdue), e pagos (paid) que tenham pagamentos futuros
            if ((loan.status === 'active' || loan.status === 'pending' || loan.status === 'overdue' || loan.status === 'paid') && 
                loan.paymentSchedule?.nextPaymentDate) {
              try {
                // Converter para objeto Date com ajuste para horário local
                // Corrigindo problema de fuso horário: usar o construtor que especifica os componentes da data
                const dateStr = loan.paymentSchedule.nextPaymentDate;
                const dateParts = dateStr.split('-').map(Number);
                const year = dateParts[0];
                const month = dateParts[1] - 1; // Mês em JavaScript é 0-indexed
                const dayNum = dateParts[2];
                
                const nextPaymentDate = new Date(year, month, dayNum, 12, 0, 0);
                
                // Verificar se o pagamento está programado para este dia (APENAS do mês atual)
                // Garantir que esteja mostrando apenas pagamentos do mês atual
                // No loop, 'day' é uma Date definida mais acima
                const dayValue = day.getDate();
                
                if (nextPaymentDate.getDate() === dayValue && 
                    nextPaymentDate.getMonth() === currentMonth && 
                    nextPaymentDate.getFullYear() === currentYear) {
                  // Adicionar o valor da parcela
                  scheduledPayments += loan.paymentSchedule.installmentAmount || 0;
                  
                  // Registrar o status deste empréstimo para este dia
                  if (loan.status === 'overdue') {
                    hasOverdue = true;
                  } else if (loan.status === 'pending') {
                    hasPending = true;
                  } else if (loan.status === 'paid') {
                    isPaid = true;
                  }
                  
                  // Log com formato de data correto
                  const formattedDay = day.toISOString().split('T')[0];
                  console.log(`Encontrado pagamento programado para ${formattedDay}: ${loan.borrowerName} (${loan.status}), valor: ${loan.paymentSchedule.installmentAmount}`);
                }
              } catch (e) {
                console.error("Erro ao processar data de pagamento programado:", e);
              }
            }
          });
          
          // Retornar o valor e status para cada dia
          return {
            value: scheduledPayments,
            hasOverdue,
            hasPending,
            isPaid
          };
        });
        
        // Separar valores e status para o gráfico
        const dailyPayments = dailyPaymentsData.map(item => item.value);
        const backgroundColors = dailyPaymentsData.map(item => {
          if (item.hasOverdue) return "rgba(239, 68, 68, 0.2)"; // Vermelho para vencidos
          return "rgba(34, 197, 94, 0.2)"; // Verde para todos os outros status (pendentes, ativos e pagos)
        });
        
        const borderColors = dailyPaymentsData.map(item => {
          if (item.hasOverdue) return "rgb(239, 68, 68)"; // Vermelho para vencidos
          return "rgb(34, 197, 94)"; // Verde para todos os outros status (pendentes, ativos e pagos)
        });
        
        // Criar gráfico de barras para visualização diária
        chartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: days.map(date => date.getDate().toString()),
            datasets: [{
              label: "Pagamentos Programados",
              data: dailyPayments,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 2,
              borderRadius: 4,
              hoverBackgroundColor: borderColors.map(color => {
                if (color === "rgb(239, 68, 68)") return "rgba(239, 68, 68, 0.4)"; // Vermelho para vencidos
                return "rgba(34, 197, 94, 0.4)"; // Verde para todos os outros status
              }),
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => `Total: ${formatCurrency(context.raw as number)}`,
                  title: (context) => `Dia ${context[0].label}`
                }
              },
              legend: {
                position: "top",
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Dia do Mês'
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => formatCurrency(value as number)
                }
              }
            }
          }
        });
      } else {
        // Para outros períodos, mostrar visualização mensal
        // Se for o período de 3, 6 ou 12 meses, mostrar a projeção para os meses futuros
        const periodMonths = Array.from({ length: months }, (_, i) => {
          const date = new Date(today);
          // Agora incluímos o mês atual (i=0) e meses futuros (i>0)
          date.setMonth(date.getMonth() + i);
          return date;
        });
        
        console.log("Meses a serem exibidos:", 
          periodMonths.map(d => `${d.getMonth()+1}/${d.getFullYear()}`).join(", "));
        
        // Calcular pagamentos para cada mês (usando apenas os empréstimos como base)
        const monthlyPaymentsData = periodMonths.map(month => {
          // Usar apenas os empréstimos para calcular os valores do gráfico
          let scheduledMonthlyPayments = 0;
          let hasOverdue = false;
          let hasPending = false;
          let isPaid = false;
          
          // Cada mês (atual ou futuro) terá seus próprios pagamentos calculados
          console.log(`PROCESSANDO PAGAMENTOS PARA MÊS ${month.getMonth()+1}/${month.getFullYear()}`);
          
          // Para cada mês futuro, precisamos calcular os pagamentos que são esperados naquele mês
          loans.forEach(loan => {
            // Incluir empréstimos ativos, pendentes ou pagos que tenham cronograma de pagamento
            // Mesmo empréstimos com status 'paid' podem ter parcelas futuras!
            if ((loan.status === 'active' || loan.status === 'pending' || loan.status === 'paid') && loan.paymentSchedule) {
              try {
                // Para o mês atual, usar a próxima data de pagamento diretamente
                if (month.getMonth() === currentMonth && month.getFullYear() === currentYear) {
                  // Usar a data de próximo pagamento para o mês atual
                  const dateStr = loan.paymentSchedule.nextPaymentDate;
                  const [year, monthNum, day] = dateStr.split('-').map(Number);
                  const nextPaymentDate = new Date(year, monthNum - 1, day, 12, 0, 0);
                  
                  // Verificar se esse pagamento é para o mês atual
                  if (nextPaymentDate.getMonth() === month.getMonth() && 
                      nextPaymentDate.getFullYear() === month.getFullYear()) {
                    console.log(`✅ INCLUINDO pagamento de ${loan.borrowerName} (${loan.status}): ${loan.paymentSchedule.installmentAmount} para ${nextPaymentDate.toLocaleDateString('pt-BR')}`);
                    scheduledMonthlyPayments += loan.paymentSchedule.installmentAmount || 0;
                    
                    // Registrar status
                    if (loan.status === 'pending') {
                      hasPending = true;
                    }
                  }
                } 
                // Para meses futuros, calcular as datas de pagamento projetadas
                else {
                  // Calcular meses no futuro a partir do mês atual
                  const monthsInFuture = (month.getFullYear() - currentYear) * 12 + month.getMonth() - currentMonth;
                  
                  // Verificar se ainda terá parcelas a pagar nesse mês futuro
                  // Usar paymentSchedule.paidInstallments se disponível, senão estimar com base nos pagamentos feitos
                  const paidInstallments = loan.paymentSchedule.paidInstallments !== undefined 
                    ? loan.paymentSchedule.paidInstallments 
                    : 0;
                  
                  // Calcular o número da parcela que cai nesse mês futuro
                  // Não adicionamos +1 aqui, pois isso faria com que a 1ª parcela fosse considerada já paga
                  // Para novos empréstimos, paidInstallments é 0, então monthsInFuture=1 deve corresponder à parcela 1
                  const futureInstallmentNumber = paidInstallments + monthsInFuture;
                  
                  // Só incluir se esse mês futuro ainda tiver parcela dentro do cronograma do empréstimo
                  if (futureInstallmentNumber <= loan.paymentSchedule.installments) {
                    console.log(`✅ PROJETANDO pagamento de ${loan.borrowerName} para ${month.getMonth()+1}/${month.getFullYear()} (parcela ${futureInstallmentNumber} de ${loan.paymentSchedule.installments})`);
                    scheduledMonthlyPayments += loan.paymentSchedule.installmentAmount || 0;
                  } else {
                    console.log(`❌ EXCLUINDO projeção de ${loan.borrowerName}: todas as ${loan.paymentSchedule.installments} parcelas já terão sido pagas até ${month.getMonth()+1}/${month.getFullYear()}`);
                  }
                }
              } catch (e) {
                console.error("Erro ao processar projeção de pagamento:", e);
              }
            }
          });
          
          // Retornar dados com valor e status
          return {
            value: scheduledMonthlyPayments,
            hasOverdue,
            hasPending,
            isPaid
          };
        });
        
        // Separar valores e status para o gráfico
        const monthlyPayments = monthlyPaymentsData.map(item => item.value);
        const monthBackgroundColors = monthlyPaymentsData.map(item => {
          if (item.hasOverdue) return "rgba(239, 68, 68, 0.2)"; // Vermelho para vencidos
          return "rgba(34, 197, 94, 0.2)"; // Verde para todos os outros status (pendentes, ativos e pagos)
        });
        
        const monthBorderColors = monthlyPaymentsData.map(item => {
          if (item.hasOverdue) return "rgb(239, 68, 68)"; // Vermelho para vencidos
          return "rgb(34, 197, 94)"; // Verde para todos os outros status (pendentes, ativos e pagos)
        });
        
        // Criar gráfico de barras para visualização mensal
        chartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: periodMonths.map(date => {
              const monthNames = [
                "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                "Jul", "Ago", "Set", "Out", "Nov", "Dez"
              ];
              return `${monthNames[date.getMonth()]}/${date.getFullYear()}`;
            }),
            datasets: [{
              label: "Pagamentos Programados",
              data: monthlyPayments,
              backgroundColor: monthBackgroundColors,
              borderColor: monthBorderColors,
              borderWidth: 2,
              borderRadius: 4,
              hoverBackgroundColor: monthBorderColors.map(color => {
                if (color === "rgb(239, 68, 68)") return "rgba(239, 68, 68, 0.4)"; // Vermelho para vencidos
                return "rgba(34, 197, 94, 0.4)"; // Verde para todos os outros status
              }),
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => `Total: ${formatCurrency(context.raw as number)}`,
                  title: (context) => context[0].label
                }
              },
              legend: {
                position: "top",
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Mês/Ano'
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => formatCurrency(value as number)
                }
              }
            }
          }
        });
      }
    };
    
    createChart();
    
    // Cleanup ao desmontar
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [renderKey, period, formatCurrency, loans, payments]);
  
  // Manipulador para alterar o período de visualização
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    forceChartUpdate();
  };
  
  // Total estimado para o período atual (usando apenas os empréstimos como base)
  const calculateTotalEstimated = () => {
    if (period === "1") {
      // Se for visualização mensal, calcular para o mês corrente
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Calcular usando apenas os empréstimos programados para este mês
      let scheduledPayments = 0;
      
      // Processando empréstimos, incluindo aqueles com status 'paid' mas que têm pagamentos futuros
      console.log("Calculando pagamentos estimados para o mês");
      const activeLoans = loans.filter(loan => 
        loan.status === 'active' || loan.status === 'pending' || loan.status === 'overdue' || loan.status === 'paid');
      
      console.log(`Total de contratos não arquivados (ativos/vencidos/pagos): ${activeLoans.length}`);
      const loansWithSchedule = activeLoans.filter(loan => loan.paymentSchedule?.nextPaymentDate);
      console.log(`Contratos com programação: ${loansWithSchedule.length}`);
      
      loansWithSchedule.forEach(loan => {
        // Já sabemos que loan.paymentSchedule e nextPaymentDate existem por causa do filtro anterior
        try {
          // TypeScript não-nulo assertion operator (!) para indicar que paymentSchedule existe
          // Corrigindo problema de fuso horário
          const dateStr = loan.paymentSchedule!.nextPaymentDate!;
          const [year, month, day] = dateStr.split('-').map(Number);
          const nextPaymentDate = new Date(year, month - 1, day, 12, 0, 0);
          const installmentAmount = loan.paymentSchedule!.installmentAmount || 0;
          
          // Verificar se o próximo pagamento é neste mês
          if (nextPaymentDate.getMonth() === currentMonth && 
              nextPaymentDate.getFullYear() === currentYear) {
            console.log(`Adicionando pagamento de ${loan.borrowerName} PARA ESTE MÊS: ${installmentAmount} (data: ${nextPaymentDate.getDate()}/${nextPaymentDate.getMonth()+1}/${nextPaymentDate.getFullYear()})`);
            scheduledPayments += installmentAmount;
          } else {
            console.log(`Pagamento de ${loan.borrowerName} NÃO é para este mês (${currentMonth+1}/${currentYear}): ${installmentAmount} (data: ${nextPaymentDate.getDate()}/${nextPaymentDate.getMonth()+1}/${nextPaymentDate.getFullYear()})`);
          }
        } catch (e) {
          console.error("Erro ao calcular pagamentos programados:", e);
        }
      });
      
      console.log(`Total estimado final APENAS PARA ESTE MÊS: ${scheduledPayments}`);
      return scheduledPayments;
    }
    
    // Para outros períodos, vamos fazer uma projeção dos pagamentos futuros
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthsPeriod = parseInt(period);
    
    // Filtrar empréstimos ativos, pendentes ou pagos com cronograma de pagamento
    // É importante incluir empréstimos 'paid' que podem ter parcelas futuras
    const eligibleLoans = loans.filter(loan => 
      (loan.status === 'active' || loan.status === 'pending' || loan.status === 'paid') && 
      loan.paymentSchedule?.installmentAmount && 
      loan.paymentSchedule?.installments);
    
    // Calcular para cada empréstimo as parcelas futuras no período especificado
    let totalProjected = 0;
    
    eligibleLoans.forEach(loan => {
      if (!loan.paymentSchedule) return;
      
      // Determinar quantas parcelas já foram pagas
      const paidInstallments = loan.paymentSchedule.paidInstallments !== undefined 
        ? loan.paymentSchedule.paidInstallments 
        : 0;
      
      console.log(`[Projeção] Empréstimo ${loan.borrowerName}: ${paidInstallments} parcelas pagas de ${loan.paymentSchedule.installments} totais`);
      
      // Calcular quantas parcelas ainda restam
      const remainingInstallments = loan.paymentSchedule.installments - paidInstallments;
      
      // Limitar ao período especificado ou ao número de parcelas restantes, o que for menor
      const installmentsInPeriod = Math.min(monthsPeriod, remainingInstallments);
      
      // Adicionar ao total projetado
      totalProjected += installmentsInPeriod * (loan.paymentSchedule.installmentAmount || 0);
      
      console.log(`Projeção para ${loan.borrowerName}: ${installmentsInPeriod} parcelas futuras (${formatCurrency(installmentsInPeriod * (loan.paymentSchedule.installmentAmount || 0))})`);
    });
    
    console.log(`Total estimado para os próximos ${monthsPeriod} meses: ${formatCurrency(totalProjected)}`);
    return totalProjected;
  };
  
  const totalEstimated = calculateTotalEstimated();
  
  return (
    <Card className="col-span-3 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-b">
        <div className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg font-semibold">
                Tendência de Pagamentos
              </CardTitle>
            </div>
            <CardDescription className="text-sm mt-1">
              Visualização de pagamentos programados de todos os contratos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={forceChartUpdate}
              className="bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Atualizar gráfico"
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <div className="w-[140px]">
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="bg-white dark:bg-slate-800">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    <SelectValue placeholder="Período" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Este mês</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-start mt-2">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 px-3 border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total estimado para o período</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalEstimated)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="h-64">
          <canvas 
            ref={chartRef} 
            key={`payment-trends-${renderKey}`} 
            className={cn(
              "transition-opacity duration-300",
              renderKey ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
