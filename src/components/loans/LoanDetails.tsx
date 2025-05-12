import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/shared/StatusBadge";
import PaymentForm from "@/components/payments/PaymentForm";
import { useLoan } from "@/context/LoanContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatPercentage } from "@/utils/formatters";
import { Edit, Trash2, Calendar, User, DollarSign, Percent, Archive } from "lucide-react";
import { parseISO, format, differenceInDays } from "date-fns";
import { LoanType } from "@/types";

interface LoanDetailsProps {
  loanId: string;
}

export default function LoanDetails({ loanId }: LoanDetailsProps) {
  const [, navigate] = useLocation();
  const { 
    getLoanById, 
    getBorrowerById, 
    getPaymentsByLoanId, 
    calculateLoanMetrics,
    deleteLoan,
    archiveLoan,
    updateLoan
  } = useLoan();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [showPaidInstallmentsDialog, setShowPaidInstallmentsDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanType | null>(null);
  const [paidInstallmentsValue, setPaidInstallmentsValue] = useState<number>(0);
  
  const loan = getLoanById(loanId);
  
  // Função para abrir o diálogo de edição de parcelas pagas
  const handleEditPaidInstallments = (loan: LoanType) => {
    setSelectedLoan(loan);
    // Inicializar com o valor atual de parcelas pagas, ou 0 se não existir
    const currentPaidInstallments = loan.paymentSchedule?.paidInstallments || 
      (loan.paymentSchedule ? 
        loan.paymentSchedule.installments - Math.ceil(calculateLoanMetrics(loan.id).remainingBalance / loan.paymentSchedule.installmentAmount) : 0);
    
    setPaidInstallmentsValue(currentPaidInstallments);
    setShowPaidInstallmentsDialog(true);
  };
  
  // Função para salvar o número editado de parcelas pagas
  const handleSavePaidInstallments = () => {
    if (!selectedLoan || !selectedLoan.paymentSchedule) return;
    
    // Validar o número de parcelas
    if (paidInstallmentsValue < 0) {
      toast({
        title: "Valor inválido",
        description: "O número de parcelas pagas não pode ser negativo.",
        variant: "destructive"
      });
      return;
    }
    
    if (paidInstallmentsValue > selectedLoan.paymentSchedule.installments) {
      toast({
        title: "Valor inválido",
        description: `O número de parcelas pagas não pode ser maior que o total de parcelas (${selectedLoan.paymentSchedule.installments}).`,
        variant: "destructive"
      });
      return;
    }
    
    // Atualizar o empréstimo com o novo valor de parcelas pagas
    updateLoan(selectedLoan.id, {
      paymentSchedule: {
        ...selectedLoan.paymentSchedule,
        paidInstallments: paidInstallmentsValue
      }
    });
    
    // Fechar o diálogo e mostrar mensagem de sucesso
    setShowPaidInstallmentsDialog(false);
    toast({
      title: "Parcelas pagas atualizadas",
      description: `O número de parcelas pagas foi atualizado para ${paidInstallmentsValue}.`,
    });
  };
  
  if (!loan) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Empréstimo não encontrado</h3>
            <p className="mt-2 text-slate-500">
              O empréstimo solicitado não existe ou foi removido.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/loans")}
            >
              Voltar para Empréstimos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const borrower = getBorrowerById(loan.borrowerId);
  const payments = getPaymentsByLoanId(loan.id);
  const metrics = calculateLoanMetrics(loan.id);
  
  // Calculate days overdue if applicable
  const isOverdue = loan.status === 'overdue' || loan.status === 'defaulted';
  const daysOverdue = isOverdue 
    ? differenceInDays(new Date(), parseISO(loan.dueDate))
    : 0;
  
  const handleDelete = () => {
    deleteLoan(loan.id);
    navigate("/loans");
  };
  
  return (
    <>
      {/* Dialog para editar número de parcelas pagas */}
      <Dialog open={showPaidInstallmentsDialog} onOpenChange={setShowPaidInstallmentsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Parcelas Pagas</DialogTitle>
            <DialogDescription>
              Defina manualmente quantas parcelas já foram pagas para este empréstimo.
              Isso ajudará a manter o histórico correto sem afetar a lógica de cálculo automática.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidInstallments" className="text-right">
                Parcelas Pagas
              </Label>
              <div className="col-span-3">
                <Input
                  id="paidInstallments"
                  type="number"
                  min="0"
                  max={selectedLoan?.paymentSchedule?.installments}
                  value={paidInstallmentsValue}
                  onChange={(e) => setPaidInstallmentsValue(parseInt(e.target.value) || 0)}
                  className="w-full"
                />
                {selectedLoan?.paymentSchedule && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Total de parcelas: {selectedLoan.paymentSchedule.installments}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaidInstallmentsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePaidInstallments}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Empréstimo para {loan.borrowerName}
          </h1>
          <p className="text-slate-500">
            ID: {loan.id} | Criado em: {formatDate(loan.issueDate)}
          </p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Link href={`/loans/${loan.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          
          {/* Botão de Arquivar (somente visível para empréstimos pagos) */}
          {loan.status === 'paid' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Arquivar Empréstimo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a arquivar este empréstimo. Empréstimos arquivados 
                    serão movidos para a seção de "Arquivados" e não aparecerão na lista principal.
                    Esta ação pode ser revertida posteriormente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    archiveLoan(loan.id);
                    // Navegar para a lista de empréstimos arquivados
                    navigate("/loans/archived");
                  }}>
                    Sim, arquivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {/* Botão de Excluir */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente 
                  o empréstimo e todos os pagamentos associados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Valor Total</CardTitle>
            <div className="text-2xl font-semibold">{formatCurrency(loan.principal)}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-slate-500">
              <DollarSign className="h-4 w-4 mr-1" />
              Principal
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Taxa de Juros</CardTitle>
            <div className="text-2xl font-semibold">{formatPercentage(loan.interestRate)}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-slate-500">
              <Percent className="h-4 w-4 mr-1" />
              Taxa anual
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Status</CardTitle>
            <div className="text-2xl font-semibold flex items-center gap-2">
              <StatusBadge status={loan.status} className="text-sm py-0.5" />
              {isOverdue && (
                <span className="text-sm font-normal text-amber-500">
                  {daysOverdue} dias em atraso
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-slate-500">
              <Calendar className="h-4 w-4 mr-1" />
              Vencimento: {formatDate(loan.dueDate)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="new-payment">Registrar Pagamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center text-xl font-bold">
                <span className="bg-slate-100 p-2 rounded-lg mr-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </span>
                Detalhes do Empréstimo
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Informações completas sobre este empréstimo e sua situação atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              <div className="space-y-6">
                {/* Informações Gerais com design moderno */}
                <div className="bg-slate-50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    Informações Gerais
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Mutuário</span>
                      <span className="font-medium col-span-2 text-right">{loan.borrowerName}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Valor Principal</span>
                      <span className="font-medium col-span-2 text-right">{formatCurrency(loan.principal)}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Taxa de Juros</span>
                      <span className="font-medium col-span-2 text-right">{loan.interestRate}%</span>
                    </div>
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Data de Emissão</span>
                      <span className="font-medium col-span-2 text-right">{formatDate(loan.issueDate)}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Data de Vencimento</span>
                      <span className="font-medium col-span-2 text-right">{formatDate(loan.dueDate)}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Status</span>
                      <div className="col-span-2 flex justify-end">
                        <StatusBadge status={loan.status} className="text-xs py-1 px-3" />
                      </div>
                    </div>
                  </div>
                  
                  {loan.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="font-medium mb-2 text-sm text-slate-600">Observações</h4>
                      <p className="text-slate-700 bg-white p-3 rounded-md text-sm border border-slate-200">
                        {loan.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Resumo Financeiro com progresso visual */}
                <div className="bg-slate-50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" />
                    Resumo Financeiro
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Total Principal</span>
                      <span className="font-medium col-span-2 text-right">{formatCurrency(metrics.totalPrincipal)}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Total Juros</span>
                      <span className="font-medium col-span-2 text-right">{formatCurrency(metrics.totalInterest)}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                      <span className="text-slate-600 col-span-1 text-sm">Total Pago</span>
                      <span className="font-medium col-span-2 text-right">{formatCurrency(metrics.totalPaid)}</span>
                    </div>
                    
                    {/* Barra de progresso de pagamento */}
                    {loan.paymentSchedule && (
                      <div className="space-y-2 border-b border-dashed border-slate-200 pb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-sm">Progresso do Pagamento</span>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 px-2 py-0"
                              onClick={() => handleEditPaidInstallments(loan)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <span className="text-sm font-medium">
                              {loan.paymentSchedule.paidInstallments !== undefined ? 
                                loan.paymentSchedule.paidInstallments : 
                                payments.filter(p => p.notes && p.notes.includes('Parcela marcada como paga')).length} / {loan.paymentSchedule.installments}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, ((loan.paymentSchedule.paidInstallments !== undefined ? 
                                loan.paymentSchedule.paidInstallments : 
                                payments.filter(p => p.notes && p.notes.includes('Parcela marcada como paga')).length) / loan.paymentSchedule.installments) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 items-center pb-2">
                      <span className="text-slate-700 font-semibold col-span-1">Saldo Devedor</span>
                      <span className="font-bold col-span-2 text-right text-lg">
                        {formatCurrency(metrics.remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Cronograma de Pagamento com indicadores visuais */}
                <div className="bg-slate-50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Cronograma de Pagamento
                  </h3>
                  
                  {loan.paymentSchedule ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                        <span className="text-slate-600 col-span-1 text-sm">Frequência</span>
                        <span className="font-medium col-span-2 text-right">
                          {loan.paymentSchedule.frequency === 'weekly' && 'Semanal'}
                          {loan.paymentSchedule.frequency === 'biweekly' && 'Quinzenal'}
                          {loan.paymentSchedule.frequency === 'monthly' && 'Mensal'}
                          {loan.paymentSchedule.frequency === 'quarterly' && 'Trimestral'}
                          {loan.paymentSchedule.frequency === 'yearly' && 'Anual'}
                          {loan.paymentSchedule.frequency === 'custom' && 'Personalizado'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                        <span className="text-slate-600 col-span-1 text-sm">Próximo Pagamento</span>
                        <div className="col-span-2 flex items-center justify-end">
                          <span className={`font-medium ${isOverdue ? 'text-red-500' : ''}`}>
                            {formatDate(loan.paymentSchedule.nextPaymentDate)}
                          </span>
                          {isOverdue && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded ml-2">
                              Atrasado
                            </span>
                          )}
                          {!isOverdue && new Date(loan.paymentSchedule.nextPaymentDate) <= new Date(new Date().setDate(new Date().getDate() + 7)) && (
                            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded ml-2">
                              Próximo
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 items-center border-b border-dashed border-slate-200 pb-2">
                        <span className="text-slate-600 col-span-1 text-sm">Número de Parcelas</span>
                        <span className="font-medium col-span-2 text-right">{loan.paymentSchedule.installments}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 items-center pb-2">
                        <span className="text-slate-600 col-span-1 text-sm">Valor da Parcela</span>
                        <span className="font-medium col-span-2 text-right">
                          {formatCurrency(loan.paymentSchedule.installmentAmount)}
                        </span>
                      </div>
                      
                      {/* Próximos pagamentos - adicional */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="font-medium mb-3 text-sm text-slate-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Próximos 3 Pagamentos
                        </h4>
                        
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, index) => {
                            // Calcular a data do próximo pagamento com base na frequência
                            const baseDate = new Date(loan.paymentSchedule?.nextPaymentDate || loan.dueDate);
                            let nextDate = new Date(baseDate);
                            
                            if (loan.paymentSchedule?.frequency === 'weekly') {
                              nextDate.setDate(baseDate.getDate() + (7 * index));
                            } else if (loan.paymentSchedule?.frequency === 'biweekly') {
                              nextDate.setDate(baseDate.getDate() + (14 * index));
                            } else if (loan.paymentSchedule?.frequency === 'monthly') {
                              nextDate.setMonth(baseDate.getMonth() + index);
                            } else if (loan.paymentSchedule?.frequency === 'quarterly') {
                              nextDate.setMonth(baseDate.getMonth() + (3 * index));
                            } else if (loan.paymentSchedule?.frequency === 'yearly') {
                              nextDate.setFullYear(baseDate.getFullYear() + index);
                            }
                            
                            const isPast = nextDate < new Date();
                            const isNear = !isPast && nextDate <= new Date(new Date().setDate(new Date().getDate() + 7));
                            
                            return (
                              <div key={index} className={`flex justify-between items-center p-2 rounded ${isPast ? 'bg-red-50' : isNear ? 'bg-amber-50' : 'bg-white'} border border-slate-200`}>
                                <span className="text-sm">{formatDate(nextDate.toISOString())}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{formatCurrency(loan.paymentSchedule?.installmentAmount || 0)}</span>
                                  {isPast && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Atrasado</span>}
                                  {isNear && !isPast && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Em breve</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-700 text-sm">
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Nenhum cronograma de pagamento definido para este empréstimo.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Ações rápidas - Nova funcionalidade */}
                <div className="bg-slate-50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Ações Rápidas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Link href={`/payments/new?loanId=${loan.id}`}>
                      <Button variant="outline" className="w-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Registrar Pagamento
                      </Button>
                    </Link>
                    
                    <Link href={`/loans/${loan.id}/edit`}>
                      <Button variant="outline" className="w-full flex items-center">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Empréstimo
                      </Button>
                    </Link>
                    
                    <Link href={`/loans/${loan.id}/schedule`}>
                      <Button variant="outline" className="w-full flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Ver Cronograma
                      </Button>
                    </Link>
                    
                    <Link href={`/loans/${loan.id}/print`}>
                      <Button variant="outline" className="w-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        Imprimir Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Informações do Mutuário</CardTitle>
            </CardHeader>
            <CardContent>
              {borrower ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Nome</span>
                      <span className="font-medium">{borrower.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Email</span>
                      <span className="font-medium">{borrower.email || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Telefone</span>
                      <span className="font-medium">{borrower.phone || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center md:justify-end">
                    <Link href={`/borrowers/${borrower.id}`}>
                      <Button>
                        <User className="h-4 w-4 mr-2" />
                        Ver Perfil Completo
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">
                  Informações do mutuário não disponíveis.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Total de {payments.length} pagamentos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Juros</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            Nenhum pagamento registrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{formatCurrency(payment.principal)}</TableCell>
                            <TableCell>{formatCurrency(payment.interest)}</TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setActiveTab("new-payment")}>
                Registrar Novo Pagamento
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="new-payment" className="mt-6">
          <PaymentForm loanId={loan.id} onComplete={() => setActiveTab("payments")} />
        </TabsContent>
      </Tabs>
    </>
  );
}
