import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLoan } from '@/context/LoanContext';
import { formatCurrency, formatPercentage, formatDate, getStatusName } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Cores para os gráficos
const COLORS = ['#4ade80', '#f87171', '#fb923c', '#60a5fa'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('month');
  const reportRef = useRef(null);
  
  try {
    const { getDashboardMetrics, loans, payments, borrowers } = useLoan();
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
    const getPeriodLabel = () => {
      switch (dateRange) {
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
      doc.text(`Total de Empréstimos: ${metrics.activeLoanCount + metrics.paidLoanCount + metrics.overdueLoanCount + metrics.defaultedLoanCount}`, 14, 72);
      doc.text(`Empréstimos Ativos: ${metrics.activeLoanCount}`, 14, 78);
      doc.text(`Empréstimos Vencidos: ${metrics.overdueLoanCount}`, 14, 84);
      doc.text(`Empréstimos Pagos: ${metrics.paidLoanCount}`, 14, 90);
      
      // Tabela de Empréstimos
      if (reportType === 'loans' || reportType === 'summary') {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Lista de Empréstimos', 14, 22);
        
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
              <h3 className="text-lg font-medium mb-2">Total Emprestado</h3>
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
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="summary" onClick={() => setReportType('summary')}>Resumo</TabsTrigger>
                <TabsTrigger value="loans" onClick={() => setReportType('loans')}>Empréstimos</TabsTrigger>
                <TabsTrigger value="payments" onClick={() => setReportType('payments')}>Pagamentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary">
                <div className="space-y-8" ref={reportRef}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Gráfico de Status de Empréstimos */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-center">Status dos Empréstimos</h3>
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
