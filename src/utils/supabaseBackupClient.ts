/**
 * Cliente para backups usando Supabase
 * 
 * Este módulo lida com armazenamento e recuperação de backups no Supabase,
 * permitindo sincronização de dados em nuvem e compartilhamento entre dispositivos.
 */

import { BorrowerType, LoanType, PaymentType, AppSettings } from '@/types';
import { backupSupabase, isBackupSupabaseConfigured } from '@/lib/backupSupabase';
import { encryptData, decryptData, promptForPassword } from './cryptoUtils';

import { BACKUP_CONFIG } from '@/config/backupConfig';

import { getCookie, setCookie } from './cookieUtils';

// Chaves para os cookies de configuração do Supabase
const COOKIE_KEYS = {
  SUPABASE_URL: 'loanbuddy_supabase_url',
  SUPABASE_ANON_KEY: 'loanbuddy_supabase_anon_key',
  SUPABASE_BUCKET: 'loanbuddy_supabase_bucket'
};

// Configurações para o Storage do Supabase
let BUCKET_NAME = getCookie(COOKIE_KEYS.SUPABASE_BUCKET) || 'loanbuddy';  // Nome do bucket da configuração
const DATA_FILE_NAME = 'loanbuddy_data.json';
const ENCRYPTED_DATA_FILE_NAME = 'loanbuddy_data_encrypted.json';
// Nomes de arquivos adicionais para verificar
const ADDITIONAL_DATA_FILES = [
  'loan_data_2023.json',
  'loanbuddy_backup_2025-05-13.json',
  'backups/loan_data_2023.json'  // Se estiver dentro da pasta "backups"
];

// Lista de nomes de bucket para tentar (em ordem de preferência) - primeiro tenta o configurado pelo usuário
const FALLBACK_BUCKETS = [getCookie(COOKIE_KEYS.SUPABASE_BUCKET) || 'load', 'loanbuddy', 'backups', 'storage', 'data', 'files'];

// Função para atualizar o nome do bucket (usado quando precisamos alternar para o bucket padrão)
function updateBucketName(newName: string) {
  console.log(`Alterando bucket de '${BUCKET_NAME}' para '${newName}'`);
  BUCKET_NAME = newName;
}

// Interface para os dados de backup
interface BackupData {
  borrowers: BorrowerType[];
  loans: LoanType[];
  payments: PaymentType[];
  settings?: AppSettings;
  lastSyncTime: string;
}

/**
 * Verifica se o Supabase de backup está disponível para uso
 * @returns true se o Supabase de backup estiver configurado e acessível
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  if (!isBackupSupabaseConfigured()) {
    console.warn('Supabase para backup não está configurado. Verifique as variáveis de ambiente ou configurações.');
    return false;
  }

  try {
    // Tentar acessar os buckets manualmente em vez de listar
    for (const bucketName of FALLBACK_BUCKETS) {
      try {
        console.log(`Verificando acesso direto ao bucket '${bucketName}'...`);
        const { data, error } = await backupSupabase!.storage.from(bucketName).list();
        
        if (!error) {
          console.log(`Bucket '${bucketName}' está acessível diretamente!`);
          updateBucketName(bucketName);
          return true;
        }
      } catch (err) {
        console.log(`Bucket '${bucketName}' não está acessível:`, err);
        // Continue verificando outros buckets
      }
    }
    
    // Se nenhum bucket estiver disponível diretamente, tentar outra abordagem
    // Verificar a conexão tentando listar os buckets
    const { data, error } = await backupSupabase!.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao verificar conexão com Supabase para backup:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do Supabase para backup:', error);
    return false;
  }
}

/**
 * Verifica se o bucket existe ou tenta usar algum dos buckets disponíveis
 * Tenta várias estratégias para encontrar ou criar um bucket utilizável
 * @returns true se pudermos prosseguir com operações de armazenamento
 */
