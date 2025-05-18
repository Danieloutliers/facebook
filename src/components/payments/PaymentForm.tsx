import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoan } from "@/context/LoanContext";
import { calculatePaymentDistribution } from "@/utils/loanCalculations";
import { format, parseISO, addDays, addMonths } from "date-fns";
import { PaymentFrequency } from "@/types";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

// Form schema
const paymentFormSchema = z.object({
  date: z.date(),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  notes: z.string().optional(),
  parcelaPaga: z.boolean().default(true),
  updateNextPaymentDate: z.boolean().default(true),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  loanId: string;
  onComplete?: () => void;
}

export default function PaymentForm({ loanId, onComplete }: PaymentFormProps) {
  const { getLoanById, getPaymentsByLoanId, addPayment, updateLoan } = useLoan();
  const [principal, setPrincipal] = useState(0);
  const [interest, setInterest] = useState(0);

  const loan = getLoanById(loanId);
  const previousPayments = getPaymentsByLoanId(loanId);

  // Set up form with default values
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      date: new Date(),
      amount: loan?.paymentSchedule?.installmentAmount || 0,
      notes: "",
      parcelaPaga: true,
      updateNextPaymentDate: true,
    },
  });

  // Calculate payment distribution when amount changes
  const amount = form.watch("amount");
  
  useEffect(() => {
    if (loan && amount > 0) {
      const { principal: principalAmount, interest: interestAmount } = 
        calculatePaymentDistribution(loan, amount, previousPayments);
      
      setPrincipal(principalAmount);
      setInterest(interestAmount);
      
      // Verifica se é um empréstimo de tipo "Somente Juros" e adiciona logs
      if (loan.paymentSchedule?.frequency === 'interest_only') {
        const monthlyRate = loan.interestRate / 100;
        const interestDue = loan.principal * monthlyRate;
        
        if (amount <= interestDue) {
          console.log(`Pagamento de ${amount} é menor ou igual aos juros devidos (${interestDue}). Todo o valor será aplicado aos juros.`);
        } else {
          console.log(`Pagamento de ${amount} excede os juros devidos (${interestDue}). Valor excedente de ${amount - interestDue} será aplicado ao principal.`);
        }
      }
    } else {
      setPrincipal(0);
      setInterest(0);
    }
  }, [loan, amount, previousPayments]);

  // Função para calcular a próxima data de pagamento com base na frequência
  const calculateNextPaymentDate = (date: Date, frequency: PaymentFrequency): Date => {
    // Pegar o dia original de pagamento (ou da data atual se não houver next payment date)
    const diaOriginal = loan?.paymentSchedule?.nextPaymentDate ? 
                        new Date(loan.paymentSchedule.nextPaymentDate).getDate() : 
                        date.getDate();
    
    let novaData: Date;
    
    switch (frequency) {
      case "weekly":
        novaData = addDays(date, 7);
        break;
      case "biweekly":
        novaData = addDays(date, 14);
        break;
      case "monthly":
        novaData = addMonths(date, 1);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
        break;
      case "quarterly":
        novaData = addMonths(date, 3);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
        break;
      case "yearly":
        novaData = addMonths(date, 12);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
        break;
      default:
        novaData = addMonths(date, 1);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
    }
    
    return novaData;
  };
  
  // Função auxiliar para obter o número de dias em um mês
  const getDaysInMonth = (data: Date): number => {
    return new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
  };

  const onSubmit = (data: PaymentFormValues) => {
    if (!loan) return;
    
    // Registrar o pagamento
    addPayment({
      loanId: loan.id,
      date: format(data.date, "yyyy-MM-dd"),
      amount: data.amount,
      principal: principal,
      interest: interest,
      notes: data.parcelaPaga ? 'Parcela marcada como paga' : data.notes,
    });
    
    // Sempre que um pagamento for registrado, devemos atualizar o contador de parcelas pagas
    // a menos que seja um empréstimo do tipo "Somente Juros"
    if (loan.paymentSchedule) {
      const frequency = loan.paymentSchedule.frequency as PaymentFrequency;
      const isInterestOnly = frequency === 'interest_only';
      
      // Calcular o novo valor de paidInstallments (somente se não for "Somente Juros")
      const currentPaidInstallments = loan.paymentSchedule.paidInstallments !== undefined 
        ? loan.paymentSchedule.paidInstallments 
        : 0;
      
      let updatedPaymentSchedule = { ...loan.paymentSchedule };
      
      // Apenas se a parcela estiver marcada como paga E o checkbox de avançar estiver marcado
      // é que atualizamos a data do próximo pagamento
      if (data.parcelaPaga && data.updateNextPaymentDate) {
        const nextPaymentDate = calculateNextPaymentDate(
          parseISO(format(data.date, "yyyy-MM-dd")),  // Usar a data do pagamento como base
          frequency
        );
        
        updatedPaymentSchedule.nextPaymentDate = format(nextPaymentDate, "yyyy-MM-dd");
      }
      
      // Incrementar o contador de parcelas pagas apenas se não for "Somente Juros" e se estiver marcada como paga
      if (!isInterestOnly && data.parcelaPaga) {
        updatedPaymentSchedule.paidInstallments = currentPaidInstallments + 1;
        
        console.log(`Atualizando parcelas pagas: ${currentPaidInstallments} -> ${currentPaidInstallments + 1}`);
      } else if (isInterestOnly) {
        console.log(`Registrando pagamento de juros (Modo Somente Juros). Não incrementando contador de parcelas.`);
      }
      
      // Atualizar o empréstimo com a nova data do próximo pagamento e contador de parcelas pagas
      updateLoan(loan.id, {
        paymentSchedule: updatedPaymentSchedule,
      });
    }
    
    if (onComplete) {
      onComplete();
    }
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Pagamento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={"w-full pl-3 text-left font-normal flex justify-between items-center"}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Pagamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Valor sugerido: {formatCurrency(loan.paymentSchedule?.installmentAmount || 0)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Principal</h3>
                <div className="p-3 bg-slate-50 rounded-md">
                  {formatCurrency(principal)}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Juros</h3>
                <div className="p-3 bg-slate-50 rounded-md">
                  {formatCurrency(interest)}
                </div>
              </div>
            </div>
            
            {/* Explicação para empréstimos do tipo "Somente Juros" */}
            {loan?.paymentSchedule?.frequency === 'interest_only' && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  Empréstimo com Pagamento Somente de Juros
                </h4>
                <p className="text-xs text-amber-700">
                  Neste tipo de empréstimo, o saldo principal só será reduzido quando o pagamento for maior que os juros devidos.
                  {amount > 0 && loan.interestRate > 0 && (
                    <>
                      <br /><br />
                      <span className="font-medium">Distribuição do pagamento atual:</span><br />
                      {amount <= (loan.principal * loan.interestRate / 100) ? (
                        <>Todo o valor de {formatCurrency(amount)} será aplicado aos juros.</>
                      ) : (
                        <>
                          {formatCurrency(interest)} será aplicado aos juros.<br />
                          {formatCurrency(principal)} será aplicado ao principal, reduzindo o saldo devedor.
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Checkbox Parcela Paga */}
            <FormField
              control={form.control}
              name="parcelaPaga"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Marcar parcela como paga</FormLabel>
                    <FormDescription>
                      Marque esta opção para registrar que a parcela foi efetivamente paga
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Next Payment Date Update Option - Mostra apenas se parcela paga estiver marcada */}
            {form.watch("parcelaPaga") && (
              <FormField
                control={form.control}
                name="updateNextPaymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Avançar para próxima parcela</FormLabel>
                      <FormDescription>
                        Quando marcado, a data do próximo pagamento será atualizada automaticamente de acordo com a frequência do empréstimo.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o pagamento"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onComplete}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Pagamento
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
