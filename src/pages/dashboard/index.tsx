import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CalendarClock,
  Wallet
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import LoanStatusChart from "@/components/dashboard/LoanStatusChart";
import StatusSummary from "@/components/dashboard/StatusSummary";
import RecentLoans from "@/components/dashboard/RecentLoans";
import PaymentTrendsNew from "@/components/dashboard/PaymentTrendsNew";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";
import OverdueLoans from "@/components/dashboard/OverdueLoans";
import QuickActions from "@/components/dashboard/QuickActions";
import { useLoan } from "@/context/LoanContext";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Dashboard() {
  const { getDashboardMetrics, loans, getEstimatedMonthlyPayments } = useLoan();
  const metrics = getDashboardMetrics();
  const estimatedMonthlyPayments = getEstimatedMonthlyPayments();
  
  // Estes valores agora são todos zeros enquanto não há dados
  const activeLoanGrowthLastMonth = 0;
  const interestGrowthLastMonth = 0;
  const newOverdueLastMonth = 0;
  
  // Obter o nome do mês atual para exibição
  const currentMonth = format(new Date(), 'MMMM', { locale: pt });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  
  return (
    <div className="dark:bg-background">
      {/* Dashboard Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard 
          title="Total Emprestado" 
          value={metrics.totalLoaned}
          icon={<DollarSign className="h-6 w-6" />}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-500"
          change={{
            value: `${activeLoanGrowthLastMonth}%`,
            isPositive: true,
            label: "este mês"
          }}
        />
        
        <MetricCard 
          title="Juros Acumulados" 
          value={metrics.totalInterestAccrued}
          icon={<TrendingUp className="h-6 w-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-500"
          change={{
            value: `${interestGrowthLastMonth}%`,
            isPositive: true,
            label: "este mês"
          }}
        />
        
        <MetricCard 
          title="Recebido este Mês" 
          value={metrics.totalReceivedThisMonth}
          icon={<Wallet className="h-6 w-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-500"
          change={{
            value: "Atual",
            isPositive: true,
            label: "no mês"
          }}
        />
        
        <MetricCard 
          title="Valor em Atraso" 
          value={metrics.totalOverdue}
          icon={<Clock className="h-6 w-6" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-500"
          change={{
            value: newOverdueLastMonth.toString(),
            isPositive: false,
            label: "novos este mês"
          }}
        />
        
        <MetricCard 
          title={`Previsto para ${capitalizedMonth}`}
          value={estimatedMonthlyPayments}
          icon={<CalendarClock className="h-6 w-6" />}
          iconBgColor="bg-violet-100"
          iconColor="text-violet-500"
          change={{
            value: "Estimativa",
            isPositive: true,
            label: "baseada em parcelas"
          }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <LoanStatusChart />
        </div>
        <StatusSummary />
      </div>

      {/* Payment Trends */}
      <div className="mb-6">
        <PaymentTrendsNew />
      </div>

      {/* Recent Loans and Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentLoans />
        <UpcomingPayments />
      </div>

      {/* Overdue Loans Section */}
      <div className="mb-6">
        <OverdueLoans />
      </div>

      {/* Quick Actions Section */}
      <div className="mt-6">
        <QuickActions />
      </div>
    </div>
  );
}
