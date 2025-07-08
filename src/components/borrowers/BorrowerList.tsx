import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PlusCircle, 
  Search, 
  Phone, 
  Mail, 
  Eye, 
  Calendar, 
  PlusSquare,
  FileText,
  DollarSign
} from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { calculateRemainingBalance } from "@/utils/loanCalculations";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isValid, parseISO, format } from 'date-fns';

export default function BorrowerList() {
  const { borrowers, loans, payments, getLoansByBorrowerId } = useLoan();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("name-asc");

  // Filter borrowers based on search term
  const filteredBorrowers = borrowers.filter((borrower) =>
    borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (borrower.email && borrower.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (borrower.phone && borrower.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort borrowers based on the selected sort order
  const sortedBorrowers = [...filteredBorrowers].sort((a, b) => {
    switch (sortOrder) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "loans-desc":
        return getLoansByBorrowerId(b.id).length - getLoansByBorrowerId(a.id).length;
      case "loans-asc":
        return getLoansByBorrowerId(a.id).length - getLoansByBorrowerId(b.id).length;
      default:
        return 0;
    }
  });

  // Get active loan count for a borrower
  const getActiveLoanCount = (borrowerId: string) => {
    const borrowerLoans = getLoansByBorrowerId(borrowerId);
    
    // Um empréstimo é considerado ativo se:
    // 1. Não está arquivado E
    // 2. Ainda tem saldo remanescente (não foi totalmente quitado)
    
    return borrowerLoans.filter(loan => {
      // Empréstimos arquivados não são considerados ativos
      if (loan.status === 'archived') return false;
      
      // Obter pagamentos associados a este empréstimo
      const loanPayments = payments.filter(payment => payment.loanId === loan.id);
      
      // Calcular saldo remanescente usando a função utilitária
      const remainingBalance = calculateRemainingBalance(loan, loanPayments);
      
      // Se ainda tem saldo pendente (maior que 0), o empréstimo é considerado ativo
      // Ignoramos o status temporário 'paid' que pode ser aplicado quando há pagamento no mês corrente
      return remainingBalance > 0;
    }).length;
  };

  // Calculate total loan amount for a borrower
  const calculateTotalLoanAmount = (borrowerId: string) => {
    const borrowerLoans = getLoansByBorrowerId(borrowerId);
    return borrowerLoans.reduce((total, loan) => {
      return total + (loan.principal || 0);
    }, 0);
  };
  
  // Get next payment date from borrower's loans
  const getNextPaymentDate = (borrowerId: string) => {
    const borrowerLoans = getLoansByBorrowerId(borrowerId);
    
    // Incluir todos os empréstimos não arquivados, mesmo os que são marcados como 'paid'
    // pois esse status pode ser temporário após um pagamento, mas ainda haver parcelas futuras
    const activeLoans = borrowerLoans.filter(loan => 
      loan.status !== 'archived'
    );
    
    if (activeLoans.length === 0) return null;
    
    // Verificar se há saldo remanescente em algum empréstimo
    const loansWithBalance = activeLoans.filter(loan => {
      const loanPayments = payments.filter(payment => payment.loanId === loan.id);
      const remainingBalance = calculateRemainingBalance(loan, loanPayments);
      return remainingBalance > 0;
    });
    
    if (loansWithBalance.length === 0) return null;
    
    // Encontrar o empréstimo com a próxima data de pagamento mais próxima (futuro)
    const now = new Date();
    
    // Primeiro verificamos as datas de pagamento programadas nas schedules
    // Não filtramos apenas datas futuras, pois queremos mostrar a próxima data
    // mesmo que seja no passado (para empréstimos em atraso)
    const loansWithSchedules = loansWithBalance
      .filter(loan => loan.paymentSchedule && loan.paymentSchedule.nextPaymentDate)
      .map(loan => {
        // Tratamento mais robusto para garantir a data correta
        let paymentDate: Date;
        try {
          const dateStr = loan.paymentSchedule!.nextPaymentDate;
          
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
          
          // Imprimir para debug
          console.log(`Data de próximo pagamento para ${loan.borrowerName}: ${loan.paymentSchedule!.nextPaymentDate} -> ${format(paymentDate, 'dd/MM/yyyy')}`);
        } catch (e) {
          // Se ainda houver erro, usar data atual como fallback, mas registrar o erro
          console.warn(`Erro ao processar data de pagamento para ${loan.id}:`, e);
          paymentDate = new Date();
        }
        
        return {
          date: paymentDate,
          amount: loan.paymentSchedule!.installmentAmount || 0,
          borrowerName: loan.borrowerName || ''
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (loansWithSchedules.length > 0) {
      return {
        date: loansWithSchedules[0].date,
        amount: loansWithSchedules[0].amount,
        borrowerName: loansWithSchedules[0].borrowerName
      };
    }
    
    // Se não houver datas de pagamento programadas, usamos as datas de vencimento como fallback
    const loansWithDueDates = loansWithBalance
      .map(loan => {
        // Tratamento mais robusto para garantir a data correta
        let dueDate: Date;
        try {
          dueDate = new Date(loan.dueDate);
          
          // Verificar se a data é válida
          if (isNaN(dueDate.getTime())) {
            throw new Error("Data de vencimento inválida");
          }
        } catch (e) {
          console.warn(`Erro ao processar data de vencimento para ${loan.id}:`, e);
          dueDate = new Date();
        }
        
        return {
          date: dueDate,
          amount: (loan.principal / (loan.paymentSchedule?.installments || 12)) * (1 + (loan.interestRate / 100)),
          borrowerName: loan.borrowerName || ''
        };
      })
      // Não filtramos para manter todas as datas, incluindo as passadas
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (loansWithDueDates.length > 0) {
      return {
        date: loansWithDueDates[0].date,
        amount: loansWithDueDates[0].amount,
        borrowerName: loansWithDueDates[0].borrowerName
      };
    }
    
    return null;
  };

  // Get borrower status (active, overdue, defaulted)
  const getBorrowerStatus = (borrowerId: string) => {
    const borrowerLoans = getLoansByBorrowerId(borrowerId);
    
    // Verificar se há empréstimos inadimplentes
    if (borrowerLoans.some(loan => loan.status === 'defaulted')) {
      return { text: "Inadimplente", className: "text-red-600 dark:text-red-400" };
    }
    
    // Verificar se há empréstimos em atraso
    if (borrowerLoans.some(loan => loan.status === 'overdue')) {
      return { text: "Atrasado", className: "text-yellow-600 dark:text-yellow-400" };
    }
    
    // Default status is active
    return { text: "Ativo", className: "text-green-600 dark:text-green-400" };
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <CardTitle className="text-xl font-semibold">Mutuários</CardTitle>
        <Link href="/borrowers/new">
          <Button className="sm:ml-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Mutuário
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative w-full sm:w-2/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={sortOrder}
            onValueChange={setSortOrder}
          >
            <SelectTrigger className="w-full sm:w-1/3">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="loans-desc">Nº de Empréstimos (maior)</SelectItem>
              <SelectItem value="loans-asc">Nº de Empréstimos (menor)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {sortedBorrowers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">Nenhum mutuário encontrado.</p>
            <Link href="/borrowers/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Mutuário
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBorrowers.map((borrower) => {
              const activeLoanCount = getActiveLoanCount(borrower.id);
              const totalAmount = calculateTotalLoanAmount(borrower.id);
              const status = getBorrowerStatus(borrower.id);
              const initials = getInitials(borrower.name);
              
              return (
                <Card key={borrower.id} className="overflow-hidden transition-all hover:shadow-lg group relative">
                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.className} bg-opacity-20 dark:bg-opacity-30 bg-slate-100 dark:bg-slate-800`}>
                      {status.text}
                    </div>
                  </div>
                  
                  <div className="flex items-center p-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-semibold shrink-0 mr-4 shadow-md">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{borrower.name}</h3>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Phone className="h-3.5 w-3.5 mr-1.5" />
                        <span>{borrower.phone || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        <span>{borrower.email || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-slate-800/80 px-5 py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                          <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Próximo pagamento</p>
                          {(() => {
                            const nextPayment = getNextPaymentDate(borrower.id);
                            if (!nextPayment) return <p className="text-sm font-semibold">Nenhum</p>;
                            
                            const paymentDate = nextPayment.date;
                            
                            if (!isValid(paymentDate)) return <p className="text-sm font-semibold">Data inválida</p>;
                            
                            const now = new Date();
                            let statusClass = "text-slate-700 dark:text-slate-300";
                            let statusBadge = null;
                            
                            if (paymentDate < now) {
                              statusClass = "text-red-600 dark:text-red-400";
                              statusBadge = (
                                <span className="ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">
                                  Atrasado
                                </span>
                              );
                            } else {
                              // Se for nos próximos 7 dias
                              const sevenDaysFromNow = new Date();
                              sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                              
                              if (paymentDate <= sevenDaysFromNow) {
                                statusClass = "text-yellow-600 dark:text-yellow-400";
                                statusBadge = (
                                  <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs">
                                    Próximo
                                  </span>
                                );
                              }
                            }
                            
                            return (
                              <div className="flex items-center">
                                <span className={`text-sm font-semibold ${statusClass}`}>
                                  {formatDate(paymentDate)}
                                  {statusBadge}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const nextPayment = getNextPaymentDate(borrower.id);
                          if (nextPayment) {
                            return (
                              <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Valor</p>
                                <p className="text-sm font-bold text-primary">
                                  {formatCurrency(nextPayment.amount)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 border-t">
                    <div className="p-4 text-center border-r bg-white dark:bg-slate-800">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-1">
                          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-sm font-semibold">{activeLoanCount}</div>
                        <div className="text-xs text-slate-500">Empréstimos</div>
                      </div>
                    </div>
                    <div className="p-4 text-center bg-white dark:bg-slate-800">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-1">
                          <DollarSign className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="text-sm font-semibold">{formatCurrency(totalAmount)}</div>
                        <div className="text-xs text-slate-500">Total</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-t">
                    <Link href={`/borrowers/${borrower.id}`} className="w-1/2">
                      <Button variant="ghost" size="sm" className="w-full py-4 rounded-none border-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Eye className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">Detalhes</span>
                      </Button>
                    </Link>
                    <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                    <Link href={`/loans/new?borrower=${borrower.id}`} className="w-1/2">
                      <Button variant="ghost" size="sm" className="w-full py-4 rounded-none border-0 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                        <PlusSquare className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />
                        <span className="font-medium">Novo Empréstimo</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
