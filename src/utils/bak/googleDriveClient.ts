/**
 * Cliente para integração com o Google Drive
 * 
 * Este módulo lida com a autenticação, upload, download e gerenciamento
 * de arquivos no Google Drive para armazenamento e sincronização de dados.
 */

import { BorrowerType, LoanType, PaymentType, AppSettings } from '@/types';
import { encryptData, decryptData, promptForPassword } from './cryptoUtils';

// Define tipos para gapi 
declare global {
  interface Window {
    gapi: any;
  }
}

// Acesso ao objeto gapi para uso em todo o módulo
const getGapi = () => {
  if (typeof window === 'undefined') return null;
  return window.gapi;
};

// Configurações para a API do Google Drive
// Escopo mais amplo para garantir acesso completo ao Drive
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const APP_FOLDER_NAME = 'LoanBuddy Dados';
const DATA_FILE_NAME = 'loanbuddy_data.json';
const ENCRYPTED_DATA_FILE_NAME = 'loanbuddy_data_encrypted.json';

// Interfaces para as estruturas de dados
interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

interface DriveData {
  borrowers: BorrowerType[];
  loans: LoanType[];
  payments: PaymentType[];
  settings?: AppSettings;
  lastSyncTime: string;
}

/**
 * Inicializa o cliente do Google Drive
 * @param clientId ID do cliente OAuth do Google
 * @returns Promise que resolve quando a inicialização estiver completa
 */
