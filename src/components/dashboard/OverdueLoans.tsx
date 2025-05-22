import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useLoan } from "@/context/LoanContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/shared/StatusBadge";
import { AlertCircle } from "lucide-react";

export default function OverdueLoans() {
  const { getOverdueLoans, getBorrowerById } = useLoan();
  
  // Obter empréstimos vencidos ou em default
  const overdueLoans = getOverdueLoans();
  
  // Preparar dados para exibição
  const loansToDisplay = overdueLoans
    .map(loan => {
      const borrower = getBorrowerById(loan.borrowerId);
      return {
        id: loan.id,
        borrowerId: loan.borrowerId,
        borrowerName: borrower?.name || loan.borrowerName,
        amount: loan.principal,
        dueDate: loan.dueDate,
        status: loan.status
      };
    })
    // Ordenar por data de vencimento (mais antigos primeiro)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    // Limitar a 5 resultados para o dashboard
    .slice(0, 5);
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Empréstimos Vencendo</CardTitle>
        <Link href="/loans">
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
                <TableHead className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="hidden xs:inline">Vencimento</span>
                  <span className="xs:hidden">Data</span>
                </TableHead>
                <TableHead className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Status</TableHead>
                <TableHead className="px-2 sm:px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Ação</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loansToDisplay.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm font-medium text-slate-900 max-w-[100px] sm:max-w-none truncate">
                    {loan.borrowerName}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm text-slate-700">
                    {formatCurrency(loan.amount)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm text-slate-700">
                    {formatDate(loan.dueDate)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm hidden sm:table-cell">
                    <StatusBadge status={loan.status} />
                  </TableCell>
                  <TableCell className="px-2 sm:px-3 py-2 text-sm text-right">
                    <Link href={`/loans/${loan.id}`}>
                      <Button variant="link" className="text-primary h-auto p-0 sm:p-1">
                        <span className="hidden sm:inline">Detalhes</span>
                        <span className="sm:hidden">Ver</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {loansToDisplay.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-slate-500">
                    <div className="flex flex-col items-center justify-center p-4">
                      <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                      <p>Nenhum empréstimo vencido encontrado</p>
                    </div>
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
