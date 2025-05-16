/**
 * Utilitários de criptografia para proteção de dados
 * 
 * Implementa funções para criptografar e descriptografar dados
 * usando a Web Crypto API do navegador. Todas as operações são
 * baseadas em AES-GCM para garantir confidencialidade e integridade.
 */

// Configurações de criptografia
const CRYPTO_ALGORITHM = 'AES-GCM';
const CRYPTO_KEY_LENGTH = 256;
const CRYPTO_IV_LENGTH = 12; // Tamanho do vetor de inicialização para AES-GCM

/**
 * Gera uma chave criptográfica a partir de uma senha
 * @param password Senha fornecida pelo usuário
 * @returns Chave criptográfica derivada da senha
 */
async function deriveKeyFromPassword(password: string): Promise<CryptoKey> {
  // Converter a senha para um formato que a API Crypto possa usar
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Usar PBKDF2 para derivar uma chave segura da senha
  const salt = encoder.encode('emprestimos-salt'); // Valor fixo para facilitar a decodificação
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derivar a chave AES da senha
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // Valor alto para dificultar ataques de força bruta
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: CRYPTO_ALGORITHM, length: CRYPTO_KEY_LENGTH },
    false, // Não extraível
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa dados usando AES-GCM
 * @param data Dados a serem criptografados
 * @param password Senha para criptografia
 * @returns String codificada em base64 contendo os dados criptografados
 */
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    // Derivar a chave da senha
    const key = await deriveKeyFromPassword(password);
    
    // Gerar um vetor de inicialização aleatório
    const iv = window.crypto.getRandomValues(new Uint8Array(CRYPTO_IV_LENGTH));
    
    // Criptografar os dados
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: CRYPTO_ALGORITHM,
        iv
      },
      key,
      dataBuffer
    );
    
    // Combinar IV e dados criptografados em um único array
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Converter para array e depois codificar em base64
    const bytes = [];
    for (let i = 0; i < result.length; i++) {
      bytes.push(String.fromCharCode(result[i]));
    }
    return btoa(bytes.join(''));
  } catch (error) {
    console.error('Erro ao criptografar dados:', error);
    throw new Error('Falha ao criptografar dados. Verifique a senha e tente novamente.');
  }
}

/**
 * Descriptografa dados usando AES-GCM
 * @param encryptedData Dados criptografados em formato base64
 * @param password Senha para descriptografia
 * @returns Dados originais descriptografados
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    // Derivar a chave da senha
    const key = await deriveKeyFromPassword(password);
    
    // Decodificar o base64 para obter os dados binários
    const binaryString = atob(encryptedData);
    const encryptedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      encryptedBytes[i] = binaryString.charCodeAt(i);
    }
    
    // Extrair o IV do início dos dados
    const iv = encryptedBytes.slice(0, CRYPTO_IV_LENGTH);
    
    // Extrair os dados criptografados
    const ciphertext = encryptedBytes.slice(CRYPTO_IV_LENGTH);
    
    // Descriptografar os dados
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: CRYPTO_ALGORITHM,
        iv
      },
      key,
      ciphertext
    );
    
    // Converter o buffer descriptografado para string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    throw new Error('Falha ao descriptografar dados. A senha está correta?');
  }
}

/**
 * Verifica se um texto é provavelmente criptografado
 * @param text Texto a ser verificado
 * @returns true se o texto parece estar criptografado
 */
export function isEncryptedData(text: string): boolean {
  // Verificar se o texto parece ser uma string em base64
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(text)) {
    return false;
  }
  
  try {
    // Tentar decodificar e verificar se tem o tamanho mínimo esperado (IV + algum conteúdo)
    const decodedLength = atob(text).length;
    return decodedLength > CRYPTO_IV_LENGTH + 16; // IV + pelo menos alguns bytes de dados
  } catch {
    return false;
  }
}

/**
 * Exibe um diálogo para solicitar senha do usuário
 * @param isDecrypting Indica se é para descriptografia (true) ou criptografia (false)
 * @returns Senha informada pelo usuário ou null se cancelado
 */
export function promptForPassword(isDecrypting: boolean = false): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const action = isDecrypting ? 'descriptografar' : 'criptografar';
      const password = window.prompt(`Digite sua senha para ${action} os dados:`);
      
      if (password === null || password.trim() === '') {
        // Usuário cancelou ou não digitou senha
        resolve(null);
      } else {
        resolve(password);
      }
    } catch (error) {
      console.error('Erro ao solicitar senha:', error);
      resolve(null);
    }
  });
}