export async function ensureBucketExists(): Promise<boolean> {
  if (!isBackupSupabaseConfigured()) return false;
  
  try {
    // Vamos usar uma abordagem diferente - tentar acessar diretamente 
    // cada bucket em vez de tentar criá-los
    
    // Usar o bucket configurado pelo usuário
    const userBucket = getCookie(COOKIE_KEYS.SUPABASE_BUCKET) || 'load';
    console.log(`Tentando usar diretamente o bucket '${userBucket}'...`);
    
    try {
      // Tentar listar conteúdo do bucket
      const { data, error } = await backupSupabase!.storage.from(userBucket).list();
      
      if (!error) {
        console.log(`Bucket '${userBucket}' está acessível!`);
        console.log(`Conteúdo do bucket:`, data.map(item => item.name).join(', '));
        updateBucketName(userBucket);
        // Atualizar o cookie para garantir consistência
        setCookie(COOKIE_KEYS.SUPABASE_BUCKET, userBucket);
        return true;
      } else {
        console.warn(`Erro ao acessar bucket '${userBucket}':`, error);
      }
    } catch (err) {
      console.error(`Erro ao acessar o bucket '${userBucket}':`, err);
    }
    
    // Se não conseguimos acessar o bucket específico, tentar outros buckets
    for (const bucketName of FALLBACK_BUCKETS) {
      if (bucketName === userBucket) continue; // Já tentamos este
      
      try {
        console.log(`Tentando acessar bucket alternativo '${bucketName}'...`);
        const { data, error } = await backupSupabase!.storage.from(bucketName).list();
        
        if (!error) {
          console.log(`Bucket '${bucketName}' está acessível!`);
          console.log(`Conteúdo do bucket:`, data.map(item => item.name).join(', '));
          updateBucketName(bucketName);
          // Atualizar o cookie para garantir consistência
          setCookie(COOKIE_KEYS.SUPABASE_BUCKET, bucketName);
          return true;
        } else {
          console.warn(`Erro ao acessar bucket '${bucketName}':`, error);
        }
      } catch (err) {
        console.error(`Erro ao acessar o bucket '${bucketName}':`, err);
      }
    }
    
    console.error('Não foi possível acessar nenhum bucket no Supabase. Verifique se o bucket foi criado manualmente e se as políticas de acesso estão configuradas corretamente.');
    return false;
  } catch (error) {
    console.error('Erro ao configurar bucket no Supabase para backup:', error);
    return false;
  }
}

/**
 * Salva os dados no Supabase usando o cliente de backup,
 * realizando um merge entre os dados existentes e os novos dados
 * para evitar perda de informações.
 * 
 * @param borrowers Lista de mutuários
 * @param loans Lista de empréstimos
 * @param payments Lista de pagamentos
 * @param settings Configurações do aplicativo
 * @param useEncryption Se deve criptografar os dados antes de salvar
 * @returns Um objeto contendo o status da operação e mensagem
 */
