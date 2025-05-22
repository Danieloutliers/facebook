import { BorrowerType, LoanType, PaymentType, AppSettings } from '@/types';
import { downloadCSV } from './csvHelpers';

/**
 * Estrutura de dados para o arquivo de backup
 */
export interface BackupData {
  version: string;
  timestamp: string;
  description?: string;
  borrowers: BorrowerType[];
  loans: LoanType[];
  payments: PaymentType[];
  settings: AppSettings;
}

/**
 * Gera um arquivo de backup em formato JSON com todos os dados da aplicação
 */
export function createBackup(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[],
  settings: AppSettings,
  description?: string
): BackupData {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    description: description || `Backup manual - ${new Date().toLocaleString()}`,
    borrowers,
    loans,
    payments,
    settings
  };
}

/**
 * Valida um arquivo de backup antes da restauração
 */
export function validateBackup(backupData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar se é um objeto
  if (!backupData || typeof backupData !== 'object') {
    errors.push('O arquivo de backup não contém um objeto JSON válido');
    return { valid: false, errors };
  }

  // Verificar a versão
  if (!backupData.version) {
    errors.push('O arquivo de backup não contém informação de versão');
  }

  // Verificar a presença de dados essenciais
  if (!Array.isArray(backupData.borrowers)) {
    errors.push('O arquivo de backup não contém lista de mutuários válida');
  }

  if (!Array.isArray(backupData.loans)) {
    errors.push('O arquivo de backup não contém lista de empréstimos válida');
  }

  if (!Array.isArray(backupData.payments)) {
    errors.push('O arquivo de backup não contém lista de pagamentos válida');
  }

  if (!backupData.settings || typeof backupData.settings !== 'object') {
    errors.push('O arquivo de backup não contém configurações válidas');
  }

  // Verificar consistência básica dos dados
  if (Array.isArray(backupData.loans) && Array.isArray(backupData.borrowers)) {
    for (const loan of backupData.loans) {
      if (!loan.borrowerId) {
        errors.push(`Empréstimo ${loan.id} não possui mutuário associado`);
        continue;
      }
      
      const borrowerExists = backupData.borrowers.some((b: BorrowerType) => b.id === loan.borrowerId);
      if (!borrowerExists) {
        errors.push(`Empréstimo ${loan.id} referencia um mutuário inexistente (${loan.borrowerId})`);
      }
    }
  }

  if (Array.isArray(backupData.payments) && Array.isArray(backupData.loans)) {
    for (const payment of backupData.payments) {
      if (!payment.loanId) {
        errors.push(`Pagamento ${payment.id} não possui empréstimo associado`);
        continue;
      }
      
      const loanExists = backupData.loans.some((l: LoanType) => l.id === payment.loanId);
      if (!loanExists) {
        errors.push(`Pagamento ${payment.id} referencia um empréstimo inexistente (${payment.loanId})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Salva o backup em arquivo JSON e faz o download
 */
export function downloadBackup(backupData: BackupData): void {
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Nome do arquivo com data em formato legível
  const date = new Date().toISOString().split('T')[0];
  const filename = `loanbuddy_backup_${date}.json`;
  
  // Criar link temporário para download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Limpar recursos
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exporta os dados para CSV para compatibilidade com versões anteriores
 */
export function exportToCsv(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[]
): void {
  // Esta função utiliza a implementação existente de CSV
  const csvData = generateCsvFromData(borrowers, loans, payments);
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csvData, `loanbuddy_export_${date}.csv`);
}

/**
 * Função auxiliar para gerar conteúdo CSV
 * (Esta é uma implementação temporária, idealmente usando a função já existente no sistema)
 */
function generateCsvFromData(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[]
): string {
  // Implementação simplificada, idealmente deve-se usar a função existente no sistema
  let csvContent = '[BORROWERS]\n';
  csvContent += 'id,name,email,phone\n';
  
  borrowers.forEach(borrower => {
    csvContent += `${borrower.id},${borrower.name},${borrower.email || ''},${borrower.phone || ''}\n`;
  });
  
  csvContent += '\n[LOANS]\n';
  csvContent += 'id,borrowerId,borrowerName,principal,interestRate,issueDate,dueDate,status,notes\n';
  
  loans.forEach(loan => {
    csvContent += `${loan.id},${loan.borrowerId},${loan.borrowerName},${loan.principal},${loan.interestRate},${loan.issueDate},${loan.dueDate},${loan.status},${loan.notes || ''}\n`;
  });
  
  csvContent += '\n[PAYMENTS]\n';
  csvContent += 'id,loanId,date,amount,principal,interest,notes\n';
  
  payments.forEach(payment => {
    csvContent += `${payment.id},${payment.loanId},${payment.date},${payment.amount},${payment.principal},${payment.interest},${payment.notes || ''}\n`;
  });
  
  return csvContent;
}

// Funções fictícias para compatibilidade - não fazem nada por não usar mais localStorage
export function saveAutoBackup(): void {
  console.log('Sistema de backup automático desativado. Dados não persistidos.');
}

export function getAutoBackupsList(): { key: string; timestamp: Date; description: string }[] {
  console.log('Sistema de backup automático desativado. Dados não persistidos.');
  return [];
}

export function restoreFromAutoBackup(): BackupData | null {
  console.log('Sistema de backup automático desativado. Dados não persistidos.');
  return null;
}
