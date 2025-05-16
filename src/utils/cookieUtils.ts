/**
 * Utilitários para manipulação de cookies
 * 
 * Este módulo fornece funções para salvar e recuperar configurações
 * em cookies do navegador
 */

// Chaves dos cookies que utilizamos
const KEYS = {
  AUTO_SYNC_ENABLED: 'loanbuddy_auto_sync_enabled',
  USE_ENCRYPTION: 'loanbuddy_use_encryption'
};

/**
 * Salva um valor em um cookie
 * @param key Nome do cookie
 * @param value Valor a ser salvo
 * @param days Dias de expiração (padrão: 365 dias)
 */
export function setCookie(key: string, value: string, days = 365): void {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${d.toUTCString()}`;
  
  // Configurações mais flexíveis para funcionar em ambientes de desenvolvimento
  document.cookie = `${key}=${value};${expires};path=/;SameSite=None;Secure`;
  
  // Log para depuração
  console.log(`Cookie definido: ${key}=${value}`);
  
  // Vamos salvar no localStorage também como backup
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

/**
 * Obtém o valor de um cookie
 * @param key Nome do cookie
 * @returns Valor do cookie ou null se não existir
 */
export function getCookie(key: string): string | null {
  // Primeiro tentamos obter do cookie
  const name = `${key}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      const value = c.substring(name.length, c.length);
      console.log(`Cookie encontrado: ${key}=${value}`);
      return value;
    }
  }
  
  // Se não encontrarmos no cookie, verificamos o localStorage como backup
  try {
    const localValue = localStorage.getItem(key);
    console.log(`LocalStorage para ${key}:`, localValue);
    if (localValue) {
      return localValue;
    }
  } catch (e) {
    console.error('Erro ao acessar localStorage:', e);
  }
  
  console.log(`Cookie/LocalStorage não encontrado: ${key}`);
  return null;
}

/**
 * Remove um cookie
 * @param key Nome do cookie
 */
export function removeCookie(key: string): void {
  // Remove do cookie
  document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=None;Secure`;
  
  // Remove também do localStorage
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Erro ao remover do localStorage:', e);
  }
  
  console.log(`Cookie/LocalStorage removido: ${key}`);
}

/**
 * Salva configuração de sincronização automática em cookie
 */
export function saveAutoSyncEnabled(enabled: boolean): void {
  setCookie(KEYS.AUTO_SYNC_ENABLED, enabled ? 'true' : 'false');
}

/**
 * Obtém configuração de sincronização automática do cookie
 */
export function getAutoSyncEnabled(): boolean {
  const value = getCookie(KEYS.AUTO_SYNC_ENABLED);
  console.log('Cookie autoSync:', value);
  return value === 'true';
}

/**
 * Salva configuração de uso de criptografia em cookie
 */
export function saveUseEncryption(enabled: boolean): void {
  setCookie(KEYS.USE_ENCRYPTION, enabled ? 'true' : 'false');
}

/**
 * Obtém configuração de uso de criptografia do cookie
 */
export function getUseEncryption(): boolean {
  const value = getCookie(KEYS.USE_ENCRYPTION);
  console.log('Cookie useEncryption:', value);
  return value === 'true';
}