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
import StatusBadge from "@/components/shared/StatusBadge";
import PaymentForm from "@/components/payments/PaymentForm";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate, formatPercentage } from "@/utils/formatters";
import { Edit, Trash2, Calendar, User, DollarSign, Percent } from "lucide-react";
import { parseISO, format, differenceInDays } from "date-fns";

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
    deleteLoan 
  } = useLoan();
  const [activeTab, setActiveTab] = useState("details");
  
  const loan = getLoanById(loanId);
  
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
            <CardHeader>
              <CardTitle>Detalhes do Empréstimo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações Gerais</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Mutuário</span>
                    <span className="font-medium">{loan.borrowerName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Valor Principal</span>
                    <span className="font-medium">{formatCurrency(loan.principal)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Taxa de Juros</span>
                    <span className="font-medium">{loan.interestRate}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Data de Emissão</span>
                    <span className="font-medium">{formatDate(loan.issueDate)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Data de Vencimento</span>
                    <span className="font-medium">{formatDate(loan.dueDate)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Status</span>
                    <StatusBadge status={loan.status} />
                  </div>
                </div>
                
                {loan.notes && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Observações</h4>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-md">
                      {loan.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Cronograma de Pagamento</h3>
                
                {loan.paymentSchedule ? (
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Frequência</span>
                      <span className="font-medium">
                        {loan.paymentSchedule.frequency === 'weekly' && 'Semanal'}
                        {loan.paymentSchedule.frequency === 'biweekly' && 'Quinzenal'}
                        {loan.paymentSchedule.frequency === 'monthly' && 'Mensal'}
                        {loan.paymentSchedule.frequency === 'quarterly' && 'Trimestral'}
                        {loan.paymentSchedule.frequency === 'yearly' && 'Anual'}
                        {loan.paymentSchedule.frequency === 'custom' && 'Personalizado'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Próximo Pagamento</span>
                      <span className="font-medium">
                        {formatDate(loan.paymentSchedule.nextPaymentDate)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Número de Parcelas</span>
                      <span className="font-medium">{loan.paymentSchedule.installments}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Valor da Parcela</span>
                      <span className="font-medium">
                        {formatCurrency(loan.paymentSchedule.installmentAmount)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">
                    Nenhum cronograma de pagamento definido.
                  </p>
                )}
                
                <h3 className="text-lg font-semibold mt-8 mb-4">Resumo Financeiro</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Total Principal</span>
                    <span className="font-medium">{formatCurrency(metrics.totalPrincipal)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Total Juros</span>
                    <span className="font-medium">{formatCurrency(metrics.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Total Pago</span>
                    <span className="font-medium">{formatCurrency(metrics.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500 font-semibold">Saldo Devedor</span>
                    <span className="font-semibold">{formatCurrency(metrics.remainingBalance)}</span>
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
