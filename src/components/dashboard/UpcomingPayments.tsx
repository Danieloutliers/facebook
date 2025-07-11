import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { parseISO, addDays, isBefore } from "date-fns";

export default function UpcomingPayments() {
  const { getUpcomingDueLoans, getBorrowerById } = useLoan();
  
  // Obter empréstimos com vencimento nos próximos 40 dias (incluindo até 10 dias além do período padrão)
  const upcomingLoans = getUpcomingDueLoans(40);
  
  // Preparar dados para exibição
  const upcomingPayments = upcomingLoans
    .filter(loan => loan.paymentSchedule) // garantir que tem programação de pagamento
    .map(loan => {
      const borrower = getBorrowerById(loan.borrowerId);
      return {
        id: loan.id,
        loanId: loan.id,
        borrowerId: loan.borrowerId,
        borrowerName: borrower?.name || loan.borrowerName,
        amount: loan.paymentSchedule?.installmentAmount || 0,
        date: loan.paymentSchedule?.nextPaymentDate || '',
      };
    })
    // Ordenar por data de pagamento (mais próximos primeiro)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    // Limitar a 5 resultados para o dashboard
    .slice(0, 5);
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Próximos Pagamentos</CardTitle>
        <Link href="/payments">
          <Button variant="link" className="text-primary">
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mutuário</TableHead>
                <TableHead className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</TableHead>
                <TableHead className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</TableHead>
                <TableHead className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Ação</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-900 max-w-[100px] sm:max-w-none truncate">
                    {payment.borrowerName}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm text-slate-700">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm text-slate-700">
                    {formatDate(payment.date)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm text-right">
                    <Link href={`/loans/${payment.loanId}`}>
                      <Button variant="link" className="text-primary h-auto p-0 sm:p-1">
                        <span className="hidden sm:inline">Registrar</span>
                        <span className="sm:hidden">Ver</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {upcomingPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                    Nenhum pagamento próximo encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
