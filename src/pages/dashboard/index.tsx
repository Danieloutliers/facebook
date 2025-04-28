import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users,
  Wallet
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import LoanStatusChart from "@/components/dashboard/LoanStatusChart";
import StatusSummary from "@/components/dashboard/StatusSummary";
import RecentLoans from "@/components/dashboard/RecentLoans";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";
import OverdueLoans from "@/components/dashboard/OverdueLoans";
import QuickActions from "@/components/dashboard/QuickActions";
import { useLoan } from "@/context/LoanContext";

export default function Dashboard() {
  const { getDashboardMetrics, loans } = useLoan();
  const metrics = getDashboardMetrics();
  
  // Calculate month-over-month growth
  const activeLoanGrowthLastMonth = 12; // Example value, could be calculated based on historical data
  const interestGrowthLastMonth = 8.5; // Example value, could be calculated based on historical data
  const newOverdueLastMonth = 3; // Example value, could be calculated based on historical data
  const newBorrowersLastMonth = 2; // Example value, could be calculated based on historical data
  
  return (
    <div>
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
          title="Total Mutuários" 
          value={metrics.totalBorrowers}
          icon={<Users className="h-6 w-6" />}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-500"
          change={{
            value: newBorrowersLastMonth.toString(),
            isPositive: true,
            label: "novos este mês"
          }}
          isCurrency={false}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <LoanStatusChart />
        </div>
        <StatusSummary />
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
