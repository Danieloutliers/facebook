import { useState, useEffect } from 'react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { LoanType, PaymentType, PaymentFrequency } from '@/types';
import { useLoan } from '@/context/LoanContext';
import { calculateRemainingBalance } from '@/utils/loanCalculations';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanType | null;
}

export function PaymentModal({ isOpen, onClose, loan }: PaymentModalProps) {
  const { payments, addPayment, updateLoan } = useLoan();
  const [amount, setAmount] = useState<string>('');
  const [principal, setPrincipal] = useState<string>('');
  const [interest, setInterest] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [parcelaPaga, setParcelaPaga] = useState<boolean>(true);
  const [avancarProximaParcela, setAvancarProximaParcela] = useState<boolean>(true);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen && loan) {
      // Default to the installment amount if available
      const installmentAmount = loan.paymentSchedule?.installmentAmount || 0;
      setAmount(installmentAmount.toString());
      
      // Calculate default principal and interest split
      const remainingBalance = calculateRemainingBalance(loan, payments.filter(p => p.loanId === loan.id));
      const interestAmount = (remainingBalance * loan.interestRate / 100) / 12; // Monthly interest
      const principalAmount = installmentAmount - interestAmount;
      
      setPrincipal(principalAmount.toFixed(2));
      setInterest(interestAmount.toFixed(2));
      setDate(new Date());
      setParcelaPaga(true);
      setAvancarProximaParcela(true);
    }
  }, [isOpen, loan, payments]);

  // Update interest when amount or principal changes
  useEffect(() => {
    if (amount && principal) {
      const amountNum = parseFloat(amount);
      const principalNum = parseFloat(principal);
      setInterest((amountNum - principalNum).toFixed(2));
    }
  }, [amount, principal]);

  // Update principal when amount or interest changes
  useEffect(() => {
    if (amount && interest) {
      const amountNum = parseFloat(amount);
      const interestNum = parseFloat(interest);
      setPrincipal((amountNum - interestNum).toFixed(2));
    }
  }, [amount, interest]);

  // Função para calcular a próxima data de pagamento com base na frequência
  const calcularProximaData = (dataAtual: Date, frequencia: PaymentFrequency): Date => {
    // Pegamos o dia do pagamento original para manter consistência
    const diaOriginal = loan?.paymentSchedule?.nextPaymentDate ? 
                        new Date(loan.paymentSchedule.nextPaymentDate).getDate() : 
                        dataAtual.getDate();
    
    let novaData: Date;
    
    switch (frequencia) {
      case 'weekly':
        novaData = addDays(dataAtual, 7);
        break;
      case 'biweekly':
        novaData = addDays(dataAtual, 14);
        break;
      case 'monthly':
        novaData = addMonths(dataAtual, 1);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
        break;
      case 'quarterly':
        novaData = addMonths(dataAtual, 3);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
        break;
      case 'yearly':
        novaData = addMonths(dataAtual, 12);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
        break;
      default:
        novaData = addMonths(dataAtual, 1);
        // Ajustamos para manter o mesmo dia do mês
        novaData.setDate(Math.min(diaOriginal, getDaysInMonth(novaData)));
    }
    
    return novaData;
  };
  
  // Função auxiliar para obter o número de dias em um mês
  const getDaysInMonth = (data: Date): number => {
    return new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
  };

  const handleSubmit = () => {
    if (!loan) return;
    
    const amountNum = parseFloat(amount);
    const principalNum = parseFloat(principal);
    const interestNum = parseFloat(interest);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Por favor, informe um valor válido para o pagamento');
      return;
    }
    
    const newPayment: Omit<PaymentType, 'id'> = {
      loanId: loan.id,
      date: format(date, 'yyyy-MM-dd'),
      amount: amountNum,
      principal: principalNum,
      interest: interestNum,
      notes: parcelaPaga ? 'Parcela marcada como paga' : undefined
    };
    
    // Registrar o pagamento
    addPayment(newPayment);
    
    // Atualizar status do empréstimo se necessário, MAS não modificar a data
    // do próximo pagamento se o usuário não quiser avançar
    if (parcelaPaga && loan.paymentSchedule) {
      // Se o usuário escolheu avançar para a próxima parcela
      if (avancarProximaParcela) {
        const proximaData = calcularProximaData(date, loan.paymentSchedule.frequency);
        
        // Atualizar o empréstimo com a próxima data de pagamento
        console.log(`Atualizando próxima data de pagamento para: ${format(proximaData, 'dd/MM/yyyy')}`);
        
        // O formato da data deve ser ISO para garantir consistência
        const nextPaymentDateISO = format(proximaData, 'yyyy-MM-dd');
        
        // Atualizar o empréstimo com a data correta de próximo pagamento
        // e também garantir que o status seja atualizado para 'active' se estava em atraso
        updateLoan(loan.id, {
          status: 'active', // Sempre atualizar para ativo após um pagamento
          paymentSchedule: {
            ...loan.paymentSchedule,
            nextPaymentDate: nextPaymentDateISO
          }
        });
        
        // Registrar para debug
        console.log(`Atualizando empréstimo ${loan.id}, nova data de próximo pagamento: ${nextPaymentDateISO}`);
      } else {
        // Apenas atualizamos o status do empréstimo sem mudar a data
        console.log('Pagamento registrado sem avançar a data da próxima parcela');
        
        // Atualizar apenas o status se necessário, sem mexer na data
        if (loan.status === 'overdue' || loan.status === 'defaulted') {
          updateLoan(loan.id, {
            status: 'active'
          });
        }
      }
    }
    
    onClose();
  };

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="loan-info">Empréstimo</Label>
            <div id="loan-info" className="text-sm p-2 bg-slate-50 rounded-md">
              <p><span className="font-medium">Mutuário:</span> {loan.borrowerName}</p>
              <p><span className="font-medium">Valor total:</span> {formatCurrency(loan.principal)}</p>
              <p><span className="font-medium">Taxa:</span> {loan.interestRate}%</p>
              <p><span className="font-medium">Vencimento:</span> {formatDate(loan.dueDate)}</p>
              {loan.paymentSchedule && (
                <p><span className="font-medium">Próximo pagamento:</span> {formatDate(loan.paymentSchedule.nextPaymentDate)}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor total do pagamento"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Principal</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                min="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="Valor do principal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest">Juros</Label>
              <Input
                id="interest"
                type="number"
                step="0.01"
                min="0"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="Valor dos juros"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Data do Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'dd/MM/yyyy') : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Checkbox Parcela Paga */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="parcela-paga" 
              checked={parcelaPaga}
              onCheckedChange={(checked) => setParcelaPaga(checked === true)}
            />
            <Label 
              htmlFor="parcela-paga" 
              className="font-medium cursor-pointer"
            >
              Marcar parcela como paga
            </Label>
          </div>
          
          {/* Checkbox Avançar para Próxima Parcela */}
          {parcelaPaga && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="avancar-parcela" 
                checked={avancarProximaParcela}
                onCheckedChange={(checked) => setAvancarProximaParcela(checked === true)}
              />
              <Label 
                htmlFor="avancar-parcela" 
                className="font-medium cursor-pointer"
              >
                Avançar para próxima parcela
              </Label>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Registrar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
