/**
 * Utilitários para logs detalhados na aplicação
 */

// Estilos para logs no console
const LOG_STYLES = {
  header: 'font-size: 14px; font-weight: bold; color: #0066cc; background: #e6f2ff; padding: 2px 5px; border-radius: 3px;',
  success: 'color: #00875A; font-weight: bold;',
  error: 'color: #DE350B; font-weight: bold;',
  warning: 'color: #FF8B00; font-weight: bold;',
  info: 'color: #0068D9; font-weight: bold;',
  data: 'color: #403294; font-style: italic;',
  separator: 'color: #888; font-weight: bold;'
};

/**
 * Registra início de uma operação importante
 * @param operationName Nome da operação
 */
export function logOperationStart(operationName: string): void {
  console.group(`%c🚀 INÍCIO: ${operationName}`, LOG_STYLES.header);
  console.log(`%c⏱️ Iniciado em: ${new Date().toLocaleTimeString()}`, LOG_STYLES.info);
}

/**
 * Registra fim bem-sucedido de uma operação
 * @param operationName Nome da operação
 * @param stats Estatísticas opcionais para mostrar
 */
export function logOperationSuccess(operationName: string, stats?: Record<string, any>): void {
  console.log(`%c✅ ${operationName} concluído com sucesso`, LOG_STYLES.success);
  
  if (stats) {
    console.log('%c📊 Estatísticas:', LOG_STYLES.info);
    console.table(stats);
  }
  
  console.log(`%c⏱️ Finalizado em: ${new Date().toLocaleTimeString()}`, LOG_STYLES.info);
  console.groupEnd();
}

/**
 * Registra falha em uma operação
 * @param operationName Nome da operação
 * @param error Objeto de erro
 */
export function logOperationError(operationName: string, error: any): void {
  console.log(`%c❌ ERRO em ${operationName}:`, LOG_STYLES.error);
  
  if (error instanceof Error) {
    console.log(`%c📃 Mensagem: ${error.message}`, LOG_STYLES.error);
    console.log(`%c📃 Stack: ${error.stack}`, LOG_STYLES.data);
  } else {
    console.log(`%c📃 Detalhes do erro:`, LOG_STYLES.error, error);
  }
  
  console.log(`%c⏱️ Erro em: ${new Date().toLocaleTimeString()}`, LOG_STYLES.info);
  console.groupEnd();
}

/**
 * Cria uma seção separadora em logs
 * @param sectionName Nome da seção
 */
export function logSection(sectionName: string): void {
  console.log(`%c${'='.repeat(20)} ${sectionName} ${'='.repeat(20)}`, LOG_STYLES.separator);
}

/**
 * Registra um item com sucesso
 * @param message Mensagem de sucesso
 * @param data Dados opcionais
 */
export function logSuccess(message: string, data?: any): void {
  console.log(`%c✅ ${message}`, LOG_STYLES.success);
  if (data !== undefined) {
    console.log('%c📃 Dados:', LOG_STYLES.data, data);
  }
}

/**
 * Registra um aviso
 * @param message Mensagem de aviso
 * @param data Dados opcionais
 */
export function logWarning(message: string, data?: any): void {
  console.log(`%c⚠️ ${message}`, LOG_STYLES.warning);
  if (data !== undefined) {
    console.log('%c📃 Dados:', LOG_STYLES.data, data);
  }
}

/**
 * Registra informação
 * @param message Mensagem informativa
 * @param data Dados opcionais
 */
export function logInfo(message: string, data?: any): void {
  console.log(`%c📌 ${message}`, LOG_STYLES.info);
  if (data !== undefined) {
    console.log('%c📃 Dados:', LOG_STYLES.data, data);
  }
}

/**
 * Registra erro
 * @param message Mensagem de erro
 * @param data Dados opcionais
 */
export function logError(message: string, data?: any): void {
  console.log(`%c❌ ${message}`, LOG_STYLES.error);
  if (data !== undefined) {
    console.log('%c📃 Dados:', LOG_STYLES.data, data);
  }
}

/**
 * Registra estatísticas de importação/exportação
 * @param stats Estatísticas a serem mostradas
 */
export function logImportExportStats(stats: {
  format: string;
  borrowers: number;
  loans: number;
  payments: number;
  invalidLoans?: number;
  invalidPayments?: number;
}): void {
  logSection('ESTATÍSTICAS');
  
  console.log(`%c📊 Resumo da operação (${stats.format}):`, LOG_STYLES.info);
  console.table({
    "Mutuários": stats.borrowers,
    "Contratos": stats.loans,
    "Pagamentos": stats.payments,
    "Contratos inválidos": stats.invalidLoans || 0,
    "Pagamentos inválidos": stats.invalidPayments || 0
  });
}

/**
 * Registra detalhes de validação de dados
 * @param validationResults Resultados da validação
 */
export function logDataValidation(validationResults: {
  borrowerIds: number;
  loanIds: number;
  invalidLoans: Array<{ id: string, borrowerId: string }>;
  invalidPayments: Array<{ id: string, loanId: string }>;
}): void {
  logSection('VALIDAÇÃO DE INTEGRIDADE');
  
  logInfo(`${validationResults.borrowerIds} IDs de mutuários distintos encontrados`);
  logInfo(`${validationResults.loanIds} IDs de contratos distintos encontrados`);
  
  if (validationResults.invalidLoans.length === 0) {
    logSuccess('Todos os contratos referenciam mutuários válidos');
  } else {
    logWarning(`${validationResults.invalidLoans.length} contratos referenciam mutuários inexistentes:`);
    validationResults.invalidLoans.forEach(loan => {
      console.log(`  - Contrato ID ${loan.id} referencia mutuário inexistente ${loan.borrowerId}`);
    });
  }
  
  if (validationResults.invalidPayments.length === 0) {
    logSuccess('Todos os pagamentos referenciam contratos válidos');
  } else {
    logWarning(`${validationResults.invalidPayments.length} pagamentos referenciam contratos inexistentes:`);
    validationResults.invalidPayments.forEach(payment => {
      console.log(`  - Pagamento ID ${payment.id} referencia contrato inexistente ${payment.loanId}`);
    });
  }
}
