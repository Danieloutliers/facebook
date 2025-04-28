import { useState } from "react";
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
import { Search, Trash2, FileText } from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";

export default function PaymentList() {
  const { payments, borrowers, loans, getLoanById, deletePayment } = useLoan();
  const [searchTerm, setSearchTerm] = useState("");
  const [borrowerFilter, setBorrowerFilter] = useState("all");

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

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <CardTitle className="text-xl font-semibold">Pagamentos</CardTitle>
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
  );
}
