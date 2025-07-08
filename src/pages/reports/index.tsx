import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLoan } from '@/context/LoanContext';
import { formatCurrency, formatPercentage, formatDate, getStatusName } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { FileDown, Printer, TrendingUp, TrendingDown, Users, CreditCard, Percent, Calendar } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, isSameMonth, differenceInMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

// Cores para os gráficos
const COLORS = ['#4ade80', '#f87171', '#fb923c', '#60a5fa'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('month');
  const [analyticsDateRange, setAnalyticsDateRange] = useState('month');
  const reportRef = useRef(null);

  try {
    const { getDashboardMetrics, loans, payments, borrowers, advances } = useLoan();
    const metrics = getDashboardMetrics();

    // Preparar dados para o gráfico de status de empréstimos
    const getStatusChartData = () => {
      return [
        { name: 'Ativos', value: metrics.activeLoanCount },
        { name: 'Vencidos', value: metrics.overdueLoanCount },
        { name: 'Em Atraso', value: metrics.defaultedLoanCount },
        { name: 'Pagos', value: metrics.paidLoanCount }
      ];
    };

    // Filtrar pagamentos com base no período selecionado
    const getFilteredPayments = () => {
      const now = new Date();
      let startDate = new Date();

      if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (dateRange === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
      } else if (dateRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else if (dateRange === 'all') {
        startDate = new Date(0); // Desde o início dos tempos
      }

      return payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= now;
      });
    };

    // Preparar dados para o gráfico de pagamentos por mês
    const getPaymentsChartData = () => {
      const filteredPayments = getFilteredPayments();
      const paymentsByMonth: Record<string, {
        month: string;
        total: number;
        principal: number;
        interest: number;
      }> = {};

      filteredPayments.forEach(payment => {
        const date = new Date(payment.date);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM/yy', { locale: ptBR });

        if (!paymentsByMonth[monthKey]) {
          paymentsByMonth[monthKey] = {
            month: monthName,
            total: 0,
            principal: 0,
            interest: 0
          };
        }

        paymentsByMonth[monthKey].total += Number(payment.amount);
        paymentsByMonth[monthKey].principal += Number(payment.principal);
        paymentsByMonth[monthKey].interest += Number(payment.interest);
      });

      // Converter para array e ordenar por data
      return Object.values(paymentsByMonth).sort((a, b) => 
        a.month.localeCompare(b.month)
      );
    };

    // Função para gerar o nome descritivo do período
    const getPeriodLabel = (range = dateRange) => {
      switch (range) {
        case 'month':
          return 'Último mês';
        case 'quarter':
          return 'Últimos 3 meses';
        case 'year':
          return 'Último ano';
        case 'all':
          return 'Todo o período';
        default:
          return 'Período personalizado';
      }
    };

    // Funções para análise de dados para o painel analítico

    // Obter intervalo de datas com base no período selecionado
    const getDateRangeInterval = (range = analyticsDateRange) => {
      const now = new Date();
      let startDate = new Date();

      if (range === 'month') {
        startDate = subMonths(now, 1);
      } else if (range === 'quarter') {
        startDate = subMonths(now, 3);
      } else if (range === 'halfYear') {
        startDate = subMonths(now, 6);
      } else if (range === 'year') {
        startDate = subMonths(now, 12);
      }

      return { startDate, endDate: now };
    };

    // Obter novos clientes em um período específico
    const getNewBorrowers = (period: 'current' | 'previous' | 'last3months' = 'current') => {
      const now = new Date();
      let startDate: Date = new Date();
      let endDate: Date = new Date();

      if (period === 'current') {
        // Mês atual
        startDate = startOfMonth(now);
        endDate = now;
      } else if (period === 'previous') {
        // Mês anterior
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
      } else if (period === 'last3months') {
        // Últimos 3 meses (sem incluir o atual)
        startDate = startOfMonth(subMonths(now, 3));
        endDate = endOfMonth(subMonths(now, 1));
      }

      return borrowers.filter(borrower => {
        // Usando a data que o borrower foi adicionado ao sistema (assumindo que é armazenada em registeredAt)
        const registeredDate = borrower.registeredAt ? new Date(borrower.registeredAt) : 
                               // Fallback para quando o campo foi adicionado ao sistema (no localStorage)
                               new Date(parseInt(borrower.id));

        return registeredDate >= startDate && registeredDate <= endDate;
      });
    };

    // Obter empréstimos em um período específico
    const getLoansInPeriod = (period: 'current' | 'previous' | 'last3months' = 'current') => {
      const now = new Date();
      let startDate: Date = new Date();
      let endDate: Date = new Date();

      if (period === 'current') {
        // Mês atual
        startDate = startOfMonth(now);
        endDate = now;
      } else if (period === 'previous') {
        // Mês anterior
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
      } else if (period === 'last3months') {
        // Últimos 3 meses (sem incluir o atual)
        startDate = startOfMonth(subMonths(now, 3));
        endDate = endOfMonth(subMonths(now, 1));
      }

      return loans.filter(loan => {
        // Filtrar apenas contratos não arquivados
        if (loan.status === 'archived') return false;

        const loanDate = new Date(loan.issueDate);
        return loanDate >= startDate && loanDate <= endDate;
      });
    };

    // Calcular o valor total emprestado em um período
    const getTotalLoanedInPeriod = (period: 'current' | 'previous' | 'last3months' = 'current') => {
      const loansInPeriod = getLoansInPeriod(period);
      return loansInPeriod.reduce((sum, loan) => sum + loan.principal, 0);
    };

    // Calcular a variação percentual entre dois valores
    const calculatePercentChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Calcular taxa de inadimplência (empréstimos vencidos / total de empréstimos ativos)
    const calculateDefaultRate = () => {
      const activeLoans = loans.filter(loan => loan.status !== 'archived' && loan.status !== 'paid');
      if (activeLoans.length === 0) return 0;

      const overdueLoans = activeLoans.filter(loan => loan.status === 'overdue' || loan.status === 'defaulted');
      return (overdueLoans.length / activeLoans.length) * 100;
    };

    // Gerar dados históricos para os últimos 6 meses
    const getHistoricalData = () => {
      const now = new Date();
      const data = [];

      // Gerar dados para os últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthName = format(month, 'MMM/yy', { locale: ptBR });

        // Contar empréstimos no mês (não incluir arquivados)
        const monthLoans = loans.filter(loan => {
          if (loan.status === 'archived') return false;
          const loanDate = new Date(loan.issueDate);
          return isWithinInterval(loanDate, { start: monthStart, end: monthEnd });
        });

        // Contar novos clientes no mês
        const monthBorrowers = borrowers.filter(borrower => {
          // Usar o ID como timestamp de criação, já que ele geralmente é gerado com Date.now()
          const borrowerDate = new Date(parseInt(borrower.id));
          return isWithinInterval(borrowerDate, { start: monthStart, end: monthEnd });
        });

        // Calcular valor total contratado no mês
        const loanedAmount = monthLoans.reduce((sum, loan) => sum + loan.principal, 0);

        data.push({
          month: monthName,
          loans: monthLoans.length,
          borrowers: monthBorrowers.length,
          amount: loanedAmount
        });
      }

      return data;
    };

    // Função para obter o nome do mutuário por ID
    const getBorrowerName = (borrowerId: string) => {
      const borrower = borrowers.find(b => b.id === borrowerId);
      return borrower ? borrower.name : 'Desconhecido';
    };

    // Handler para imprimir o relatório
    const handlePrint = () => {
      window.print();
    };

    // Função para gerar e exportar o PDF
    const generatePDF = () => {
      const doc = new jsPDF();
      const title = 'Relatório de Empréstimos';

      // Título e cabeçalho
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
      doc.text(`Período do relatório: ${getPeriodLabel()}`, 14, 36);

      // Resumo geral
      doc.setFontSize(14);
      doc.text('Resumo Geral', 14, 46);
      doc.setFontSize(10);
      doc.text(`Total Emprestado: ${formatCurrency(metrics.totalLoaned)}`, 14, 54);
      doc.text(`Total Recebido (no período): ${formatCurrency(metrics.totalReceivedThisMonth)}`, 14, 60);
      doc.text(`Juros Acumulados: ${formatCurrency(metrics.totalInterestAccrued)}`, 14, 66);
      doc.text(`Total de Contratos: ${metrics.activeLoanCount + metrics.paidLoanCount + metrics.overdueLoanCount + metrics.defaultedLoanCount}`, 14, 72);
      doc.text(`Contratos Ativos: ${metrics.activeLoanCount}`, 14, 78);
      doc.text(`Contratos Vencidos: ${metrics.overdueLoanCount}`, 14, 84);
      doc.text(`Contratos Pagos: ${metrics.paidLoanCount}`, 14, 90);

      // Tabela de Contratos
      if (reportType === 'loans' || reportType === 'summary') {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Lista de Contratos', 14, 22);

        // @ts-ignore - jspdf-autotable não tem tipagem correta
        doc.autoTable({
          startY: 30,
          head: [['Mutuário', 'Valor', 'Taxa', 'Data de Emissão', 'Vencimento', 'Status']],
          body: loans.map(loan => [
            getBorrowerName(loan.borrowerId),
            formatCurrency(Number(loan.principal)),
            formatPercentage(Number(loan.interestRate)),
            formatDate(loan.issueDate),
            formatDate(loan.dueDate),
            getStatusName(loan.status)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [75, 85, 99] }
        });
      }

      // Tabela de Pagamentos
      if (reportType === 'payments' || reportType === 'summary') {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Pagamentos Recentes', 14, 22);

        const filteredPayments = getFilteredPayments();

        // @ts-ignore
        doc.autoTable({
          startY: 30,
          head: [['Data', 'Empréstimo', 'Valor', 'Principal', 'Juros']],
          body: filteredPayments.map(payment => {
            const loan = loans.find(l => l.id === payment.loanId);
            const borrowerName = loan ? getBorrowerName(loan.borrowerId) : 'N/A';
            return [
              formatDate(payment.date),
              borrowerName,
              formatCurrency(Number(payment.amount)),
              formatCurrency(Number(payment.principal)),
              formatCurrency(Number(payment.interest))
            ];
          }),
          theme: 'striped',
          headStyles: { fillColor: [75, 85, 99] }
        });
      }

      doc.save('relatorio-emprestimos.pdf');
    };

    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="default" onClick={generatePDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Resumo rápido de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Total Contratado</h3>
              <p className="text-3xl font-bold">{formatCurrency(metrics.totalLoaned)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Juros Acumulados</h3>
              <p className="text-3xl font-bold">{formatCurrency(metrics.totalInterestAccrued)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">Recebido no Mês</h3>
              <p className="text-3xl font-bold">{formatCurrency(metrics.totalReceivedThisMonth)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Selecione o tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Resumo Geral</SelectItem>
                <SelectItem value="loans">Empréstimos</SelectItem>
                <SelectItem value="payments">Pagamentos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-range">Período</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="date-range">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conteúdo do relatório */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Relatório Financeiro</h2>
              <p className="text-muted-foreground mt-2">
                Período: {getPeriodLabel()}
              </p>
            </div>

            <Tabs value={reportType} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="summary" onClick={() => setReportType('summary')}>Resumo</TabsTrigger>
                <TabsTrigger value="analytics" onClick={() => setReportType('analytics')}>Análise</TabsTrigger>
                <TabsTrigger value="loans" onClick={() => setReportType('loans')}>Contratos</TabsTrigger>
                <TabsTrigger value="payments" onClick={() => setReportType('payments')}>Pagamentos</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <div className="space-y-8" ref={reportRef}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Gráfico de Status de Empréstimos */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-center">Status dos Contratos</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getStatusChartData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {getStatusChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} empréstimos`, '']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Gráfico de Pagamentos por Mês */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-center">Pagamentos por Mês</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getPaymentsChartData()}
                            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} />
                            <YAxis tickFormatter={(value) => `R$${value}`} />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(Number(value)), '']}
                              labelFormatter={(value) => `Mês: ${value}`}
                            />
                            <Legend />
                            <Bar dataKey="principal" name="Principal" fill="#60a5fa" />
                            <Bar dataKey="interest" name="Juros" fill="#f87171" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Status Atual</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-right py-3 px-4">Quantidade</th>
                            <th className="text-right py-3 px-4">Percentual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getStatusChartData().map((status, index) => {
                            const total = metrics.activeLoanCount + metrics.paidLoanCount + 
                                         metrics.overdueLoanCount + metrics.defaultedLoanCount;
                            const percentage = total > 0 ? (status.value / total) * 100 : 0;

                            return (
                              <tr key={index} className="border-b">
                                <td className="py-3 px-4">{status.name}</td>
                                <td className="text-right py-3 px-4">{status.value}</td>
                                <td className="text-right py-3 px-4">{percentage.toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="space-y-8">
                  {/* Seletor de período para análise */}
                  <div className="flex justify-end mb-6">
                    <div className="w-[200px]">
                      <Label htmlFor="analytics-range">Período de Análise</Label>
                      <Select value={analyticsDateRange} onValueChange={setAnalyticsDateRange}>
                        <SelectTrigger id="analytics-range">
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Último mês</SelectItem>
                          <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                          <SelectItem value="halfYear">Últimos 6 meses</SelectItem>
                          <SelectItem value="year">Último ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Relatório mensal e trimestral */}
                  <div>
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="h-8 w-1 bg-primary rounded-full"></div>
                      <h3 className="text-xl font-semibold">Relatório Mensal e Contratual</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Novos clientes no mês */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-blue-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Novos Clientes (Mês Atual)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {getNewBorrowers('current').length}
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 flex items-center">
                            {(() => {
                              const currentCount = getNewBorrowers('current').length;
                              const previousCount = getNewBorrowers('previous').length;
                              const percentChange = calculatePercentChange(currentCount, previousCount);
                              const isPositive = percentChange > 0;

                              return (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <div className={`p-1 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} mr-2`}>
                                      {isPositive ? (
                                        <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      )}
                                    </div>
                                    <span className={`font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {percentChange.toFixed(1)}%
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">vs mês anterior</span>
                                </div>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Clientes nos últimos 3 meses */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mr-3">
                              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Clientes (Últimos 3 Meses)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                            {getNewBorrowers('last3months').length}
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 flex items-center justify-between">
                            <span>Média mensal:</span>
                            <span className="font-medium">{(getNewBorrowers('last3months').length / 3).toFixed(1)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Novos contratos no mês */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-green-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                              <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            Contratos (Mês Atual)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {getLoansInPeriod('current').length}
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 flex items-center">
                            {(() => {
                              const currentCount = getLoansInPeriod('current').length;
                              const previousCount = getLoansInPeriod('previous').length;
                              const percentChange = calculatePercentChange(currentCount, previousCount);
                              const isPositive = percentChange > 0;

                              return (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <div className={`p-1 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} mr-2`}>
                                      {isPositive ? (
                                        <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      )}
                                    </div>
                                    <span className={`font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {percentChange.toFixed(1)}%
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">vs mês anterior</span>
                                </div>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Valor emprestado no mês */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-amber-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-3">
                              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            Valor Contratado (Mês Atual)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(getTotalLoanedInPeriod('current'))}
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 flex items-center">
                            {(() => {
                              const currentAmount = getTotalLoanedInPeriod('current');
                              const previousAmount = getTotalLoanedInPeriod('previous');
                              const percentChange = calculatePercentChange(currentAmount, previousAmount);
                              const isPositive = percentChange > 0;

                              return (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <div className={`p-1 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} mr-2`}>
                                      {isPositive ? (
                                        <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      )}
                                    </div>
                                    <span className={`font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {percentChange.toFixed(1)}%
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">vs mês anterior</span>
                                </div>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Valor emprestado nos últimos 3 meses */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-orange-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 mr-3">
                              <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            Valor Contratado (Últimos 3 Meses)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(getTotalLoanedInPeriod('last3months'))}
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 flex items-center justify-between">
                            <span>Média mensal:</span>
                            <span className="font-medium">{formatCurrency(getTotalLoanedInPeriod('last3months') / 3)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Valor médio por empréstimo */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-purple-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
                              <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            Valor Médio por Contrato
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const currentLoans = getLoansInPeriod('current');
                            const avgLoanValue = currentLoans.length > 0 
                              ? getTotalLoanedInPeriod('current') / currentLoans.length
                              : 0;

                            return (
                              <>
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                  {formatCurrency(avgLoanValue)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-3 flex items-center justify-between">
                                  <span>Baseado em:</span>
                                  <span className="font-medium">{currentLoans.length} empréstimos</span>
                                </div>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Indicadores complementares */}
                  <div className="mt-10">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="h-8 w-1 bg-primary rounded-full"></div>
                      <h3 className="text-xl font-semibold">Indicadores Complementares (KPI)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Taxa de inadimplência */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-red-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
                              <Percent className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            Taxa de Inadimplência
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {formatPercentage(calculateDefaultRate())}
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 flex items-center justify-between">
                            <span>Status:</span>
                            <span className="font-medium">
                              {metrics.overdueLoanCount + metrics.defaultedLoanCount} de {metrics.activeLoanCount + metrics.overdueLoanCount + metrics.defaultedLoanCount} empréstimos
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Crescimento de clientes */}
                      <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-teal-500"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center">
                            <div className="p-2 rounded-full bg-teal-100 dark:bg-teal-900/30 mr-3">
                              <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            Crescimento de Clientes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const currentCount = getNewBorrowers('current').length;
                            const previousCount = getNewBorrowers('previous').length;
                            const percentChange = calculatePercentChange(currentCount, previousCount);
                            const isPositive = percentChange > 0;

                            return (
                              <>
                                <div className={`text-3xl font-bold ${isPositive ? 'text-teal-600 dark:text-teal-400' : percentChange === 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                                </div>
                                <div className="text-sm text-muted-foreground mt-3 flex items-center justify-between">
                                  <span>Comparativo:</span>
                                  <span className="font-medium">
                                    {currentCount} novos vs {previousCount} anteriores
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Histórico dos últimos 6 meses */}
                  <div className="mt-10">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="h-8 w-1 bg-primary rounded-full"></div>
                      <h3 className="text-xl font-semibold">Histórico dos últimos 6 meses</h3>
                    </div>

                    {/* Gráficos históricos */}
                    <div className="grid grid-cols-1 gap-8">
                      {/* Gráfico de Empréstimos por Mês */}
                      <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-700"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            Contratos por Mês
                          </CardTitle>
                          <CardDescription>Evolução do número de contratos nos últimos 6 meses</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={getHistoricalData()}
                                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                              >
                                <defs>
                                  <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                  dataKey="month" 
                                  axisLine={false}
                                  tickLine={false}
                                  dy={10}
                                />
                                <YAxis 
                                  axisLine={false}
                                  tickLine={false}
                                  tickCount={5}
                                  dx={-10}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    border: 'none'
                                  }}
                                />
                                <Legend 
                                  verticalAlign="top"
                                  height={36}
                                  iconType="circle"
                                />
                                <Bar 
                                  dataKey="loans" 
                                  name="Contratos" 
                                  fill="url(#colorLoans)" 
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={60}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Gráfico de Valor Emprestado por Mês */}
                      <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-700"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center">
                            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mr-3">
                              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Valor Contratado por Mês
                          </CardTitle>
                          <CardDescription>Evolução do valor total em empréstimos nos últimos 6 meses</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getHistoricalData()}
                                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                              >
                                <defs>
                                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                  dataKey="month" 
                                  axisLine={false} 
                                  tickLine={false}
                                  dy={10}
                                />
                                <YAxis 
                                  tickFormatter={(value) => `R$${value.toLocaleString()}`}
                                  axisLine={false}
                                  tickLine={false}
                                  tickCount={5}
                                  dx={-10}
                                />
                                <Tooltip 
                                  formatter={(value) => [formatCurrency(Number(value)), '']}
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    border: 'none'
                                  }}
                                />
                                <Legend 
                                  verticalAlign="top"
                                  height={36}
                                  iconType="circle"
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="amount" 
                                  stroke="#059669" 
                                  fill="url(#colorAmount)" 
                                  name="Valor Emprestado"
                                  strokeWidth={2}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Gráfico de Novos Clientes por Mês */}
                      <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-purple-700"></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
                              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            Novos Clientes por Mês
                          </CardTitle>
                          <CardDescription>Número de novos clientes registrados nos últimos 6 meses</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={getHistoricalData()}
                                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                  dataKey="month" 
                                  axisLine={false}
                                  tickLine={false}
                                  dy={10}
                                />
                                <YAxis 
                                  axisLine={false}
                                  tickLine={false}
                                  tickCount={5}
                                  dx={-10}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    border: 'none'
                                  }}
                                />
                                <Legend 
                                  verticalAlign="top"
                                  height={36}
                                  iconType="circle"
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="borrowers" 
                                  stroke="#8B5CF6" 
                                  name="Novos Clientes" 
                                  strokeWidth={3}
                                  dot={{ r: 6, strokeWidth: 2 }}
                                  activeDot={{ r: 8, strokeWidth: 2 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="loans">
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Mutuário</th>
                          <th className="text-right py-3 px-4">Valor</th>
                          <th className="text-right py-3 px-4">Taxa</th>
                          <th className="text-center py-3 px-4">Emissão</th>
                          <th className="text-center py-3 px-4">Vencimento</th>
                          <th className="text-center py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.map((loan) => (
                          <tr key={loan.id} className="border-b">
                            <td className="py-3 px-4">{getBorrowerName(loan.borrowerId)}</td>
                            <td className="text-right py-3 px-4">{formatCurrency(Number(loan.principal))}</td>
                            <td className="text-right py-3 px-4">{formatPercentage(Number(loan.interestRate))}</td>
                            <td className="text-center py-3 px-4">{formatDate(loan.issueDate)}</td>
                            <td className="text-center py-3 px-4">{formatDate(loan.dueDate)}</td>
                            <td className="text-center py-3 px-4">{getStatusName(loan.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payments">
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Data</th>
                          <th className="text-left py-3 px-4">Mutuário</th>
                          <th className="text-right py-3 px-4">Valor</th>
                          <th className="text-right py-3 px-4">Principal</th>
                          <th className="text-right py-3 px-4">Juros</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredPayments().map((payment) => {
                          const loan = loans.find(l => l.id === payment.loanId);
                          const borrowerName = loan ? getBorrowerName(loan.borrowerId) : 'N/A';

                          return (
                            <tr key={payment.id} className="border-b">
                              <td className="py-3 px-4">{formatDate(payment.date)}</td>
                              <td className="py-3 px-4">{borrowerName}</td>
                              <td className="text-right py-3 px-4">{formatCurrency(Number(payment.amount))}</td>
                              <td className="text-right py-3 px-4">{formatCurrency(Number(payment.principal))}</td>
                              <td className="text-right py-3 px-4">{formatCurrency(Number(payment.interest))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Erro no contexto LoanProvider:", error);
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar relatórios</h1>
            <p className="mb-2">Não foi possível acessar os dados de empréstimos.</p>
            <p>Por favor, tente atualizar a página ou contate o suporte.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}