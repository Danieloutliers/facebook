import { BorrowerType, LoanType, PaymentType, AppSettings } from '@/types';
import { downloadCSV } from './csvHelpers';
import { encryptData, decryptData, promptForPassword, isEncryptedData } from './cryptoUtils';

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
 * Estrutura para backup criptografado
 */
export interface EncryptedBackupData {
  version: string;
  encrypted: boolean;
  timestamp: string;
  data: string; // Dados criptografados em formato base64
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
 * Verifica se um arquivo de backup está criptografado
 */
export function isEncryptedBackup(backupData: any): boolean {
  return (
    backupData &&
    typeof backupData === 'object' &&
    backupData.encrypted === true &&
    typeof backupData.data === 'string' &&
    backupData.version?.includes('encrypted')
  );
}

/**
 * Valida um arquivo de backup antes da restauração
 * Suporta tanto backups normais quanto criptografados
 */
export function validateBackup(backupData: any): { valid: boolean; errors: string[]; encrypted: boolean } {
  const errors: string[] = [];
  
  // Verificar se é um objeto
  if (!backupData || typeof backupData !== 'object') {
    errors.push('O arquivo de backup não contém um objeto JSON válido');
    return { valid: false, errors, encrypted: false };
  }
  
  // Verificar se é um backup criptografado
  if (isEncryptedBackup(backupData)) {
    // Para backups criptografados, só podemos verificar a estrutura básica
    // A validação completa só será possível após a descriptografia
    if (!backupData.data || typeof backupData.data !== 'string') {
      errors.push('O backup criptografado não contém dados válidos');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      encrypted: true
    };
  }
  
  // Se não for criptografado, procede com a validação normal
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
    errors,
    encrypted: false
  };
}

/**
 * Descriptografa um backup criptografado
 * @param encryptedBackup Dados de backup criptografados
 * @param password Senha para descriptografia
 * @returns Dados de backup descriptografados
 */
export async function decryptBackup(
  encryptedBackup: EncryptedBackupData, 
  password: string
): Promise<BackupData> {
  try {
    // Verificar se é realmente um backup criptografado
    if (!isEncryptedBackup(encryptedBackup)) {
      throw new Error('O arquivo fornecido não é um backup criptografado válido');
    }
    
    // Descriptografar os dados
    const decryptedJson = await decryptData(encryptedBackup.data, password);
    
    // Converter para objeto
    const backupData = JSON.parse(decryptedJson) as BackupData;
    
    // Validar o backup descriptografado
    const validation = validateBackup(backupData);
    if (!validation.valid) {
      throw new Error(`Backup inválido após descriptografia: ${validation.errors.join(', ')}`);
    }
    
    return backupData;
  } catch (error) {
    console.error('Erro ao descriptografar backup:', error);
    throw new Error('Falha ao descriptografar o backup. A senha está correta?');
  }
}

/**
 * Salva o backup em arquivo JSON (com ou sem criptografia) e faz o download
 * 
 * @param backupData Dados de backup a serem salvos
 * @param encryptBackup Se true, solicita senha para criptografar os dados
 */
export async function downloadBackup(backupData: BackupData, encryptBackup: boolean = false): Promise<void> {
  try {
    let jsonString = JSON.stringify(backupData, null, 2);
    let contentType = 'application/json';
    let filenameSuffix = '';
    
    // Se solicitada criptografia, solicita senha e criptografa
    if (encryptBackup) {
      const password = await promptForPassword(false);
      
      // Se o usuário cancelou, não continua
      if (!password) {
        console.log('Operação de backup criptografado cancelada pelo usuário');
        return;
      }
      
      // Criptografa os dados
      const encryptedData = await encryptData(jsonString, password);
      
      // Cria estrutura de backup criptografado
      const encryptedBackup: EncryptedBackupData = {
        version: '1.0-encrypted',
        encrypted: true,
        timestamp: new Date().toISOString(),
        data: encryptedData
      };
      
      // Substitui os dados pelo formato criptografado
      jsonString = JSON.stringify(encryptedBackup, null, 2);
      filenameSuffix = '_encrypted';
    }
    
    // Cria o blob para download
    const blob = new Blob([jsonString], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    // Nome do arquivo com data em formato legível
    const date = new Date().toISOString().split('T')[0];
    const filename = `loanbuddy_backup_${date}${filenameSuffix}.json`;
    
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
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    throw new Error('Falha ao criar o backup. Por favor, tente novamente.');
  }
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
