import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency } from "@/utils/formatters";

export default function PaymentTrends() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const { payments, loans, getEstimatedMonthlyPayments } = useLoan();
  const [period, setPeriod] = useState("1");
  const [refreshing, setRefreshing] = useState(false);
  
  // Usar um ID para forçar o recarregamento do gráfico quando solicitado
  const [chartUpdateId, setChartUpdateId] = useState(Date.now());
  
  // Função para atualizar manualmente o gráfico
  const refreshChart = () => {
    setRefreshing(true);
    
    // Forçar redesenho do gráfico com um novo ID
    setChartUpdateId(Date.now());
    
    // Simular um pequeno atraso para feedback visual
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };
  
  // Use um ID para forçar o recarregamento do gráfico quando houver alterações
  const [chartId, setChartId] = useState(Date.now());
  
  // Forçar a atualização do gráfico quando os empréstimos ou pagamentos mudarem
  useEffect(() => {
    // Verificar se realmente houve mudança na quantidade de empréstimos
    // Isso é importante para garantir que novos empréstimos sempre atualizem o gráfico
    if (loans.length !== 0) {
      setChartId(Date.now());
      console.log(`Dados atualizados, forçando redesenho do gráfico. Total de empréstimos: ${loans.length}`);
      
      // Forçar a atualização do gráfico imediatamente
      refreshChart();
    }
  }, [loans, payments]);
  
  // Adicionar um listener para eventos de atualização de empréstimos
  useEffect(() => {
    // Função handler para o evento loansUpdated
    const handleLoansUpdated = (event: any) => {
      console.log('Evento loansUpdated recebido:', event.detail);
      // Forçar a atualização do gráfico
      setChartId(Date.now());
      refreshChart();
    };
    
    // Registrar o listener para o evento customizado
    document.addEventListener('loansUpdated', handleLoansUpdated);
    
    // Limpar o listener quando o componente for desmontado
    return () => {
      document.removeEventListener('loansUpdated', handleLoansUpdated);
    };
  }, []); // Remover dependência que estava causando erro

  useEffect(() => {
    // Atualizar quando o chartUpdateId mudar (botão de atualização) ou quando
    // period, payments ou loans mudarem, ou quando chartId mudar
    
    // Garantir que o componente está montado e o canvas está disponível
    if (!chartRef.current) return;
    
    // Indicar que o gráfico está sendo atualizado (para logging)
    console.log(`Atualizando gráfico devido a mudança em: chartUpdateId=${chartUpdateId}, chartId=${chartId}`);

    // Ao atualizar o gráfico, registrar os dados dos empréstimos para debugging
    console.log("=== DEBUGGING GRÁFICO DE TENDÊNCIAS ===");
    console.log(`Total de empréstimos: ${loans.length}`);
    
    // Listar TODOS os empréstimos com detalhes - inclusive os possivelmente inativos ou sem data
    console.log("Lista completa de empréstimos:");
    
    // Exibir tabela formatada para melhor visualização
    console.table(loans.map((loan, index) => {
      let nextPaymentDateStr = "N/A";
      let installmentAmount = "N/A";
      
      if (loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate) {
        try {
          const nextDate = new Date(loan.paymentSchedule.nextPaymentDate);
          nextPaymentDateStr = `${nextDate.getDate()}/${nextDate.getMonth()+1}/${nextDate.getFullYear()}`;
          installmentAmount = loan.paymentSchedule.installmentAmount?.toString() || "0";
        } catch (e) {
          nextPaymentDateStr = `ERRO: ${loan.paymentSchedule.nextPaymentDate}`;
        }
      }
      
      return {
        idx: index + 1,
        id: loan.id,
        nome: loan.borrowerName,
        status: loan.status,
        proximoPagamento: nextPaymentDateStr,
        valor: installmentAmount 
      };
    }));
    
    // Logs detalhados adicionais
    loans.forEach((loan, index) => {
      console.log(`Empréstimo #${index+1}: ${loan.borrowerName} (ID: ${loan.id})`);
      console.log(`  - Status: ${loan.status}`);
      console.log(`  - Tem agenda de pagamento? ${loan.paymentSchedule ? 'Sim' : 'Não'}`);
      
      if (loan.paymentSchedule) {
        if (loan.paymentSchedule.nextPaymentDate) {
          try {
            const nextDate = new Date(loan.paymentSchedule.nextPaymentDate);
            console.log(`  - Próximo pagamento: ${nextDate.getDate()}/${nextDate.getMonth()+1}/${nextDate.getFullYear()}`);
            console.log(`  - Valor da parcela: ${loan.paymentSchedule.installmentAmount}`);
            console.log(`  - Data original (sem parse): ${loan.paymentSchedule.nextPaymentDate}`);
          } catch (e) {
            console.error(`  - ERRO ao processar data: ${loan.paymentSchedule.nextPaymentDate}`, e);
          }
        } else {
          console.log(`  - Sem data de próximo pagamento definida`);
        }
      }
      
      console.log("  ---");
    });
    
    console.log("=== FIM DO DEBUGGING ===");

    const loadChart = async () => {
      // Importar Chart.js dinamicamente
      const Chart = (await import("chart.js/auto")).default;

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const today = new Date();
      const months = parseInt(period);
      
      // Se for 1 mês, mostrar por dia
      if (months === 1) {
        const ctx = chartRef.current?.getContext("2d");
        if (!ctx) return;
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const days = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(currentYear, currentMonth, i + 1);
          return date;
        });

        const dailyPayments = days.map(day => {
          // 1. Primeiro, calcular os pagamentos já realizados para este dia
          const paymentsForDay = payments.reduce((total, payment) => {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getDate() === day.getDate() && 
                paymentDate.getMonth() === day.getMonth() && 
                paymentDate.getFullYear() === day.getFullYear()) {
              return total + payment.amount;
            }
            return total;
          }, 0);
          
          // 2. Para pagamentos futuros, verificar programações de empréstimos ativos
          let futureDailyPayments = 0;
          
          // Adicionar apenas se a data atual for igual ou anterior ao dia verificado
          // para evitar dupla contagem de pagamentos já realizados
          const now = new Date();
          const isCurrentDayOrFuture = day >= now || 
                                      (day.getDate() === now.getDate() && 
                                      day.getMonth() === now.getMonth() && 
                                      day.getFullYear() === now.getFullYear());
          
          if (isCurrentDayOrFuture) {
            // Procurar por empréstimos com pagamentos programados para este dia
            loans.forEach(loan => {
              if (loan.status === 'active' && loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate) {
                // Garantir que estamos trabalhando com um objeto Date para comparação
                let nextPaymentDate;
                
                try {
                  // Tentar converter a string de data em um objeto Date
                  nextPaymentDate = new Date(loan.paymentSchedule.nextPaymentDate);
                  
                  // Verificar se a data é válida
                  if (isNaN(nextPaymentDate.getTime())) {
                    console.error(`Data inválida para empréstimo ${loan.id}: ${loan.paymentSchedule.nextPaymentDate}`);
                    return; // Pular este empréstimo
                  }
                  
                  // Debug para verificar datas
                  console.log(`Verificando empréstimo ${loan.borrowerName} para o dia ${day.getDate()}/${day.getMonth()+1}/${day.getFullYear()}`);
                  console.log(`  - Data de pagamento programada: ${nextPaymentDate.getDate()}/${nextPaymentDate.getMonth()+1}/${nextPaymentDate.getFullYear()}`);
                  
                  // Comparar diretamente as datas em formato ISO para debugging
                  console.log(`  - Comparando: ${day.toISOString().split('T')[0]} com ${nextPaymentDate.toISOString().split('T')[0]}`);
                  
                  // Verificar se o dia, mês e ano coincidem - verificando com maior precisão
                  // Comparar as datas como strings ISO para garantir correspondência exata
                  const dayFormatted = day.toISOString().split('T')[0];
                  const nextPaymentFormatted = nextPaymentDate.toISOString().split('T')[0];
                  
                  // Verificar de duas formas: primeiro pelo formato ISO (mais preciso) e depois pelos componentes individuais
                  if (dayFormatted === nextPaymentFormatted || 
                      (nextPaymentDate.getDate() === day.getDate() && 
                       nextPaymentDate.getMonth() === day.getMonth() && 
                       nextPaymentDate.getFullYear() === day.getFullYear())) {
                    console.log(`  - CORRESPONDÊNCIA ENCONTRADA! Adicionando ${loan.paymentSchedule.installmentAmount} ao dia ${day.getDate()}`);
                    // Adicionar o valor da parcela aos pagamentos futuros
                    futureDailyPayments += loan.paymentSchedule.installmentAmount || 0;
                  }
                } catch (error) {
                  console.error(`Erro ao processar data do empréstimo ${loan.id}:`, error);
                }
              }
            });
          }
          
          // Retornar a soma dos pagamentos realizados e futuros para este dia
          return paymentsForDay + futureDailyPayments;
        });

        chartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: days.map(date => date.getDate().toString()),
            datasets: [{
              label: "Total Recebido + Estimado",
              data: dailyPayments,
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              borderColor: "rgb(34, 197, 94)",
              borderWidth: 2,
              borderRadius: 4,
              hoverBackgroundColor: "rgba(34, 197, 94, 0.4)",
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
        return;
      }

      // Para outros períodos, manter visualização mensal
      const periodMonths = Array.from({ length: months }, (_, i) => {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        return date;
      }).reverse();

      const monthlyPayments = periodMonths.map(month => {
        // 1. Calcular pagamentos já realizados neste mês
        const paymentsForMonth = payments.reduce((total, payment) => {
          const paymentDate = new Date(payment.date);
          if (paymentDate.getMonth() === month.getMonth() && 
              paymentDate.getFullYear() === month.getFullYear()) {
            return total + payment.amount;
          }
          return total;
        }, 0);
        
        // 2. Para pagamentos futuros, adicionar os que estão programados
        let futureMonthlyPayments = 0;
        const now = new Date();
        
        // Adicionar pagamentos futuros apenas para o mês atual ou meses futuros
        const isCurrentMonthOrFuture = 
          (month.getMonth() > now.getMonth() && month.getFullYear() === now.getFullYear()) ||
          month.getFullYear() > now.getFullYear() ||
          (month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear());
        
        if (isCurrentMonthOrFuture) {
          // Procurar por empréstimos com pagamentos programados para este mês
          loans.forEach(loan => {
            if (loan.status === 'active' && loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate) {
              // Garantir que estamos trabalhando com um objeto Date para comparação
              let nextPaymentDate;
              
              try {
                // Tentar converter a string de data em um objeto Date
                nextPaymentDate = new Date(loan.paymentSchedule.nextPaymentDate);
                
                // Verificar se a data é válida
                if (isNaN(nextPaymentDate.getTime())) {
                  console.error(`Data inválida para empréstimo ${loan.id}: ${loan.paymentSchedule.nextPaymentDate}`);
                  return; // Pular este empréstimo
                }
                
                // Debugging mensal
                console.log(`Verificando pagamento mensal para ${loan.borrowerName} no mês ${month.getMonth()+1}/${month.getFullYear()}`);
                console.log(`  - Data de pagamento: ${nextPaymentDate.getMonth()+1}/${nextPaymentDate.getFullYear()}`);
                
                // Usar a mesma lógica melhorada de comparação da visão diária
                // Formatando as datas para comparação por mês/ano
                const monthFormatted = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2, '0')}`;
                const nextPaymentFormatted = `${nextPaymentDate.getFullYear()}-${String(nextPaymentDate.getMonth()+1).padStart(2, '0')}`;
                
                if (monthFormatted === nextPaymentFormatted || 
                    (nextPaymentDate.getMonth() === month.getMonth() && 
                     nextPaymentDate.getFullYear() === month.getFullYear())) {
                  console.log(`  - CORRESPONDÊNCIA MENSAL! Adicionando ${loan.paymentSchedule.installmentAmount}`);
                  futureMonthlyPayments += loan.paymentSchedule.installmentAmount || 0;
                }
              } catch (error) {
                console.error(`Erro ao processar data do empréstimo ${loan.id}:`, error);
              }
            }
          });
        }
        
        // Retornar a soma dos pagamentos realizados e futuros para este mês
        return paymentsForMonth + futureMonthlyPayments;
      });

      const ctx = chartRef.current?.getContext("2d");
      if (!ctx) return;

      chartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: periodMonths.map(date => 
            date.toLocaleString("pt-BR", { month: "short", year: "2-digit" })
          ),
          datasets: [
            {
              label: "Total Recebido + Estimado",
              data: monthlyPayments,
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              borderColor: "rgb(34, 197, 94)",
              borderWidth: 2,
              borderRadius: 4,
              hoverBackgroundColor: "rgba(34, 197, 94, 0.4)",
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => `Total: ${formatCurrency(context.raw as number)}`
              }
            },
            legend: {
              position: "top",
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => formatCurrency(value as number)
              }
            }
          }
        }
      });
    };

    loadChart();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [payments, loans, period, chartUpdateId, chartId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Tendência de Pagamentos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshChart} 
              disabled={refreshing}
              title="Atualizar gráfico"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Este mês</SelectItem>
                <SelectItem value="2">2 meses</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <canvas ref={chartRef} key={`chart-${chartUpdateId}-${chartId}`}></canvas>
        </div>
      </CardContent>
    </Card>
  );
}
