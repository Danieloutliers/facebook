import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Database, Save } from 'lucide-react';
import { SUPABASE_CONFIG } from '@/config/supabaseConfig';
import { getCookie, setCookie } from '@/utils/cookieUtils';

interface SupabaseConfigState {
  url: string;
  anonKey: string;
  bucketName: string;
}

const COOKIE_KEYS = {
  SUPABASE_URL: 'loanbuddy_supabase_url',
  SUPABASE_ANON_KEY: 'loanbuddy_supabase_anon_key',
  SUPABASE_BUCKET: 'loanbuddy_supabase_bucket',
};

export default function SupabaseConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<SupabaseConfigState>({
    url: '',
    anonKey: '',
    bucketName: '',
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (SUPABASE_CONFIG.forceUseDefaultCredentials) {
      setConfig({
        url: SUPABASE_CONFIG.url || '',
        anonKey: SUPABASE_CONFIG.anonKey || '',
        bucketName: SUPABASE_CONFIG.bucketName || 'loanbuddy',
      });
    } else {
      const urlFromCookie = getCookie(COOKIE_KEYS.SUPABASE_URL);
      const anonKeyFromCookie = getCookie(COOKIE_KEYS.SUPABASE_ANON_KEY);
      const bucketFromCookie = getCookie(COOKIE_KEYS.SUPABASE_BUCKET);

      setConfig({
        url: urlFromCookie || '',
        anonKey: anonKeyFromCookie || '',
        bucketName: bucketFromCookie || 'loanbuddy',
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleClearCookies = () => {
    document.cookie = `${COOKIE_KEYS.SUPABASE_URL}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${COOKIE_KEYS.SUPABASE_ANON_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${COOKIE_KEYS.SUPABASE_BUCKET}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    localStorage.removeItem(COOKIE_KEYS.SUPABASE_URL);
    localStorage.removeItem(COOKIE_KEYS.SUPABASE_ANON_KEY);
    localStorage.removeItem(COOKIE_KEYS.SUPABASE_BUCKET);

    setConfig({
      url: '',
      anonKey: '',
      bucketName: 'loanbuddy',
    });

    toast({
      title: 'Configurações resetadas',
      description: 'Todas as configurações do Supabase foram apagadas. Você pode inserir novas credenciais agora.',
    });
  };

  const handleSave = () => {
    if (SUPABASE_CONFIG.forceUseDefaultCredentials) {
      toast({
        title: 'Configuração bloqueada',
        description: 'O sistema está configurado para usar apenas as credenciais definidas no código. Entre em contato com o administrador para alterar.',
        variant: 'default',
      });
      setOpen(false);
      return;
    }

    if (!config.url || !config.anonKey || !config.bucketName) {
      toast({
        title: 'Configuração incompleta',
        description: 'Por favor, preencha todos os campos para configurar o Supabase.',
        variant: 'destructive',
      });
      return;
    }

    handleClearCookies();

    try {
      new URL(config.url);
    } catch (e) {
      toast({
        title: 'URL inválida',
        description: 'A URL fornecida não é válida. Exemplo correto: https://seu-projeto.supabase.co',
        variant: 'destructive',
      });
      return;
    }

    setCookie(COOKIE_KEYS.SUPABASE_URL, config.url);
    setCookie(COOKIE_KEYS.SUPABASE_ANON_KEY, config.anonKey);
    setCookie(COOKIE_KEYS.SUPABASE_BUCKET, config.bucketName);

    toast({
      title: 'Configurações salvas',
      description: 'As configurações do Supabase foram salvas com sucesso. Recarregue a página para aplicar as mudanças.',
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <Settings className="h-3.5 w-3.5" />
          <span>Configurar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-500" />
            Configurar Supabase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {SUPABASE_CONFIG.forceUseDefaultCredentials ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-blue-800 dark:text-blue-300 text-sm mb-4">
              <p className="font-medium">Modo gerenciado pelo sistema</p>
              <p className="mt-1">O sistema está configurado para usar apenas as credenciais definidas pelo administrador. Os campos abaixo são apenas para visualização.</p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-amber-800 dark:text-amber-300 text-sm mb-4">
              <p>
                Para obter suas credenciais, acesse o
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline mx-1"
                >
                  Painel do Supabase
                </a>
                e vá para Settings → API.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="url">URL do Projeto</Label>
            <Input
              id="url"
              name="url"
              placeholder="https://seu-projeto.supabase.co"
              value={config.url}
              onChange={handleChange}
              disabled={SUPABASE_CONFIG.forceUseDefaultCredentials}
              className={SUPABASE_CONFIG.forceUseDefaultCredentials ? 'opacity-70' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Exemplo: https://abcdefghijklm.supabase.co
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="anonKey">Chave Anônima (anon key)</Label>
            <Input
              id="anonKey"
              name="anonKey"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={config.anonKey}
              onChange={handleChange}
              disabled={SUPABASE_CONFIG.forceUseDefaultCredentials}
              className={SUPABASE_CONFIG.forceUseDefaultCredentials ? 'opacity-70' : ''}
            />
            <p className="text-xs text-muted-foreground">
            Encontre em Settings → API → Project API keys → anon public
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bucketName">Nome do Bucket</Label>
            <Input
              id="bucketName"
              name="bucketName"
              placeholder="loanbuddy"
              value={config.bucketName}
              onChange={handleChange}
              disabled={SUPABASE_CONFIG.forceUseDefaultCredentials}
              className={SUPABASE_CONFIG.forceUseDefaultCredentials ? 'opacity-70' : ''}
            />
            <p className="text-xs text-muted-foreground">
              É necessário criar este bucket manualmente no "Storage" do Supabase
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearCookies}
            className="gap-1"
          >
            <span className="h-4 w-4" />
            Limpar Configurações
          </Button>

          <Button
            type="button"
            variant={SUPABASE_CONFIG.forceUseDefaultCredentials ? 'outline' : 'default'}
            onClick={handleSave}
            className="gap-1"
          >
            {SUPABASE_CONFIG.forceUseDefaultCredentials ? (
              <>
                <span className="h-4 w-4" />
                Fechar
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
