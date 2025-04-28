import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  BorrowerType,
  LoanType,
  PaymentType,
  LoanStatus,
  DashboardMetrics,
  AppSettings
} from "@/types";
import { calculateRemainingBalance, determineNewLoanStatus } from "@/utils/loanCalculations";
import { mockBorrowers, mockLoans, mockPayments } from "@/utils/mockData";
import { parseCSV, generateCSV } from "@/utils/csvHelpers";
import { useToast } from "@/hooks/use-toast";
import { parseISO } from "date-fns";
import {
  loadBorrowers,
  loadLoans,
  loadPayments,
  loadSettings,
  saveBorrowers,
  saveLoans,
  savePayments,
  saveSettings,
  generateId
} from "@/lib/memoryClient";

interface LoanContextType {
  // Data
  borrowers: BorrowerType[];
  loans: LoanType[];
  payments: PaymentType[];
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
  currency: "R$"
};

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider = ({ children }: { children: ReactNode }) => {
  // Inicializar com dados do localStorage ou dados mockados
  const [borrowers, setBorrowers] = useState<BorrowerType[]>(() => {
    const storedBorrowers = loadBorrowers();
    return storedBorrowers.length > 0 ? storedBorrowers : mockBorrowers;
  });
  
  const [loans, setLoans] = useState<LoanType[]>(() => {
    const storedLoans = loadLoans();
    return storedLoans.length > 0 ? storedLoans : mockLoans;
  });
  
  const [payments, setPayments] = useState<PaymentType[]>(() => {
    const storedPayments = loadPayments();
    return storedPayments.length > 0 ? storedPayments : mockPayments;
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const storedSettings = loadSettings();
    return storedSettings || initialSettings;
  });
  
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
    
    setLoans(prev => [...prev, newLoan]);
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
    
    setLoans(prev => 
      prev.map(loan => loan.id === id ? { ...loan, ...updatedLoanData } : loan)
    );
    
    toast({
      title: "Empréstimo atualizado",
      description: "Os dados do empréstimo foram atualizados com sucesso."
    });
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
    
    setPayments(prev => [...prev, newPayment]);
    
    // Atualizar o empréstimo para "Pago" imediatamente após registrar o pagamento do mês atual
    // Isso garante que o status seja atualizado mesmo que a data de vencimento já tenha passado
    updateLoan(loan.id, { status: 'paid' });
    
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
    const totalInterest = loanPayments.reduce((sum, payment) => sum + payment.interest, 0);
    const remainingBalance = calculateRemainingBalance(loan, loanPayments);
    
    return {
      totalPrincipal,
      totalInterest,
      totalPaid,
      remainingBalance
    };
  };
  
  const getDashboardMetrics = (): DashboardMetrics => {
    const totalLoaned = loans.reduce((sum, loan) => sum + loan.principal, 0);
    
    const totalInterestAccrued = payments.reduce((sum, payment) => sum + payment.interest, 0);
    
    const overdueLoans = loans.filter(loan => loan.status === 'overdue' || loan.status === 'defaulted');
    const totalOverdue = overdueLoans.reduce((sum, loan) => {
      const loanPayments = payments.filter(payment => payment.loanId === loan.id);
      return sum + calculateRemainingBalance(loan, loanPayments);
    }, 0);
    
    // Calcular total recebido no mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const totalReceivedThisMonth = payments.reduce((sum, payment) => {
      const paymentDate = new Date(payment.date);
      // Verificar se o pagamento foi feito no mês atual
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        return sum + payment.amount;
      }
      return sum;
    }, 0);
    
    const activeLoanCount = loans.filter(loan => loan.status === 'active').length;
    const paidLoanCount = loans.filter(loan => loan.status === 'paid').length;
    const overdueLoanCount = loans.filter(loan => loan.status === 'overdue').length;
    const defaultedLoanCount = loans.filter(loan => loan.status === 'defaulted').length;
    
    return {
      totalLoaned,
      totalInterestAccrued,
      totalOverdue,
      totalBorrowers: borrowers.length,
      activeLoanCount,
      paidLoanCount,
      overdueLoanCount,
      defaultedLoanCount,
      totalReceivedThisMonth
    };
  };
  
  const getOverdueLoans = () => {
    return loans.filter(loan => loan.status === 'overdue' || loan.status === 'defaulted');
  };
  
  const getUpcomingDueLoans = (days: number) => {
    // Definir hoje com hora, minutos e segundos zerados para comparação de datas por dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    return loans.filter(loan => {
      // Verificar empréstimos com programação de pagamento
      if (!loan.paymentSchedule || !loan.paymentSchedule.nextPaymentDate) return false;
      
      try {
        // Tratar a data do próximo pagamento
        let nextPaymentDate;
        const dateStr = loan.paymentSchedule.nextPaymentDate;
        
        // Verificar o formato da data e fazer o parse apropriado
        if (typeof dateStr === 'string') {
          // Tenta tratar como data ISO
          try {
            nextPaymentDate = parseISO(dateStr);
            
            // Verificar se é uma data válida
            if (isNaN(nextPaymentDate.getTime())) {
              throw new Error('Data inválida após parseISO');
            }
          } catch (e) {
            // Tenta tratar como formato DD/MM/YYYY
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Meses são 0-indexed em JS
                const year = parseInt(parts[2], 10);
                nextPaymentDate = new Date(year, month, day);
              } else {
                return false; // Formato de data inválido
              }
            } else {
              return false; // Não conseguiu analisar a data
            }
          }
        } else {
          return false; // nextPaymentDate não é uma string
        }
        
        // Zerar horas, minutos e segundos para comparação apenas por dia
        const nextPaymentDay = new Date(nextPaymentDate);
        nextPaymentDay.setHours(0, 0, 0, 0);
        
        // IMPORTANTE: Modificado para incluir pagamentos do dia atual e vencidos
        // Verificar se o pagamento é para hoje (dia atual)
        const isToday = nextPaymentDay.getTime() === today.getTime();
        
        // Verificar se o pagamento está próximo (dentro do período de dias especificado)
        const isUpcoming = nextPaymentDay > today && nextPaymentDay <= futureDate;
        
        // Verificar se o pagamento está vencido (antes ou igual ao dia atual)
        const isDue = nextPaymentDay <= today;
        
        // CORREÇÃO IMPORTANTE: Garantir que empréstimos com status 'overdue' ou no dia
        // atual sempre apareçam, mesmo se nextPaymentDate for igual a today
        const shouldShow = isToday || // É hoje
                           isUpcoming || // Está dentro do período futuro especificado
                           (isDue && loan.status !== 'paid') || // Está vencido e não foi pago
                           loan.status === 'overdue'; // Está marcado como vencido
        
        // Retorna true se a data for válida e algum dos critérios acima for atendido
        return !isNaN(nextPaymentDate.getTime()) && shouldShow;
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
        logInfo('Reiniciando dados para valores padrão');
        
        const defaultSettings = {
          defaultInterestRate: 5,
          defaultPaymentFrequency: "monthly" as const,
          defaultInstallments: 12,
          currency: "R$"
        };
        
        setBorrowers([...mockBorrowers]);
        setLoans([...mockLoans]);
        setPayments([...mockPayments]);
        setSettings(defaultSettings);
        
        // Salvar em memória (não em localStorage)
        saveBorrowers([...mockBorrowers]);
        saveLoans([...mockLoans]);
        savePayments([...mockPayments]);
        saveSettings(defaultSettings);
        
        logSuccess('Dados reiniciados com sucesso');
        logOperationSuccess('RESET DE DADOS', {
          Mutuários: mockBorrowers.length,
          Empréstimos: mockLoans.length,
          Pagamentos: mockPayments.length
        });
        
        toast({
          title: "Dados reiniciados",
          description: "Todos os dados foram redefinidos para os valores padrão"
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
  
  const contextValue: LoanContextType = {
    borrowers,
    loans,
    payments,
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
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentsByLoanId,
    calculateLoanMetrics,
    getDashboardMetrics,
    getOverdueLoans,
    getUpcomingDueLoans,
    updateSettings,
    importData,
    exportData
  };
  
  return (
    <LoanContext.Provider value={contextValue}>
      {children}
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
