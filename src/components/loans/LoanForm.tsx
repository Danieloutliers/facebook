import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useLoan } from "@/context/LoanContext";
import { LoanType, PaymentFrequency } from "@/types";
import { calculateMonthlyPayment } from "@/utils/loanCalculations";
import { format, addMonths, addDays, addWeeks, addYears, parseISO } from "date-fns";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

// Form schema
const loanFormSchema = z.object({
  borrowerId: z.string().min(1, "Selecione um mutuário"),
  principal: z.coerce.number().positive("Valor deve ser positivo"),
  interestRate: z.coerce.number().min(0, "Taxa deve ser maior ou igual a zero"),
  issueDate: z.date(),
  dueDate: z.date(),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"] as const),
  installments: z.coerce.number().int().positive("Número de parcelas deve ser positivo"),
  notes: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;
type LoanFormWatchValues = {
  principal: number | string;
  interestRate: number | string;
  installments: number | string;
  frequency: PaymentFrequency;
  issueDate: Date;
};

interface LoanFormProps {
  loan?: LoanType;
  isEditing?: boolean;
  preselectedBorrowerId?: string;
}

export default function LoanForm({ loan, isEditing = false, preselectedBorrowerId = "" }: LoanFormProps) {
  const [, navigate] = useLocation();
  const { borrowers, settings, addLoan, updateLoan } = useLoan();
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);

  // Set up form with default values
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      borrowerId: loan?.borrowerId || preselectedBorrowerId || "",
      principal: loan?.principal || 0,
      interestRate: loan?.interestRate || settings.defaultInterestRate,
      // Só usa a data atual se for um novo empréstimo, caso contrário mantém a data existente
      issueDate: loan ? parseISO(loan.issueDate) : new Date(),
      dueDate: loan ? parseISO(loan.dueDate) : addMonths(new Date(), 12),
      frequency: (loan?.paymentSchedule?.frequency || settings.defaultPaymentFrequency) as PaymentFrequency,
      installments: loan?.paymentSchedule?.installments || settings.defaultInstallments,
      notes: loan?.notes || "",
    },
  });

  // Calculate installment amount when relevant form values change
  const principal = form.watch("principal");
  const interestRate = form.watch("interestRate");
  const installments = form.watch("installments");
  const frequency = form.watch("frequency");
  const issueDate = form.watch("issueDate");
  
  // Atualizar a data de vencimento automaticamente quando a data de emissão ou número de parcelas mudar
  useEffect(() => {
    if (issueDate && !loan) { // Só atualiza automaticamente em novos empréstimos
      try {
        // Obtém o número atual de parcelas (verifica se é um número válido)
        let installmentCount = form.getValues("installments");
        installmentCount = typeof installmentCount === "string" 
          ? parseInt(installmentCount) 
          : (installmentCount || 1);
        
        // Garantir que o número de parcelas seja válido e não excessivo
        if (isNaN(installmentCount) || installmentCount <= 0) {
          installmentCount = 1;
        } else if (installmentCount > 60) { // Limitar a 5 anos (60 meses)
          installmentCount = 60;
        }
        
        // Clone a data para não modificar a original
        let newDueDate = new Date(issueDate);
        console.log("Data de emissão:", format(newDueDate, "dd/MM/yyyy"));
        
        // Ajusta a data de vencimento com base na frequência e no número de parcelas
        switch (frequency) {
          case "weekly":
            // Adiciona o número de semanas
            newDueDate = addDays(newDueDate, 7 * installmentCount);
            break;
          case "biweekly":
            // Adiciona o número de quinzenas
            newDueDate = addDays(newDueDate, 14 * installmentCount);
            break;
          case "monthly":
            // Adiciona o número de meses
            newDueDate = addMonths(newDueDate, installmentCount);
            break;
          case "quarterly":
            // Adiciona o número de trimestres (3 meses por trimestre)
            newDueDate = addMonths(newDueDate, 3 * installmentCount);
            break;
          case "yearly":
            // Adiciona o número de anos
            newDueDate = addMonths(newDueDate, 12 * installmentCount);
            break;
          default:
            // Por padrão, usa meses
            newDueDate = addMonths(newDueDate, installmentCount);
        }
        
        console.log("Data de vencimento calculada:", format(newDueDate, "dd/MM/yyyy"), "para", installmentCount, "parcelas com frequência", frequency);
        
        // Garantir que a data não seja muito distante no futuro (máximo de 10 anos)
        const maxFutureDate = addYears(new Date(), 10);
        if (newDueDate > maxFutureDate) {
          newDueDate = maxFutureDate;
        }
        
        form.setValue("dueDate", newDueDate);
      } catch (error) {
        console.error("Erro ao calcular data de vencimento:", error);
        // Em caso de erro, definir data de vencimento como 1 ano após emissão
        form.setValue("dueDate", addYears(new Date(issueDate), 1));
      }
    }
  }, [issueDate, form, loan, frequency, installments]);
  
  useEffect(() => {
    if (principal && interestRate && installments) {
      // Converter para números (podem vir como number ou string dependendo da origem)
      const principalAmount = typeof principal === 'string' ? parseFloat(principal) : principal;
      const rateValue = typeof interestRate === 'string' ? parseFloat(interestRate) : interestRate;
      const installmentCount = typeof installments === 'string' ? parseInt(installments) : installments;
      
      // Verificar se os valores são válidos
      if (isNaN(principalAmount) || isNaN(rateValue) || isNaN(installmentCount) || 
          principalAmount <= 0 || rateValue <= 0 || installmentCount <= 0) {
        setInstallmentAmount(0);
        return;
      }
      
      // Ajuste dos cálculos com base na frequência de pagamento
      // Nota: rateValue já é mensal
      let ratePerPeriod = rateValue / 100; // Taxa mensal em decimal
      
      // Ajuste da taxa para outras frequências de pagamento
      switch (frequency) {
        case "weekly":
          // Taxa semanal (mensal / ~4.33 semanas)
          ratePerPeriod = ratePerPeriod / 4.33;
          break;
        case "biweekly":
          // Taxa quinzenal (mensal / ~2.17 quinzenas)
          ratePerPeriod = ratePerPeriod / 2.17;
          break;
        case "monthly":
          // Mantém a taxa mensal
          break;
        case "quarterly":
          // Taxa trimestral (mensal * 3)
          ratePerPeriod = ratePerPeriod * 3;
          break;
        case "yearly":
          // Taxa anual (mensal * 12)
          ratePerPeriod = ratePerPeriod * 12;
          break;
        default:
          // Mantém a taxa mensal por padrão
          break;
      }
      
      // Para cálculo simples com juros fixos em cada parcela
      // Valor da parcela = (Principal + Juros Total) / Número de parcelas
      // onde Juros Total = Principal * Taxa * Número de parcelas
      const totalInterest = principalAmount * ratePerPeriod * installmentCount;
      const payment = (principalAmount + totalInterest) / installmentCount;
      
      setInstallmentAmount(isNaN(payment) ? 0 : payment);
    } else {
      setInstallmentAmount(0);
    }
  }, [principal, interestRate, installments, frequency]);

  // Usar a data de emissão como base e adicionar 1 mês para a próxima data de pagamento
  // Isso garante que o primeiro pagamento seja exatamente 1 mês após a emissão
  const calculateNextPaymentDate = (issueDate: Date): Date => {
    // Adiciona 1 mês à data de emissão para definir a próxima data de pagamento
    return addMonths(new Date(issueDate), 1);
  };

  const onSubmit = (data: LoanFormValues) => {
    // Calcular a próxima data de pagamento como 1 mês após a data de emissão
    const nextPaymentDate = calculateNextPaymentDate(data.issueDate);
    
    if (isEditing && loan) {
      updateLoan(loan.id, {
        ...data,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
        paymentSchedule: {
          frequency: data.frequency,
          nextPaymentDate: format(nextPaymentDate, "yyyy-MM-dd"),
          installments: data.installments,
          installmentAmount: installmentAmount,
        },
      });
      navigate(`/loans/${loan.id}`);
    } else {
      // Adicionar o empréstimo
      addLoan({
        ...data,
        issueDate: format(data.issueDate, "yyyy-MM-dd"),
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
        paymentSchedule: {
          frequency: data.frequency,
          nextPaymentDate: format(nextPaymentDate, "yyyy-MM-dd"),
          installments: data.installments,
          installmentAmount: installmentAmount,
        },
      });
      
      navigate("/loans");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Empréstimo" : "Novo Empréstimo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Borrower */}
            <FormField
              control={form.control}
              name="borrowerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mutuário</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um mutuário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {borrowers.map((borrower) => (
                        <SelectItem key={borrower.id} value={borrower.id}>
                          {borrower.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Principal */}
            <FormField
              control={form.control}
              name="principal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Principal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interest Rate */}
            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Juros (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Taxa de juros mensal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Issue Date */}
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Emissão</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={
                            "w-full pl-3 text-left font-normal flex justify-between items-center"
                          }
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={
                            "w-full pl-3 text-left font-normal flex justify-between items-center"
                          }
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {!isEditing && (
                    <FormDescription>
                      Atualiza automaticamente com base no número de parcelas e frequência
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência de Pagamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of Installments */}
            <FormField
              control={form.control}
              name="installments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Parcelas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculated Installment Amount */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Valor da Parcela</h3>
              <div className="p-3 bg-slate-50 rounded-md text-lg font-semibold">
                {formatCurrency(installmentAmount)}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o empréstimo"
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
              <Button variant="outline" type="button" onClick={() => navigate("/loans")}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Criar"} Empréstimo
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
