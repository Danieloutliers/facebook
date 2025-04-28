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
    } else {
      setPrincipal(0);
      setInterest(0);
    }
  }, [loan, amount, previousPayments]);

  // Função para calcular a próxima data de pagamento com base na frequência
  const calculateNextPaymentDate = (date: Date, frequency: PaymentFrequency): Date => {
    switch (frequency) {
      case "weekly":
        return addDays(date, 7);
      case "biweekly":
        return addDays(date, 14);
      case "monthly":
        return addMonths(date, 1);
      case "quarterly":
        return addMonths(date, 3);
      case "yearly":
        return addMonths(date, 12);
      default:
        return addMonths(date, 1);
    }
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
      notes: data.notes,
    });
    
    // Se o checkbox estiver marcado, atualizar a data do próximo pagamento
    if (data.updateNextPaymentDate && loan.paymentSchedule) {
      const frequency = loan.paymentSchedule.frequency as PaymentFrequency;
      const nextPaymentDate = calculateNextPaymentDate(
        // Se estamos perto do final do mês, use a data atual para calcular o próximo pagamento
        // ao invés da data de pagamento no formulário, para evitar problemas com meses de comprimentos diferentes
        new Date(), 
        frequency
      );
      
      const updatedPaymentSchedule = {
        ...loan.paymentSchedule,
        nextPaymentDate: format(nextPaymentDate, "yyyy-MM-dd"),
      };
      
      // Atualizar o empréstimo com a nova data do próximo pagamento
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

            {/* Next Payment Date Update Option */}
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
                    <FormLabel>Atualizar data do próximo pagamento</FormLabel>
                    <FormDescription>
                      Quando marcado, a data do próximo pagamento será atualizada automaticamente de acordo com a frequência do empréstimo.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

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
