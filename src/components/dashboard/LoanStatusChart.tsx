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

      // Simply use mock data for the chart
      activeData.push(5, 6, 8, 9, 10, 12, 13, 12, 11, 12, 12, 12);
      paidData.push(2, 3, 3, 4, 4, 3, 4, 5, 5, 5, 5, 5);
      overdueData.push(0, 1, 1, 2, 1, 2, 2, 3, 2, 3, 3, 3);
      defaultedData.push(0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1);

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
