import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import {
  BorrowerType,
  LoanType,
  PaymentType,
  LoanStatus,
  DashboardMetrics,
  AppSettings,
  AdvanceType,
  AdvanceStatus
} from "@/types";
import { calculateRemainingBalance, determineNewLoanStatus } from "@/utils/loanCalculations";
import { mockBorrowers, mockLoans, mockPayments } from "@/utils/mockData";
import { parseCSV, generateCSV } from "@/utils/csvHelpers";
import { useToast } from "@/hooks/use-toast";
import { parseISO, format } from "date-fns";
import * as AutoSyncService from '@/utils/autoSyncService';
import {
  loadBorrowers,
  loadLoans,
  loadPayments,
  loadSettings,
  loadAdvances,
  saveBorrowers,
  saveLoans,
  savePayments,
  saveSettings,
  saveAdvances,
  generateId,
  isPersistenceEnabled,
  getPersistenceStatusMessage
} from "@/lib/localStorageClient";
import { ArchiveLoanDialog } from "@/components/loans/ArchiveLoanDialog";
// Importamos as utilidades de log para exibir mensagens de depuração mais detalhadas
import { logInfo, logSuccess, logWarning } from "@/utils/logUtils";
// Importamos o sistema de notificações automáticas
import { setupAutomaticNotifications } from "@/utils/automaticNotifications";

interface LoanContextType {
  // Data
  borrowers: BorrowerType[];
  loans: LoanType[];
  payments: PaymentType[];
  advances: AdvanceType[];
  settings: AppSettings;
  
  // Borrower Operations
  addBorrower: (borrower: Omit<BorrowerType, "id">) => void;
  updateBorrower: (id: string, borrower: Partial<BorrowerType>) => void;
  deleteBorrower: (id: string) => void;
  getBorrowerById: (id: string) => BorrowerType | undefined;
  
  // Loan Operations
  addLoan: (loan: Omit<LoanType, "id" | "status" | "borrowerName">) => void;
  updateLoan: (id: string, loan: Partial<LoanType>) => void;
  deleteLoan: (id: string) => void;
  getLoanById: (id: string) => LoanType | undefined;
  getLoansByBorrowerId: (borrowerId: string) => LoanType[];
  archiveLoan: (id: string) => void;
  getArchivedLoans: () => LoanType[];
  
  // Advance Operations
  addAdvance: (advance: Omit<AdvanceType, "id" | "status" | "borrowerName">) => void;
  updateAdvance: (id: string, advance: Partial<AdvanceType>) => void;
  deleteAdvance: (id: string) => void;
  getAdvanceById: (id: string) => AdvanceType | undefined;
  getAdvancesByBorrowerId: (borrowerId: string) => AdvanceType[];
  getActiveAdvances: () => AdvanceType[];
  getOverdueAdvances: () => AdvanceType[];
  
  // Payment Operations
  addPayment: (payment: Omit<PaymentType, "id">) => void;
  updatePayment: (id: string, payment: Partial<PaymentType>) => void;
  deletePayment: (id: string) => void;
  getPaymentsByLoanId: (loanId: string) => PaymentType[];
  
  // Calculation & Analytics
  calculateLoanMetrics: (loanId: string) => {
    totalPrincipal: number;
    totalInterest: number;
    totalPaid: number;
    remainingBalance: number;
  };
  getDashboardMetrics: () => DashboardMetrics;
  getOverdueLoans: () => LoanType[];
  getUpcomingDueLoans: (days: number) => LoanType[];
  getEstimatedMonthlyPayments: () => number;
  
  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Import/Export
  importData: (csvData: string) => void;
  exportData: () => string;
}

