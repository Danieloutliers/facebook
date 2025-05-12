import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Trash2, 
  FileText, 
  Calendar, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2
} from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { differenceInDays, isSameMonth, isBefore, addDays } from "date-fns";

export default function PaymentList() {
  const { payments, borrowers, loans, getLoanById, deletePayment } = useLoan();
  const [searchTerm, setSearchTerm] = useState("");
  const [borrowerFilter, setBorrowerFilter] = useState("all");
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);

  // Calcular pagamentos próximos para o mês atual
  useEffect(() => {
    const currentDate = new Date();
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    
    // Coletar todos os empréstimos ativos
    const activeLoans = loans.filter(loan => 
      loan.status !== 'paid' && 
      loan.status !== 'archived'
    );

    // Construir lista de pagamentos próximos
    const upcoming: any[] = [];
    
    activeLoans.forEach(loan => {
      // Considerar pagamentos do cronograma
      if (loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate) {
        const nextPaymentDate = new Date(loan.paymentSchedule.nextPaymentDate);
        const amount = loan.paymentSchedule.installmentAmount || 0;
        
        // Verificar se o pagamento é para o mês atual ou próximo
        if (isSameMonth(nextPaymentDate, currentDate) || 
            (isSameMonth(nextPaymentDate, nextMonthDate) && isBefore(nextPaymentDate, addDays(currentDate, 30)))) {
          
          // Calcular dias restantes
          const daysLeft = differenceInDays(nextPaymentDate, currentDate);
          
          // Definir status com base nos dias restantes
          let status = 'upcoming';
          if (daysLeft < 0) {
            status = 'overdue';
          } else if (daysLeft <= 3) {
            status = 'urgent';
          } else if (daysLeft <= 7) {
            status = 'soon';
          }
          
          upcoming.push({
            id: `upcoming-${loan.id}`,
            loanId: loan.id,
            borrowerId: loan.borrowerId,
            borrowerName: loan.borrowerName || "Desconhecido",
            date: nextPaymentDate,
            amount,
            daysLeft: daysLeft < 0 ? 0 : daysLeft,
            status,
            isOverdue: daysLeft < 0
          });
        }
      }
    });
    
    // Ordenar por data (mais próximos primeiro)
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    setUpcomingPayments(upcoming);
  }, [loans]);

  // Filter payments based on search term and borrower filter
  const filteredPayments = payments.filter((payment) => {
    const loan = getLoanById(payment.loanId);
    
    if (!loan) return false;
    
    const matchesBorrower = 
      borrowerFilter === "all" || loan.borrowerId === borrowerFilter;
    
    const matchesSearch = 
      loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.date.includes(searchTerm.toLowerCase());
    
    return matchesBorrower && matchesSearch;
  });

  // Sort payments by date (newest first)
  const sortedPayments = [...filteredPayments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDeletePayment = (paymentId: string) => {
    deletePayment(paymentId);
  };

  // Função para exibir o status do pagamento
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Atrasado
          </Badge>
        );
      case 'urgent':
        return (
          <Badge variant="destructive" className="gap-1 bg-orange-600">
            <Clock className="h-3 w-3" /> Urgente
          </Badge>
        );
      case 'soon':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
            <Calendar className="h-3 w-3" /> Próximo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" /> Programado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Pagamentos do Mês */}
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Pagamentos do Mês
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Visualize todos os pagamentos previstos para os próximos 30 dias</p>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingPayments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-md">
              <p className="text-slate-500">Nenhum pagamento previsto para os próximos 30 dias.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPayments.map((payment) => (
                <Card key={payment.id} className={`overflow-hidden transition ${
                  payment.status === 'overdue' ? 'border-red-300 dark:border-red-800' :
                  payment.status === 'urgent' ? 'border-orange-300 dark:border-orange-800' :
                  payment.status === 'soon' ? 'border-yellow-300 dark:border-yellow-800' :
                  'border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{payment.borrowerName}</h4>
                        <p className="text-sm text-slate-500">{formatDate(payment.date)}</p>
                      </div>
                      <div>
                        {renderStatusBadge(payment.status)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-slate-500 mr-1.5" />
                        <span className="text-sm">
                          {payment.isOverdue 
                            ? "Já venceu"
                            : `Faltam ${payment.daysLeft} dias`
                          }
                        </span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                    
                    <Link href={`/loans/${payment.loanId}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-4 w-4 mr-1.5" />
                        Ver Empréstimo
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              Histórico de Pagamentos
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Visualize e gerencie todos os pagamentos registrados</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative w-full sm:w-2/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Buscar por mutuário ou data..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={borrowerFilter}
              onValueChange={setBorrowerFilter}
            >
              <SelectTrigger className="w-full sm:w-1/3">
                <SelectValue placeholder="Filtrar por mutuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Mutuários</SelectItem>
                {borrowers.map((borrower) => (
                  <SelectItem key={borrower.id} value={borrower.id}>
                    {borrower.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Mutuário</TableHead>
                    <TableHead>Empréstimo</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Juros</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhum pagamento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedPayments.map((payment) => {
                      const loan = getLoanById(payment.loanId);
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell>{loan?.borrowerName || "Desconhecido"}</TableCell>
                          <TableCell>
                            <Link href={`/loans/${payment.loanId}`}>
                              <Button variant="link" className="h-auto p-0">
                                Ver Empréstimo
                              </Button>
                            </Link>
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatCurrency(payment.principal)}</TableCell>
                          <TableCell>{formatCurrency(payment.interest)}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePayment(payment.id)}>
                                    Sim, excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