export async function saveDataToSupabase(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[],
  settings: AppSettings,
  useEncryption: boolean
): Promise<{ success: boolean; message: string }> {
  if (!isBackupSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase para backup não está configurado. Verifique as configurações.'
    };
  }
  
  try {
    // Garantir que o bucket existe
    const bucketExists = await ensureBucketExists();
    if (!bucketExists) {
      return {
        success: false,
        message: 'Não foi possível criar ou acessar o bucket de armazenamento no Supabase.'
      };
    }
    
    // NOVO: Primeiro carregar os dados existentes para fazer merge
    let existingData: BackupData | null = null;
    
    try {
      console.log('Carregando dados existentes do Supabase para realizar merge...');
      existingData = await loadDataFromSupabase(useEncryption);
      
      if (existingData) {
        console.log('Dados existentes encontrados no Supabase. Realizando merge...');
      } else {
        console.log('Nenhum dado existente encontrado no Supabase. Salvando apenas os dados atuais.');
      }
    } catch (loadError) {
      console.error('Erro ao carregar dados existentes do Supabase:', loadError);
      // Continuar o processo mesmo sem carregar os dados existentes
      console.log('Continuando com o salvamento sem fazer merge dos dados existentes.');
    }
    
    // Função auxiliar para mesclar arrays por ID
    function mergeById<T extends { id: string }>(localItems: T[], remoteItems: T[] = []): T[] {
      // Mapa de todos os itens por ID para fácil acesso
      const itemsMap = new Map<string, T>();
      
      // Adicionar primeiro os itens remotos ao mapa
      remoteItems.forEach(item => {
        itemsMap.set(item.id, item);
      });
      
      // Adicionar ou sobrescrever com itens locais
      // (consideramos itens locais mais recentes/atualizados)
      localItems.forEach(item => {
        itemsMap.set(item.id, item);
      });
      
      // Converter o mapa de volta para array
      return Array.from(itemsMap.values());
    }
    
    // Realizar merge dos dados (se existirem dados no Supabase)
    const mergedBorrowers = existingData ? mergeById(borrowers, existingData.borrowers) : borrowers;
    const mergedLoans = existingData ? mergeById(loans, existingData.loans) : loans;
    const mergedPayments = existingData ? mergeById(payments, existingData.payments) : payments;
    
    // Preparar os dados para salvar (com merge realizado)
    const backupData: BackupData = {
      borrowers: mergedBorrowers,
      loans: mergedLoans,
      payments: mergedPayments,
      settings: settings,
      lastSyncTime: new Date().toISOString()
    };
    
    // Log para debug
    const entityCounts = {
      local: {
        borrowers: borrowers.length,
        loans: loans.length,
        payments: payments.length
      },
      remote: existingData ? {
        borrowers: existingData.borrowers.length,
        loans: existingData.loans.length,
        payments: existingData.payments.length
      } : null,
      merged: {
        borrowers: mergedBorrowers.length,
        loans: mergedLoans.length,
        payments: mergedPayments.length
      }
    };
    
    console.log('Contagem de entidades para sincronização:', entityCounts);
    
    let dataToSave: string;
    let fileName: string;
    
    if (useEncryption) {
      // Solicitar senha para criptografia
      const password = await promptForPassword(true);
      if (!password) {
        return {
          success: false,
          message: 'Operação cancelada. É necessário fornecer uma senha para criptografar o backup.'
        };
      }
      
      // Criptografar os dados
      const encryptedData = await encryptData(JSON.stringify(backupData), password);
      dataToSave = JSON.stringify(encryptedData);
      fileName = ENCRYPTED_DATA_FILE_NAME;
    } else {
      dataToSave = JSON.stringify(backupData);
      fileName = DATA_FILE_NAME;
    }
    
    // Salvar o arquivo no Supabase Storage usando o cliente de backup
    const { error } = await backupSupabase!.storage
      .from(BUCKET_NAME)
      .upload(fileName, dataToSave, {
        cacheControl: '3600',
        upsert: true, // Sobrescrever, mas agora estamos enviando dados mesclados
        contentType: 'application/json'
      });
    
    if (error) {
      console.error('Erro ao salvar dados no Supabase (backup):', error);
      return {
        success: false,
        message: `Erro ao salvar dados no Supabase para backup: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: `Dados ${useEncryption ? 'criptografados e ' : ''}mesclados e salvos com sucesso no Supabase.`
    };
  } catch (error) {
    console.error('Erro ao salvar dados no Supabase (backup):', error);
    return {
      success: false,
      message: `Erro ao salvar dados no Supabase para backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Carrega os dados do Supabase usando o cliente de backup
 * @param useEncryption Se deve descriptografar os dados após carregar
 * @returns Os dados carregados ou null se houve erro
 */
export async function loadDataFromSupabase(
  useEncryption: boolean
): Promise<BackupData | null> {
  if (!isBackupSupabaseConfigured()) {
    console.warn('Supabase para backup não está configurado. Verifique as configurações.');
    return null;
  }
  
  try {
    // Verificar se o bucket existe
    const bucketExists = await ensureBucketExists();
    if (!bucketExists) {
      console.error('Bucket não encontrado no Supabase para backup');
      return null;
    }
    
    const fileName = useEncryption ? ENCRYPTED_DATA_FILE_NAME : DATA_FILE_NAME;
    
    // Verificar se o arquivo existe usando o cliente de backup
    const { data: fileExists, error: existsError } = await backupSupabase!.storage
      .from(BUCKET_NAME)
      .list();
    
    if (existsError) {
      console.error('Erro ao verificar existência do arquivo no backup:', existsError);
      return null;
    }
    
    // Verificar se algum dos arquivos conhecidos existe
    let fileToDownload = fileName;
    
    // Primeiro verificamos o arquivo padrão
    let fileFound = fileExists.some(file => file.name === fileName);
    
    // Depuração: mostrar todos os arquivos no bucket
    console.log("Todos os arquivos no bucket de backup:", fileExists.map(f => f.name).join(", "));
    
    // Se não encontramos o arquivo padrão, verificamos os arquivos adicionais
    if (!fileFound && !useEncryption) {
      for (const additionalFile of ADDITIONAL_DATA_FILES) {
        console.log(`Verificando arquivo alternativo: ${additionalFile}`);
        if (fileExists.some(file => file.name === additionalFile)) {
          console.log(`Arquivo alternativo encontrado: ${additionalFile}`);
          fileToDownload = additionalFile;
          fileFound = true;
          break;
        }
      }
      
      // Se ainda não encontramos, tentar procurar por correspondência parcial
      if (!fileFound) {
        for (const file of fileExists) {
          console.log(`Verificando se o arquivo ${file.name} contém 'json'...`);
          if (file.name.includes('.json')) {
            console.log(`Encontramos um arquivo JSON: ${file.name}`);
            fileToDownload = file.name;
            fileFound = true;
            break;
          }
        }
      }
      
      // Também verificar pasta backups usando o cliente de backup
      try {
        console.log("Verificando conteúdo da pasta 'backups'...");
        const { data: backupFolderFiles, error: folderError } = await backupSupabase!.storage
          .from(BUCKET_NAME)
          .list('backups');
          
        if (!folderError && backupFolderFiles.length > 0) {
          console.log("Arquivos na pasta 'backups':", backupFolderFiles.map(f => f.name).join(", "));
          
          for (const file of backupFolderFiles) {
            if (file.name.includes('.json')) {
              console.log(`Encontramos um arquivo JSON na pasta backups: ${file.name}`);
              fileToDownload = `backups/${file.name}`;
              fileFound = true;
              break;
            }
          }
        }
      } catch (folderErr) {
        console.log("Erro ao verificar pasta backups:", folderErr);
      }
    }
    
    if (!fileFound) {
      console.warn(`Nenhum arquivo de dados encontrado no Supabase para backup. Procurei por ${fileName} e outros arquivos alternativos.`);
      return null;
    }
    
    console.log(`Baixando arquivo ${fileToDownload} do Supabase para backup...`);
    
    // Fazer download do arquivo usando o cliente de backup
    const { data, error } = await backupSupabase!.storage
      .from(BUCKET_NAME)
      .download(fileToDownload);
    
    if (error) {
      console.error('Erro ao carregar dados do Supabase para backup:', error);
      return null;
    }
    
    // Converter o blob para texto
    const jsonText = await data.text();
    
    if (useEncryption) {
      // Solicitar senha para descriptografia
      const password = await promptForPassword(false);
      if (!password) {
        console.warn('Operação cancelada. Senha necessária para descriptografar o backup.');
        return null;
      }
      
      try {
        const encryptedData = JSON.parse(jsonText);
        const decryptedJson = await decryptData(encryptedData, password);
        return JSON.parse(decryptedJson);
      } catch (decryptError) {
        console.error('Erro ao descriptografar dados:', decryptError);
        throw new Error('Não foi possível descriptografar os dados. Senha incorreta ou dados corrompidos.');
      }
    } else {
      return JSON.parse(jsonText);
    }
  } catch (error) {
    console.error('Erro ao carregar dados do Supabase para backup:', error);
    return null;
  }
}

/**
 * Sincroniza os dados com o Supabase usando o cliente de backup
 * @param borrowers Lista de mutuários
 * @param loans Lista de empréstimos
 * @param payments Lista de pagamentos
 * @param settings Configurações do aplicativo
 * @param useEncryption Se deve criptografar os dados
 * @returns Um objeto contendo o status da operação e mensagem
 */
export async function syncWithSupabase(
  borrowers: BorrowerType[],
  loans: LoanType[],
  payments: PaymentType[],
  settings: AppSettings,
  useEncryption: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    // Primeiro salvar os dados atuais usando o cliente de backup
    const saveResult = await saveDataToSupabase(
      borrowers, 
      loans, 
      payments, 
      settings, 
      useEncryption
    );
    
    if (!saveResult.success) {
      return saveResult;
    }
    
    return {
      success: true,
      message: 'Sincronização com Supabase para backup completada com sucesso.'
    };
  } catch (error) {
    console.error('Erro na sincronização com Supabase para backup:', error);
    return {
      success: false,
      message: `Erro na sincronização com Supabase para backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}