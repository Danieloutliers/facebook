import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoan } from "@/context/LoanContext";

// This component will use Chart.js for visualization
export default function LoanStatusChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const { loans } = useLoan();

  useEffect(() => {
    if (!chartRef.current) return;

    // Import Chart.js dynamically to avoid SSR issues
    const loadChart = async () => {
      const Chart = (await import("chart.js/auto")).default;

      // If a chart already exists, destroy it
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Group loans by status and month
      const today = new Date();
      const months = [];
      const activeData = [];
      const pendingData = []; // Novo array para empréstimos "A Vencer"
      const paidData = [];
      const overdueData = [];
      const defaultedData = [];

      // Generate last 11 months plus current month
      for (let i = 10; i >= 0; i--) {
        const month = new Date(today);
        month.setMonth(today.getMonth() - i);
        months.push(month.toLocaleString("pt-BR", { month: "short" }));
      }
      months.push(today.toLocaleString("pt-BR", { month: "short" }));

      // Inicializar com zeros para todos os meses
      for (let i = 0; i < 12; i++) {
        activeData.push(0);
        pendingData.push(0); // Inicializar array para empréstimos "A Vencer"
        paidData.push(0);
        overdueData.push(0);
        defaultedData.push(0);
      }
      
      // Preencher com dados reais - simular crescimento ao longo do tempo
      if (loans.length > 0) {
        // Contar o status atual dos empréstimos
        const activeLoanCount = loans.filter(loan => loan.status === 'active').length;
        const pendingLoanCount = loans.filter(loan => loan.status === 'pending').length; // Contar empréstimos "A Vencer"
        const paidLoanCount = loans.filter(loan => loan.status === 'paid').length;
        const overdueLoanCount = loans.filter(loan => loan.status === 'overdue').length;
        const defaultedLoanCount = loans.filter(loan => loan.status === 'defaulted').length;
        
        console.log("Status counts for chart:", {
          active: activeLoanCount,
          pending: pendingLoanCount, // Adicionar status "A Vencer" ao log
          paid: paidLoanCount,
          overdue: overdueLoanCount,
          defaulted: defaultedLoanCount
        });
        
        // Distribuir os valores ao longo dos meses para simular crescimento
        // O mês atual (último) terá o valor completo
        activeData[11] = activeLoanCount;
        pendingData[11] = pendingLoanCount; // Valor atual para "A Vencer"
        paidData[11] = paidLoanCount;
        overdueData[11] = overdueLoanCount;
        defaultedData[11] = defaultedLoanCount;
        
        // Meses anteriores terão valores menores (simulando crescimento)
        if (activeLoanCount > 0) {
          activeData[10] = Math.max(0, activeLoanCount - 1);
          activeData[9] = Math.max(0, activeLoanCount - 1);
          activeData[8] = Math.max(0, activeLoanCount - 2);
        }
        
        // Simulação de valores anteriores para empréstimos "A Vencer"
        if (pendingLoanCount > 0) {
          pendingData[10] = Math.max(0, pendingLoanCount - 1);
          pendingData[9] = Math.max(0, pendingLoanCount - 1);
        }
        
        if (paidLoanCount > 0) {
          paidData[10] = Math.max(0, paidLoanCount - 1);
          paidData[9] = Math.max(0, paidLoanCount - 1);
          paidData[8] = Math.max(0, paidLoanCount - 2);
        }
        
        if (overdueLoanCount > 0) {
          overdueData[10] = overdueLoanCount;
          overdueData[9] = Math.max(0, overdueLoanCount - 1);
        }
        
        if (defaultedLoanCount > 0) {
          defaultedData[10] = defaultedLoanCount;
        }
      }

      // Verificar se o canvas existe
      if (!chartRef.current) return;
      
      const ctx = chartRef.current.getContext("2d");
      if (!ctx) return;

      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: months,
          datasets: [
            {
              label: "Ativos",
              data: activeData,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: "A Vencer",
              data: pendingData,
              borderColor: "#9333ea", // Roxo para "A Vencer"
              backgroundColor: "rgba(147, 51, 234, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: "Pagos",
              data: paidData,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
            {
              label: "Vencidos",
              data: overdueData,
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
            {
              label: "Inadimplentes",
              data: defaultedData,
              borderColor: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                boxWidth: 12,
                font: {
                  size: 12,
                },
              },
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
          },
        },
      });
    };

    loadChart();

    // Clean up chart instance on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [loans]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Empréstimos por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <canvas ref={chartRef}></canvas>
        </div>
      </CardContent>
    </Card>
  );
}