export async function initGoogleDriveClient(clientId: string): Promise<void> {
  try {
    // Importar gapi de forma assíncrona (para evitar problemas de SSR)
    const { gapi } = await import('gapi-script');
    
    // Atualizar window.gapi para que getGapi() funcione corretamente
    if (typeof window !== 'undefined') {
      window.gapi = gapi;
    }
    
    return new Promise((resolve, reject) => {
      gapi.load('client:auth2', () => {
        gapi.client.init({
          clientId,
          scope: DRIVE_SCOPE,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          // Especificar explicitamente a URL atual como URL de redirecionamento
          redirect_uri: window.location.origin + window.location.pathname,
          // Forçar a tela de consentimento para renovar o escopo
          prompt: 'consent'
        }).then(() => {
          console.log('Google API Client inicializado com sucesso');
          
          // Verificar se o usuário já está autenticado
          const authInstance = gapi.auth2.getAuthInstance();
          if (authInstance.isSignedIn.get()) {
            console.log('Usuário já autenticado, verificando escopo...');
            
            // Verificar se o token tem o escopo completo
            const currentUser = authInstance.currentUser.get();
            const scopes = currentUser.getGrantedScopes();
            console.log('Escopos concedidos:', scopes);
            
            // Se não tiver o escopo completo do Drive, fazer logout para forçar nova autenticação
            if (!scopes.includes('https://www.googleapis.com/auth/drive')) {
              console.log('Escopo insuficiente detectado. Fazendo logout para forçar nova autenticação...');
              authInstance.signOut().then(() => {
                console.log('Logout realizado. O usuário precisará fazer login novamente para conceder o escopo correto.');
              });
            }
          }
          
          resolve();
        }).catch((error: any) => {
          console.error('Erro ao inicializar Google API Client:', error);
          reject(error);
        });
      });
    });
  } catch (error) {
    console.error('Erro ao carregar biblioteca gapi:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário está autenticado com o Google
 * @returns true se o usuário estiver autenticado
 */
export function isSignedIn(): boolean {
  try {
    const gapi = getGapi();
    // Verificar se o gapi está disponível
    if (!gapi || !gapi.auth2) {
      console.warn('Google API não está inicializada');
      return false;
    }
    
    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error);
    return false;
  }
}

/**
 * Realiza o login com a conta Google
 * @returns Promise que resolve quando o login for bem-sucedido
 */
export async function signIn(): Promise<void> {
  try {
    const gapi = getGapi();
    if (!gapi || !gapi.auth2) {
      throw new Error('Google API não está inicializada');
    }
    
    const authInstance = gapi.auth2.getAuthInstance();
    
    // Verificar se já está autenticado
    const isSignedIn = authInstance.isSignedIn.get();
    if (isSignedIn) {
      console.log('Usuário já está autenticado com o Google');
      return;
    }
    
    // Configurar opções para redirecionar em vez de popup
    const signInOptions = {
      // Usar a URL atual como URI de redirecionamento
      redirect_uri: window.location.origin + window.location.pathname,
      // Permitir que o usuário selecione as permissões que deseja conceder
      prompt: 'consent',
      // Usar redirecionamento em vez de popup
      ux_mode: 'redirect'
    };
    
    console.log('Iniciando autenticação via redirecionamento...');
    
    // Definir tipos para a resposta do Google
    interface GoogleAuthResponse {
      code: string;
    }
    
    // Configurar opções de autenticação para garantir escopo completo
    const authOptions = {
      scope: DRIVE_SCOPE,
      prompt: 'consent', // Sempre mostrar a tela de consentimento
      redirect_uri: window.location.origin + window.location.pathname,
      access_type: 'offline', // Solicitar token de atualização
      include_granted_scopes: true // Incluir todos os escopos previamente concedidos
    };

    // Em vez de usar o método de popup, vamos gerar uma URL de autenticação e redirecionar
    try {
      console.log('Solicitando autenticação com escopo completo do Drive:', DRIVE_SCOPE);
      
      // Tentar primeiro o método de acesso offline (código para token)
      const authResponse = await authInstance.grantOfflineAccess(authOptions);
      console.log('Login com Google realizado com sucesso (offline access):', authResponse);
      
      // Verificar novamente se o usuário está logado
      if (authInstance.isSignedIn.get()) {
        console.log('Usuário confirmado como autenticado');
        
        // Verificar se o escopo concedido inclui o escopo completo do Drive
        const currentUser = authInstance.currentUser.get();
        const scopes = currentUser.getGrantedScopes();
        console.log('Escopos concedidos:', scopes);
        
        if (!scopes.includes(DRIVE_SCOPE)) {
          console.warn('Aviso: O escopo concedido não inclui o escopo completo do Drive. Pode haver problemas de permissão.');
          
          // Tentar novamente com login completo para garantir o escopo
          await authInstance.signIn(authOptions);
        }
      } else {
        console.log('Autenticação offline completa mas usuário não aparece como logado, tentando login completo...');
        await authInstance.signIn(authOptions);
      }
    } catch (error) {
      console.error('Erro durante a autenticação:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Erro ao fazer login com o Google:', error);
    throw error;
  }
}

/**
 * Realiza o logout da conta Google
 */
export async function signOut(): Promise<void> {
  try {
    const gapi = getGapi();
    if (!gapi || !gapi.auth2) {
      throw new Error('Google API não está inicializada');
    }
    
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();
    console.log('Logout do Google realizado com sucesso');
  } catch (error) {
    console.error('Erro ao fazer logout do Google:', error);
    throw error;
  }
}

/**
 * Busca a pasta de dados do aplicativo no Drive, criando-a se não existir
 * @returns ID da pasta
 */
export async function getAppFolder(): Promise<string> {
  try {
    const gapi = getGapi();
    if (!gapi || !gapi.client || !gapi.client.drive) {
      throw new Error('Google Drive API não está inicializada');
    }
    
    // Buscar pasta existente
    const response = await gapi.client.drive.files.list({
      q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    // Se a pasta já existir, retorna o ID
    if (response.result.files && response.result.files.length > 0) {
      console.log('Pasta do aplicativo encontrada:', response.result.files[0].id);
      return response.result.files[0].id;
    }
    
    // Se não existir, cria uma nova pasta
    const folderResponse = await gapi.client.drive.files.create({
      resource: {
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    
    console.log('Nova pasta do aplicativo criada:', folderResponse.result.id);
    return folderResponse.result.id;
  } catch (error) {
    console.error('Erro ao buscar/criar pasta do aplicativo:', error);
    throw error;
  }
}

/**
 * Busca o arquivo de dados no Drive
 * @param folderId ID da pasta onde o arquivo está
 * @param encrypted Se true, busca o arquivo criptografado
 * @returns Informações do arquivo ou null se não encontrado
 */
export async function findDataFile(folderId: string, encrypted: boolean = false): Promise<DriveFileInfo | null> {
  try {
    const gapi = getGapi();
    if (!gapi || !gapi.client || !gapi.client.drive) {
      throw new Error('Google Drive API não está inicializada');
    }
    
    const fileName = encrypted ? ENCRYPTED_DATA_FILE_NAME : DATA_FILE_NAME;
    
    const response = await gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime)'
    });
    
    if (response.result.files && response.result.files.length > 0) {
      console.log(`Arquivo ${fileName} encontrado:`, response.result.files[0].id);
      return response.result.files[0] as DriveFileInfo;
    }
    
    console.log(`Arquivo ${fileName} não encontrado no Google Drive`);
    return null;
  } catch (error) {
    console.error('Erro ao buscar arquivo de dados:', error);
    throw error;
  }
}

/**
 * Lê o conteúdo de um arquivo do Drive
 * @param fileId ID do arquivo
 * @returns Conteúdo do arquivo como string
 */
export async function readFileContent(fileId: string): Promise<string> {
  try {
    const gapi = getGapi();
    if (!gapi || !gapi.client || !gapi.client.drive) {
      throw new Error('Google Drive API não está inicializada');
    }
    
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    
    return response.body;
  } catch (error) {
    console.error('Erro ao ler conteúdo do arquivo:', error);
    throw error;
  }
}

/**
 * Cria ou atualiza um arquivo no Drive
 * @param folderId ID da pasta onde o arquivo deve ser salvo
 * @param fileName Nome do arquivo
 * @param content Conteúdo do arquivo
 * @param fileId ID do arquivo existente (se for atualização)
 * @returns ID do arquivo criado/atualizado
 */
export async function saveFile(
  folderId: string, 
  fileName: string, 
  content: string,
  fileId?: string
): Promise<string> {
  try {
    const gapi = getGapi();
    if (!gapi || !gapi.auth) {
      throw new Error('Google API não está inicializada');
    }
    
    const metadata = {
      name: fileName,
      mimeType: 'application/json'
    };
    
    // Se for uma atualização, não incluir a pasta pai
    if (!fileId) {
      // @ts-ignore - O tipo é incompatível, mas a API funciona corretamente
      metadata.parents = [folderId];
    }
    
    const blob = new Blob([content], { type: 'application/json' });
    
    // Criar FormData para upload
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    
    // Obter token de acesso
    const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
    
    let url = 'https://www.googleapis.com/upload/drive/v3/files';
    let method = 'POST';
    
    // Se for atualização, usar método PATCH e incluir o ID na URL
    if (fileId) {
      url = `${url}/${fileId}`;
      method = 'PATCH';
    }
    
    // Adicionar parâmetros à URL
    url += '?uploadType=multipart';
    
    // Fazer a requisição de upload
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao salvar arquivo: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Arquivo salvo com sucesso:', result.id);
    return result.id;
  } catch (error) {
    console.error('Erro ao salvar arquivo no Drive:', error);
    throw error;
  }
}

/**
 * Salva os dados no Google Drive
 * @param borrowers Lista de mutuários
 * @param loans Lista de empréstimos
 * @param payments Lista de pagamentos
 * @param settings Configurações da aplicação
 * @param encrypt Se true, criptografa os dados antes de salvar
 * @returns Promise que resolve quando o salvamento for bem-sucedido
 */
export async function saveDataToDrive(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[],
  settings?: AppSettings,
  encrypt: boolean = false
): Promise<void> {
  try {
    if (!isSignedIn()) {
      await signIn();
    }
    
    // Obter a pasta do aplicativo
    const folderId = await getAppFolder();
    
    // Preparar os dados
    const data: DriveData = {
      borrowers,
      loans,
      payments,
      settings,
      lastSyncTime: new Date().toISOString()
    };
    
    // Converter para JSON
    let jsonContent = JSON.stringify(data, null, 2);
    let fileName = DATA_FILE_NAME;
    
    // Se for criptografado, solicitar senha e criptografar
    if (encrypt) {
      const password = await promptForPassword(false);
      if (!password) {
        throw new Error('Operação cancelada pelo usuário');
      }
      
      jsonContent = await encryptData(jsonContent, password);
      fileName = ENCRYPTED_DATA_FILE_NAME;
    }
    
    // Verificar se o arquivo já existe
    const existingFile = await findDataFile(folderId, encrypt);
    
    // Salvar o arquivo (criar novo ou atualizar existente)
    if (existingFile) {
      await saveFile(folderId, fileName, jsonContent, existingFile.id);
    } else {
      await saveFile(folderId, fileName, jsonContent);
    }
    
    console.log('Dados salvos no Google Drive com sucesso');
  } catch (error) {
    console.error('Erro ao salvar dados no Google Drive:', error);
    throw error;
  }
}

/**
 * Carrega os dados do Google Drive
 * @param encrypt Se true, tenta carregar o arquivo criptografado
 * @returns Dados carregados do Drive ou null se não encontrados/erro
 */
export async function loadDataFromDrive(encrypt: boolean = false): Promise<DriveData | null> {
  try {
    if (!isSignedIn()) {
      await signIn();
    }
    
    // Obter a pasta do aplicativo
    const folderId = await getAppFolder();
    
    // Buscar o arquivo
    const file = await findDataFile(folderId, encrypt);
    if (!file) {
      console.log('Arquivo de dados não encontrado no Drive');
      return null;
    }
    
    // Ler o conteúdo do arquivo
    const content = await readFileContent(file.id);
    
    // Se for criptografado, descriptografar
    if (encrypt) {
      const password = await promptForPassword(true);
      if (!password) {
        throw new Error('Operação cancelada pelo usuário');
      }
      
      const decryptedContent = await decryptData(content, password);
      return JSON.parse(decryptedContent) as DriveData;
    }
    
    // Retornar os dados
    return JSON.parse(content) as DriveData;
  } catch (error) {
    console.error('Erro ao carregar dados do Google Drive:', error);
    return null;
  }
}

/**
 * Sincroniza os dados locais com o Google Drive
 * @param borrowers Lista de mutuários
 * @param loans Lista de empréstimos
 * @param payments Lista de pagamentos
 * @param settings Configurações da aplicação
 * @param encryptedSync Se true, usa o arquivo criptografado
 * @returns Resultado da sincronização
 */
export async function syncWithGoogleDrive(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[],
  settings?: AppSettings,
  encryptedSync: boolean = false
): Promise<{success: boolean, message: string}> {
  try {
    if (!isSignedIn()) {
      await signIn();
    }
    
    // Salvar os dados atuais no Drive
    await saveDataToDrive(borrowers, loans, payments, settings, encryptedSync);
    
    return {
      success: true,
      message: `Sincronização ${encryptedSync ? 'criptografada' : ''} com Google Drive concluída com sucesso`
    };
  } catch (error) {
    console.error('Erro ao sincronizar com Google Drive:', error);
    return {
      success: false,
      message: `Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}