const initialSettings: AppSettings = {
  defaultInterestRate: 5,
  defaultPaymentFrequency: "monthly",
  defaultInstallments: 12,
  currency: "R$",
  enableNotifications: true,
  paymentReminderDays: 3
};

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider = ({ children }: { children: ReactNode }) => {
  // Arrays vazios para início em produção
  const initialBorrowers: BorrowerType[] = [];
  const initialLoans: LoanType[] = [];
  const initialPayments: PaymentType[] = [];
  const initialAdvances: AdvanceType[] = [];
  
  // Referência para a função de limpeza das notificações automáticas
  const notificationCleanupRef = useRef<(() => void) | null>(null);

  // Inicializar estados com dados do armazenamento local ou dados de teste
  const [borrowers, setBorrowers] = useState<BorrowerType[]>(() => {
    const storedBorrowers = loadBorrowers();
    return storedBorrowers.length > 0 ? storedBorrowers : initialBorrowers;
  });
  
  const [loans, setLoans] = useState<LoanType[]>(() => {
    const storedLoans = loadLoans();
    return storedLoans.length > 0 ? storedLoans : initialLoans;
  });
  
  const [payments, setPayments] = useState<PaymentType[]>(() => {
    const storedPayments = loadPayments();
    return storedPayments.length > 0 ? storedPayments : initialPayments;
  });
  
  const [advances, setAdvances] = useState<AdvanceType[]>(() => {
    // Carregar adiantamentos do armazenamento local
    const storedAdvances = loadAdvances();
    return storedAdvances.length > 0 ? storedAdvances : initialAdvances;
  });
  
  // Estado para controlar o diálogo de arquivamento
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [loanToArchive, setLoanToArchive] = useState<LoanType | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const storedSettings = loadSettings();
    return storedSettings || initialSettings;
  });
  
  // Exibir status da persistência no console para depuração
  useEffect(() => {
    logInfo(`Status da persistência: ${isPersistenceEnabled() ? 'Ativada' : 'Desativada'}`);
    logInfo(getPersistenceStatusMessage());
  }, []);
  
  const { toast } = useToast();
  
  // Salvar dados no localStorage sempre que mudar
  useEffect(() => {
    saveBorrowers(borrowers);
  }, [borrowers]);
  
  useEffect(() => {
    saveLoans(loans);
  }, [loans]);
  
  useEffect(() => {
    savePayments(payments);
  }, [payments]);
  
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  
  // Salvar adiantamentos no localStorage sempre que mudarem
  useEffect(() => {
    saveAdvances(advances);
  }, [advances]);
  
  // Agendar sincronização automática com Supabase quando dados forem alterados
  useEffect(() => {
    // Evitar sincronização na inicialização (quando ainda não há alterações reais)
    if (borrowers.length > 0 || loans.length > 0 || payments.length > 0) {
      console.log('Dados alterados, agendando sincronização automática...');
      AutoSyncService.scheduleSync(borrowers, loans, payments, settings);
    }
  }, [borrowers, loans, payments, settings]);
  
  // Configurar notificações automáticas
  useEffect(() => {
    // Verificar se as notificações estão habilitadas nas configurações
    if (settings.enableNotifications) {
      logInfo("Configurando sistema de notificações automáticas...");
      
      // Iniciar o sistema de notificações automáticas
      const cleanup = setupAutomaticNotifications(
        // Funções de acesso aos dados
        () => loans,
        () => borrowers,
        () => settings.paymentReminderDays || 3,
        // Verificar a cada 30 minutos
        30
      );
      
      // Armazenar a função de limpeza
      notificationCleanupRef.current = cleanup;
      
      logSuccess("Sistema de notificações automáticas configurado");
    } else {
      logInfo("Notificações automáticas desabilitadas nas configurações");
      
      // Limpar notificações automáticas se estiverem rodando
      if (notificationCleanupRef.current) {
        notificationCleanupRef.current();
        notificationCleanupRef.current = null;
        logInfo("Sistema de notificações automáticas desativado");
      }
    }
    
    // Limpar quando o componente for desmontado
    return () => {
      if (notificationCleanupRef.current) {
        notificationCleanupRef.current();
        notificationCleanupRef.current = null;
        logInfo("Sistema de notificações automáticas desativado (cleanup)");
      }
    };
  }, [settings.enableNotifications, loans, borrowers, settings.paymentReminderDays]);
  
  // Update loan statuses based on due dates and payments
  useEffect(() => {
    // Usar nossa função utilitária para determinar o status do empréstimo
    const updatedLoans = loans.map(loan => {      
      // Obter os pagamentos deste empréstimo
      const loanPayments = payments.filter(payment => payment.loanId === loan.id);
      
      // Determinar o novo status com base nos pagamentos e datas
      const newStatus = determineNewLoanStatus(loan, loanPayments);
      
      // Se o status mudou, atualizar o empréstimo
      if (newStatus !== loan.status) {
        return { ...loan, status: newStatus };
      }
      
      return loan;
    });
    
    // Atualizar o estado apenas se houve mudanças
    if (JSON.stringify(updatedLoans) !== JSON.stringify(loans)) {
      setLoans(updatedLoans);
    }
  }, [loans, payments]);
  
  // Advance operations
  const addAdvance = (advanceData: Omit<AdvanceType, "id" | "status" | "borrowerName">) => {
    const borrower = borrowers.find(b => b.id === advanceData.borrowerId);
    
    if (!borrower) {
      toast({
        title: "Erro",
        description: "Mutuário não encontrado",
        variant: "destructive"
      });
      return;
    }
    
    const newAdvance: AdvanceType = {
      ...advanceData,
      id: Date.now().toString(),
      status: 'active',
      borrowerName: borrower.name
    };
    
    setAdvances(prev => [...prev, newAdvance]);
    
    toast({
      title: "Adiantamento registrado",
      description: `Adiantamento de ${settings.currency}${advanceData.amount} para ${borrower.name} foi registrado.`
    });
  };
  
  const updateAdvance = (id: string, advanceData: Partial<AdvanceType>) => {
    // Se o borrowerId estiver sendo atualizado, precisamos atualizar o borrowerName também
    let updatedAdvanceData = { ...advanceData };
    
    if (advanceData.borrowerId) {
      const borrower = borrowers.find(b => b.id === advanceData.borrowerId);
      if (borrower) {
        updatedAdvanceData.borrowerName = borrower.name;
      }
    }
    
    setAdvances(prev => 
      prev.map(advance => advance.id === id ? { ...advance, ...updatedAdvanceData } : advance)
    );
    
    toast({
      title: "Adiantamento atualizado",
      description: "Os dados do adiantamento foram atualizados com sucesso."
    });
  };
  
  const deleteAdvance = (id: string) => {
    setAdvances(prev => prev.filter(advance => advance.id !== id));
    
    toast({
      title: "Adiantamento excluído",
      description: "O adiantamento foi excluído com sucesso."
    });
  };
  
  const getAdvanceById = (id: string) => {
    return advances.find(advance => advance.id === id);
  };
  
  const getAdvancesByBorrowerId = (borrowerId: string) => {
    return advances.filter(advance => advance.borrowerId === borrowerId);
  };
  
  const getActiveAdvances = () => {
    return advances.filter(advance => advance.status === 'active');
  };
  
  const getOverdueAdvances = () => {
    const today = new Date();
    return advances.filter(advance => 
      advance.status === 'active' && new Date(advance.dueDate) < today
    );
  };
  
  // Borrower operations
  const addBorrower = (borrower: Omit<BorrowerType, "id">) => {
    const newBorrower: BorrowerType = {
      ...borrower,
      id: Date.now().toString()
    };
    
    setBorrowers(prev => [...prev, newBorrower]);
    toast({
      title: "Mutuário adicionado",
      description: `${borrower.name} foi adicionado com sucesso.`
    });
  };
  
  const updateBorrower = (id: string, borrower: Partial<BorrowerType>) => {
    setBorrowers(prev => 
      prev.map(b => b.id === id ? { ...b, ...borrower } : b)
    );
    toast({
      title: "Mutuário atualizado",
      description: "Os dados do mutuário foram atualizados com sucesso."
    });
  };
  
  const deleteBorrower = (id: string) => {
    // Check for associated loans
    const borrowerLoans = loans.filter(loan => loan.borrowerId === id);
    if (borrowerLoans.length > 0) {
      toast({
        title: "Erro ao excluir",
        description: "Este mutuário possui empréstimos associados e não pode ser excluído.",
        variant: "destructive"
      });
      return;
    }
    
    setBorrowers(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Mutuário excluído",
      description: "O mutuário foi excluído com sucesso."
    });
  };
  
  const getBorrowerById = (id: string) => {
    return borrowers.find(b => b.id === id);
  };
  
  // Loan operations
  const addLoan = (loanData: Omit<LoanType, "id" | "status" | "borrowerName">) => {
    const borrower = borrowers.find(b => b.id === loanData.borrowerId);
    
    if (!borrower) {
      toast({
        title: "Erro",
        description: "Mutuário não encontrado",
        variant: "destructive"
      });
      return;
    }
    
    const newLoan: LoanType = {
      ...loanData,
      id: Date.now().toString(),
      status: 'active',
      borrowerName: borrower.name
    };
    
    // Adicionar o empréstimo e forçar atualização do estado
    setLoans(prev => {
      const newLoans = [...prev, newLoan];
      
      // Publicar evento para notificar componentes interessados
      // Isso ajuda componentes como PaymentTrends a reconhecer mudanças
      document.dispatchEvent(new CustomEvent('loansUpdated', { 
        detail: { loans: newLoans, action: 'add', loanId: newLoan.id }
      }));
      
      return newLoans;
    });
    
    toast({
      title: "Empréstimo adicionado",
      description: `Empréstimo para ${borrower.name} registrado com sucesso.`
    });
  };
  
  const updateLoan = (id: string, loanData: Partial<LoanType>) => {
    // If borrowerId is being updated, we need to update borrowerName too
    let updatedLoanData = { ...loanData };
    
    if (loanData.borrowerId) {
      const borrower = borrowers.find(b => b.id === loanData.borrowerId);
      if (borrower) {
        updatedLoanData.borrowerName = borrower.name;
      }
    }
    
    // Verifica se esta é uma chamada direta da função addPayment
    // Se for uma atualização de status para 'paid', verifica se foi chamada pela addPayment
    // com nota marcando a parcela como paga
    const updateIsFromAddPayment = new Error().stack?.includes('addPayment');
    
    // Se estiver tentando mudar o status para 'paid' e não for da função apropriada,
    // ou não conter a nota de parcela paga, não permitimos a alteração do status
    if (updatedLoanData.status === 'paid' && !updateIsFromAddPayment) {
      // Verifica a fonte da chamada para permitir apenas alterações legítimas
      const error = new Error();
      console.log('Tentativa de atualizar status:', error.stack);
      
      // Verificar se é uma chamada legítima
      const isLegitimateUpdate = error.stack?.includes('determineNewLoanStatus') &&
                               payments.some(p => 
                                 p.loanId === id && 
                                 p.notes && 
                                 p.notes.includes('Parcela marcada como paga')
                               );
      
      if (!isLegitimateUpdate) {
        console.log('Bloqueando atualização automática de status para "paid"');
        delete updatedLoanData.status;
      }
    }
    
    // Verifica atualizações no cronograma de pagamento para fins de debug
    if (updatedLoanData.paymentSchedule) {
      // Log da data de próximo pagamento
      if (updatedLoanData.paymentSchedule.nextPaymentDate) {
        console.log(`Atualizando empréstimo ${id}, nova data de próximo pagamento: ${updatedLoanData.paymentSchedule.nextPaymentDate}`);
      }
      
      // Log do número de parcelas pagas
      if (updatedLoanData.paymentSchedule.paidInstallments !== undefined) {
        // Buscar o valor atual para comparação
        const currentLoan = loans.find(loan => loan.id === id);
        const currentPaidInstallments = currentLoan?.paymentSchedule?.paidInstallments !== undefined 
          ? currentLoan.paymentSchedule.paidInstallments 
          : 0;
          
        console.log(`Atualizando parcelas pagas do empréstimo ${id}: ${currentPaidInstallments} -> ${updatedLoanData.paymentSchedule.paidInstallments}`);
      }
    }
    
    setLoans(prev => 
      prev.map(loan => loan.id === id ? { ...loan, ...updatedLoanData } : loan)
    );
    
    // Apenas exibe o toast se houver alguma atualização de fato
    if (Object.keys(updatedLoanData).length > 0) {
      toast({
        title: "Empréstimo atualizado",
        description: "Os dados do empréstimo foram atualizados com sucesso."
      });
    }
  };
  
  const deleteLoan = (id: string) => {
    // Check for associated payments
    const loanPayments = payments.filter(payment => payment.loanId === id);
    
    // Remove associated payments
    if (loanPayments.length > 0) {
      setPayments(prev => prev.filter(payment => payment.loanId !== id));
    }
    
    setLoans(prev => prev.filter(loan => loan.id !== id));
    toast({
      title: "Empréstimo excluído",
      description: "O empréstimo foi excluído com sucesso."
    });
  };
  
  const getLoanById = (id: string) => {
    return loans.find(loan => loan.id === id);
  };
  
  const getLoansByBorrowerId = (borrowerId: string) => {
    return loans.filter(loan => loan.borrowerId === borrowerId);
  };
  
  const archiveLoan = (id: string) => {
    console.log("Função archiveLoan chamada com ID:", id);
    
    const loan = loans.find(loan => loan.id === id);
    console.log("Empréstimo encontrado:", loan);
    
    if (!loan) {
      toast({
        title: "Erro",
        description: "Empréstimo não encontrado",
        variant: "destructive"
      });
      return;
    }
    
    // Só pode arquivar empréstimos pagos
    if (loan.status !== 'paid') {
      console.log("Empréstimo não está com status pago:", loan.status);
      toast({
        title: "Não é possível arquivar",
        description: "Apenas empréstimos pagos podem ser arquivados",
        variant: "destructive"
      });
      return;
    }
    
    // Atualiza o status para 'archived'
    console.log("Atualizando status para 'archived'");
    setLoans(prev => {
      const updatedLoans = prev.map(l => 
        l.id === id ? { ...l, status: 'archived' as LoanStatus } : l
      );
      console.log("Empréstimos atualizados:", updatedLoans);
      return updatedLoans;
    });
    
    toast({
      title: "Empréstimo arquivado",
      description: `O empréstimo para ${loan.borrowerName} foi arquivado com sucesso.`
    });
  };
  
  const getArchivedLoans = () => {
    console.log("getArchivedLoans chamado, total de empréstimos:", loans.length);
    console.log("Empréstimos e seus status:", loans.map(loan => `${loan.id}: ${loan.status}`));
    
    const archivedLoans = loans.filter(loan => {
      console.log(`Verificando empréstimo ${loan.id}, status: ${loan.status}, tipo: ${typeof loan.status}`);
      return loan.status === 'archived';
    });
    
    console.log("Empréstimos arquivados encontrados:", archivedLoans.length);
    if (archivedLoans.length > 0) {
      console.log("Detalhes dos empréstimos arquivados:", archivedLoans);
    }
    
    return archivedLoans;
  };
  
  // Payment operations
  const addPayment = (paymentData: Omit<PaymentType, "id">) => {
    const loan = loans.find(loan => loan.id === paymentData.loanId);
    
    if (!loan) {
      toast({
        title: "Erro",
        description: "Empréstimo não encontrado",
        variant: "destructive"
      });
      return;
    }
    
    const newPayment: PaymentType = {
      ...paymentData,
      id: Date.now().toString()
    };
    
    // Adicionar o novo pagamento ao estado
    setPayments(prev => [...prev, newPayment]);
    
    // Calcular saldo remanescente do empréstimo incluindo o novo pagamento
    const loanPayments = [...payments, newPayment].filter(p => p.loanId === loan.id);
    const remainingBalance = calculateRemainingBalance(loan, loanPayments);
    
    // Verificar se o empréstimo foi totalmente pago (saldo zero ou negativo)
    if (remainingBalance <= 0) {
      // Atualizar status para 'paid'
      updateLoan(loan.id, { status: 'paid' });
      
      // Buscar o empréstimo atualizado com status 'paid'
      const updatedLoan = { ...loan, status: 'paid' as LoanStatus };
      
      // Mostrar diálogo perguntando se deseja arquivar
      setLoanToArchive(updatedLoan);
      setShowArchiveDialog(true);
    } 
    // Atualizar para 'paid' apenas se marcado explicitamente como pago nas notas 
    else if (paymentData.notes && paymentData.notes.includes('Parcela marcada como paga')) {
      updateLoan(loan.id, { status: 'paid' });
    }
    
    toast({
      title: "Pagamento registrado",
      description: `Pagamento de ${settings.currency} ${paymentData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado com sucesso.`
    });
  };
  
  const updatePayment = (id: string, paymentData: Partial<PaymentType>) => {
    setPayments(prev => 
      prev.map(payment => payment.id === id ? { ...payment, ...paymentData } : payment)
    );
    
    const payment = payments.find(p => p.id === id);
    if (payment) {
      const loan = loans.find(loan => loan.id === payment.loanId);
      if (loan) {
        const updatedPayments = payments.map(p => 
          p.id === id ? { ...p, ...paymentData } : p
        ).filter(p => p.loanId === loan.id);
        
        const newStatus = determineNewLoanStatus(loan, updatedPayments);
        if (newStatus !== loan.status) {
          updateLoan(loan.id, { status: newStatus });
        }
      }
    }
    
    toast({
      title: "Pagamento atualizado",
      description: "Os dados do pagamento foram atualizados com sucesso."
    });
  };
  
  const deletePayment = (id: string) => {
    const payment = payments.find(p => p.id === id);
    
    setPayments(prev => prev.filter(payment => payment.id !== id));
    
    if (payment) {
      const loan = loans.find(loan => loan.id === payment.loanId);
      if (loan) {
        const updatedPayments = payments.filter(p => p.id !== id && p.loanId === loan.id);
        const newStatus = determineNewLoanStatus(loan, updatedPayments);
        
        if (newStatus !== loan.status) {
          updateLoan(loan.id, { status: newStatus });
        }
      }
    }
    
    toast({
      title: "Pagamento excluído",
      description: "O pagamento foi excluído com sucesso."
    });
  };
  
  const getPaymentsByLoanId = (loanId: string) => {
    return payments.filter(payment => payment.loanId === loanId);
  };
  
  // Calculations and analytics
  const calculateLoanMetrics = (loanId: string) => {
    const loan = loans.find(loan => loan.id === loanId);
    const loanPayments = payments.filter(payment => payment.loanId === loanId);
    
    if (!loan) {
      return {
        totalPrincipal: 0,
        totalInterest: 0,
        totalPaid: 0,
        remainingBalance: 0
      };
    }
    
    const totalPrincipal = loan.principal;
    const totalPaid = loanPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Cálculo do total de juros depende do tipo de empréstimo
    let totalInterest = 0;
    
    // O cálculo do total de juros depende do tipo de empréstimo
    if (loan.paymentSchedule?.frequency === 'interest_only') {
      // Para empréstimos "Somente Juros", o total de juros é a soma dos juros pagos
      // já que o valor dos juros pode variar conforme o principal vai sendo reduzido
      totalInterest = loanPayments.reduce((sum, payment) => sum + payment.interest, 0);
      
      // Adicionalmente, podemos mostrar os juros pagos até o momento, não o total projetado
      console.log(`Empréstimo ${loan.id} (Somente Juros): Total de juros pagos: ${totalInterest}`);
    } else {
      // Para outros tipos de empréstimos, também somamos os juros dos pagamentos já feitos
      totalInterest = loanPayments.reduce((sum, payment) => sum + payment.interest, 0);
    }
    
    const remainingBalance = calculateRemainingBalance(loan, loanPayments);
    
    return {
      totalPrincipal,
      totalInterest,
      totalPaid,
      remainingBalance
    };
  };
  
  const getEstimatedMonthlyPayments = (): number => {
    console.log("Calculando pagamentos estimados para o mês");
    
    // Pegar todos os empréstimos não arquivados (ativos, vencidos, pendentes, pagos)
    const validLoans = loans.filter(loan => 
      loan.status !== 'archived' && 
      (loan.status === 'active' || loan.status === 'pending' || loan.status === 'overdue' || loan.status === 'paid')
    );
    console.log(`Total de empréstimos não arquivados (ativos/vencidos/pendentes/pagos): ${validLoans.length}`);
    
    // Verificar empréstimos com programações de pagamento
    const loansWithSchedule = validLoans.filter(loan => 
      loan.paymentSchedule && 
      loan.paymentSchedule.nextPaymentDate && 
      loan.paymentSchedule.installmentAmount
    );
    console.log(`Empréstimos com programação: ${loansWithSchedule.length}`);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calcular a soma estimada de pagamentos para o mês atual
    let estimatedTotal = 0;
    
    // Se não existirem empréstimos com programação, usar uma estimativa baseada no principal
    if (loansWithSchedule.length === 0) {
      // Fallback: usar todos os empréstimos válidos e calcular um valor estimado
      estimatedTotal = validLoans.reduce((sum, loan) => {
        // Estimativa simples: valor do principal dividido por 12 (média de parcelas mensais)
        // ou usar o valor de installmentAmount se disponível
        const estimatedInstallment = loan.paymentSchedule?.installmentAmount || (loan.principal / 12);
        return sum + estimatedInstallment;
      }, 0);
      
      console.log(`Usando estimativa com base no principal/parcelas: ${estimatedTotal}`);
      return estimatedTotal;
    }
    
    // Processa empréstimos com programação de pagamento
    for (const loan of loansWithSchedule) {
      if (!loan.paymentSchedule) continue;
      
      try {
        // Pegamos a data do próximo pagamento de forma mais robusta
        let nextPaymentDate: Date | null = null;
        const dateStr = loan.paymentSchedule.nextPaymentDate;
        
        // Tratamento robusto para datas em diferentes formatos
        if (typeof dateStr === 'string') {
          try {
            // Primeiro tenta como ISO
            nextPaymentDate = new Date(dateStr);
            
            // Verifica se é uma data válida
            if (isNaN(nextPaymentDate.getTime())) {
              // Tenta parseISO como alternativa
              nextPaymentDate = parseISO(dateStr);
              
              // Se ainda for inválida, tenta como DD/MM/YYYY
              if (isNaN(nextPaymentDate.getTime()) && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0], 10);
                  const month = parseInt(parts[1], 10) - 1; // Meses são 0-indexed
                  const year = parseInt(parts[2], 10);
                  nextPaymentDate = new Date(year, month, day);
                } else {
                  throw new Error('Formato de data inválido');
                }
              }
            }
          } catch (e) {
            console.warn('Erro ao processar data:', dateStr, e);
            continue;
          }
        } else {
          console.warn('Data de pagamento não é uma string:', dateStr);
          continue;
        }
        
        // Se depois de todas as tentativas a data ainda for inválida, pula este empréstimo
        if (!nextPaymentDate || isNaN(nextPaymentDate.getTime())) {
          console.warn('Data inválida após tentativas de conversão:', dateStr);
          continue;
        }
        
        // Verificamos se o pagamento é para o mês atual
        if (nextPaymentDate.getMonth() === currentMonth && 
            nextPaymentDate.getFullYear() === currentYear) {
          
          // É para este mês, adiciona ao total estimado
          estimatedTotal += loan.paymentSchedule.installmentAmount;
          const formattedDate = `${nextPaymentDate.getDate()}/${nextPaymentDate.getMonth() + 1}/${nextPaymentDate.getFullYear()}`;
          console.log(`Adicionando pagamento de ${loan.borrowerName} PARA ESTE MÊS: ${loan.paymentSchedule.installmentAmount} (data: ${formattedDate})`);
        } else {
          // Formato da data de forma mais clara para o diagnóstico
          const formattedDate = `${nextPaymentDate.getDate()}/${nextPaymentDate.getMonth() + 1}/${nextPaymentDate.getFullYear()}`;
          console.log(`Pagamento de ${loan.borrowerName} NÃO é para este mês (${currentMonth + 1}/${currentYear}): ${loan.paymentSchedule.installmentAmount} (data: ${formattedDate})`);
        }
      } catch (error) {
        console.warn('Erro ao processar empréstimo:', loan.id, error);
      }
    }
    
    console.log(`Total estimado final APENAS PARA ESTE MÊS: ${estimatedTotal}`);
    return estimatedTotal;
  };

  // Função auxiliar para filtrar pagamentos que NÃO foram registrados via edição de parcelas
  const getValidPaymentsForReports = () => {
    return payments.filter(payment => {
      // Verificar se o pagamento não contém a string que identifica pagamentos de edição de parcelas
      return !payment.notes || !payment.notes.includes('Pagamento registrado via edição de parcelas');
    });
  };

  const getDashboardMetrics = (): DashboardMetrics => {
    // Filtrar empréstimos que não estão arquivados para o cálculo do total emprestado
    const activeLoans = loans.filter(loan => loan.status !== 'archived');
    const totalLoaned = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
    
    // Usar apenas pagamentos válidos (que não são de edição de parcelas)
    const validPayments = getValidPaymentsForReports();
    
    const totalInterestAccrued = validPayments.reduce((sum, payment) => sum + payment.interest, 0);
    
    // Alterado para mostrar o valor das parcelas em atraso, não o saldo total
    const overdueLoans = loans.filter(loan => loan.status === 'overdue' || loan.status === 'defaulted');
    const totalOverdue = overdueLoans.reduce((sum, loan) => {
      // Se tivermos o valor da parcela programada, usamos ele
      if (loan.paymentSchedule && loan.paymentSchedule.installmentAmount) {
        return sum + loan.paymentSchedule.installmentAmount;
      } else {
        // Caso contrário, calculamos uma estimativa da parcela
        const installments = loan.paymentSchedule?.installments || 12;
        const monthlyPayment = (loan.principal / installments) * (1 + (loan.interestRate / 100));
        return sum + monthlyPayment;
      }
    }, 0);
    
    // Calcular total recebido no mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const totalReceivedThisMonth = validPayments.reduce((sum, payment) => {
      const paymentDate = new Date(payment.date);
      // Verificar se o pagamento foi feito no mês atual
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        return sum + payment.amount;
      }
      return sum;
    }, 0);
    
    const activeLoanCount = loans.filter(loan => loan.status === 'active').length;
    const pendingLoanCount = loans.filter(loan => loan.status === 'pending').length;
    const paidLoanCount = loans.filter(loan => loan.status === 'paid').length;
    const overdueLoanCount = loans.filter(loan => loan.status === 'overdue').length;
    const defaultedLoanCount = loans.filter(loan => loan.status === 'defaulted').length;
    
    return {
      totalLoaned,
      totalInterestAccrued,
      totalOverdue,
      totalBorrowers: borrowers.length,
      activeLoanCount,
      pendingLoanCount,
      paidLoanCount,
      overdueLoanCount,
      defaultedLoanCount,
      totalReceivedThisMonth
    };
  };
  
  const getOverdueLoans = () => {
    // Filtrar empréstimos em atraso
    return loans.filter(loan => 
      loan.status === 'overdue' || loan.status === 'defaulted'
    );
  };
  
  const getUpcomingDueLoans = (days: number) => {
    // Definir hoje com hora, minutos e segundos zerados para comparação de datas por dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    console.log(`🔍 getUpcomingDueLoans: Buscando pagamentos de hoje (${today.toLocaleDateString()}) até ${futureDate.toLocaleDateString()}`);
    
    // SIMPLIFICADO: Mostrar TODOS os empréstimos com datas futuras,
    // independente do status (active, paid, etc.)
    return loans.filter(loan => {
      // Não incluir empréstimos arquivados
      if (loan.status === 'archived') return false;
      
      // Verificar empréstimos com programação de pagamento
      if (!loan.paymentSchedule || !loan.paymentSchedule.nextPaymentDate) return false;
      
      console.log(`🔍 Avaliando empréstimo: ${loan.borrowerName} (${loan.status}) - próximo pagamento: ${loan.paymentSchedule.nextPaymentDate}`);
      
      try {
        // Tratar a data do próximo pagamento
        const nextPaymentDate = parseISO(loan.paymentSchedule.nextPaymentDate);
        
        // Verificar se é uma data válida
        if (isNaN(nextPaymentDate.getTime())) {
          console.warn('Data inválida para empréstimo ' + loan.id);
          return false;
        }
        
        // Zerar horas, minutos e segundos para comparação apenas por dia
        const nextPaymentDay = new Date(nextPaymentDate);
        nextPaymentDay.setHours(0, 0, 0, 0);
        
        // IMPORTANTE: MOSTRAR QUALQUER EMPRÉSTIMO COM DATA FUTURA, INDEPENDENTE DO STATUS
        // A data é hoje ou futura, e está dentro do período especificado (days)
        const isInRange = nextPaymentDay >= today && nextPaymentDay <= futureDate;
        
        console.log(`🔍 Resultado para ${loan.borrowerName}: ${isInRange ? 'INCLUÍDO' : 'EXCLUÍDO'} - Data: ${nextPaymentDay.toLocaleDateString()} - IsInRange: ${isInRange}`);
        
        return isInRange; // Incluir QUALQUER empréstimo com data dentro do período
      } catch (error) {
        console.warn('Erro ao analisar paymentSchedule para o empréstimo ' + loan.id + ':', error);
        return false;
      }
    });
  };
  
  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast({
      title: "Configurações atualizadas",
      description: "As configurações foram atualizadas com sucesso."
    });
  };
  
  // Import/Export
  const importData = (data: string) => {
    // Importar utilitários de log
    import('@/utils/logUtils').then(({
      logOperationStart,
      logOperationSuccess,
      logOperationError,
      logSection,
      logSuccess,
      logWarning,
      logInfo,
      logError,
      logImportExportStats,
      logDataValidation
    }) => {
      // Verificar se é um reset
      if (data === 'RESET') {
        logOperationStart('RESET DE DADOS');
        logInfo('Limpando todos os dados');
        
        const defaultSettings = {
          defaultInterestRate: 5,
          defaultPaymentFrequency: "monthly" as const,
          defaultInstallments: 12,
          currency: "R$"
        };
        
        // Limpar todos os dados (arrays vazios)
        setBorrowers([]);
        setLoans([]);
        setPayments([]);
        setSettings(defaultSettings);
        
        // Salvar em memória (não em localStorage)
        saveBorrowers([]);
        saveLoans([]);
        savePayments([]);
        saveSettings(defaultSettings);
        
        logSuccess('Dados limpos com sucesso');
        logOperationSuccess('RESET DE DADOS', {
          Mutuários: 0,
          Empréstimos: 0,
          Pagamentos: 0
        });
        
        toast({
          title: "Dados limpos",
          description: "Todos os dados foram removidos do aplicativo"
        });
        
        return;
      }
      
      try {
        logOperationStart('IMPORTAÇÃO DE DADOS');
        
        // Variáveis para armazenar os dados importados
        let importedBorrowers: BorrowerType[] = [];
        let importedLoans: LoanType[] = [];
        let importedPayments: PaymentType[] = [];
        let importFormat = 'desconhecido';
        
        // Tenta analisar como JSON primeiro
        try {
          logInfo('Tentando analisar como JSON');
          const jsonData = JSON.parse(data);
          importFormat = 'JSON';
          
          // Verifica se o JSON contém as estruturas esperadas
          if (Array.isArray(jsonData.borrowers) && 
              Array.isArray(jsonData.loans) && 
              Array.isArray(jsonData.payments)) {
            
            importedBorrowers = jsonData.borrowers;
            importedLoans = jsonData.loans;
            importedPayments = jsonData.payments;
            
            // Registra detalhes de cada tipo
            logSuccess(`Mutuários encontrados: ${importedBorrowers.length}`);
            logSuccess(`Empréstimos encontrados: ${importedLoans.length}`);
            logSuccess(`Pagamentos encontrados: ${importedPayments.length}`);
            
            // Validação básica de estrutura
            logSection('VALIDAÇÃO DE ESTRUTURA');
            
            // Verificar estrutura dos mutuários
            const invalidBorrowers = importedBorrowers.filter(b => !b.id || !b.name);
            if (invalidBorrowers.length > 0) {
              logWarning(`${invalidBorrowers.length} mutuários com estrutura incompleta`, 
                invalidBorrowers.map(b => ({ id: b.id, nome: b.name })));
            } else {
              logSuccess('Todos os mutuários têm estrutura válida');
            }
            
            // Verificar estrutura dos empréstimos e consertar paymentSchedule se for string
            let scheduleFixCount = 0;
            importedLoans.forEach(loan => {
              if (loan.paymentSchedule && typeof loan.paymentSchedule === 'string') {
                try {
                  loan.paymentSchedule = JSON.parse(loan.paymentSchedule as any);
                  scheduleFixCount++;
                } catch (e) {
                  logWarning(`Erro ao analisar paymentSchedule do empréstimo ${loan.id}`, e);
                }
              }
            });
            
            if (scheduleFixCount > 0) {
              logInfo(`${scheduleFixCount} objetos paymentSchedule foram convertidos de string para objeto`);
            }
            
            // Verificar estrutura dos empréstimos
            const invalidLoansStructure = importedLoans.filter(
              l => !l.id || !l.borrowerId || l.principal === undefined || l.principal === null
            );
            if (invalidLoansStructure.length > 0) {
              logWarning(`${invalidLoansStructure.length} empréstimos com estrutura incompleta`, 
                invalidLoansStructure.map(l => ({ id: l.id, borrowerId: l.borrowerId })));
            } else {
              logSuccess('Todos os empréstimos têm estrutura válida');
            }
            
            // Verificar estrutura dos pagamentos
            const invalidPaymentsStructure = importedPayments.filter(
              p => !p.id || !p.loanId || p.amount === undefined || p.amount === null
            );
            if (invalidPaymentsStructure.length > 0) {
              logWarning(`${invalidPaymentsStructure.length} pagamentos com estrutura incompleta`, 
                invalidPaymentsStructure.map(p => ({ id: p.id, loanId: p.loanId })));
            } else {
              logSuccess('Todos os pagamentos têm estrutura válida');
            }
            
            logImportExportStats({
              format: 'JSON',
              borrowers: importedBorrowers.length,
              loans: importedLoans.length,
              payments: importedPayments.length
            });
          } else {
            throw new Error("Estrutura de dados JSON inválida");
          }
        } catch (jsonError) {
          // Se falhar como JSON, tenta como CSV
          logWarning('Não é um JSON válido, tentando CSV...');
          importFormat = 'CSV';
          
          // Verificar se o CSV contém as seções necessárias
          if (!data.includes('[BORROWERS]') || 
              !data.includes('[LOANS]') || 
              !data.includes('[PAYMENTS]')) {
            throw new Error("O arquivo CSV não contém as seções necessárias: [BORROWERS], [LOANS], [PAYMENTS]");
          }
          
          const parsed = parseCSV(data);
          importedBorrowers = parsed.importedBorrowers;
          importedLoans = parsed.importedLoans;
          importedPayments = parsed.importedPayments;
          
          logSuccess(`Mutuários encontrados no CSV: ${importedBorrowers.length}`);
          logSuccess(`Empréstimos encontrados no CSV: ${importedLoans.length}`);
          logSuccess(`Pagamentos encontrados no CSV: ${importedPayments.length}`);
          
          logImportExportStats({
            format: 'CSV',
            borrowers: importedBorrowers.length,
            loans: importedLoans.length,
            payments: importedPayments.length
          });
        }
        
        // Validar relacionamentos entre entidades
        const borrowerIds = new Set(importedBorrowers.map(b => b.id));
        
        // Verificar se todos os empréstimos referenciam mutuários existentes
        const invalidLoans = importedLoans.filter(loan => !borrowerIds.has(loan.borrowerId));
        
        // Verificar se todos os pagamentos referenciam empréstimos existentes
        const loanIds = new Set(importedLoans.map(l => l.id));
        const invalidPayments = importedPayments.filter(payment => !loanIds.has(payment.loanId));
        
        // Exibir validação de dados
        logDataValidation({
          borrowerIds: borrowerIds.size,
          loanIds: loanIds.size,
          invalidLoans: invalidLoans.map(loan => ({ id: loan.id, borrowerId: loan.borrowerId })),
          invalidPayments: invalidPayments.map(payment => ({ id: payment.id, loanId: payment.loanId }))
        });
        
        // Atualizar o estado com os dados importados
        logSection('SALVANDO DADOS');
        logInfo('Atualizando estado da aplicação');
        
        setBorrowers(importedBorrowers);
        setLoans(importedLoans);
        setPayments(importedPayments);
        
        // Salvar em memória (não em localStorage)
        logInfo('Salvando dados em memória');
        saveBorrowers(importedBorrowers);
        saveLoans(importedLoans);
        savePayments(importedPayments);
        
        // Estatísticas para o log final
        const stats = {
          Formato: importFormat,
          Mutuários: importedBorrowers.length,
          Empréstimos: importedLoans.length,
          Pagamentos: importedPayments.length,
          'Empréstimos inválidos': invalidLoans.length,
          'Pagamentos inválidos': invalidPayments.length
        };
        
        logOperationSuccess('IMPORTAÇÃO DE DADOS', stats);
        
        // Notificação para o usuário
        toast({
          title: "Dados importados",
          description: `Importado com sucesso: ${importedBorrowers.length} mutuários, ${importedLoans.length} empréstimos, ${importedPayments.length} pagamentos.`
        });
      } catch (error) {
        logOperationError('IMPORTAÇÃO DE DADOS', error);
        
        // Mensagem de erro mais específica
        let errorMessage = "Falha ao importar dados. Verifique o formato do arquivo.";
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Erro na importação",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Re-lançar o erro para que o chamador possa lidar com ele, se necessário
        throw error;
      }
    });
  };
  
  const exportData = () => {
    // Importar utilitários de log
    import('@/utils/logUtils').then(({
      logOperationStart,
      logOperationSuccess,
      logSection,
      logInfo
    }) => {
      logOperationStart('EXPORTAÇÃO DE DADOS');
      logInfo('Iniciando exportação para CSV');
      
      logSection('ESTATÍSTICAS DOS DADOS');
      
      // Exibir estatísticas dos dados sendo exportados
      console.table({
        "Mutuários": borrowers.length,
        "Empréstimos": loans.length,
        "Pagamentos": payments.length,
        "Total de registros": borrowers.length + loans.length + payments.length
      });
      
      // Exibir informações sobre status dos empréstimos
      const loanStatuses = loans.reduce((acc, loan) => {
        acc[loan.status] = (acc[loan.status] || 0) + 1;
        return acc;
      }, {} as Record<LoanStatus, number>);
      
      logInfo('Distribuição de status dos empréstimos');
      console.table(loanStatuses);
      
      logOperationSuccess('EXPORTAÇÃO DE DADOS', {
        Mutuários: borrowers.length,
        Empréstimos: loans.length,
        Pagamentos: payments.length
      });
    });
    
    return generateCSV(borrowers, loans, payments);
  };
  
  // Funções para gerenciar o diálogo de arquivamento
  const handleCloseArchiveDialog = () => {
    setShowArchiveDialog(false);
    setLoanToArchive(null);
  };

  const handleConfirmArchive = (loanId: string) => {
    // Arquivar o empréstimo
    archiveLoan(loanId);
    
    // Fechar o diálogo
    setShowArchiveDialog(false);
    setLoanToArchive(null);
  };

  const contextValue: LoanContextType = {
    borrowers,
    loans,
    payments,
    advances,
    settings,
    addBorrower,
    updateBorrower,
    deleteBorrower,
    getBorrowerById,
    addLoan,
    updateLoan,
    deleteLoan,
    getLoanById,
    getLoansByBorrowerId,
    archiveLoan,
    getArchivedLoans,
    addAdvance,
    updateAdvance,
    deleteAdvance,
    getAdvanceById,
    getAdvancesByBorrowerId,
    getActiveAdvances,
    getOverdueAdvances,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentsByLoanId,
    calculateLoanMetrics,
    getDashboardMetrics,
    getOverdueLoans,
    getUpcomingDueLoans,
    getEstimatedMonthlyPayments,
    updateSettings,
    importData,
    exportData
  };
  
  return (
    <LoanContext.Provider value={contextValue}>
      {children}
      
      {/* Diálogo de confirmação para arquivar empréstimos pagos */}
      {showArchiveDialog && loanToArchive && (
        <ArchiveLoanDialog
          loan={loanToArchive}
          isOpen={showArchiveDialog}
          onClose={handleCloseArchiveDialog}
          onConfirm={handleConfirmArchive}
        />
      )}
    </LoanContext.Provider>
  );
};

export const useLoan = () => {
  const context = useContext(LoanContext);
  
  if (context === undefined) {
    throw new Error("useLoan must be used within a LoanProvider");
  }
  
  return context;
};
