import { BorrowerType, LoanType, PaymentType } from "@/types";

/**
 * Parse a CSV string into structured data with better error handling
 */
export function parseCSV(csvData: string): {
  importedBorrowers: BorrowerType[];
  importedLoans: LoanType[];
  importedPayments: PaymentType[];
} {
  try {
    const lines = csvData.split('\n');
    
    // Identify sections
    const borrowerSectionStart = lines.findIndex(line => line.trim() === '[BORROWERS]');
    const loanSectionStart = lines.findIndex(line => line.trim() === '[LOANS]');
    const paymentSectionStart = lines.findIndex(line => line.trim() === '[PAYMENTS]');
    
    // Validar que todas as seções estão presentes
    if (borrowerSectionStart === -1) {
      throw new Error("Seção [BORROWERS] não encontrada no arquivo CSV");
    }
    if (loanSectionStart === -1) {
      throw new Error("Seção [LOANS] não encontrada no arquivo CSV");
    }
    if (paymentSectionStart === -1) {
      throw new Error("Seção [PAYMENTS] não encontrada no arquivo CSV");
    }
    
    // Definir os índices de início corretos (pulando o cabeçalho da seção)
    const borrowerDataStart = borrowerSectionStart + 1;
    const loanDataStart = loanSectionStart + 1;
    const paymentDataStart = paymentSectionStart + 1;
    
    const borrowerSectionEnd = loanSectionStart - 1;
    const loanSectionEnd = paymentSectionStart - 1;
    
    // Parse borrowers
    const borrowerLines = lines.slice(borrowerDataStart, borrowerSectionEnd);
    
    // Verificar se existem linhas de mutuários
    if (borrowerLines.length === 0) {
      throw new Error("Nenhum dado de mutuário encontrado na seção [BORROWERS]");
    }
    
    const borrowerHeaders = borrowerLines[0].split(',').map(header => header.trim());
    const borrowerData = borrowerLines.slice(1);
    
    const importedBorrowers: BorrowerType[] = borrowerData
      .filter(line => line.trim() !== '') // Ignorar linhas vazias
      .map(line => {
        const values = line.split(',').map(val => val.trim());
        const borrower: any = {};
        
        borrowerHeaders.forEach((header, index) => {
          borrower[header] = values[index] || null; // Usar null para valores ausentes
        });
        
        return {
          id: borrower.id,
          name: borrower.name || '',
          email: borrower.email || null,
          phone: borrower.phone || null
        };
      })
      .filter(borrower => borrower.id && borrower.name); // Filtrar entradas sem ID ou nome
    
    // Parse loans
    const loanLines = lines.slice(loanDataStart, loanSectionEnd);
    
    // Verificar se existem linhas de contratos
    if (loanLines.length === 0) {
      throw new Error("Nenhum dado de contrato encontrado na seção [LOANS]");
    }
    
    const loanHeaders = loanLines[0].split(',').map(header => header.trim());
    const loanData = loanLines.slice(1);
    
    const importedLoans: LoanType[] = loanData
      .filter(line => line.trim() !== '') // Ignorar linhas vazias
      .map(line => {
        const values = line.split(',').map(val => val.trim());
        const loan: any = {};
        
        loanHeaders.forEach((header, index) => {
          if (header === 'principal' || header === 'interestRate') {
            loan[header] = parseFloat(values[index]) || 0;
          } else {
            loan[header] = values[index] || '';
          }
        });
        
        // Garantir que o status seja um valor válido
        if (!['active', 'paid', 'overdue', 'defaulted'].includes(loan.status)) {
          loan.status = 'active'; // Valor padrão
        }
        
        let paymentSchedule;
        try {
          if (loan.paymentSchedule) {
            // Remover aspas duplicadas que podem estar presentes em campos JSON
            const cleanPaymentSchedule = loan.paymentSchedule.replace(/""/g, '"');
            paymentSchedule = JSON.parse(cleanPaymentSchedule);
          }
        } catch (e) {
          console.warn("Erro ao analisar paymentSchedule:", e);
          paymentSchedule = undefined;
        }
        
        return {
          id: loan.id,
          borrowerId: loan.borrowerId,
          borrowerName: loan.borrowerName || '',
          principal: loan.principal || 0,
          interestRate: loan.interestRate || 0,
          issueDate: loan.issueDate || '',
          dueDate: loan.dueDate || '',
          status: loan.status,
          notes: loan.notes || null,
          paymentSchedule: paymentSchedule
        };
      })
      .filter(loan => loan.id && loan.borrowerId); // Filtrar entradas sem ID ou borrowerId
    
    // Parse payments
    const paymentLines = lines.slice(paymentDataStart);
    
    // Verificar se existem linhas de pagamentos
    if (paymentLines.length === 0) {
      throw new Error("Nenhum dado de pagamento encontrado na seção [PAYMENTS]");
    }
    
    const paymentHeaders = paymentLines[0].split(',').map(header => header.trim());
    const paymentData = paymentLines.slice(1);
    
    const importedPayments: PaymentType[] = paymentData
      .filter(line => line.trim() !== '') // Ignorar linhas vazias
      .map(line => {
        const values = line.split(',').map(val => val.trim());
        const payment: any = {};
        
        paymentHeaders.forEach((header, index) => {
          if (header === 'amount' || header === 'principal' || header === 'interest') {
            payment[header] = parseFloat(values[index]) || 0;
          } else {
            payment[header] = values[index] || '';
          }
        });
        
        return {
          id: payment.id,
          loanId: payment.loanId,
          date: payment.date || '',
          amount: payment.amount || 0,
          principal: payment.principal || 0,
          interest: payment.interest || 0,
          notes: payment.notes || null
        };
      })
      .filter(payment => payment.id && payment.loanId); // Filtrar entradas sem ID ou loanId
    
    return {
      importedBorrowers,
      importedLoans,
      importedPayments
    };
  } catch (error) {
    console.error("Erro ao analisar CSV:", error);
    throw error;
  }
}

/**
 * Generate a CSV string from application data
 */
export function generateCSV(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[]
): string {
  // Borrower section
  let csv = '[BORROWERS]\n';
  csv += 'id,name,email,phone\n';
  
  borrowers.forEach(borrower => {
    csv += `${borrower.id},${borrower.name},${borrower.email || ''},${borrower.phone || ''}\n`;
  });
  
  // Loan section
  csv += '\n[LOANS]\n';
  csv += 'id,borrowerId,borrowerName,principal,interestRate,issueDate,dueDate,status,notes,paymentSchedule\n';
  
  loans.forEach(loan => {
    const paymentScheduleString = loan.paymentSchedule 
      ? JSON.stringify(loan.paymentSchedule).replace(/"/g, '""') 
      : '';
    
    csv += `${loan.id},${loan.borrowerId},${loan.borrowerName},${loan.principal},${loan.interestRate},${loan.issueDate},${loan.dueDate},${loan.status},${loan.notes || ''},"${paymentScheduleString}"\n`;
  });
  
  // Payment section
  csv += '\n[PAYMENTS]\n';
  csv += 'id,loanId,date,amount,principal,interest,notes\n';
  
  payments.forEach(payment => {
    csv += `${payment.id},${payment.loanId},${payment.date},${payment.amount},${payment.principal},${payment.interest},${payment.notes || ''}\n`;
  });
  
  return csv;
}

/**
 * Download a string as a file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Create download URL
  const url = URL.createObjectURL(blob);
  
  // Setup download link
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add link, trigger download, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
