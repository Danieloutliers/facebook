import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, AlertCircle, KeyRound } from "lucide-react";
import { useLock } from "@/context/LockContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
}

export function SetPasswordDialog({ open, onOpenChange, isEditing = false }: SetPasswordDialogProps) {
  const { setLockPassword } = useLock();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!password.trim()) {
      setError('Digite uma senha numérica');
      return;
    }

    if (!/^\d+$/.test(password)) {
      setError('A senha deve conter apenas números');
      return;
    }

    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 números');
      return;
    }
    
    if (password.length > 10) {
      setError('A senha deve ter no máximo 10 números');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      await setLockPassword(password);
      
      toast({
        title: isEditing ? "Senha alterada" : "Senha definida",
        description: isEditing 
          ? "A senha de bloqueio foi alterada com sucesso." 
          : "A senha de bloqueio foi definida com sucesso. O app será bloqueado quando você atualizar a página."
      });

      // Limpar campos e fechar
      setPassword('');
      setConfirmPassword('');
      setError('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao definir senha:', error);
      setError('Erro ao salvar a senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {isEditing ? 'Alterar Senha de Bloqueio' : 'Definir Senha de Bloqueio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Digite uma nova senha para bloquear o aplicativo.' 
              : 'Defina uma senha para proteger o aplicativo quando estiver inativo.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite apenas números"
                  value={password}
                  onChange={(e) => {
                    // Permitir apenas números
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPassword(value);
                  }}
                  disabled={isLoading}
                  className="pr-10"
                  autoComplete="new-password"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme os números"
                  value={confirmPassword}
                  onChange={(e) => {
                    // Permitir apenas números
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setConfirmPassword(value);
                  }}
                  disabled={isLoading}
                  className="pr-10"
                  autoComplete="new-password"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md text-xs text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Senha Numérica:</p>
              <ul className="space-y-1">
                <li>• Apenas números são aceitos (como um PIN)</li>
                <li>• Mínimo de 4 números, máximo de 10</li>
                <li>• Recomendado: 6 dígitos (ex: 123456)</li>
                <li>• Esta senha é diferente da sua senha de login</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Alterar Senha' : 'Definir Senha'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}