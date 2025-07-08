import { useState } from "react";
import { Link } from "wouter";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PlusCircle, Search, Archive, Edit, Eye, CreditCard, Calendar, DollarSign, User } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { calculateRemainingBalance } from "@/utils/loanCalculations";
import { LoanType } from "@/types";
import { PaymentModal } from "@/components/payments/PaymentModal";
import { format, isValid } from "date-fns";

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
      // Excluir contratos arquivados da lista principal
      if (statusFilter !== "archived" && loan.status === 'archived') {
        return false;
      }
      
      const borrower = getBorrowerById(loan.borrowerId);
      const matchesSearch = 
        borrower?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Ajuste para que contratos com próxima data de pagamento continuem aparecendo,
      // mesmo que estejam marcados como 'paid'
      const matchesStatus = 
        statusFilter === "all" || 
        loan.status === statusFilter ||
        // Se o contrato tem uma próxima data de pagamento e é marcado como 'paid',
        // ele deve aparecer quando o filtro for 'all' ou 'active'
        (loan.status === 'paid' && 
         loan.paymentSchedule?.nextPaymentDate && 
         (statusFilter === 'all' || statusFilter === 'active'));
      
      return matchesSearch && matchesStatus;
    })
    // Ordenar contratos por data de vencimento (mais próximos primeiro)
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

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
            <CardTitle className="text-xl font-semibold">Contratos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Contratos arquivados não são exibidos nesta lista. <Link href="/loans/archived" className="text-primary font-medium underline">Ver contratos arquivados</Link>
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
                Novo Contrato
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
          
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">Nenhum contrato encontrado.</p>
              <Link href="/loans/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Novo Contrato
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLoans.map((loan) => {
                const remainingBalance = getRemainingBalance(loan);
                const nextPayment = getNextPaymentDate(loan);
                const initials = getInitials(loan.borrowerName);
                
                return (
                  <Card key={loan.id} className="overflow-hidden transition-all hover:shadow-lg group relative border-l-4 border-l-primary/20">
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={loan.status} />
                    </div>
                    
                    {/* Header com cliente */}
                    <div className="p-4 pb-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white font-semibold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{loan.borrowerName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Contrato #{loan.id.slice(-6)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações principais */}
                    <div className="px-4 py-2 space-y-3">
                      {/* Valor e Taxa */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Valor Contratado
                          </p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(loan.principal)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Taxa de Juros</p>
                          <p className="text-lg font-bold text-orange-600">{loan.interestRate}%</p>
                        </div>
                      </div>
                      
                      {/* Saldo Devedor */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Saldo Devedor</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(remainingBalance)}</p>
                      </div>
                      
                      {/* Próximo Pagamento */}
                      {nextPayment && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Próximo Pagamento</p>
                                <p className="text-sm font-semibold">{formatDate(nextPayment.date)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-muted-foreground">Valor</p>
                              <p className="text-sm font-bold text-green-600">{formatCurrency(nextPayment.amount)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          <Link href={`/loans/${loan.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2" title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/loans/${loan.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Pagamentos">
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
                          
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleOpenPaymentModal(loan)}
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Pagamento
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
