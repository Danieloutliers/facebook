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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PlusCircle, Search, Archive, Edit, Eye, CreditCard } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { calculateRemainingBalance } from "@/utils/loanCalculations";
import { LoanType } from "@/types";
import { PaymentModal } from "@/components/payments/PaymentModal";
import { format } from "date-fns";

export default function LoanList() {
  const { loans, payments, getBorrowerById } = useLoan();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanType | null>(null);
  
  // Função para abrir o modal de pagamento
  const handleOpenPaymentModal = (loan: LoanType) => {
    setSelectedLoan(loan);
    setIsPaymentModalOpen(true);
  };
  
  // Função para fechar o modal de pagamento e garantir que os dados estão atualizados
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedLoan(null);
    
    // Forçar re-renderização da lista usando um pequeníssimo atraso
    // para garantir que todos os dados estejam atualizados
    setTimeout(() => {
      // Este setState forçará um rerender, mesmo com o mesmo valor
      setStatusFilter(statusFilter);
    }, 100);
  };

  // Filter loans based on search term and status filter
  const filteredLoans = loans
    .filter((loan) => {
      // Excluir empréstimos arquivados da lista principal
      if (statusFilter !== "archived" && loan.status === 'archived') {
        return false;
      }
      
      const borrower = getBorrowerById(loan.borrowerId);
      const matchesSearch = 
        borrower?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Ajuste para que empréstimos com próxima data de pagamento continuem aparecendo,
      // mesmo que estejam marcados como 'paid'
      const matchesStatus = 
        statusFilter === "all" || 
        loan.status === statusFilter ||
        // Se o empréstimo tem uma próxima data de pagamento e é marcado como 'paid',
        // ele deve aparecer quando o filtro for 'all' ou 'active'
        (loan.status === 'paid' && 
         loan.paymentSchedule?.nextPaymentDate && 
         (statusFilter === 'all' || statusFilter === 'active'));
      
      return matchesSearch && matchesStatus;
    })
    // Ordenar empréstimos por data de vencimento (mais próximos primeiro)
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date();
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date();
      return dateA.getTime() - dateB.getTime();
    });

  // Get next payment date for a loan
  const getNextPaymentDate = (loan: LoanType) => {
    // Se o empréstimo estiver arquivado, não há próximo pagamento
    // Mas empréstimos com status 'paid' ainda podem ter próximas parcelas
    if (loan.status === 'archived') {
      return null;
    }
    
    // Verificamos as datas de pagamento programadas nas schedules (informação mais atual)
    if (loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate) {
      // Garantir que estamos usando a versão mais atualizada do schedule
      // Isto é importante para quando um pagamento for registrado e o próximo pagamento for atualizado
      
      // Tratamento mais robusto para garantir a data correta
      let paymentDate: Date;
      try {
        const dateStr = loan.paymentSchedule.nextPaymentDate;
        
        // Verificar formato ISO (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          // É um formato ISO válido
          const [year, month, day] = dateStr.split('-').map(Number);
          paymentDate = new Date(year, month - 1, day); // Meses são 0-indexed em JS
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          // É um formato DD/MM/YYYY
          const [day, month, year] = dateStr.split('/').map(Number);
          paymentDate = new Date(year, month - 1, day);
        } else {
          // Tentativa genérica com construtor Date
          paymentDate = new Date(dateStr);
          
          // Verificar se resultou em data válida
          if (isNaN(paymentDate.getTime())) {
            throw new Error(`Formato de data não reconhecido: ${dateStr}`);
          }
        }
        
        console.log(`[LoanList] Data de próximo pagamento para ${loan.borrowerName}: ${loan.paymentSchedule.nextPaymentDate} -> ${format(paymentDate, 'dd/MM/yyyy')}`);
      } catch (e) {
        // Se ainda houver erro, usar data atual como fallback, mas registrar o erro
        console.warn(`[LoanList] Erro ao processar data de pagamento para ${loan.id}:`, e);
        paymentDate = new Date();
      }
      
      return {
        date: paymentDate,
        amount: loan.paymentSchedule.installmentAmount || 0
      };
    }
    
    // Se não houver data de pagamento programada, usamos a data de vencimento como fallback
    // Tratamento mais robusto para a data de vencimento também
    let dueDate: Date;
    try {
      const dateStr = loan.dueDate;
      
      // Verificar formato ISO (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // É um formato ISO válido
        const [year, month, day] = dateStr.split('-').map(Number);
        dueDate = new Date(year, month - 1, day); // Meses são 0-indexed em JS
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        // É um formato DD/MM/YYYY
        const [day, month, year] = dateStr.split('/').map(Number);
        dueDate = new Date(year, month - 1, day);
      } else {
        // Tentativa genérica com construtor Date
        dueDate = new Date(dateStr);
        
        // Verificar se resultou em data válida
        if (isNaN(dueDate.getTime())) {
          throw new Error(`Formato de data não reconhecido: ${dateStr}`);
        }
      }
      
      console.log(`[LoanList] Usando data de vencimento para ${loan.borrowerName}: ${loan.dueDate} -> ${format(dueDate, 'dd/MM/yyyy')}`);
    } catch (e) {
      // Se ainda houver erro, usar data atual como fallback, mas registrar o erro
      console.warn(`[LoanList] Erro ao processar data de vencimento para ${loan.id}:`, e);
      dueDate = new Date();
    }
    
    return {
      date: dueDate,
      amount: (loan.principal / (loan.paymentSchedule?.installments || 12)) * (1 + (loan.interestRate / 100))
    };
  };
  
  // Calculate remaining balance for a loan
  const getRemainingBalance = (loan: LoanType): number => {
    const loanPayments = payments.filter(payment => payment.loanId === loan.id);
    return calculateRemainingBalance(loan, loanPayments);
  };

  return (
    <>
      {/* Modal de Pagamento */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={handleClosePaymentModal} 
        loan={selectedLoan} 
      />
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-xl font-semibold">Empréstimos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Empréstimos arquivados não são exibidos nesta lista. <Link href="/loans/archived" className="text-primary font-medium underline">Ver empréstimos arquivados</Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/loans/archived">
              <Button variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Ver Arquivados
              </Button>
            </Link>
            <Link href="/loans/new">
              <Button className="sm:ml-auto">
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Empréstimo
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative w-full sm:w-2/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Buscar por nome do mutuário..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-1/3">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">A Vencer</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="overdue">Vencidos</SelectItem>
                <SelectItem value="defaulted">Inadimplentes</SelectItem>
                <SelectItem value="archived">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Mutuário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Próx. Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Nenhum empréstimo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.borrowerName}</TableCell>
                        <TableCell>{formatCurrency(loan.principal)}</TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                        <TableCell>
                          {loan.paymentSchedule?.installmentAmount 
                            ? formatCurrency(loan.paymentSchedule.installmentAmount)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const nextPayment = getNextPaymentDate(loan);
                            if (!nextPayment) return '-';
                            
                            // Garantir que formatamos as datas corretamente
                            const formattedDate = formatDate(nextPayment.date);
                            
                            return formattedDate;
                          })()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={loan.status} />
                        </TableCell>
                        <TableCell>{formatCurrency(getRemainingBalance(loan))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/loans/${loan.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/loans/${loan.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar empréstimo">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Pagamentos">
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0">
                                <div className="border-b px-4 py-3">
                                  <h4 className="text-sm font-semibold">Histórico de Pagamentos</h4>
                                </div>
                                <div className="px-4 py-2">
                                  {(() => {
                                    const loanPayments = payments.filter(payment => payment.loanId === loan.id);
                                    return loanPayments.length > 0 ? (
                                      <div className="max-h-48 overflow-y-auto">
                                        {loanPayments.map(payment => (
                                          <div key={payment.id} className="py-2 border-b last:border-b-0">
                                            <div className="flex justify-between">
                                              <span className="text-sm font-medium">{formatDate(payment.date)}</span>
                                              <span className="text-sm font-semibold text-emerald-600">{formatCurrency(payment.amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                              <span>Principal: {formatCurrency(payment.principal)}</span>
                                              <span>Juros: {formatCurrency(payment.interest)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500 py-2">Nenhum pagamento registrado</p>
                                    );
                                  })()}
                                </div>
                                <div className="border-t px-4 py-3 bg-slate-50 flex justify-end">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleOpenPaymentModal(loan)}
                                  >
                                    <PlusCircle className="h-3 w-3 mr-2" />
                                    Registrar Pagamento
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
