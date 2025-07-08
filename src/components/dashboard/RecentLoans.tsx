import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";

export default function RecentLoans() {
  const { loans } = useLoan();
  
  // Filtrar contratos que não estão arquivados
  const activeLoans = loans.filter(loan => loan.status !== 'archived');
  
  // Sort loans by issue date (newest first) and take 5
  const recentLoans = [...activeLoans]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Contratos Recentes</CardTitle>
        <Link href="/loans">
          <Button variant="link" className="text-primary">
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mutuário</TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data Venc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                    {loan.borrowerName}
                  </TableCell>
                  <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                    {formatCurrency(loan.principal)}
                  </TableCell>
                  <TableCell className="px-3 py-2 whitespace-nowrap">
                    <StatusBadge status={loan.status} />
                  </TableCell>
                  <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                    {formatDate(loan.dueDate)}
                  </TableCell>
                </TableRow>
              ))}
              {recentLoans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                    Nenhum contrato recente encontrado
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
